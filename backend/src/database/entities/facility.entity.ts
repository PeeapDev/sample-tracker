import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Sample } from './sample.entity';
import { EventLog } from './event-log.entity';

@Entity('facilities')
export class Facility {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ['health_facility', 'hub', 'laboratory'] })
  type: string;

  @Column()
  district: string;

  @Column({ nullable: true })
  chiefdom: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Sample, (sample) => sample.facility)
  samples: Sample[];

  @OneToMany(() => EventLog, (log) => log.facility)
  eventLogs: EventLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
