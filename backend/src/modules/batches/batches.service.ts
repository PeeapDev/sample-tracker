import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
import { Batch } from '../../database/entities/batch.entity';
import { Sample } from '../../database/entities/sample.entity';
import { UserRole } from '../../database/enums';
import { SamplesService } from '../samples/samples.service';
import { CreateBatchDto, ScanBatchDto } from './dto/batch.dto';

interface ScanActor {
  sub: string;
  role: UserRole;
  facilityId?: string;
}

@Injectable()
export class BatchesService {
  constructor(
    @InjectRepository(Batch)
    private batchRepository: Repository<Batch>,
    @InjectRepository(Sample)
    private sampleRepository: Repository<Sample>,
    private samplesService: SamplesService,
  ) {}

  private generateBatchId(): string {
    const random = uuidv4().split('-')[0].toUpperCase();
    return `BOX-${random}`;
  }

  async create(dto: CreateBatchDto, userId: string): Promise<any> {
    const ids = dto.sampleIds ?? [];
    const samples = ids.length
      ? await this.sampleRepository.find({ where: { id: In(ids) } })
      : [];

    // An empty batch is allowed (created on the fly so samples can be assigned
    // to it later). Only complain if specific ids were given but none resolved.
    if (ids.length > 0 && samples.length === 0) {
      throw new BadRequestException('No valid samples to batch.');
    }

    const batchId = this.generateBatchId();
    const qrCode = await QRCode.toDataURL(batchId);
    const facilityId = dto.facilityId || samples[0]?.facilityId || null;

    const batch = await this.batchRepository.save(
      this.batchRepository.create({
        batchId,
        qrCode,
        sampleCount: samples.length,
        createdById: userId,
        facilityId,
        notes: dto.notes,
      }),
    );

    if (samples.length > 0) {
      // Samples may already belong to another box; capture those so we can fix
      // their counts after the move.
      const previousBatchIds = Array.from(
        new Set(
          samples
            .map((s) => s.batchId)
            .filter((b): b is string => !!b && b !== batch.id),
        ),
      );
      await this.sampleRepository.update(
        { id: In(samples.map((s) => s.id)) },
        { batchId: batch.id },
      );
      if (previousBatchIds.length) {
        await this.recountBatches(previousBatchIds);
      }
    }

    return this.findById(batch.id);
  }

  /**
   * Sort samples into an existing batch by scanning. Samples already in another
   * box are moved here (their origin facility is never touched), every move is
   * recorded in the sample's chain of custody, and the affected boxes' counts
   * are recomputed. Accepts human sample codes or internal UUIDs.
   */
  async addSamples(targetBatchId: string, codes: string[], actor: ScanActor) {
    const batch = await this.batchRepository.findOne({
      where: { id: targetBatchId },
    });
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }
    if (!codes?.length) {
      throw new BadRequestException('No samples to add.');
    }

    // Resolve by either internal id or human sampleId so scanned codes work.
    const samples = await this.sampleRepository.find({
      where: [{ id: In(codes) }, { sampleId: In(codes) }],
    });

    // Map prior batches to their labels for a readable timeline note.
    const previousBatchIds = Array.from(
      new Set(
        samples
          .map((s) => s.batchId)
          .filter((b): b is string => !!b && b !== batch.id),
      ),
    );
    const previousBatches = previousBatchIds.length
      ? await this.batchRepository.find({ where: { id: In(previousBatchIds) } })
      : [];
    const labelById = new Map(previousBatches.map((b) => [b.id, b.batchId]));

    const added: any[] = [];
    const skipped: any[] = [];
    const seen = new Set<string>();
    const affected = new Set<string>([batch.id]);

