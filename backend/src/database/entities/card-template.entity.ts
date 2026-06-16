import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// A saved ID-card design. The visual layout (canvas size, background and the
// positioned elements) lives in a single jsonb blob so the designer can evolve
// its element schema without a migration; only `name` is promoted to a column
// for cheap listing/sorting.
@Entity('card_templates')
export class CardTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb', default: {} })
  layout: {
    w: number;
    h: number;
    bg: string;
    bgImage?: string;
    bgFit?: string;
    radius: number;
    elements: any[];
  };

  // Who created it (best-effort; nullable so seeds/imports don't need a user).
  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
