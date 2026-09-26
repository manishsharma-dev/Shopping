import {
  defaultTypes,
  rank,
  rolePermissions,
  typeRole,
  typeRoles,
  vendorRole,
} from './management.types';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { User, UserRole } from '../auth/auth.entities';
import { hashPassword, publicUser } from '../auth/auth.service';
import { ManagementDto } from './management.dto';
import { ManagementRecord, RecordKind } from './management.entity';
import {
  Actor,
  inScope,
  permissions,
  platform,
  regional,
  requireScope,
  vendorAdmin,
} from './management.policy';

export function stringValue(
  d: Record<string, any>,
  key: string,
  max = 150,
  optional = false,
): string {
  const value = d[key];
  if (optional && (value === undefined || value === '')) return '';
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    throw new BadRequestException(`${key} must contain 1–${max} characters`);
  return value.trim();
}
export function numberValue(
  d: Record<string, any>,
  key: string,
  max = 100000000,
  integer = false,
): number {
  const v = d[key];
  if (
    typeof v !== 'number' ||
    !Number.isFinite(v) ||
    v < 0 ||
    v > max ||
    (integer && !Number.isSafeInteger(v))
  )
    throw new BadRequestException(`Invalid ${key}`);
  return v;
}
function oneOf(
  value: unknown,
  options: readonly string[],
  label: string,
): string {
  if (typeof value !== 'string' || !options.includes(value))
    throw new BadRequestException(`Invalid ${label}`);
  return value;
}
function list(value: unknown, label: string, max = 50): string[] {
  if (
    !Array.isArray(value) ||
    value.length > max ||
    value.some((v) => typeof v !== 'string' || !v.trim() || v.length > 150)
  )
    throw new BadRequestException(`Invalid ${label}`);
  return [...new Set(value.map((v) => v.trim()))];
}

