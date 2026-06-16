import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, SelectQueryBuilder } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
import { Sample } from '../../database/entities/sample.entity';
import { EventLog } from '../../database/entities/event-log.entity';
import { SampleFeedback } from '../../database/entities/sample-feedback.entity';
import { Batch } from '../../database/entities/batch.entity';
import { Facility } from '../../database/entities/facility.entity';
import { User } from '../../database/entities/user.entity';
import { Dispatch } from '../../database/entities/dispatch.entity';
import { SampleStatus, UserRole, NotificationType } from '../../database/enums';
import {
  CreateSampleDto,
  UpdateSampleStatusDto,
  ScanSampleDto,
  SampleFilterDto,
  CreateFeedbackDto,
} from './dto/sample.dto';
import {
  NotificationsService,
  CreateNotificationInput,
} from '../notifications/notifications.service';

interface ScanActor {
  sub: string;
  role: UserRole;
  facilityId?: string;
}

interface GpsCoords {
  latitude?: number;
  longitude?: number;
}

// The scan-driven state machine: for each current status, which role's scan
// advances it, and to what next status. Collection is excluded — that's the one
// manual step. ADMIN may perform any scan. Terminal states have no entry.
const SCAN_FLOW: Partial<Record<SampleStatus, { role: UserRole; next: SampleStatus }>> = {
  [SampleStatus.COLLECTED]: { role: UserRole.DISPATCHER, next: SampleStatus.PICKED_UP },
  [SampleStatus.PICKED_UP]: { role: UserRole.HUB_OFFICER, next: SampleStatus.HUB_RECEIVED },
  [SampleStatus.HUB_RECEIVED]: { role: UserRole.DISPATCHER, next: SampleStatus.IN_TRANSIT },
  [SampleStatus.IN_TRANSIT]: { role: UserRole.LAB_OFFICER, next: SampleStatus.LAB_RECEIVED },
  [SampleStatus.LAB_RECEIVED]: { role: UserRole.LAB_OFFICER, next: SampleStatus.ANALYSIS_QUEUE },
  [SampleStatus.ANALYSIS_QUEUE]: { role: UserRole.LAB_OFFICER, next: SampleStatus.COMPLETED },
};

// The custody hand-off points worth telling everyone about: a sample has been
// accepted/received somewhere new. Other transitions (in-transit, queued,
// completed) don't fire an "accepted at" alert.
const SCAN_NOTIFICATIONS: Partial<
  Record<SampleStatus, { type: NotificationType; title: string; message: string }>
> = {
  [SampleStatus.PICKED_UP]: {
    type: NotificationType.SAMPLE_PICKED_UP,
    title: 'Sample Picked Up',
    message: 'Picked up by the dispatcher.',
  },
  [SampleStatus.HUB_RECEIVED]: {
    type: NotificationType.HUB_ARRIVAL,
    title: 'Sample Accepted at Hub',
    message: 'Accepted at the hub.',
  },
  [SampleStatus.LAB_RECEIVED]: {
    type: NotificationType.LAB_ARRIVAL,
    title: 'Sample Accepted at Lab',
    message: 'Accepted at the laboratory.',
  },
};

@Injectable()
export class SamplesService {
  private readonly logger = new Logger(SamplesService.name);

  constructor(
    @InjectRepository(Sample)
    private sampleRepository: Repository<Sample>,
    @InjectRepository(EventLog)
    private eventLogRepository: Repository<EventLog>,
    @InjectRepository(SampleFeedback)
    private feedbackRepository: Repository<SampleFeedback>,
    private notificationsService: NotificationsService,
  ) {}

  /// Record feedback (rider rating + sample condition + comment) left from the
  /// tracker popup. Ties the rating to the sample's current rider for later
  /// per-rider aggregation.
  async addFeedback(
    id: string,
    dto: CreateFeedbackDto,
    raterId: string,
  ): Promise<SampleFeedback> {
    const sample = await this.findById(id);
    const feedback = this.feedbackRepository.create({
      sampleId: sample.id,
      raterId,
      riderId: sample.dispatcherId,
      riderRating: dto.riderRating,
      sampleCondition: dto.sampleCondition,
      comment: dto.comment,
      stage: sample.status,
    });
    const saved = await this.feedbackRepository.save(feedback);

    // Fan out alerts (rider got rated / bad condition → admins). Best-effort:
    // a notification failure must never fail the feedback write itself.
    try {
      await this.notifyFeedback(sample, saved, raterId);
    } catch (err) {
      this.logger.warn(
        `Feedback saved but notification failed for sample ${sample.sampleId}: ${String(err)}`,
      );
    }

    return saved;
  }

