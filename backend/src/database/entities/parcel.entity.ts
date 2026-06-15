import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ParcelStatus, ParcelType } from '../enums';
import { User } from './user.entity';
import { Facility } from './facility.entity';
import { ParcelEvent } from './parcel-event.entity';

/// A return parcel — letters or supplies a rider carries back FROM the center
/// TO a facility. The reverse of a sample's journey, with the same scan-driven
/// chain of custody (registered → picked_up → in_transit → delivered).
@Entity('parcels')
export class Parcel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  parcelId: string;

  @Column({ type: 'enum', enum: ParcelType, default: ParcelType.SUPPLY })
  type: ParcelType;

  @Index()
  @Column({ type: 'enum', enum: ParcelStatus, default: ParcelStatus.REGISTERED })
  status: ParcelStatus;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ nullable: true })
  qrCode: string;

  // Where it comes from — typically the central lab/hub.
  @ManyToOne(() => Facility, { nullable: true, eager: true })
  @JoinColumn({ name: 'originFacilityId' })
  originFacility: Facility;

  @Column({ nullable: true })
  originFacilityId: string;

  // Where it's headed — the receiving facility.
  @ManyToOne(() => Facility, { nullable: true, eager: true })
  @JoinColumn({ name: 'destinationFacilityId' })
  destinationFacility: Facility;

  @Index()
  @Column({ nullable: true })
  destinationFacilityId: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'riderId' })
  rider: User;

  @Column({ nullable: true })
  riderId: string;

  @Column({ nullable: true })
  registeredById: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'timestamp', nullable: true })
  registeredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  pickedUpAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  inTransitAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @OneToMany(() => ParcelEvent, (log) => log.parcel)
  eventLogs: ParcelEvent[];

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
