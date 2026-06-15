import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, SelectQueryBuilder } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
import { Parcel } from '../../database/entities/parcel.entity';
import { ParcelEvent } from '../../database/entities/parcel-event.entity';
import { ParcelStatus, UserRole } from '../../database/enums';
import {
  CreateParcelDto,
  UpdateParcelStatusDto,
  ScanParcelDto,
  ParcelFilterDto,
} from './dto/parcel.dto';

interface ScanActor {
  sub: string;
  role: UserRole;
  facilityId?: string;
}

interface GpsCoords {
  latitude?: number;
  longitude?: number;
}

// Reverse-direction scan flow: who advances a parcel from each stage to the
// next. The rider carries it from the center out; the receiving facility's
// collector confirms delivery. ADMIN may perform any scan.
const SCAN_FLOW: Partial<
  Record<ParcelStatus, { role: UserRole; next: ParcelStatus }>
> = {
  [ParcelStatus.REGISTERED]: {
    role: UserRole.DISPATCHER,
    next: ParcelStatus.PICKED_UP,
  },
  [ParcelStatus.PICKED_UP]: {
    role: UserRole.DISPATCHER,
    next: ParcelStatus.IN_TRANSIT,
  },
  [ParcelStatus.IN_TRANSIT]: {
    role: UserRole.COLLECTOR,
    next: ParcelStatus.DELIVERED,
  },
};

@Injectable()
export class ParcelsService {
  constructor(
    @InjectRepository(Parcel)
    private parcelRepository: Repository<Parcel>,
    @InjectRepository(ParcelEvent)
    private eventRepository: Repository<ParcelEvent>,
  ) {}

  async create(dto: CreateParcelDto, userId: string): Promise<Parcel> {
    const parcelId = this.generateParcelId();
    const qrCode = await QRCode.toDataURL(parcelId);

    const parcel = this.parcelRepository.create({
      ...dto,
      parcelId,
      qrCode,
      quantity: dto.quantity ?? 1,
      registeredById: userId,
      registeredAt: new Date(),
      status: ParcelStatus.REGISTERED,
    });

    const saved = await this.parcelRepository.save(parcel);

    await this.logEvent(saved.id, ParcelStatus.REGISTERED, userId, dto.originFacilityId, {
      type: dto.type,
      description: dto.description,
      quantity: saved.quantity,
      destinationFacilityId: dto.destinationFacilityId,
    });

    return saved;
  }

  // Lean column set for the list view — omits the base64 qrCode blob so the
  // table query stays fast (see the same pattern in SamplesService).
  private static readonly LIST_COLUMNS = [
    'parcel.id',
    'parcel.parcelId',
    'parcel.type',
    'parcel.status',
    'parcel.description',
    'parcel.quantity',
    'parcel.originFacilityId',
    'parcel.destinationFacilityId',
    'parcel.riderId',
    'parcel.notes',
    'parcel.registeredAt',
    'parcel.pickedUpAt',
    'parcel.inTransitAt',
    'parcel.deliveredAt',
    'parcel.createdAt',
    'parcel.updatedAt',
    'destination.id',
    'destination.name',
    'destination.district',
    'rider.id',
    'rider.firstName',
    'rider.lastName',
  ];

  private static readonly LIST_CAP = 500;

  private listQuery() {
    return this.parcelRepository
      .createQueryBuilder('parcel')
      .leftJoin('parcel.destinationFacility', 'destination')
      .leftJoin('parcel.rider', 'rider')
      .select(ParcelsService.LIST_COLUMNS);
  }

  private paginate(qb: SelectQueryBuilder<Parcel>, filters: ParcelFilterDto) {
    qb.orderBy('parcel.createdAt', 'DESC');
    if (filters.page || filters.pageSize) {
      const pageSize = Math.min(filters.pageSize ?? 25, 200);
      const page = filters.page ?? 1;
      qb.skip((page - 1) * pageSize).take(pageSize);
    } else {
      qb.take(ParcelsService.LIST_CAP);
    }
    return qb;
  }

