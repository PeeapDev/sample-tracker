import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sample } from '../../database/entities/sample.entity';
import { Dispatch } from '../../database/entities/dispatch.entity';
import { EventLog } from '../../database/entities/event-log.entity';
import { User } from '../../database/entities/user.entity';
import { Facility } from '../../database/entities/facility.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Sample)
    private sampleRepository: Repository<Sample>,
    @InjectRepository(Dispatch)
    private dispatchRepository: Repository<Dispatch>,
    @InjectRepository(EventLog)
    private eventLogRepository: Repository<EventLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Facility)
    private facilityRepository: Repository<Facility>,
  ) {}

  async getOperationalMetrics() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const delayCut = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // One pass over the samples table with conditional aggregation, instead of
    // 7 separate COUNT round-trips to the database.
    const [row] = await this.sampleRepository.manager.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE "createdAt" > $1)::int AS today,
         COUNT(*) FILTER (WHERE "createdAt" > $2)::int AS week,
         COUNT(*) FILTER (WHERE status = 'in_transit')::int AS in_transit,
         COUNT(*) FILTER (WHERE status = 'in_transit' AND "dispatchedAt" > $3)::int AS delayed,
         COUNT(*) FILTER (WHERE status = 'lost')::int AS lost,
         COUNT(*) FILTER (WHERE status = 'completed')::int AS completed
       FROM samples`,
      [today, weekAgo, delayCut],
    );

    const totalSamples = Number(row.total);
    const lost = Number(row.lost);
    const lostRate = totalSamples > 0 ? (lost / totalSamples) * 100 : 0;

    return {
      totalSamples,
      samplesToday: Number(row.today),
      samplesThisWeek: Number(row.week),
      inTransit: Number(row.in_transit),
      delayed: Number(row.delayed),
      lost,
      completed: Number(row.completed),
      lostRate: parseFloat(lostRate.toFixed(2)),
    };
  }

  async getManagementMetrics() {
    // Four cross-table counts collapsed into a single query via scalar subqueries.
    const [row] = await this.userRepository.manager.query(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE "isActive" = true)::int AS "totalUsers",
         (SELECT COUNT(*) FROM facilities WHERE "isActive" = true)::int AS "totalFacilities",
         (SELECT COUNT(*) FROM dispatches WHERE status = 'in_transit')::int AS "activeDispatches",
         (SELECT COUNT(*) FROM dispatches)::int AS "totalDispatches"`,
    );

    return {
      totalUsers: Number(row.totalUsers),
      totalFacilities: Number(row.totalFacilities),
      activeDispatches: Number(row.activeDispatches),
      totalDispatches: Number(row.totalDispatches),
    };
  }

  async getCollectionVolume(days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const results = await this.sampleRepository
      .createQueryBuilder('sample')
      .select("DATE(sample.createdAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('sample.createdAt >= :since', { since })
      .groupBy("DATE(sample.createdAt)")
      .orderBy('date', 'ASC')
      .getRawMany();

    return results;
  }

  async getStatusDistribution() {
    const results = await this.sampleRepository
      .createQueryBuilder('sample')
      .select('sample.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('sample.status')
      .getRawMany();

    return results;
  }

  async getProgramDistribution() {
    const results = await this.sampleRepository
      .createQueryBuilder('sample')
      .select('sample.diseaseProgram', 'program')
      .addSelect('COUNT(*)', 'count')
      .groupBy('sample.diseaseProgram')
      .getRawMany();

    return results;
  }

  async getRecentActivity(limit: number = 20) {
    // The EventLog/Sample/User/Facility entities all declare eager ManyToOne
    // relations, so a plain `find({ relations: [...] })` expands into an
    // ~18-way LEFT JOIN — and because `take` is combined with joins, TypeORM
    // wraps the whole thing in a `SELECT DISTINCT ... LIMIT` over that join.
    // Each joined sample row also drags along its base64 `qrCode` PNG blob, so
    // Postgres has to materialise and de-duplicate a huge intermediate result.
    // That made this query scale super-linearly with `limit` (≈6s at 10, ≈116s
    // at 20) against the remote DB.
    //
    // A QueryBuilder ignores eager relations, so we join only `sample` and
    // select the handful of scalar columns the dashboard actually renders.
    return this.eventLogRepository
      .createQueryBuilder('event')
      .leftJoin('event.sample', 'sample')
      .select([
        'event.id',
        'event.event',
        'event.description',
        'event.timestamp',
        'event.metadata',
        'sample.id',
        'sample.sampleId',
        'sample.sampleType',
        'sample.status',
        'sample.diseaseProgram',
      ])
      .orderBy('event.timestamp', 'DESC')
      .take(limit)
      .getMany();
  }

  async getFullDashboard() {
    const [
      operational,
      management,
      collectionVolume,
      statusDistribution,
      programDistribution,
      recentActivity,
    ] = await Promise.all([
      this.getOperationalMetrics(),
      this.getManagementMetrics(),
      this.getCollectionVolume(30),
      this.getStatusDistribution(),
      this.getProgramDistribution(),
      this.getRecentActivity(10),
    ]);

    return {
      operational,
      management,
      collectionVolume,
      statusDistribution,
      programDistribution,
      recentActivity,
    };
  }
}
