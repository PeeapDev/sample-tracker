import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

/// The latest known position of a rider — one row per rider, upserted on every
/// location ping from the mobile app. The live map on the web console reads the
/// rows updated recently (stale ones drop off). History isn't kept here; the
/// per-handoff GPS already lives in the sample/parcel event logs.
@Entity('rider_locations')
export class RiderLocation {
  // riderId is the primary key so each ping upserts the single current row.
  @PrimaryColumn()
  riderId: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'riderId' })
  rider: User;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  // Optional GPS quality / motion hints from the device.
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  accuracy: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  speed: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  heading: number;

  // The active dispatch the rider is on (so the map can show what they carry).
  @Index()
  @Column({ nullable: true })
  dispatchId: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