  /** Sample conditions that warrant alerting ops (anything but "intact"). */
  private static readonly BAD_CONDITIONS = new Set([
    'compromised',
    'damaged',
    'leaking',
  ]);

  /**
   * Two audiences for feedback on a handoff:
   *  - the rider (assigned dispatcher) learns they were rated, and
   *  - admins (+ a dashboard broadcast) are alerted when the sample arrived in a
   *    bad condition, since that's the actionable case.
   */
  private async notifyFeedback(
    sample: Sample,
    feedback: SampleFeedback,
    raterId: string,
  ): Promise<void> {
    const sampleId = sample.sampleId;
    const condition = (feedback.sampleCondition ?? '').trim().toLowerCase();
    const isBad = SamplesService.BAD_CONDITIONS.has(condition);
    const commentTail = feedback.comment?.trim()
      ? ` "${feedback.comment.trim()}"`
      : '';

    const jobs: Promise<unknown>[] = [];

    // Rider rating → tell the rider (skip if they rated their own delivery).
    if (
      feedback.riderRating &&
      sample.dispatcherId &&
      sample.dispatcherId !== raterId
    ) {
      jobs.push(
        this.notificationsService.createNotification({
          type: NotificationType.SAMPLE_FEEDBACK,
          title: 'Delivery rated',
          message: `You received a ${feedback.riderRating}★ delivery rating for sample ${sampleId}.${commentTail}`,
          userId: sample.dispatcherId,
          sampleId: sample.id,
          metadata: {
            kind: 'rider_rating',
            riderRating: feedback.riderRating,
            sampleCondition: feedback.sampleCondition,
            stage: feedback.stage,
          },
        }),
      );
    }

    // Bad condition → broadcast + every admin.
    if (isBad) {
      const recipients = new Set<string>();
      await this.addBroadcastRecipients(recipients, null);
      const message = `Sample ${sampleId} was reported ${condition} at the ${String(
        feedback.stage,
      )} stage.${commentTail}`;
      const base: CreateNotificationInput = {
        type: NotificationType.SAMPLE_FEEDBACK,
        title: 'Sample condition alert',
        message,
        sampleId: sample.id,
        metadata: {
          kind: 'bad_condition',
          sampleCondition: condition,
          stage: feedback.stage,
        },
      };
      jobs.push(this.notificationsService.createNotification(base)); // dashboard broadcast
      recipients.forEach((userId) =>
        jobs.push(
          this.notificationsService.createNotification({ ...base, userId }),
        ),
      );
    }

    await Promise.all(jobs);
  }