  async findAll(
    filters: ParcelFilterDto,
  ): Promise<{ data: Parcel[]; total: number }> {
    const qb = this.listQuery();

    if (filters.search) {
      qb.where(
        '(parcel.parcelId ILIKE :search OR parcel.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }
    if (filters.status) {
      qb.andWhere('parcel.status = :status', { status: filters.status });
    }
    if (filters.type) {
      qb.andWhere('parcel.type = :type', { type: filters.type });
    }
    if (filters.destinationFacilityId) {
      qb.andWhere('parcel.destinationFacilityId = :dest', {
        dest: filters.destinationFacilityId,
      });
    }

    const [data, total] = await this.paginate(qb, filters).getManyAndCount();
    return { data, total };
  }

  async findById(id: string): Promise<Parcel> {
    const parcel = await this.parcelRepository.findOne({
      where: { id },
      relations: ['originFacility', 'destinationFacility', 'rider'],
    });
    if (!parcel) {
      throw new NotFoundException('Parcel not found');
    }
    return parcel;
  }

  async findByParcelId(parcelId: string): Promise<Parcel> {
    const parcel = await this.parcelRepository.findOne({
      where: { parcelId },
      relations: ['originFacility', 'destinationFacility', 'rider'],
    });
    if (!parcel) {
      throw new NotFoundException('Parcel not found');
    }
    return parcel;
  }

  async updateStatus(
    id: string,
    dto: UpdateParcelStatusDto,
    userId: string,
    facilityId?: string,
  ): Promise<Parcel> {
    const parcel = await this.findById(id);
    this.validateTransition(parcel.status, dto.status);

    const updateData: any = { status: dto.status };
    this.stampStatusTime(updateData, dto.status);
    if (dto.riderId) updateData.riderId = dto.riderId;

    await this.parcelRepository.update(id, updateData);
    await this.logEvent(id, dto.status, userId, facilityId, {
      notes: dto.notes,
      previousStatus: parcel.status,
    });

    return this.findById(id);
  }

  /**
   * Scan-to-advance for return parcels: the scanner's role + the parcel's
   * current status determine the next status. One scan = one transition + one
   * GPS-stamped custody log. 'lost' flags damage/loss from any active stage.
   */
  async scanAdvance(parcelId: string, actor: ScanActor, dto: ScanParcelDto) {
    const parcel = await this.findByParcelId(parcelId);
    const coords: GpsCoords = { latitude: dto.latitude, longitude: dto.longitude };

    if (dto.action === 'lost') {
      if (
        parcel.status === ParcelStatus.DELIVERED ||
        parcel.status === ParcelStatus.LOST
      ) {
        throw new BadRequestException(
          `Parcel ${parcelId} is already ${parcel.status}.`,
        );
      }
      const lost = await this.markLost(
        parcel.id,
        actor.sub,
        dto.notes,
        actor.facilityId,
        coords,
      );
      return {
        parcel: lost,
        previousStatus: parcel.status,
        newStatus: ParcelStatus.LOST,
        message: `Parcel ${parcelId} marked lost.`,
      };
    }

    const step = SCAN_FLOW[parcel.status];
    if (!step) {
      throw new BadRequestException(
        `Parcel ${parcelId} is already ${parcel.status} — there is no further scan step.`,
      );
    }
    if (actor.role !== UserRole.ADMIN && actor.role !== step.role) {
      throw new ForbiddenException(
        `This scan advances the parcel to "${step.next}", which only a ${step.role} can perform.`,
      );
    }

    const updateData: any = { status: step.next };
    this.stampStatusTime(updateData, step.next);
    if (step.next === ParcelStatus.PICKED_UP) {
      updateData.riderId = actor.sub;
    }

    await this.parcelRepository.update(parcel.id, updateData);
    await this.logEvent(
      parcel.id,
      step.next,
      actor.sub,
      actor.facilityId,
      { notes: dto.notes, previousStatus: parcel.status, scanned: true },
      coords,
    );

    return {
      parcel: await this.findById(parcel.id),
      previousStatus: parcel.status,
      newStatus: step.next,
      message: `Scanned ${parcel.parcelId}: ${parcel.status} → ${step.next}.`,
    };
  }

  async markLost(
    id: string,
    userId: string,
    notes?: string,
    facilityId?: string,
    coords?: GpsCoords,
  ): Promise<Parcel> {
    const parcel = await this.findById(id);
    await this.parcelRepository.update(id, { status: ParcelStatus.LOST });
    await this.logEvent(id, ParcelStatus.LOST, userId, facilityId, { notes }, coords);
    return this.findById(id);
  }

  async getTimeline(parcelId: string): Promise<ParcelEvent[]> {
    const parcel = await this.findByParcelId(parcelId);
    return this.eventRepository.find({
      where: { parcelId: parcel.id },
      relations: ['actor'],
      order: { timestamp: 'ASC' },
    });
  }

  async getStats(): Promise<any> {
    const [total, registered, inTransit, delivered, lost] = await Promise.all([
      this.parcelRepository.count(),
      this.parcelRepository.count({ where: { status: ParcelStatus.REGISTERED } }),
      this.parcelRepository.count({
        where: { status: In([ParcelStatus.PICKED_UP, ParcelStatus.IN_TRANSIT]) },
      }),
      this.parcelRepository.count({ where: { status: ParcelStatus.DELIVERED } }),
      this.parcelRepository.count({ where: { status: ParcelStatus.LOST } }),
    ]);
    return { total, registered, inTransit, delivered, lost };
  }

  private stampStatusTime(updateData: any, status: ParcelStatus): void {
    switch (status) {
      case ParcelStatus.PICKED_UP:
        updateData.pickedUpAt = new Date();
        break;
      case ParcelStatus.IN_TRANSIT:
        updateData.inTransitAt = new Date();
        break;
      case ParcelStatus.DELIVERED:
        updateData.deliveredAt = new Date();
        break;
    }
  }

  private validateTransition(current: ParcelStatus, next: ParcelStatus): void {
    const valid: Record<ParcelStatus, ParcelStatus[]> = {
      [ParcelStatus.REGISTERED]: [ParcelStatus.PICKED_UP, ParcelStatus.LOST],
      [ParcelStatus.PICKED_UP]: [ParcelStatus.IN_TRANSIT, ParcelStatus.LOST],
      [ParcelStatus.IN_TRANSIT]: [ParcelStatus.DELIVERED, ParcelStatus.LOST],
      [ParcelStatus.DELIVERED]: [],
      [ParcelStatus.LOST]: [],
    };
    if (!valid[current]?.includes(next)) {
      throw new BadRequestException(
        `Cannot transition parcel from ${current} to ${next}`,
      );
    }
  }

  private generateParcelId(): string {
    const prefix = 'PCL';
    const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
    const random = uuidv4().split('-')[0].toUpperCase().slice(0, 4);
    return `${prefix}-${timestamp}-${random}`;
  }

  private async logEvent(
    parcelId: string,
    event: ParcelStatus,
    actorId: string,
    facilityId?: string,
    metadata?: Record<string, any>,
    coords?: GpsCoords,
  ): Promise<void> {
    const log = this.eventRepository.create({
      parcelId,
      event,
      actorId,
      facilityId,
      metadata,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    });
    await this.eventRepository.save(log);
  }
}
