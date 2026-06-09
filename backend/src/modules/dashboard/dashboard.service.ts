import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Sample } from '../../database/entities/sample.entity';
import { Dispatch } from '../../database/entities/dispatch.entity';
import { EventLog } from '../../database/entities/event-log.entity';
import { User } from '../../database/entities/user.entity';
import { Facility } from '../../database/entities/facility.entity';
import { SampleStatus, DispatchStatus } from '../../database/enums';

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

    const [
      totalSamples,
      samplesToday,
      samplesThisWeek,
      inTransit,
      delayed,
      lost,
      completed,
    ] = await Promise.all([
      this.sampleRepository.count(),
      this.sampleRepository.count({
        where: { createdAt: MoreThan(today) },
      }),
      this.sampleRepository.count({
        where: { createdAt: MoreThan(weekAgo) },
      }),
      this.sampleRepository.count({
        where: {
          status: SampleStatus.IN_TRANSIT,
        },
      }),
      this.sampleRepository.count({
        where: {
          status: SampleStatus.IN_TRANSIT,
          dispatchedAt: MoreThan(new Date(now.getTime() - 48 * 60 * 60 * 1000)),
        },
      }),
      this.sampleRepository.count({
        where: { status: SampleStatus.LOST },
      }),
      this.sampleRepository.count({
        where: { status: SampleStatus.COMPLETED },
      }),
    ]);

    const lostRate = totalSamples > 0 ? (lost / totalSamples) * 100 : 0;

    return {
      totalSamples,
      samplesToday,
      samplesThisWeek,
      inTransit,
      delayed,
      lost,
      completed,
      lostRate: parseFloat(lostRate.toFixed(2)),
    };
  }

  async getManagementMetrics() {
    const [
      totalUsers,
      totalFacilities,
      activeDispatches,
      totalDispatches,
    ] = await Promise.all([
      this.userRepository.count({ where: { isActive: true } }),
      this.facilityRepository.count({ where: { isActive: true } }),
      this.dispatchRepository.count({
        where: {
          status: DispatchStatus.IN_TRANSIT,
        },
      }),
      this.dispatchRepository.count(),
    ]);

    return {
      totalUsers,
      totalFacilities,
      activeDispatches,
      totalDispatches,
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
    return this.eventLogRepository.find({
      relations: ['sample', 'actor', 'facility'],
      order: { timestamp: 'DESC' },
      take: limit,
    });
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
