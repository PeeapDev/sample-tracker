import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Sample } from './sample.entity';
import { User } from './user.entity';

/// Feedback left from the tracker popup when a handoff is reviewed. Captures
/// BOTH a rider-delivery rating (1–5) and the sample's condition on arrival,
/// plus an optional comment — so rider performance can be aggregated and any
/// compromised samples flagged.
@Entity('sample_feedbacks')
export class SampleFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  sampleId: string;

  @ManyToOne(() => Sample, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sampleId' })
  sample: Sample;

  // Who left the feedback (from the JWT).
  @Column({ nullable: true })
  raterId: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'raterId' })
  rater: User;

  // The rider being rated (the sample's dispatcher at the time), for aggregation.
  @Index()
  @Column({ nullable: true })
  riderId: string;

  // 1–5 rating of the rider's delivery (condition kept, timeliness, handling).
  @Column({ type: 'int', nullable: true })
  riderRating: number;

  // The sample's condition on arrival: intact | compromised | damaged | leaking.
  @Column({ nullable: true })
  sampleCondition: string;

  @Column({ nullable: true })
  comment: string;

  // The sample's status/stage when the feedback was left (context for the note).
  @Column({ nullable: true })
  stage: string;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
