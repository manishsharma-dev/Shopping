import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type UserRole =
  | 'customer'
  | 'superadmin'
  | 'admin'
  | 'state_admin'
  | 'district_admin'
  | 'vendor'
  | 'vendor_admin'
  | 'staff'
  | 'agent';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 100 }) name: string;
  @Column({ length: 254, unique: true }) email: string;
  @Column({ select: false }) passwordHash: string;
  @Column({ type: 'varchar', default: 'customer' }) role: UserRole;
  @Column({ default: 'Customer', length: 100 }) userType: string;
  @Column({ type: 'uuid', nullable: true }) userTypeId: string | null;
  @Column({ type: 'varchar', nullable: true }) state: string | null;
  @Column({ type: 'varchar', nullable: true }) district: string | null;
  @Column({ type: 'uuid', nullable: true }) vendorId: string | null;
  @Column({ default: true }) active: boolean;
  @CreateDateColumn() createdAt: Date;
}

@Entity('auth_sessions')
export class AuthSession {
  @PrimaryColumn({ length: 64 }) tokenHash: string;
  @Column('uuid') userId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;
  @Column('timestamptz') expiresAt: Date;
}
