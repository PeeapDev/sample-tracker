import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
import { Sample } from '../../database/entities/sample.entity';
import { EventLog } from '../../database/entities/event-log.entity';
import { SampleStatus, NotificationType } from '../../database/enums';
import {
  CreateSampleDto,
  UpdateSampleStatusDto,
  SampleFilterDto,
} from './dto/sample.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SamplesService {
  constructor(
    @InjectRepository(Sample)
    private sampleRepository: Repository<Sample>,
    @InjectRepository(EventLog)
    private eventLogRepository: Repository<EventLog>,
    private notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateSampleDto, userId: string): Promise<Sample> {
    const sampleId = this.generateSampleId();

    const qrCode = await QRCode.toDataURL(sampleId);

    const sample = this.sampleRepository.create({
      ...dto,
      sampleId,
      qrCode,
      collectedById: userId,
      collectedAt: dto.collectedAt ? new Date(dto.collectedAt) : new Date(),
      status: SampleStatus.COLLECTED,
    });

    const saved = await this.sampleRepository.save(sample);

    await this.logEvent(saved.id, SampleStatus.COLLECTED, userId, dto.facilityId, {
      sampleType: dto.sampleType,
      diseaseProgram: dto.diseaseProgram,
      quantity: dto.quantity,
    });

    await this.notificationsService.createNotification({
      type: NotificationType.SAMPLE_REGISTERED,
      title: 'Sample Registered',
      message: `Sample ${sampleId} has been registered at facility.`,
      sampleId: saved.id,
    });

    return saved;
  }

  async findAll(filters: SampleFilterDto): Promise<{ data: Sample[]; total: number }> {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.facilityId) {
      where.facilityId = filters.facilityId;
    }
    if (filters.diseaseProgram) {
      where.diseaseProgram = filters.diseaseProgram;
    }
    if (filters.dateFrom && filters.dateTo) {
      where.collectedAt = Between(new Date(filters.dateFrom), new Date(filters.dateTo));
    }
    if (filters.search) {
      return this.searchSamples(filters.search, filters);
    }

    const [data, total] = await this.sampleRepository.findAndCount({
      where,
      relations: ['facility', 'collectedBy', 'dispatcher'],
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  async findById(id: string): Promise<Sample> {
    const sample = await this.sampleRepository.findOne({
      where: { id },
      relations: ['facility', 'collectedBy', 'dispatcher'],
    });
    if (!sample) {
      throw new NotFoundException('Sample not found');
    }
    return sample;
  }

  async findBySampleId(sampleId: string): Promise<Sample> {
    const sample = await this.sampleRepository.findOne({
      where: { sampleId },
      relations: ['facility', 'collectedBy', 'dispatcher'],
    });
    if (!sample) {
      throw new NotFoundException('Sample not found');
    }
    return sample;
  }

  async updateStatus(
    id: string,
    dto: UpdateSampleStatusDto,
    userId: string,
    facilityId?: string,
  ): Promise<Sample> {
    const sample = await this.findById(id);

    this.validateStatusTransition(sample.status, dto.status);

    const updateData: any = { status: dto.status };

    switch (dto.status) {
      case SampleStatus.PICKED_UP:
        updateData.pickedUpAt = new Date();
        updateData.dispatcherId = dto.dispatcherId || userId;
        break;
      case SampleStatus.HUB_RECEIVED:
        updateData.hubReceivedAt = new Date();
        break;
      case SampleStatus.IN_TRANSIT:
        updateData.dispatchedAt = new Date();
        updateData.dispatchId = dto.dispatchId;
        break;
      case SampleStatus.LAB_RECEIVED:
        updateData.labReceivedAt = new Date();
        break;
      case SampleStatus.COMPLETED:
        updateData.completedAt = new Date();
        break;
    }

    await this.sampleRepository.update(id, updateData);

    await this.logEvent(
      id,
      dto.status,
      userId,
      facilityId || sample.facilityId,
      { notes: dto.notes, previousStatus: sample.status },
    );

    await this.sendStatusNotification(sample.sampleId, dto.status, sample.id);

    return this.findById(id);
  }

  async getTimeline(sampleId: string): Promise<EventLog[]> {
    const sample = await this.findBySampleId(sampleId);
    return this.eventLogRepository.find({
      where: { sampleId: sample.id },
      relations: ['actor', 'facility'],
      order: { timestamp: 'ASC' },
    });
  }

  async getStats(): Promise<any> {
    const [
      total,
      collected,
      inTransit,
      labReceived,
      completed,
      lost,
    ] = await Promise.all([
      this.sampleRepository.count(),
      this.sampleRepository.count({ where: { status: SampleStatus.COLLECTED } }),
      this.sampleRepository.count({
        where: { status: In([SampleStatus.PICKED_UP, SampleStatus.HUB_RECEIVED, SampleStatus.IN_TRANSIT]) },
      }),
      this.sampleRepository.count({ where: { status: SampleStatus.LAB_RECEIVED } }),
      this.sampleRepository.count({ where: { status: SampleStatus.COMPLETED } }),
      this.sampleRepository.count({ where: { status: SampleStatus.LOST } }),
    ]);

    return {
      total,
      collected,
      inTransit,
      labReceived,
      completed,
      lost,
    };
  }

  async getDistrictStats(): Promise<any[]> {
    return this.sampleRepository
      .createQueryBuilder('sample')
      .leftJoin('sample.facility', 'facility')
      .select('facility.district', 'district')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        `COUNT(CASE WHEN sample.status = '${SampleStatus.COLLECTED}' THEN 1 END)`,
        'collected',
      )
      .addSelect(
        `COUNT(CASE WHEN sample.status IN ('${SampleStatus.PICKED_UP}', '${SampleStatus.HUB_RECEIVED}', '${SampleStatus.IN_TRANSIT}') THEN 1 END)`,
        'inTransit',
      )
      .addSelect(
        `COUNT(CASE WHEN sample.status = '${SampleStatus.LAB_RECEIVED}' THEN 1 END)`,
        'labReceived',
      )
      .addSelect(
        `COUNT(CASE WHEN sample.status = '${SampleStatus.COMPLETED}' THEN 1 END)`,
        'completed',
      )
      .groupBy('facility.district')
      .getRawMany();
  }

  async markLost(id: string, userId: string, notes?: string): Promise<Sample> {
    const sample = await this.findById(id);
    await this.sampleRepository.update(id, { status: SampleStatus.LOST });
    await this.logEvent(id, SampleStatus.LOST, userId, sample.facilityId, { notes });
    await this.notificationsService.createNotification({
      type: NotificationType.SAMPLE_LOST,
      title: 'Sample Marked Lost',
      message: `Sample ${sample.sampleId} has been marked as lost.`,
      sampleId: id,
    });
    return this.findById(id);
  }

  private generateSampleId(): string {
    const prefix = 'NSR';
    const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
    const random = uuidv4().split('-')[0].toUpperCase().slice(0, 4);
    return `${prefix}-${timestamp}-${random}`;
  }

  private validateStatusTransition(
    current: SampleStatus,
    next: SampleStatus,
  ): void {
    const validTransitions: Record<SampleStatus, SampleStatus[]> = {
      [SampleStatus.COLLECTED]: [SampleStatus.PICKED_UP, SampleStatus.LOST],
      [SampleStatus.PICKED_UP]: [SampleStatus.HUB_RECEIVED, SampleStatus.LOST],
      [SampleStatus.HUB_RECEIVED]: [SampleStatus.IN_TRANSIT, SampleStatus.LOST],
      [SampleStatus.IN_TRANSIT]: [SampleStatus.LAB_RECEIVED, SampleStatus.LOST],
      [SampleStatus.LAB_RECEIVED]: [SampleStatus.ANALYSIS_QUEUE, SampleStatus.COMPLETED, SampleStatus.LOST],
      [SampleStatus.ANALYSIS_QUEUE]: [SampleStatus.COMPLETED, SampleStatus.LOST],
      [SampleStatus.COMPLETED]: [],
      [SampleStatus.LOST]: [],
    };

    const allowed = validTransitions[current];
    if (!allowed || !allowed.includes(next)) {
      throw new BadRequestException(
        `Cannot transition from ${current} to ${next}`,
      );
    }
  }

  private async logEvent(
    sampleId: string,
    event: SampleStatus,
    actorId: string,
    facilityId: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const log = this.eventLogRepository.create({
      sampleId,
      event,
      actorId,
      facilityId,
      metadata,
    });
    await this.eventLogRepository.save(log);
  }

  private async sendStatusNotification(
    sampleId: string,
    status: SampleStatus,
    id: string,
  ): Promise<void> {
    const notificationMap: Record<string, { type: NotificationType; title: string; message: string }> = {
      [SampleStatus.PICKED_UP]: {
        type: NotificationType.SAMPLE_PICKED_UP,
        title: 'Sample Picked Up',
        message: `Sample ${sampleId} has been picked up by dispatcher.`,
      },
      [SampleStatus.HUB_RECEIVED]: {
        type: NotificationType.HUB_ARRIVAL,
        title: 'Sample Arrived at Hub',
        message: `Sample ${sampleId} has arrived at the hub.`,
      },
      [SampleStatus.LAB_RECEIVED]: {
        type: NotificationType.LAB_ARRIVAL,
        title: 'Sample Arrived at Lab',
        message: `Sample ${sampleId} has arrived at the laboratory.`,
      },
    };

    const config = notificationMap[status];
    if (config) {
      await this.notificationsService.createNotification({
        ...config,
        sampleId: id,
      });
    }
  }

  private async searchSamples(
    search: string,
    filters: SampleFilterDto,
  ): Promise<{ data: Sample[]; total: number }> {
    const query = this.sampleRepository
      .createQueryBuilder('sample')
      .leftJoinAndSelect('sample.facility', 'facility')
      .leftJoinAndSelect('sample.collectedBy', 'collectedBy')
      .leftJoinAndSelect('sample.dispatcher', 'dispatcher')
      .where(
        'sample.sampleId ILIKE :search OR sample.sampleType ILIKE :search OR sample.diseaseProgram ILIKE :search',
        { search: `%${search}%` },
      );

    if (filters.status) {
      query.andWhere('sample.status = :status', { status: filters.status });
    }

    const [data, total] = await query
      .orderBy('sample.createdAt', 'DESC')
      .getManyAndCount();

    return { data, total };
  }
}
