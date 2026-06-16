import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThan, Repository } from 'typeorm';
import { RiderLocation } from '../../database/entities/rider-location.entity';
import { Dispatch } from '../../database/entities/dispatch.entity';
import { DispatchStatus } from '../../database/enums';
import { PingLocationDto } from './dto/tracking.dto';

// Rough ETA: straight-line distance at an assumed average road speed. Good
// enough for an "approaching" indicator without a routing API.
const ASSUMED_SPEED_KMH = 30;

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
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
  /// (rider went offline / finished the trip) naturally drop off. Each rider is
  /// enriched with its active dispatch's origin/destination centres and a rough
  /// ETA so the map can draw the route and show how close they are.
  async getActiveRiders(withinMinutes = 10): Promise<any[]> {
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);
    const rows = await this.locationRepository.find({
      where: { updatedAt: MoreThan(cutoff) },
      relations: ['rider'],
      order: { updatedAt: 'DESC' },
    });

    // Batch-load the dispatches the live riders are on, with their centres.
    const dispatchIds = [
      ...new Set(rows.map((r) => r.dispatchId).filter(Boolean) as string[]),
    ];
    const dispatches = dispatchIds.length
      ? await this.locationRepository.manager.find(Dispatch, {
          where: { id: In(dispatchIds) },
          relations: ['originFacility', 'destinationFacility'],
        })
      : [];
    const byId = new Map(dispatches.map((d) => [d.id, d]));

    const centre = (f: any) =>
      f && f.latitude != null && f.longitude != null
        ? { name: f.name, latitude: Number(f.latitude), longitude: Number(f.longitude) }
        : f
          ? { name: f.name, latitude: null, longitude: null }
          : null;

    return rows.map((r) => {
      const lat = Number(r.latitude);
      const lng = Number(r.longitude);
      const d = r.dispatchId ? byId.get(r.dispatchId) : null;
      const origin = centre(d?.originFacility);
      const destination = centre(d?.destinationFacility);

      let etaMinutes: number | null = null;
      if (destination?.latitude != null && destination?.longitude != null) {
        const km = haversineKm(lat, lng, destination.latitude, destination.longitude);
        etaMinutes = Math.max(1, Math.round((km / ASSUMED_SPEED_KMH) * 60));
      }

      return {
        riderId: r.riderId,
        name: r.rider
          ? `${r.rider.firstName ?? ''} ${r.rider.lastName ?? ''}`.trim()
          : 'Unknown rider',
        phone: r.rider?.phone ?? null,
        latitude: lat,
        longitude: lng,
        accuracy: r.accuracy != null ? Number(r.accuracy) : null,
        speed: r.speed != null ? Number(r.speed) : null,
        heading: r.heading != null ? Number(r.heading) : null,
        dispatchId: r.dispatchId,
        updatedAt: r.updatedAt,
        status: d?.status ?? null,
        sampleCount: d?.sampleCount ?? null,
        origin,
        destination,
        etaMinutes,
      };
    });
  }

  /// Sample-centric convergence feed for the live map: every in-flight dispatch
  /// leg (samples on their way somewhere) with its ORIGIN, its DESTINATION, the
  /// sample count, and the rider's current position when a recent GPS ping
  /// exists — falling back to the origin so a leg still appears on the map even
  /// before the rider starts pinging. This is what lets the map show samples
  /// converging on a hub from several different facilities at once.
  async getActiveLegs(withinMinutes = 30): Promise<any[]> {
    const mgr = this.locationRepository.manager;

    // Active = a rider is carrying these samples somewhere (not pending,
    // delivered or cancelled).
    const dispatches = await mgr.find(Dispatch, {
      where: {
        status: In([
          DispatchStatus.ASSIGNED,
          DispatchStatus.PICKED_UP,
          DispatchStatus.IN_TRANSIT,
        ]),
      },
      relations: ['originFacility', 'destinationFacility', 'rider'],
      order: { updatedAt: 'DESC' },
      take: 200,
    });
    if (dispatches.length === 0) return [];

    // Latest known position per rider on these legs (one row each).
    const cutoff = new Date(Date.now() - withinMinutes * 60 * 1000);
    const riderIds = [
      ...new Set(dispatches.map((d) => d.riderId).filter(Boolean) as string[]),
    ];
    const locations = riderIds.length
      ? await this.locationRepository.find({
          where: { riderId: In(riderIds), updatedAt: MoreThan(cutoff) },
        })
      : [];
    const locByRider = new Map(locations.map((l) => [l.riderId, l]));

    const centre = (f: any) =>
      f && f.latitude != null && f.longitude != null
        ? { name: f.name, latitude: Number(f.latitude), longitude: Number(f.longitude) }
        : f
          ? { name: f.name, latitude: null, longitude: null }
          : null;

    return dispatches.map((d) => {
      const origin = centre(d.originFacility);
      const destination = centre(d.destinationFacility);
      const loc = d.riderId ? locByRider.get(d.riderId) : null;

      // Current point = live GPS if we have a recent ping, else the origin.
      const hasLiveGps = !!loc;
      const current =
        loc && loc.latitude != null && loc.longitude != null
          ? { latitude: Number(loc.latitude), longitude: Number(loc.longitude) }
          : origin && origin.latitude != null
            ? { latitude: origin.latitude, longitude: origin.longitude }
            : null;

      let etaMinutes: number | null = null;
      if (
        current &&
        destination?.latitude != null &&
        destination?.longitude != null
      ) {
        const km = haversineKm(
          current.latitude,
          current.longitude,
          destination.latitude,
          destination.longitude,
        );
        etaMinutes = Math.max(1, Math.round((km / ASSUMED_SPEED_KMH) * 60));
      }

      return {
        dispatchId: d.id,
        dispatchCode: d.dispatchId,
        status: d.status,
        sampleCount: d.sampleCount,
        riderId: d.riderId,
        riderName: d.rider
          ? `${d.rider.firstName ?? ''} ${d.rider.lastName ?? ''}`.trim() || null
          : null,
        origin,
        destination,
        current,
        hasLiveGps,
        updatedAt: loc?.updatedAt ?? d.updatedAt,
        etaMinutes,
      };
    });
  }
}