  async getFeedback(id: string): Promise<SampleFeedback[]> {
    const sample = await this.findById(id);
    return this.feedbackRepository.find({
      where: { sampleId: sample.id },
      relations: ['rater'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateSampleDto, userId: string): Promise<Sample> {
    const sampleId = this.generateSampleId();

    const qrCode = await QRCode.toDataURL(sampleId);

    // Snapshot the collector at creation so the origin keeps the original
    // person's name/role/phone even if that account later changes.
    const collector = await this.sampleRepository.manager.findOne(User, {
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, role: true, phone: true },
    });
    const collectorName = collector
      ? `${collector.firstName ?? ''} ${collector.lastName ?? ''}`.trim() || null
      : null;

    const sample = this.sampleRepository.create({
      ...dto,
      sampleId,
      qrCode,
      collectedById: userId,
      collectorName,
      collectorRole: collector?.role ?? null,
      collectorPhone: collector?.phone ?? null,
      collectedAt: dto.collectedAt ? new Date(dto.collectedAt) : new Date(),
      status: SampleStatus.COLLECTED,
    });

    const saved = await this.sampleRepository.save(sample);

    // If collected straight into a batch, keep that batch's running count in
    // sync. increment() is a no-op if the batchId doesn't match any batch.
    if (saved.batchId) {
      await this.sampleRepository.manager.increment(
        Batch,
        { id: saved.batchId },
        'sampleCount',
        1,
      );
    }

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

  // Columns the list view actually renders. Crucially this omits `qrCode` — a
  // base64-encoded PNG data-URI stored per row — which the table never shows
  // (only the detail modal does, and it fetches the sample by id separately).
  // Returning it for every row, on top of the entities' eager ManyToOne
  // relations, made `findAll` pull a multi-table join full of image blobs and
  // take 30s+ for ~130 rows. A QueryBuilder ignores eager relations, so we join
  // only the facility name the table needs.
  private static readonly LIST_COLUMNS = [
    'sample.id',
    'sample.sampleId',
    'sample.sampleType',
    'sample.status',
    'sample.diseaseProgram',
    'sample.quantity',
    'sample.village',
    'sample.patientAge',
    'sample.patientGender',
    'sample.notes',
    'sample.collectedById',
    'sample.facilityId',
    'sample.dispatcherId',
    'sample.dispatchId',
    'sample.batchId',
    'sample.collectedAt',
    'sample.pickedUpAt',
    'sample.hubReceivedAt',
    'sample.dispatchedAt',
    'sample.labReceivedAt',
    'sample.completedAt',
    'sample.createdAt',
    'sample.updatedAt',
    'facility.id',
    'facility.name',
    'facility.district',
    // Only the box's id + human code — never its QR blob — so the list stays lean.
    'batch.id',
    'batch.batchId',
  ];

  // Hard ceiling on rows returned when the caller doesn't paginate, so a
  // no-args fetch can't balloon as the table grows.
  private static readonly LIST_CAP = 500;

  private listQuery() {
    return this.sampleRepository
      .createQueryBuilder('sample')
      .leftJoin('sample.facility', 'facility')
      .leftJoin('sample.batch', 'batch')
      .select(SamplesService.LIST_COLUMNS);
  }

  // Apply ORDER BY + pagination consistently. When page/pageSize are supplied
  // the result is a single small page (fast over a remote DB); otherwise we
  // return up to LIST_CAP rows for back-compat with un-paginated callers.
  private paginate(qb: SelectQueryBuilder<Sample>, filters: SampleFilterDto) {
    qb.orderBy('sample.createdAt', 'DESC');
    if (filters.page || filters.pageSize) {
      const pageSize = Math.min(filters.pageSize ?? 25, 200);
      const page = filters.page ?? 1;
      qb.skip((page - 1) * pageSize).take(pageSize);
    } else {
      qb.take(SamplesService.LIST_CAP);
    }
    return qb;
  }

  async findAll(filters: SampleFilterDto): Promise<{ data: Sample[]; total: number }> {
    if (filters.search) {
      return this.searchSamples(filters.search, filters);
    }

    const qb = this.listQuery();

    if (filters.status) {
      qb.andWhere('sample.status = :status', { status: filters.status });
    }
    if (filters.facilityId) {
      qb.andWhere('sample.facilityId = :facilityId', { facilityId: filters.facilityId });
    }
    if (filters.diseaseProgram) {
      qb.andWhere('sample.diseaseProgram = :diseaseProgram', {
        diseaseProgram: filters.diseaseProgram,
      });
    }
    if (filters.dateFrom && filters.dateTo) {
      qb.andWhere('sample.collectedAt BETWEEN :from AND :to', {
        from: new Date(filters.dateFrom),
        to: new Date(filters.dateTo),
      });
    }

    const [data, total] = await this.paginate(qb, filters).getManyAndCount();

    return { data, total };
  }

  async findById(id: string): Promise<Sample> {
    const sample = await this.sampleRepository.findOne({
      where: { id },
      relations: ['facility', 'collectedBy', 'dispatcher', 'batch'],
    });
    if (!sample) {
      throw new NotFoundException('Sample not found');
    }
    return sample;
  }

  async findBySampleId(sampleId: string): Promise<Sample> {
    const sample = await this.sampleRepository.findOne({
      where: { sampleId },
      relations: ['facility', 'collectedBy', 'dispatcher', 'batch'],
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
    if (dto.status === SampleStatus.COMPLETED) {
      await this.notifyResultsReady(sample);
    }

    return this.findById(id);
  }

  /**
   * Scan-to-advance: the heart of the post-collection flow. The scanner's role
   * + the sample's current status determine the (single, unambiguous) next
   * status. One scan = one transition + one GPS-stamped chain-of-custody log.
   */
  async scanAdvance(sampleId: string, actor: ScanActor, dto: ScanSampleDto) {
    const sample = await this.findBySampleId(sampleId);
    const coords: GpsCoords = { latitude: dto.latitude, longitude: dto.longitude };

    // A loss/damage can be flagged from any active stage.
    if (dto.action === 'lost') {
      if (sample.status === SampleStatus.COMPLETED || sample.status === SampleStatus.LOST) {
        throw new BadRequestException(`Sample ${sampleId} is already ${sample.status}.`);
      }
      const lost = await this.markLost(sample.id, actor.sub, dto.notes, actor.facilityId, coords);
      return {
        sample: lost,
        previousStatus: sample.status,
        newStatus: SampleStatus.LOST,
        message: `Sample ${sampleId} marked lost.`,
      };
    }

    const step = SCAN_FLOW[sample.status];
    if (!step) {
      throw new BadRequestException(
        `Sample ${sampleId} is already ${sample.status} — there is no further scan step.`,
      );
    }
    if (actor.role !== UserRole.ADMIN && actor.role !== step.role) {
      const human = (s: string) => s.replace(/_/g, ' ');
      throw new ForbiddenException(
        `Not your step — sample ${sampleId} is at "${human(sample.status)}". ` +
          `Its next scan (→ ${human(step.next)}) is done by a ${human(step.role)}, not a ${human(actor.role)}.`,
      );
    }

    const updateData: any = { status: step.next };
    switch (step.next) {
      case SampleStatus.PICKED_UP:
        updateData.pickedUpAt = new Date();
        updateData.dispatcherId = actor.sub;
        break;
      case SampleStatus.HUB_RECEIVED:
        updateData.hubReceivedAt = new Date();
        break;
      case SampleStatus.IN_TRANSIT:
        updateData.dispatchedAt = new Date();
        break;
      case SampleStatus.LAB_RECEIVED:
        updateData.labReceivedAt = new Date();
        break;
      case SampleStatus.COMPLETED:
        updateData.completedAt = new Date();
        break;
    }

    await this.sampleRepository.update(sample.id, updateData);
    await this.logEvent(
      sample.id,
      step.next,
      actor.sub,
      actor.facilityId || sample.facilityId,
      { notes: dto.notes, previousStatus: sample.status, scanned: true },
      coords,
    );
    await this.notifyParties(sample, step.next, actor, coords);
    if (step.next === SampleStatus.COMPLETED) {
      await this.notifyResultsReady(sample);
    }

    return {
      sample: await this.findById(sample.id),
      previousStatus: sample.status,
      newStatus: step.next,
      message: `Scanned ${sample.sampleId}: ${sample.status} → ${step.next}.`,
    };
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

  async markLost(
    id: string,
    userId: string,
    notes?: string,
    facilityId?: string,
    coords?: GpsCoords,
  ): Promise<Sample> {
    const sample = await this.findById(id);
    await this.sampleRepository.update(id, { status: SampleStatus.LOST });
    await this.logEvent(id, SampleStatus.LOST, userId, facilityId || sample.facilityId, { notes }, coords);
    await this.notificationsService.createNotification({
      type: NotificationType.SAMPLE_LOST,
      title: 'Sample Marked Lost',
      message: `Sample ${sample.sampleId} has been marked as lost.`,
      sampleId: id,
    });
    return this.findById(id);
  }

  /**
   * Record a re-batch (sorting) move in a sample's chain of custody. The status
   * is unchanged — this is a custody/location note, surfaced specially in the
   * timeline. Origin (facilityId) is never altered; the event is stamped at the
   * sorting officer's facility.
   */
  async logRebatch(
    sample: Sample,
    actor: ScanActor,
    fromLabel: string | null,
    toLabel: string,
  ): Promise<void> {
    await this.logEvent(
      sample.id,
      sample.status,
      actor.sub,
      actor.facilityId || sample.facilityId,
      {
        rebatch: { from: fromLabel, to: toLabel },
        note: `Sorted into ${toLabel}${fromLabel ? ` from ${fromLabel}` : ''}`,
      },
    );
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
    coords?: GpsCoords,
  ): Promise<void> {
    const log = this.eventLogRepository.create({
      sampleId,
      event,
      actorId,
      facilityId,
      metadata,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    });
    await this.eventLogRepository.save(log);
  }

  /**
   * Tell every party with a stake in this sample that it's just been accepted,
   * and confirm where it now physically is. Fires on the custody hand-off points
   * (picked up, hub received, lab received). The collector, the dispatcher/rider,
   * and the officer who just accepted it each get their own notification; a
   * broadcast copy (no userId) feeds the admin dashboard. The receiving
   * facility's name is the "confirmed at" location — the same facility the
   * EventLog stamps with GPS for the chain of custody.
   */
  private async notifyParties(
    sample: Sample,
    status: SampleStatus,
    actor: ScanActor,
    coords?: GpsCoords,
  ): Promise<void> {
    const config = SCAN_NOTIFICATIONS[status];
    if (!config) return;

    // "Current location" = the accepting officer's facility, falling back to the
    // sample's own facility if the scanner has none.
    const facilityId = actor.facilityId || sample.facilityId;
    let where = 'the receiving facility';
    let district: string | null = null;
    if (facilityId) {
      const facility = await this.sampleRepository.manager.findOne(Facility, {
        where: { id: facilityId },
        select: { id: true, name: true, district: true },
      });
      if (facility?.name) where = facility.name;
      district = facility?.district ?? null;
    }

    let message = `${config.message} Sample ${sample.sampleId} is now confirmed at ${where}.`;
    const metadata: Record<string, any> = {
      status,
      facilityId,
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    };

    // De-duped stakeholders: collector, assigned dispatcher, accepting officer.
    const recipients = new Set<string>(
      [sample.collectedById, sample.dispatcherId, actor.sub].filter(
        Boolean,
      ) as string[],
    );

    // Pickup is the moment ops cares about: tell every admin and every hub
    // officer in the collecting district who has the sample (the rider) and
    // roughly how long until it reaches the destination hub.
    if (status === SampleStatus.PICKED_UP) {
      const ctx = await this.resolvePickupContext(sample, coords);
      if (ctx.riderName) metadata.riderName = ctx.riderName;
      if (ctx.destinationName) metadata.destination = ctx.destinationName;
      if (ctx.etaMinutes != null) metadata.etaMinutes = ctx.etaMinutes;

      const rider = ctx.riderName ? `Rider ${ctx.riderName}` : 'The rider';
      const eta =
        ctx.etaMinutes != null && ctx.destinationName
          ? ` ETA to ${ctx.destinationName}: ~${ctx.etaMinutes} min.`
          : ctx.destinationName
            ? ` En route to ${ctx.destinationName}.`
            : '';
      message = `${rider} picked up sample ${sample.sampleId} at ${where}.${eta}`;

      await this.addBroadcastRecipients(recipients, district);
    }

    const base: CreateNotificationInput = {
      type: config.type,
      title: config.title,
      message,
      sampleId: sample.id,
      metadata,
    };

    await Promise.all([
      this.notificationsService.createNotification(base), // broadcast for dashboards
      ...[...recipients].map((userId) =>
        this.notificationsService.createNotification({ ...base, userId }),
      ),
    ]);
  }

  /** Add every admin (global) + every hub officer in [district] to the set. */
  private async addBroadcastRecipients(
    recipients: Set<string>,
    district: string | null,
  ): Promise<void> {
    const mgr = this.sampleRepository.manager;
    const admins = await mgr.find(User, {
      where: { role: UserRole.ADMIN, isActive: true },
      select: { id: true },
    });
    admins.forEach((u) => recipients.add(u.id));

    if (district) {
      const hubOfficers = await mgr
        .getRepository(User)
        .createQueryBuilder('u')
        .leftJoin('u.facility', 'f')
        .where('u.role = :role', { role: UserRole.HUB_OFFICER })
        .andWhere('u.isActive = true')
        .andWhere('f.district = :district', { district })
        .select(['u.id'])
        .getMany();
      hubOfficers.forEach((u) => recipients.add(u.id));
    }
  }

  /** Rider name + destination hub + rough ETA for a pickup alert. */
  private async resolvePickupContext(
    sample: Sample,
    coords?: GpsCoords,
  ): Promise<{ riderName: string | null; destinationName: string | null; etaMinutes: number | null }> {
    const mgr = this.sampleRepository.manager;

    let riderName: string | null = null;
    if (sample.dispatcherId) {
      const rider = await mgr.findOne(User, {
        where: { id: sample.dispatcherId },
        select: { id: true, firstName: true, lastName: true },
      });
      if (rider) {
        riderName = `${rider.firstName ?? ''} ${rider.lastName ?? ''}`.trim() || null;
      }
    }

    // Destination = the dispatch's destination hub if assigned, else a hub in the
    // collecting district, else any hub.
    let dest: Facility | null = null;
    if (sample.dispatchId) {
      const dispatch = await mgr.findOne(Dispatch, {
        where: { id: sample.dispatchId },
        relations: ['destinationFacility'],
      });
      dest = dispatch?.destinationFacility ?? null;
    }
    if (!dest) {
      let district: string | null = null;
      if (sample.facilityId) {
        const f = await mgr.findOne(Facility, {
          where: { id: sample.facilityId },
          select: { id: true, district: true },
        });
        district = f?.district ?? null;
      }
      dest = await mgr.findOne(Facility, {
        where: district
          ? { type: 'hub', district, isActive: true }
          : { type: 'hub', isActive: true },
      });
    }

    let etaMinutes: number | null = null;
    const dLat = dest?.latitude != null ? Number(dest.latitude) : null;
    const dLng = dest?.longitude != null ? Number(dest.longitude) : null;
    if (
      coords?.latitude != null &&
      coords?.longitude != null &&
      dLat != null &&
      dLng != null
    ) {
      const km = this.haversineKm(coords.latitude, coords.longitude, dLat, dLng);
      etaMinutes = Math.max(1, Math.round((km / 30) * 60)); // ~30 km/h
    }

    return { riderName, destinationName: dest?.name ?? null, etaMinutes };
  }

  private haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
    const R = 6371;
    const dLat = ((bLat - aLat) * Math.PI) / 180;
    const dLng = ((bLng - aLng) * Math.PI) / 180;
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((aLat * Math.PI) / 180) *
        Math.cos((bLat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  /**
   * Testing is done — tell the people who care that results are ready: a
   * broadcast for dashboards, plus a direct alert to the collector who
   * registered the sample and everyone at its origin facility (the site the
   * sample came from, which is waiting on the result).
   */
  private async notifyResultsReady(sample: Sample): Promise<void> {
    const base: CreateNotificationInput = {
      // Reuse LAB_ARRIVAL (results are produced at the lab) — avoids a DB enum
      // migration in production where synchronize is off. The title carries the
      // real meaning.
      type: NotificationType.LAB_ARRIVAL,
      title: 'Results Ready',
      message: `Testing complete — results for sample ${sample.sampleId} are ready.`,
      sampleId: sample.id,
      metadata: { status: SampleStatus.COMPLETED, facilityId: sample.facilityId },
    };

    const recipients = new Set<string>();
    if (sample.collectedById) recipients.add(sample.collectedById);
    if (sample.facilityId) {
      const facilityUsers = await this.sampleRepository.manager.find(User, {
        where: { facilityId: sample.facilityId },
        select: { id: true },
      });
      facilityUsers.forEach((u) => recipients.add(u.id));
    }

    await Promise.all([
      this.notificationsService.createNotification(base), // broadcast for dashboards
      ...[...recipients].map((userId) =>
        this.notificationsService.createNotification({ ...base, userId }),
      ),
    ]);
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
    const query = this.listQuery().where(
      '(sample.sampleId ILIKE :search OR sample.sampleType ILIKE :search OR sample.diseaseProgram ILIKE :search OR sample.village ILIKE :search)',
      { search: `%${search}%` },
    );

    if (filters.status) {
      query.andWhere('sample.status = :status', { status: filters.status });
    }

    const [data, total] = await this.paginate(query, filters).getManyAndCount();

    return { data, total };
  }
}
