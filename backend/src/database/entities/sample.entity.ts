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
import { SampleStatus } from '../enums';
import { User } from './user.entity';
import { Facility } from './facility.entity';
import { EventLog } from './event-log.entity';
import { Batch } from './batch.entity';

@Entity('samples')
export class Sample {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sampleId: string;

  @Column()
  sampleType: string;

  @Index()
  @Column({ type: 'enum', enum: SampleStatus, default: SampleStatus.COLLECTED })
  status: SampleStatus;

  @Index()
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

  // Immutable snapshot of the person who first collected/registered this sample,
  // captured at creation and tied to the sample's origin. Unlike the collectedBy
  // relation (which reflects the user's *current* record), these never change —
  // so even if that account is edited, renamed, or replaced, the origin always
  // shows who originally collected it.
  @Column({ nullable: true })
  collectorName: string;

  @Column({ nullable: true })
  collectorRole: string;

  @Column({ nullable: true })
  collectorPhone: string;

  @ManyToOne(() => Facility, { nullable: true, eager: true })
  @JoinColumn({ name: 'facilityId' })
  facility: Facility;

  @Index()
  @Column({ nullable: true })
  facilityId: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'dispatcherId' })
  dispatcher: User;

  @Column({ nullable: true })
  dispatcherId: string;

  @Index()
  @Column({ nullable: true })
  dispatchId: string;

  // The package/box this sample is grouped into, if any (see Batch entity).
  @Index()
  @Column({ nullable: true })
  batchId: string;

  // Relation backed by the batchId FK above — lets queries surface the box's
  // human-readable code (batch.batchId, e.g. BOX-…). Not eager: only loaded
  // when explicitly joined/requested, so the lean list query stays lean.
  @ManyToOne(() => Batch, { nullable: true })
  @JoinColumn({ name: 'batchId' })
  batch: Batch;

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

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
