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
import { SampleStatus } from '../enums';
import { User } from './user.entity';
import { Facility } from './facility.entity';
import { EventLog } from './event-log.entity';

@Entity('samples')
export class Sample {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sampleId: string;

  @Column()
  sampleType: string;

  @Column({ type: 'enum', enum: SampleStatus, default: SampleStatus.COLLECTED })
  status: SampleStatus;

  @Column()
  diseaseProgram: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ nullable: true })
  village: string;

  @Column({ nullable: true })
  patientAge: number;

  @Column({ nullable: true })
  patientGender: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  qrCode: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'collectedById' })
  collectedBy: User;

  @Column({ nullable: true })
  collectedById: string;

  @ManyToOne(() => Facility, { nullable: true, eager: true })
  @JoinColumn({ name: 'facilityId' })
  facility: Facility;

  @Column({ nullable: true })
  facilityId: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'dispatcherId' })
  dispatcher: User;

  @Column({ nullable: true })
  dispatcherId: string;

  @Column({ nullable: true })
  dispatchId: string;

  @Column({ type: 'timestamp', nullable: true })
  collectedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  pickedUpAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  hubReceivedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  dispatchedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  labReceivedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @OneToMany(() => EventLog, (log) => log.sample)
  eventLogs: EventLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
