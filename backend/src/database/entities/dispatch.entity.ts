import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { DispatchStatus } from '../enums';
import { User } from './user.entity';
import { Facility } from './facility.entity';
import { Sample } from './sample.entity';

@Entity('dispatches')
export class Dispatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  dispatchId: string;

  @Column({ type: 'enum', enum: DispatchStatus, default: DispatchStatus.PENDING })
  status: DispatchStatus;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'riderId' })
  rider: User;

  @Column({ nullable: true })
  riderId: string;

  @ManyToOne(() => Facility, { nullable: true, eager: true })
  @JoinColumn({ name: 'originFacilityId' })
  originFacility: Facility;

  @Column({ nullable: true })
  originFacilityId: string;

  @ManyToOne(() => Facility, { nullable: true, eager: true })
  @JoinColumn({ name: 'destinationFacilityId' })
  destinationFacility: Facility;

  @Column({ nullable: true })
  destinationFacilityId: string;

  @Column({ type: 'int', default: 0 })
  sampleCount: number;

  @Column({ nullable: true })
  manifestUrl: string;

  @Column({ nullable: true })
  coolerId: string;

  @Column({ type: 'timestamp', nullable: true })
  pickupTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveryTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  estimatedDeliveryTime: Date;

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => Sample, (sample) => sample.dispatchId)
  samples: Sample[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
