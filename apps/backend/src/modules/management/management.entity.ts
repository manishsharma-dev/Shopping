import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type RecordKind =
  'vendor' | 'type' | 'category' | 'field' | 'product' | 'order' | 'audit';
// Stable ownership columns remain relational; validated feature-specific fields live in JSONB.
@Entity('management_records')
@Index('management_kind_vendor', ['kind', 'vendorId'])
@Index('management_kind_region', ['kind', 'state', 'district'])
export class ManagementRecord {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar' }) kind: RecordKind;
  @Column({ length: 150 }) name: string;
  @Column({ default: 'active' }) status: string;
  @Column({ type: 'varchar', nullable: true }) state: string | null;
  @Column({ type: 'varchar', nullable: true }) district: string | null;
  @Column({ type: 'uuid', nullable: true }) vendorId: string | null;
  @Column({ type: 'uuid' }) createdBy: string;
  @Column({ type: 'jsonb', default: {} }) data: Record<string, any>;
  @Column({ default: 1 }) version: number;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
