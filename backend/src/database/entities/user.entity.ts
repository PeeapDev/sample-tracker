import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserRole } from '../enums';
import { Facility } from './facility.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ nullable: true })
  pin: string;

  @ManyToOne(() => Facility, { nullable: true, eager: true })
  @JoinColumn({ name: 'facilityId' })
  facility: Facility;

  @Column({ nullable: true })
  facilityId: string;

  @Column({ nullable: true })
  refreshToken: string;

  // Staff ID badge: a human code (STF-…) printed on the card and encoded in the
  // QR; the qrCode + photo are base64 blobs kept out of normal queries.
  @Column({ unique: true, nullable: true })
  staffId: string;

  @Column({ type: 'text', nullable: true, select: false })
  qrCode: string;

  @Column({ type: 'text', nullable: true, select: false })
  photo: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