    for (const s of samples) {
      seen.add(s.id);
      seen.add(s.sampleId);
      if (s.batchId === batch.id) {
        skipped.push({ sampleId: s.sampleId, reason: 'Already in this box' });
        continue;
      }
      const fromLabel = s.batchId ? labelById.get(s.batchId) ?? null : null;
      if (s.batchId) affected.add(s.batchId);
      await this.sampleRepository.update(s.id, { batchId: batch.id });
      await this.samplesService.logRebatch(s, actor, fromLabel, batch.batchId);
      added.push({ sampleId: s.sampleId, from: fromLabel });
    }

    // Codes that matched no sample at all.
    for (const code of codes) {
      if (!seen.has(code)) {
        skipped.push({ sampleId: code, reason: 'Not found' });
      }
    }

    await this.recountBatches([...affected]);

    return {
      batchId: batch.batchId,
      addedCount: added.length,
      skippedCount: skipped.length,
      added,
      skipped,
      message: `Added ${added.length} sample(s) to ${batch.batchId}.`,
      batch: await this.findById(batch.id),
    };
  }

  /** Recompute the denormalized sampleCount for each given batch id. */
  private async recountBatches(ids: string[]): Promise<void> {
    for (const id of ids) {
      const count = await this.sampleRepository.count({
        where: { batchId: id },
      });
      await this.batchRepository.update(id, { sampleCount: count });
    }
  }

  findAll(): Promise<Batch[]> {
    // Skip the base64 `qrCode` blob (only the detail view renders it) and the
    // eager createdBy/facility cascade a plain `find` would auto-load.
    return this.batchRepository
      .createQueryBuilder('batch')
      .leftJoin('batch.facility', 'facility')
      .select([
        'batch.id',
        'batch.batchId',
        'batch.sampleCount',
        'batch.facilityId',
        'batch.notes',
        'batch.createdAt',
        'batch.updatedAt',
        'facility.id',
        'facility.name',
        'facility.district',
      ])
      .orderBy('batch.createdAt', 'DESC')
      .take(500)
      .getMany();
  }

  async findById(id: string): Promise<any> {
    const batch = await this.batchRepository.findOne({ where: { id } });
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }
    return this.withSamples(batch);
  }

  async findByBatchId(batchId: string): Promise<any> {
    const batch = await this.batchRepository.findOne({ where: { batchId } });
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }
    return this.withSamples(batch);
  }

  /** Attach the manifest — every sample in this box, with its data. */
  private async withSamples(batch: Batch): Promise<any> {
    const samples = await this.sampleRepository.find({
      where: { batchId: batch.id },
      relations: ['facility', 'collectedBy'],
      order: { createdAt: 'ASC' },
    });
    return { ...batch, samples };
  }

  /**
   * Scan a box QR → advance EVERY sample inside to its next stage (role-aware,
   * GPS-logged per sample). Samples not in a scannable state for this role are
   * skipped and reported, never aborting the rest of the box.
   */
  async scanBatch(batchId: string, actor: ScanActor, dto: ScanBatchDto) {
    const batch = await this.batchRepository.findOne({ where: { batchId } });
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }
    const samples = await this.sampleRepository.find({
      where: { batchId: batch.id },
    });

    const advanced: any[] = [];
    const skipped: any[] = [];

    for (const s of samples) {
      try {
        const r = await this.samplesService.scanAdvance(s.sampleId, actor, {
          sampleId: s.sampleId,
          latitude: dto.latitude,
          longitude: dto.longitude,
          action: dto.action,
          notes: dto.notes,
        });
        advanced.push({ sampleId: s.sampleId, from: r.previousStatus, to: r.newStatus });
      } catch (e: any) {
        skipped.push({ sampleId: s.sampleId, reason: e?.message ?? 'Could not advance' });
      }
    }

    return {
      batchId: batch.batchId,
      total: samples.length,
      advancedCount: advanced.length,
      skippedCount: skipped.length,
      advanced,
      skipped,
      message: `Box ${batch.batchId}: advanced ${advanced.length}/${samples.length} samples.`,
      batch: await this.withSamples(batch),
    };
  }
}
