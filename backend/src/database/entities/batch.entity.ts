import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Facility } from './facility.entity';

// A Batch is a physical package/box that groups many individual samples under a
// single QR code. Scanning the box returns the manifest of all samples inside
// and (role-aware) can advance every sample in one action.
@Entity('batches')
export class Batch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  batchId: string;

  @Column({ nullable: true })
  qrCode: string;

  @Column({ type: 'int', default: 0 })
  sampleCount: number;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ nullable: true })
  createdById: string;

  @ManyToOne(() => Facility, { nullable: true, eager: true })
  @JoinColumn({ name: 'facilityId' })
  facility: Facility;

  @Column({ nullable: true })
  facilityId: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
