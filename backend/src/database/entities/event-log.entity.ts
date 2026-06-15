import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SampleStatus } from '../enums';
import { Sample } from './sample.entity';
import { User } from './user.entity';
import { Facility } from './facility.entity';

@Entity('event_logs')
export class EventLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Sample, (sample) => sample.eventLogs, { eager: true })
  @JoinColumn({ name: 'sampleId' })
  sample: Sample;

  @Index()
  @Column()
  sampleId: string;

  @Column({ type: 'enum', enum: SampleStatus })
  event: SampleStatus;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'actorId' })
  actor: User;

  @Column({ nullable: true })
  actorId: string;

  @ManyToOne(() => Facility, { nullable: true, eager: true })
  @JoinColumn({ name: 'facilityId' })
  facility: Facility;

  @Column({ nullable: true })
  facilityId: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Index()
  @CreateDateColumn()
  timestamp: Date;
}
