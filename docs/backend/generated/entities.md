# Entity mapping reference

Generated syntactically from @Entity classes. Decorators are shown exactly; this is not live database introspection or a migration. Inferred SQL types, DTO inheritance, and unmanaged geographic tables are explained in [Database structure](../database.md).

## User

Source: `apps/backend/src/modules/auth/auth.entities.ts`. `@Entity('users')`

| Property | Mapping declaration |
| --- | --- |
| id | @PrimaryGeneratedColumn('uuid') id: string; |
| name | @Column({ length: 100 }) name: string; |
| email | @Column({ length: 254, unique: true }) email: string; |
| passwordHash | @Column({ select: false }) passwordHash: string; |
| role | @Column({ type: 'varchar', default: 'customer' }) role: UserRole; |
| userType | @Column({ default: 'Customer', length: 100 }) userType: string; |
| userTypeId | @Column({ type: 'uuid', nullable: true }) userTypeId: string &#124; null; |
| state | @Column({ type: 'varchar', nullable: true }) state: string &#124; null; |
| district | @Column({ type: 'varchar', nullable: true }) district: string &#124; null; |
| vendorId | @Column({ type: 'uuid', nullable: true }) vendorId: string &#124; null; |
| active | @Column({ default: true }) active: boolean; |
| createdAt | @CreateDateColumn() createdAt: Date; |

## AuthSession

Source: `apps/backend/src/modules/auth/auth.entities.ts`. `@Entity('auth_sessions')`

| Property | Mapping declaration |
| --- | --- |
| tokenHash | @PrimaryColumn({ length: 64 }) tokenHash: string; |
| userId | @Column('uuid') userId: string; |
| user | @ManyToOne(() =&gt; User, { onDelete: 'CASCADE', nullable: false })   @JoinColumn({ name: 'userId' })   user: User; |
| expiresAt | @Column('timestamptz') expiresAt: Date; |

## ManagementRecord

Source: `apps/backend/src/modules/management/management.entity.ts`. `@Entity('management_records')` `@Index('management_kind_vendor', ['kind', 'vendorId'])` `@Index('management_kind_region', ['kind', 'state', 'district'])`

| Property | Mapping declaration |
| --- | --- |
| id | @PrimaryGeneratedColumn('uuid') id: string; |
| kind | @Column({ type: 'varchar' }) kind: RecordKind; |
| name | @Column({ length: 150 }) name: string; |
| status | @Column({ default: 'active' }) status: string; |
| state | @Column({ type: 'varchar', nullable: true }) state: string &#124; null; |
| district | @Column({ type: 'varchar', nullable: true }) district: string &#124; null; |
| vendorId | @Column({ type: 'uuid', nullable: true }) vendorId: string &#124; null; |
| createdBy | @Column({ type: 'uuid' }) createdBy: string; |
| data | @Column({ type: 'jsonb', default: {} }) data: Record&lt;string, any&gt;; |
| version | @Column({ default: 1 }) version: number; |
| createdAt | @CreateDateColumn() createdAt: Date; |
| updatedAt | @UpdateDateColumn() updatedAt: Date; |