@Injectable()
export class ManagementService implements OnModuleInit {
  constructor(private readonly db: DataSource) {}
  async onModuleInit() {
    await this.write(async (em) => {
      for (const item of defaultTypes) {
        if (!(await em.findOneBy(ManagementRecord, { id: item.id })))
          await em.save(
            ManagementRecord,
            em.create(ManagementRecord, {
              id: item.id,
              kind: 'type',
              name: item.name,
              status: 'active',
              createdBy: defaultTypes[0].id,
              data: {
                role: item.role,
                permissions: item.permissions,
                protected: item.protected,
              },
            }),
          );
      }
    });
  }
  async geography() {
    const available = await this.db.query(
      "SELECT to_regclass('public.states') AS states, to_regclass('public.districts') AS districts",
    );
    if (!available[0].states || !available[0].districts)
      return { states: [], districts: [] };
    return {
      states: await this.db.query(
        'SELECT id, name FROM public.states ORDER BY name',
      ),
      districts: await this.db.query(
        'SELECT d.id, d.name, s.name AS state FROM public.districts d JOIN public.states s ON s.id=d.state_id ORDER BY d.name',
      ),
    };
  }
  private async validateRegion(
    state: string | null,
    district: string | null,
    districtRequired: boolean,
  ) {
    const geo = await this.geography();
    if (!state || !geo.states.some((s: any) => s.name === state))
      throw new BadRequestException('Choose a valid state');
    if (
      districtRequired &&
      (!district ||
        !geo.districts.some(
          (d: any) => d.state === state && d.name === district,
        ))
    )
      throw new BadRequestException('Choose a district in the selected state');
  }
  private availableTypes(u: Actor, rows: ManagementRecord[]) {
    return rows
      .filter(
        (r) =>
          r.kind === 'type' &&
          r.status === 'active' &&
          ((!r.vendorId && !r.state && !r.district) || inScope(u, r)),
      )
      .map((r) =>
        Object.assign(new ManagementRecord(), r, {
          data: {
            ...r.data,
            rank: rank(typeRole(r)),
            deletable:
              inScope(u, r) &&
              rank(typeRole(r)) < rank(u.role) &&
              !defaultTypes.some((t) => t.id === r.id && t.protected),
          },
        }),
      );
  }
  private selectableType(u: Actor, rows: ManagementRecord[], id: unknown) {
    const type = this.availableTypes(u, rows).find((r) => r.id === id);
    if (!type) throw new BadRequestException('Select an available user type');
    const role = typeRole(type);
    if (rank(role) >= rank(u.role) || rank(role) <= 0)
      throw new ForbiddenException(
        'Can only create users below your hierarchy',
      );
    if (
      type.data.permissions.some(
        (p: string) => !this.access(u, rows).includes(p),
      )
    )
      throw new ForbiddenException(
        'Cannot delegate permissions you do not have',
      );
    return type;
  }
  async capabilities(u: Actor) {
    const rows = await this.rows();
    return {
      permissions: this.access(u, rows),
      hierarchy: rank(u.role),
      vendorStatus: vendorRole(u.role)
        ? (rows.find((r) => r.kind === 'vendor' && r.id === u.vendorId)
            ?.status ?? 'unassigned')
        : null,
    };
  }
  async applications(u: Actor) {
    return this.db.manager.find(ManagementRecord, {
      where: { kind: 'vendor', createdBy: u.id },
      order: { createdAt: 'DESC' },
    });
  }
  async catalog() {
    const rows = await this.rows();
    const vendors = new Set(
      rows
        .filter(
          (r) =>
            r.kind === 'vendor' && r.status === 'active' && r.data.approvedAt,
        )
        .map((r) => r.id),
    );
    return {
      items: rows
        .filter(
          (r) =>
            r.kind === 'product' &&
            r.status === 'active' &&
            vendors.has(r.vendorId!),
        )
        .map((r) => ({
          id: r.id,
          name: r.name,
          sku: r.data.sku,
          description: r.data.description,
          price:
            Math.round(r.data.priceMinor * (1 - r.data.discountPercent / 100)) /
            100,
          currency: 'INR',
          imageUrl: r.data.imageUrl,
          stock: r.data.stock,
        })),
    };
  }
  // All management writes serialize through one transaction lock, including audits and stock.
  private async write<T>(fn: (em: EntityManager) => Promise<T>) {
    return this.db.transaction(async (em) => {
      await em.query('SELECT pg_advisory_xact_lock(73190425)');
      return fn(em);
    });
  }
  private async rows(em = this.db.manager) {
    return em.find(ManagementRecord, { order: { createdAt: 'DESC' } });
  }
  private async actor(em: EntityManager, actor: Actor) {
    const user = await em.findOneBy(User, { id: actor.id });
    if (!user || !user.active) throw new ForbiddenException();
    return publicUser(user);
  }
  private access(u: Actor, rows: ManagementRecord[]): string[] {
    if (u.role === 'customer')
      throw new ForbiddenException('Customers cannot access administration');
    const effectiveRole = u.role === 'vendor' ? 'vendor_admin' : u.role;
    const type = rows.find(
      (r) =>
        r.kind === 'type' &&
        r.status === 'active' &&
        (u.userTypeId
          ? r.id === u.userTypeId
          : r.id === defaultTypes.find((t) => t.role === effectiveRole)?.id) &&
        (!r.vendorId || r.vendorId === u.vendorId),
    );
    if (!type || typeRole(type) !== effectiveRole)
      throw new ForbiddenException('No active user type is assigned');
    if (vendorRole(u.role)) {
      const vendor = rows.find(
        (r) =>
          r.kind === 'vendor' &&
          r.id === u.vendorId &&
          r.status === 'active' &&
          r.data.approvedAt,
      );
      if (!vendor) {
        const business = rows.find(
          (r) => r.kind === 'vendor' && r.id === u.vendorId,
        );
        if (
          business &&
          (business.status === 'pending' ||
            (business.status === 'active' && !business.data.approvedAt))
        )
          return [];
        throw new ForbiddenException('An approved, active vendor is required');
      }
    }
    return (type.data.permissions ?? []).filter((p: string) =>
      rolePermissions[effectiveRole]?.includes(p),
    );
  }
  private permit(u: Actor, rows: ManagementRecord[], permission: string) {
    if (!this.access(u, rows).includes(permission))
      throw new ForbiddenException(`Missing permission: ${permission}`);
  }
  private async audit(
    em: EntityManager,
    u: Actor,
    row: {
      id: string;
      state: string | null;
      district: string | null;
      vendorId: string | null;
    },
    action: string,
    reason = '',
  ) {
    await em.save(
      ManagementRecord,
      em.create(ManagementRecord, {
        kind: 'audit',
        name: action,
        status: 'recorded',
        state: row.state,
        district: row.district,
        vendorId: row.vendorId,
        createdBy: u.id,
        data: { targetId: row.id, actorName: u.name, reason },
      }),
    );
  }
  async snapshot(
    u: Actor,
    filters: { state?: string; district?: string; vendorId?: string },
  ) {
    const rows = await this.rows();
    for (const r of rows)
      if (r.kind === 'vendor' && r.status === 'active' && !r.data.approvedAt)
        r.status = 'pending';
    const granted = this.access(u, rows);
    const match = (r: {
      state?: string | null;
      district?: string | null;
      vendorId?: string | null;
    }) =>
      inScope(u, r) &&
      (!filters.state || r.state === filters.state) &&
      (!filters.district || r.district === filters.district) &&
      (!filters.vendorId || r.vendorId === filters.vendorId);
    const visible = rows.filter((r) => match(r));
    const can = (p: string) => granted.includes(p);
    const products = visible.filter((r) => r.kind === 'product');
    const orders = visible.filter((r) => r.kind === 'order');
    const vendors = visible.filter((r) => r.kind === 'vendor');
    const users = can('team')
      ? (await this.db.manager.find(User, { order: { createdAt: 'DESC' } }))
          .filter(match)
          .map(publicUser)
      : [];
    return {
      permissions: granted,
      hierarchy: rank(u.role),
      typeLevels: typeRoles
        .filter(
          (role) =>
            rank(role) < rank(u.role) &&
            !['superadmin', 'admin'].includes(role),
        )
        .map((role) => ({
          role,
          permissions: rolePermissions[role].filter((p) => granted.includes(p)),
        })),
      assignableTypes: this.availableTypes(u, rows).filter(
        (t) =>
          rank(typeRole(t)) < rank(u.role) &&
          t.data.permissions.every((p: string) => granted.includes(p)),
      ),
      vendorStatus: vendorRole(u.role)
        ? (rows.find((r) => r.kind === 'vendor' && r.id === u.vendorId)
            ?.status ?? 'unassigned')
        : null,
      users,
      vendors: can('vendors') || can('vendors_approve') ? vendors : [],
      vendorOptions:
        can('team') ||
        can('products') ||
        can('categories') ||
        can('types') ||
        can('orders_manage')
          ? vendors.map((v) => ({ id: v.id, name: v.name, status: v.status }))
          : [],
      types: can('types') || can('team') ? this.availableTypes(u, rows) : [],
      categories: rows.filter(
        (r) =>
          r.kind === 'category' &&
          (match(r) || (!r.vendorId && r.status === 'active')),
      ),
      fields:
        can('products') || can('categories')
          ? visible.filter((r) => r.kind === 'field')
          : [],
      products:
        can('products') ||
        can('reports') ||
        can('orders_manage') ||
        can('orders_accept')
          ? products
          : [],
      orders:
        can('orders_manage') || can('orders_accept') || can('reports')
          ? orders
          : [],
      audit: can('reports')
        ? visible.filter((r) => r.kind === 'audit').slice(0, 100)
        : [],
      stats: can('reports')
        ? {
            vendors: vendors.length,
            pendingVendors: vendors.filter((r) => r.status === 'pending')
              .length,
            products: products.filter((r) => r.status !== 'deleted').length,
            flaggedProducts: products.filter((r) => r.status === 'flagged')
              .length,
            lowStock: products.filter(
              (r) => r.status === 'active' && r.data.stock <= r.data.lowStock,
            ).length,
            orders: orders.length,
            pendingOrders: orders.filter((r) => r.status === 'pending').length,
            fulfilledSales: orders
              .filter((r) => r.status === 'fulfilled')
              .reduce((sum, r) => sum + r.data.totalMinor, 0),
          }
        : null,
    };
  }
  async apply(_actor: Actor, _d: Record<string, any>) {
    throw new ForbiddenException(
      'Vendor self-registration is not available yet',
    );
  }
  async createUser(actor: Actor, d: Record<string, any>) {
    // Hash before opening the serialized transaction.
    const password = d.password;
    if (
      typeof password !== 'string' ||
      password.length < 12 ||
      password.length > 128
    )
      throw new BadRequestException('Password must contain 12-128 characters');
    const passwordHash = await hashPassword(password);
    return this.write(async (em) => {
      const u = await this.actor(em, actor);
      const rows = await this.rows(em);
      this.permit(u, rows, 'team');
      const type = this.selectableType(u, rows, d.userTypeId);
      const role = typeRole(type);
      let state = stringValue(d, 'state', 100, true) || null;
      let district = stringValue(d, 'district', 100, true) || null;
      let vendorId: string | null = null;
      if (vendorRole(role)) {
        const vendor = rows.find(
          (r) =>
            r.kind === 'vendor' &&
            r.id === (u.vendorId || d.vendorId) &&
            ['active', 'pending'].includes(r.status),
        );
        if (!vendor)
          throw new BadRequestException('Select a pending or approved vendor');
        requireScope(u, vendor);
        vendorId = vendor.id;
        state = vendor.state;
        district = vendor.district;
        if (type.vendorId && type.vendorId !== vendor.id)
          throw new ForbiddenException('User type belongs to another vendor');
      } else {
        if (type.vendorId)
          throw new ForbiddenException(
            'Regional user types cannot belong to a vendor',
          );
        if (role === 'state_admin') {
          await this.validateRegion(state, null, false);
          district = null;
        }
        if (['district_admin', 'agent'].includes(role))
          await this.validateRegion(state, district, true);
      }
      const target = { state, district, vendorId };
      requireScope(u, target);
      if (
        (type.state && type.state !== state) ||
        (type.district && type.district !== district)
      )
        throw new ForbiddenException(
          'User type is outside the assigned region',
        );
      const userTypeId = type.id;
      const userType = type.name;
      const email = stringValue(d, 'email', 254).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new BadRequestException('Invalid email');
      if (await em.findOneBy(User, { email }))
        throw new ConflictException('Email already exists');
      const user = await em.save(
        User,
        em.create(User, {
          name: stringValue(d, 'name', 100),
          email,
          passwordHash,
          role,
          userType,
          userTypeId,
          ...target,
          active: true,
        }),
      );
      await this.audit(em, u, user, 'User created');
      return publicUser(user);
    });
  }
  async userStatus(actor: Actor, id: string, d: Record<string, any>) {
    return this.write(async (em) => {
      const u = await this.actor(em, actor);
      const rows = await this.rows(em);
      this.permit(u, rows, 'team');
      const user = await em.findOneBy(User, { id });
      if (!user) throw new NotFoundException();
      requireScope(u, user);
      if (
        u.id === id ||
        user.role === 'customer' ||
        rank(u.role) <= rank(user.role)
      )
        throw new ForbiddenException('Can only manage subordinate accounts');
      if (typeof d.active !== 'boolean')
        throw new BadRequestException('active must be boolean');
      const reason = stringValue(d, 'reason', 1000);
      user.active = d.active;
      await em.save(user);
      await this.audit(
        em,
        u,
        user,
        d.active ? 'User activated' : 'User blocked',
        reason,
      );
      return publicUser(user);
    });
  }
  async assignType(actor: Actor, id: string, d: Record<string, any>) {
    return this.write(async (em) => {
      const u = await this.actor(em, actor);
      const rows = await this.rows(em);
      this.permit(u, rows, 'team');
      const user = await em.findOneBy(User, { id });
      if (!user) throw new NotFoundException();
      requireScope(u, user);
      if (rank(user.role) >= rank(u.role) || user.role === 'customer')
        throw new ForbiddenException('Can only manage subordinate accounts');
      const type = this.selectableType(u, rows, d.userTypeId);
      if (
        typeRole(type) !==
          (user.role === 'vendor' ? 'vendor_admin' : user.role) ||
        (type.vendorId && type.vendorId !== user.vendorId)
      )
        throw new BadRequestException(
          'Choose a type at the same level and vendor scope',
        );
      if (
        (type.state && type.state !== user.state) ||
        (type.district && type.district !== user.district)
      )
        throw new ForbiddenException(
          'User type is outside the assigned region',
        );
      user.userTypeId = type.id;
      user.userType = type.name;
      await em.save(user);
      await this.audit(
        em,
        u,
        user,
        'User type changed',
        stringValue(d, 'reason', 1000),
      );
      return publicUser(user);
    });
  }
  private async saveType(actor: Actor, dto: ManagementDto, id?: string) {
    return this.write(async (em) => {
      const u = await this.actor(em, actor);
      const rows = await this.rows(em);
      this.permit(u, rows, 'types');
      const d = dto.data as Record<string, any>;
      const old = id
        ? rows.find((r) => r.kind === 'type' && r.id === id)
        : undefined;
      if (id && !old) throw new NotFoundException();
      if (old) {
        if (defaultTypes.some((t) => t.id === old.id && t.protected))
          throw new ForbiddenException(
            'Super Admin and Admin are protected user types',
          );
        requireScope(u, old);
        if (rank(typeRole(old)) >= rank(u.role))
          throw new ForbiddenException('Can only manage lower user types');
        if (old.version !== dto.version)
          throw new ConflictException(
            'This record changed. Reload before saving.',
          );
        if (d.status !== 'deleted')
          throw new BadRequestException(
            'User types are immutable; create a new type or delete an unused type',
          );
        const users = await em.find(User);
        if (
          users.some(
            (user) =>
              user.userTypeId === old.id ||
              (!user.userTypeId &&
                defaultTypes.some(
                  (t) =>
                    t.id === old.id &&
                    t.role ===
                      (user.role === 'vendor' ? 'vendor_admin' : user.role),
                )),
          )
        )
          throw new ConflictException(
            'Reassign existing users before deleting this user type',
          );
        old.status = 'deleted';
        old.version++;
        await em.save(old);
        await this.audit(
          em,
          u,
          old,
          'User type deleted',
          stringValue(d, 'reason', 1000),
        );
        return old;
      }
      const role = oneOf(d.role ?? 'staff', typeRoles, 'hierarchy level');
      if (rank(role) >= rank(u.role) || ['superadmin', 'admin'].includes(role))
        throw new ForbiddenException(
          'Create a type below your hierarchy; Super Admin and Admin are defaults',
        );
      const selected = list(d.permissions, 'permissions');
      const granted = this.access(u, rows);
      if (
        selected.some(
          (p) => !granted.includes(p) || !rolePermissions[role]?.includes(p),
        )
      )
        throw new ForbiddenException('Invalid delegated permissions');
      const vendorId = u.vendorId || d.vendorId || null;
      let state: string | null = null;
      let district: string | null = null;
      if (vendorId) {
        if (!vendorRole(role))
          throw new BadRequestException(
            'Only vendor-level types can be vendor-specific',
          );
        const vendor = rows.find(
          (r) =>
            r.kind === 'vendor' &&
            r.id === vendorId &&
            r.status === 'active' &&
            r.data.approvedAt,
        );
        if (!vendor) throw new BadRequestException('Select an approved vendor');
        requireScope(u, vendor);
        state = vendor.state;
        district = vendor.district;
      } else if (!platform(u)) {
        state = u.state;
        district = u.district;
      }
      const name = stringValue(d, 'name', 100);
      if (
        defaultTypes.some(
          (t) => t.protected && t.name.toLowerCase() === name.toLowerCase(),
        )
      )
        throw new ConflictException('This default user type name is reserved');
      if (
        rows.some(
          (r) =>
            r.kind === 'type' &&
            r.status === 'active' &&
            r.vendorId === vendorId &&
            r.state === state &&
            r.district === district &&
            r.name.toLowerCase() === name.toLowerCase(),
        )
      )
        throw new ConflictException(
          'A user type with this name already exists in this scope',
        );
      const row = em.create(ManagementRecord, {
        kind: 'type',
        name,
        createdBy: u.id,
        status: 'active',
        state,
        district,
        vendorId,
        data: { role, permissions: selected, protected: false },
      });
      requireScope(u, row);
      await em.save(row);
      await this.audit(em, u, row, 'User type created');
      return row;
    });
  }
  async save(actor: Actor, kindInput: string, dto: ManagementDto, id?: string) {
    if (kindInput === 'type') return this.saveType(actor, dto, id);
    const kind = oneOf(
      kindInput,
      ['vendor', 'type', 'category', 'field', 'product', 'order'],
      'record kind',
    ) as RecordKind;
    return this.write(async (em) => {
      const u = await this.actor(em, actor);
      const rows = await this.rows(em);
      const granted = this.access(u, rows);
      const old = id
        ? rows.find((r) => r.id === id && r.kind === kind)
        : undefined;
      if (id && !old) throw new NotFoundException();
      if (old) {
        requireScope(u, old);
        if (dto.version !== old.version)
          throw new ConflictException(
            'This record changed. Reload before saving.',
          );
      }
      const d = dto.data as Record<string, any>;
      let row = old
        ? Object.assign(new ManagementRecord(), old, { data: { ...old.data } })
        : em.create(ManagementRecord, {
            kind,
            name: stringValue(d, 'name'),
            status: 'active',
            createdBy: u.id,
            data: {},
            vendorId: null,
            state: null,
            district: null,
          });
      const moderation =
        kind === 'product' &&
        (platform(u) || regional(u)) &&
        old &&
        d.action === 'moderate';
      if (kind === 'vendor') {
        this.permit(u, rows, old ? 'vendors_approve' : 'vendors');
        if (old && !platform(u) && !regional(u))
          throw new ForbiddenException('Regional administrator required');
        if (!old) {
          row.state = stringValue(d, 'state', 100);
          row.district = stringValue(d, 'district', 100);
          requireScope(u, row);
          await this.validateRegion(row.state, row.district, true);
          row.data = {
            contactEmail: stringValue(d, 'contactEmail', 254),
            phone: stringValue(d, 'phone', 30),
            address: stringValue(d, 'address', 1000),
          };
          row.status = 'pending';
        } else {
          const next = oneOf(
            d.status,
            ['active', 'rejected', 'blocked'],
            'vendor status',
          );
          const transitions: Record<string, string[]> = {
            pending: ['active', 'rejected'],
            active: old.data.approvedAt
              ? ['blocked']
              : ['active', 'rejected', 'blocked'],
            blocked: ['active'],
            rejected: [],
          };
          if (!transitions[old.status]?.includes(next))
            throw new BadRequestException('Invalid vendor transition');
          row.status = next;
          row.data.reason = stringValue(d, 'reason', 1000);
          if (next === 'active') {
            row.data.approvedAt = new Date().toISOString();
            row.data.approvedBy = u.id;
          }
          if (
            next === 'active' &&
            old.status === 'pending' &&
            old.data.ownerId
          ) {
            const owner = await em.findOneBy(User, { id: old.data.ownerId });
            if (!owner || owner.role !== 'customer' || owner.vendorId)
              throw new ConflictException(
                'Applicant account is no longer eligible',
              );
            Object.assign(owner, {
              role: 'vendor_admin',
              userType: 'Vendor administrator',
              vendorId: old.id,
              state: old.state,
              district: old.district,
            });
            await em.save(owner);
          }
        }
      } else if (moderation) {
        this.permit(u, rows, 'products');
        row.status = oneOf(
          d.status,
          ['active', 'flagged', 'inactive', 'blocked', 'deleted'],
          'product status',
        );
        row.data.moderationReason = stringValue(d, 'reason', 1000);
      } else {
        const permission =
          kind === 'category' || kind === 'field'
            ? 'categories'
            : kind === 'order'
              ? old && d.status === 'accepted'
                ? 'orders_accept'
                : 'orders_manage'
              : 'products';
        this.permit(u, rows, permission);
        if (!old) {
          const global = kind === 'category' && platform(u) && !d.vendorId;
          if (!global) {
            const vendor = rows.find(
              (r) =>
                r.kind === 'vendor' &&
                r.id === (u.vendorId || d.vendorId) &&
                r.status === 'active' &&
                r.data.approvedAt,
            );
            if (!vendor)
              throw new BadRequestException('Select an approved active vendor');
            requireScope(u, vendor);
            row.vendorId = vendor.id;
            row.state = vendor.state;
            row.district = vendor.district;
          }
        }
        if (
          row.vendorId &&
          !rows.some(
            (r) =>
              r.kind === 'vendor' &&
              r.id === row.vendorId &&
              r.status === 'active' &&
              r.data.approvedAt,
          )
        )
          throw new BadRequestException('Vendor is not active');
        if (kind === 'category') {
          if (old)
            throw new BadRequestException('Create a new category instead');
          row.data = { description: stringValue(d, 'description', 1000, true) };
        } else if (kind === 'field') {
          if (old)
            throw new BadRequestException(
              'Field definitions are immutable to preserve existing values',
            );
          const type = oneOf(
            d.type,
            ['text', 'number', 'boolean', 'choice'],
            'field type',
          );
          const options = type === 'choice' ? list(d.options, 'choices') : [];
          if (type === 'choice' && !options.length)
            throw new BadRequestException('Provide choices');
          if (typeof d.required !== 'boolean')
            throw new BadRequestException('required must be boolean');
          row.data = { type, required: d.required, options };
        } else if (kind === 'product') {
          if (old && ['blocked', 'deleted', 'flagged'].includes(old.status))
            throw new ForbiddenException(
              'An administrator must clear moderation before editing',
            );
          row.name = stringValue(d, 'name');
          const category = rows.find(
            (r) =>
              r.kind === 'category' &&
              r.id === d.categoryId &&
              (!r.vendorId || r.vendorId === row.vendorId),
          );
          if (!category)
            throw new BadRequestException('Select an available category');
          const sku = stringValue(d, 'sku', 80);
          if (
            rows.some(
              (r) =>
                r.kind === 'product' &&
                r.id !== id &&
                r.vendorId === row.vendorId &&
                r.data.sku === sku,
            )
          )
            throw new ConflictException('SKU already exists for this vendor');
          const fields = d.fields;
          if (!fields || typeof fields !== 'object' || Array.isArray(fields))
            throw new BadRequestException('Invalid custom fields');
          const definitions = rows.filter(
            (r) => r.kind === 'field' && r.vendorId === row.vendorId,
          );
          const custom: Record<string, any> = {};
          for (const key of Object.keys(fields))
            if (!definitions.some((r) => r.id === key))
              throw new BadRequestException('Unknown custom field');
          for (const def of definitions) {
            const v = fields[def.id];
            if (v === undefined || v === '') {
              if (def.data.required)
                throw new BadRequestException(`${def.name} is required`);
              continue;
            }
            if (
              (def.data.type === 'text' &&
                (typeof v !== 'string' || v.length > 2000)) ||
              (def.data.type === 'number' &&
                (typeof v !== 'number' || !Number.isFinite(v))) ||
              (def.data.type === 'boolean' && typeof v !== 'boolean') ||
              (def.data.type === 'choice' && !def.data.options.includes(v))
            )
              throw new BadRequestException(`Invalid ${def.name}`);
            custom[def.id] = v;
          }
          const bundleIds = list(d.bundleIds ?? [], 'bundle products', 20);
          if (
            bundleIds.some(
              (b) =>
                b === id ||
                !rows.some(
                  (r) =>
                    r.id === b &&
                    r.kind === 'product' &&
                    r.vendorId === row.vendorId &&
                    r.status === 'active' &&
                    !r.data.bundleIds?.length,
                ),
            )
          )
            throw new BadRequestException(
              'Bundles need active, non-bundle products from this vendor',
            );
          const imageUrl = stringValue(d, 'imageUrl', 2000, true);
          if (imageUrl && !/^https:\/\//i.test(imageUrl))
            throw new BadRequestException('Image URL must use HTTPS');
          row.status = oneOf(
            d.status,
            ['active', 'draft', 'inactive'],
            'product status',
          );
          row.data = {
            sku,
            categoryId: category.id,
            description: stringValue(d, 'description', 10000),
            brand: stringValue(d, 'brand', 100, true),
            imageUrl,
            priceMinor: numberValue(d, 'priceMinor', 100000000, true),
            discountPercent: numberValue(d, 'discountPercent', 100),
            stock: numberValue(d, 'stock', 1000000, true),
            lowStock: numberValue(d, 'lowStock', 1000000, true),
            currency: 'INR',
            fields: custom,
            bundleIds,
          };
        } else if (kind === 'order') {
          if (!old) {
            if (
              !Array.isArray(d.lines) ||
              !d.lines.length ||
              d.lines.length > 100
            )
              throw new BadRequestException('Order needs 1–100 product lines');
            const seen = new Set();
            const lines: any[] = [];
            for (const item of d.lines) {
              if (!item || typeof item !== 'object')
                throw new BadRequestException('Invalid order line');
              const product = rows.find(
                (r) =>
                  r.kind === 'product' &&
                  r.id === item.productId &&
                  r.vendorId === row.vendorId &&
                  r.status === 'active',
              );
              const quantity = numberValue(item, 'quantity', 1000000, true);
              if (
                !product ||
                !quantity ||
                seen.has(product.id) ||
                product.data.bundleIds?.length
              )
                throw new BadRequestException(
                  'Choose distinct active standalone products',
                );
              if (product.data.stock < quantity)
                throw new ConflictException('Insufficient stock');
              seen.add(product.id);
              product.data.stock -= quantity;
              product.version++;
              await em.save(product);
              lines.push({
                productId: product.id,
                name: product.name,
                quantity,
                unitMinor: Math.round(
                  product.data.priceMinor *
                    (1 - product.data.discountPercent / 100),
                ),
              });
            }
            const totalMinor = lines.reduce(
              (s, l) => s + l.quantity * l.unitMinor,
              0,
            );
            if (!Number.isSafeInteger(totalMinor))
              throw new BadRequestException(
                'Order total exceeds supported precision',
              );
            row.status = 'pending';
            row.data = { lines, totalMinor, currency: 'INR', source: 'manual' };
          } else {
            const transitions: Record<string, string[]> = {
              pending: ['accepted', 'cancelled'],
              accepted: ['processing', 'cancelled'],
              processing: ['shipped', 'cancelled'],
              shipped: ['fulfilled'],
              fulfilled: [],
              cancelled: [],
            };
            const next = stringValue(d, 'status');
            if (!transitions[old.status]?.includes(next))
              throw new BadRequestException('Invalid order transition');
            row.status = next;
            row.data.reason = stringValue(d, 'reason', 1000);
            if (next === 'cancelled')
              for (const line of old.data.lines) {
                const product = rows.find((r) => r.id === line.productId)!;
                product.data.stock += line.quantity;
                product.version++;
                await em.save(product);
              }
          }
        }
      }
      row.version = old ? old.version + 1 : 1;
      row = await em.save(row);
      if (kind === 'vendor' && !old) {
        row.vendorId = row.id;
        await em.save(row);
      }
      await this.audit(
        em,
        u,
        row,
        `${kind} ${old ? 'updated' : 'created'}: ${row.status}`,
        row.data.reason || row.data.moderationReason || '',
      );
      return row;
    });
  }
}
