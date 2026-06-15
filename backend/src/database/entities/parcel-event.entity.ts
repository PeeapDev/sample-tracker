import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ParcelStatus } from '../enums';
import { User } from './user.entity';
import { Parcel } from './parcel.entity';

/// One GPS-stamped chain-of-custody entry in a parcel's timeline — mirrors the
/// sample EventLog, but kept separate so the parcel status enum stays distinct.
@Entity('parcel_events')
export class ParcelEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  parcelId: string;

  @ManyToOne(() => Parcel, (parcel) => parcel.eventLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parcelId' })
  parcel: Parcel;

  @Column({ type: 'enum', enum: ParcelStatus })
  event: ParcelStatus;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'actorId' })
  actor: User;

  @Column({ nullable: true })
  actorId: string;

  @Column({ nullable: true })
  facilityId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Index()
  @CreateDateColumn()
  timestamp: Date;
}
