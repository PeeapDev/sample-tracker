import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { RiderLocation } from '../../database/entities/rider-location.entity';
import { PingLocationDto } from './dto/tracking.dto';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(RiderLocation)
    private locationRepository: Repository<RiderLocation>,
  ) {}

  /// Upsert the rider's single current-location row.
  async ping(riderId: string, dto: PingLocationDto): Promise<RiderLocation> {
    await this.locationRepository.upsert(
      {
        riderId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        speed: dto.speed,
        heading: dto.heading,
        dispatchId: dto.dispatchId,
      },
      ['riderId'],
    );
    return this.locationRepository.findOne({ where: { riderId } });
  }

  /// Riders seen within the window — what the live map renders. Stale rows
  /// (rider went offline / finished the trip) naturally drop off.
  async getActiveRiders(withinMinutes = 10): Promise<any[]> {
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);
    const rows = await this.locationRepository.find({
      where: { updatedAt: MoreThan(cutoff) },
      relations: ['rider'],
      order: { updatedAt: 'DESC' },
    });

    return rows.map((r) => ({
      riderId: r.riderId,
      name: r.rider
        ? `${r.rider.firstName ?? ''} ${r.rider.lastName ?? ''}`.trim()
        : 'Unknown rider',
      phone: r.rider?.phone ?? null,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      accuracy: r.accuracy != null ? Number(r.accuracy) : null,
      speed: r.speed != null ? Number(r.speed) : null,
      heading: r.heading != null ? Number(r.heading) : null,
      dispatchId: r.dispatchId,
      updatedAt: r.updatedAt,
    }));
  }
}
