import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Dispatch } from '../../database/entities/dispatch.entity';
import { Sample } from '../../database/entities/sample.entity';
import { EventLog } from '../../database/entities/event-log.entity';
import { DispatchStatus, SampleStatus, NotificationType } from '../../database/enums';
import {
  CreateDispatchDto,
  UpdateDispatchStatusDto,
  DispatchFilterDto,
} from './dto/dispatch.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DispatchService {
  constructor(
    @InjectRepository(Dispatch)
    private dispatchRepository: Repository<Dispatch>,
    @InjectRepository(Sample)
    private sampleRepository: Repository<Sample>,
    @InjectRepository(EventLog)
    private eventLogRepository: Repository<EventLog>,
    private notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateDispatchDto, userId: string): Promise<Dispatch> {
    const dispatchId = `DSP-${Date.now().toString(36).toUpperCase()}-${uuidv4().split('-')[0].toUpperCase()}`;

    const samples = await this.sampleRepository.find({
      where: { id: In(dto.sampleIds) },
    });

    if (samples.length !== dto.sampleIds.length) {
      throw new BadRequestException('Some samples not found');
    }

    const dispatch = this.dispatchRepository.create({
      ...dto,
      dispatchId,
      sampleCount: samples.length,
      status: DispatchStatus.ASSIGNED,
    });

    const saved = await this.dispatchRepository.save(dispatch);

    await this.sampleRepository.update(
      { id: In(dto.sampleIds) },
      { dispatchId: saved.id, dispatcherId: dto.riderId },
    );

    for (const sample of samples) {
      await this.eventLogRepository.save(
        this.eventLogRepository.create({
          sampleId: sample.id,
          event: SampleStatus.PICKED_UP,
          actorId: userId,
          facilityId: dto.originFacilityId,
          metadata: { dispatchId: saved.id },
        }),
      );
    }

    return saved;
  }

  async findAll(filters: DispatchFilterDto): Promise<{ data: Dispatch[]; total: number }> {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.riderId) where.riderId = filters.riderId;
    if (filters.originFacilityId) where.originFacilityId = filters.originFacilityId;
    if (filters.destinationFacilityId) where.destinationFacilityId = filters.destinationFacilityId;

    const [data, total] = await this.dispatchRepository.findAndCount({
      where,
      relations: ['rider', 'originFacility', 'destinationFacility'],
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  async findById(id: string): Promise<Dispatch> {
    const dispatch = await this.dispatchRepository.findOne({
      where: { id },
      relations: ['rider', 'originFacility', 'destinationFacility'],
    });
    if (!dispatch) throw new NotFoundException('Dispatch not found');
    return dispatch;
  }

  async updateStatus(
    id: string,
    dto: UpdateDispatchStatusDto,
    userId: string,
  ): Promise<Dispatch> {
    const dispatch = await this.findById(id);

    const updateData: any = { status: dto.status };

    switch (dto.status) {
      case DispatchStatus.PICKED_UP:
        updateData.pickupTime = new Date();
        await this.sampleRepository.update(
          { dispatchId: id },
          { status: SampleStatus.PICKED_UP, pickedUpAt: new Date() },
        );
        break;
      case DispatchStatus.IN_TRANSIT:
        await this.sampleRepository.update(
          { dispatchId: id },
          { status: SampleStatus.IN_TRANSIT, dispatchedAt: new Date() },
        );
        break;
      case DispatchStatus.DELIVERED:
        updateData.deliveryTime = new Date();
        await this.sampleRepository.update(
          { dispatchId: id },
          { status: SampleStatus.LAB_RECEIVED, labReceivedAt: new Date() },
        );
        break;
    }

    await this.dispatchRepository.update(id, updateData);

    await this.notificationsService.createNotification({
      type: NotificationType.SAMPLE_PICKED_UP,
      title: 'Dispatch Status Updated',
      message: `Dispatch ${dispatch.dispatchId} status: ${dto.status}`,
      dispatchId: id,
    });

    return this.findById(id);
  }

  async getDispatchSamples(id: string): Promise<Sample[]> {
    return this.sampleRepository.find({
      where: { dispatchId: id },
      relations: ['facility'],
    });
  }

  async getRiderStats(): Promise<any[]> {
    return this.dispatchRepository
      .createQueryBuilder('dispatch')
      .leftJoin('dispatch.rider', 'rider')
      .select(['rider.firstName', 'rider.lastName', 'rider.id'])
      .addSelect('COUNT(dispatch.id)', 'totalDispatches')
      .addSelect(
        `COUNT(CASE WHEN dispatch.status = '${DispatchStatus.DELIVERED}' THEN 1 END)`,
        'completed',
      )
      .addSelect(
        `COUNT(CASE WHEN dispatch.status = '${DispatchStatus.IN_TRANSIT}' THEN 1 END)`,
        'active',
      )
      .groupBy('rider.id')
      .addGroupBy('rider.firstName')
      .addGroupBy('rider.lastName')
      .getRawMany();
  }
}
