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
| createdAt | @CreateDateColumn() createdAt: Date; |

## AuthSession

Source: `apps/backend/src/modules/auth/auth.entities.ts`. `@Entity('auth_sessions')`

| Property | Mapping declaration |
| --- | --- |
| tokenHash | @PrimaryColumn({ length: 64 }) tokenHash: string; |
| userId | @Column('uuid') userId: string; |
| user | @ManyToOne(() =&gt; User, { onDelete: 'CASCADE', nullable: false })   @JoinColumn({ name: 'userId' })   user: User; |
| expiresAt | @Column('timestamptz') expiresAt: Date; |
