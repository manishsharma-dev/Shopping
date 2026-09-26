import { defaultTypes } from '../src/modules/management/management.types';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AuthModule } from '../src/modules/auth/auth.module';
import { AuthSession, User } from '../src/modules/auth/auth.entities';
import { publicUser } from '../src/modules/auth/auth.service';
import { ManagementModule } from '../src/modules/management/management.module';
import { ManagementRecord } from '../src/modules/management/management.entity';
import { ManagementService } from '../src/modules/management/management.service';
import { Actor } from '../src/modules/management/management.policy';

jest.setTimeout(60000);
describe('Management integration with isolated PostgreSQL schema', () => {
  let app: INestApplication;
  let db: DataSource;
  let setup: DataSource;
  let service: ManagementService;
  let root: Actor;
  let state: Actor;
  let district: Actor;
  let vendorUser: Actor;
  let otherUser: Actor;
  let customer: Actor;
  let vendor: ManagementRecord;
  let other: ManagementRecord;
  let category: ManagementRecord;
  let product: ManagementRecord;
  const schema = `manage_test_${randomUUID().replaceAll('-', '')}`;
  const create = async (role: User['role'], scope = {}) =>
    publicUser(
      await db.manager.save(
        User,
        db.manager.create(User, {
          name: role,
          email: `${randomUUID()}@example.com`,
          passwordHash: 'unused',
          role,
          active: true,
          ...scope,
        }),
      ),
    );
  const save = (u: Actor, kind: string, data: any, row?: ManagementRecord) =>
    service.save(u, kind, { data, version: row?.version }, row?.id);
  const vendorData = (
    name: string,
    state = 'State A',
    district = 'District A',
  ) => ({
    name,
    state,
    district,
    contactEmail: 'vendor@example.com',
    phone: '1234567890',
    address: 'Test address',
  });
  const productData = () => ({
    name: 'Product',
    vendorId: vendor.id,
    sku: 'SKU-1',
    categoryId: category.id,
    description: 'Details',
    priceMinor: 10000,
    discountPercent: 10,
    stock: 5,
    lowStock: 2,
    status: 'active',
    fields: {},
    bundleIds: [],
  });
  beforeAll(async () => {
    process.loadEnvFile('.env');
    const options = {
      type: 'postgres' as const,
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5433),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'shopping_db',
    };
    setup = await new DataSource(options).initialize();
    await setup.query(`CREATE SCHEMA "${schema}"`);
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          ...options,
          schema,
          entities: [User, AuthSession, ManagementRecord],
          synchronize: true,
        }),
        AuthModule,
        ManagementModule,
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    db = app.get(DataSource);
    service = app.get(ManagementService);
    jest.spyOn(service, 'geography').mockResolvedValue({
      states: [
        { id: 1, name: 'State A' },
        { id: 2, name: 'State B' },
      ],
      districts: [
        { id: 1, name: 'District A', state: 'State A' },
        { id: 2, name: 'District B', state: 'State B' },
      ],
    });
    root = await create('superadmin');
    state = await create('state_admin', { state: 'State A' });
    district = await create('district_admin', {
      state: 'State A',
      district: 'District A',
    });
    customer = await create('customer');
    vendor = await save(state, 'vendor', vendorData('Vendor A'));
    other = await save(
      root,
      'vendor',
      vendorData('Vendor B', 'State B', 'District B'),
    );
    expect(vendor.status).toBe('pending');
    vendor = await save(
      state,
      'vendor',
      { status: 'active', reason: 'Approved' },
      vendor,
    );
    other = await save(
      root,
      'vendor',
      { status: 'active', reason: 'Approved' },
      other,
    );
    vendorUser = await create('vendor_admin', {
      vendorId: vendor.id,
      state: vendor.state,
      district: vendor.district,
    });
    otherUser = await create('vendor_admin', {
      vendorId: other.id,
      state: other.state,
      district: other.district,
    });
    category = await save(root, 'category', { name: 'Shared' });
    product = await save(vendorUser, 'product', productData());
  });
  afterAll(async () => {
    if (app) await app.close();
    if (setup?.isInitialized) {
      if (!/^manage_test_[a-f0-9]{32}$/.test(schema))
        throw new Error('Unsafe schema');
      await setup.query(`DROP SCHEMA "${schema}" CASCADE`);
      await setup.destroy();
    }
  });
  it('enforces HTTP authentication and origin/header protection', async () => {
    await request(app.getHttpServer()).get('/api/manage').expect(401);
    await request(app.getHttpServer())
      .post('/api/manage/vendor')
      .send({ data: vendorData('Bad') })
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/manage/vendor')
      .set('X-Shopping-Client', 'web')
      .set('Origin', 'https://untrusted.example')
      .send({ data: vendorData('Bad') })
      .expect(403);
  });
  it('isolates region and vendor reads and rejects forged filters and writes', async () => {
    expect(
      (await service.snapshot(state, {})).vendors.map((v) => v.id),
    ).toEqual([vendor.id]);
    expect(
      (await service.snapshot(state, { state: 'State B' })).vendors,
    ).toEqual([]);
    expect((await service.snapshot(otherUser, {})).products).toEqual([]);
    await expect(
      save(state, 'vendor', vendorData('Outside', 'State B')),
    ).rejects.toThrow('Outside');
    await expect(
      save(district, 'vendor', vendorData('Outside', 'State A', 'District B')),
    ).rejects.toThrow('Outside');
    await expect(
      save(otherUser, 'product', productData(), product),
    ).rejects.toThrow('Outside');
    await expect(service.snapshot(customer, {})).rejects.toThrow();
  });
  it('requires vendor approval and defers public applications', async () => {
    await expect(
      service.apply(customer, vendorData('Applicant')),
    ).rejects.toThrow('not available yet');
    const agent = await service.createUser(district, {
      name: 'Agent',
      email: 'agent@example.com',
      password: 'long-test-password',
      userTypeId: defaultTypes.find((t) => t.role === 'agent')!.id,
      state: 'State A',
      district: 'District A',
    });
    const pending = await save(agent, 'vendor', vendorData('Agent vendor'));
    expect(pending.status).toBe('pending');
    expect((await service.capabilities(agent)).permissions).toEqual([
      'vendors',
    ]);
    await expect(
      save(
        agent,
        'vendor',
        { status: 'active', reason: 'Self approval' },
        pending,
      ),
    ).rejects.toThrow('Missing permission');
    const login = await service.createUser(district, {
      name: 'Vendor',
      email: 'pending@example.com',
      password: 'long-test-password',
      userTypeId: defaultTypes.find((t) => t.role === 'vendor_admin')!.id,
      vendorId: pending.id,
    });
    expect((await service.capabilities(login)).permissions).toEqual([]);
    await expect(save(login, 'product', productData())).rejects.toThrow(
      'Missing permission',
    );
    await save(
      district,
      'vendor',
      { status: 'active', reason: 'Verified' },
      pending,
    );
    expect((await service.capabilities(login)).permissions).toContain(
      'products',
    );
  });
  it('enforces hierarchy, mandatory geography, protected types and safe deletion', async () => {
    const user = {
      name: 'Test',
      email: 'hierarchy@example.com',
      password: 'long-test-password',
    };
    await expect(
      service.createUser(root, { ...user, role: 'customer' }),
    ).rejects.toThrow('Select an available');
    await expect(
      service.createUser(state, {
        ...user,
        userTypeId: defaultTypes.find((t) => t.role === 'state_admin')!.id,
        state: 'State A',
      }),
    ).rejects.toThrow('below your hierarchy');
    await expect(
      service.createUser(root, {
        ...user,
        userTypeId: defaultTypes.find((t) => t.role === 'state_admin')!.id,
      }),
    ).rejects.toThrow('valid state');
    await expect(
      service.createUser(root, {
        ...user,
        userTypeId: defaultTypes.find((t) => t.role === 'district_admin')!.id,
        state: 'State A',
        district: 'District B',
      }),
    ).rejects.toThrow('district in');
    const defaults = (await service.snapshot(root, {})).types;
    for (const role of ['superadmin', 'admin']) {
      const type = defaults.find((t) => t.data.role === role)!;
      await expect(
        save(root, 'type', { status: 'deleted', reason: 'Remove' }, type),
      ).rejects.toThrow('protected');
    }
    const disposable = await save(root, 'type', {
      name: 'Temporary District Type',
      role: 'district_admin',
      permissions: ['vendors'],
    });
    await save(
      root,
      'type',
      { status: 'deleted', reason: 'Unused' },
      disposable,
    );
    await expect(
      service.createUser(root, {
        ...user,
        userTypeId: disposable.id,
        state: 'State A',
        district: 'District A',
      }),
    ).rejects.toThrow('available');
    const limited = await save(root, 'type', {
      name: 'No vendor access',
      role: 'district_admin',
      permissions: ['reports'],
    });
    const limitedUser = await service.createUser(root, {
      ...user,
      userTypeId: limited.id,
      state: 'State A',
      district: 'District A',
    });
    expect((await service.snapshot(limitedUser, {})).vendors).toEqual([]);
    await expect(
      save(limitedUser, 'vendor', vendorData('Hidden')),
    ).rejects.toThrow('Missing permission');
    await expect(
      save(root, 'type', { status: 'deleted', reason: 'In use' }, limited),
    ).rejects.toThrow('Reassign');
  });
  it('prevents role escalation and grants only assigned capabilities', async () => {
    const type = await save(vendorUser, 'type', {
      name: 'Product editor',
      permissions: ['products'],
    });
    const staff = await service.createUser(vendorUser, {
      name: 'Editor',
      email: 'editor@example.com',
      password: 'test-password-long',
      role: 'staff',
      userTypeId: type.id,
    });
    expect(staff.userType).toBe('Product editor');
    const otherType = await save(otherUser, 'type', {
      name: 'Other tenant',
      permissions: ['products'],
    });
    await expect(
      service.assignType(vendorUser, staff.id, {
        userTypeId: otherType.id,
        reason: 'Invalid',
      }),
    ).rejects.toThrow('available user type');
    const reporting = await save(vendorUser, 'type', {
      name: 'Reporting',
      permissions: ['reports'],
    });
    await service.assignType(vendorUser, staff.id, {
      userTypeId: reporting.id,
      reason: 'Changed duties',
    });
    const updatedStaff = publicUser(
      await db.manager.findOneByOrFail(User, { id: staff.id }),
    );
    expect((await service.snapshot(updatedStaff, {})).permissions).toEqual([
      'reports',
    ]);
    await expect(
      service.createUser(vendorUser, {
        name: 'Bad',
        email: 'bad@example.com',
        password: 'test-password-long',
        userTypeId: defaultTypes.find((t) => t.role === 'admin')!.id,
      }),
    ).rejects.toThrow('below your hierarchy');
    await expect(
      save(staff, 'order', {
        name: 'Bad',
        vendorId: vendor.id,
        lines: [{ productId: product.id, quantity: 1 }],
      }),
    ).rejects.toThrow('Missing permission');
    await expect(
      save(vendorUser, 'type', { name: 'Bad', permissions: ['superadmin'] }),
    ).rejects.toThrow();
    await expect(
      service.userStatus(vendorUser, vendorUser.id, {
        active: false,
        reason: 'No',
      }),
    ).rejects.toThrow();
  });
  it('validates prices, SKU uniqueness, custom fields and bundle ownership', async () => {
    await expect(
      save(vendorUser, 'product', {
        ...productData(),
        sku: 'BAD',
        priceMinor: -1,
      }),
    ).rejects.toThrow('priceMinor');
    await expect(save(vendorUser, 'product', productData())).rejects.toThrow(
      'SKU',
    );
    const field = await save(vendorUser, 'field', {
      name: 'Material',
      type: 'choice',
      required: true,
      options: ['Cotton', 'Wool'],
    });
    await expect(
      save(vendorUser, 'product', { ...productData(), sku: 'SKU-2' }),
    ).rejects.toThrow('Material');
    await expect(
      save(vendorUser, 'product', {
        ...productData(),
        sku: 'SKU-2',
        fields: { [field.id]: 'Plastic' },
      }),
    ).rejects.toThrow('Material');
    await expect(
      save(vendorUser, 'product', {
        ...productData(),
        sku: 'SKU-2',
        fields: { [field.id]: 'Cotton' },
        bundleIds: [other.id],
      }),
    ).rejects.toThrow('Bundles');
    const result = await save(vendorUser, 'product', {
      ...productData(),
      sku: 'SKU-2',
      fields: { [field.id]: 'Cotton' },
    });
    expect(result.data.fields[field.id]).toBe('Cotton');
  });
  it('reserves stock atomically, prevents overselling, restores on cancellation and rejects stale edits', async () => {
    const results = await Promise.allSettled(
      [1, 2].map((n) =>
        save(vendorUser, 'order', {
          name: `Order ${n}`,
          lines: [{ productId: product.id, quantity: 4 }],
        }),
      ),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const order = (
      results.find(
        (r) => r.status === 'fulfilled',
      ) as PromiseFulfilledResult<ManagementRecord>
    ).value;
    expect(order.data.totalMinor).toBe(36000);
    expect(
      (await db.manager.findOneByOrFail(ManagementRecord, { id: product.id }))
        .data.stock,
    ).toBe(1);
    await save(
      vendorUser,
      'order',
      { status: 'cancelled', reason: 'Customer requested' },
      order,
    );
    await expect(
      save(
        vendorUser,
        'order',
        { status: 'cancelled', reason: 'Again' },
        order,
      ),
    ).rejects.toThrow('changed');
    expect(
      (await db.manager.findOneByOrFail(ManagementRecord, { id: product.id }))
        .data.stock,
    ).toBe(5);
    await expect(
      save(vendorUser, 'product', productData(), product),
    ).rejects.toThrow('changed');
  });
  it('enforces moderation and vendor blocking in management and public catalog', async () => {
    product = await db.manager.findOneByOrFail(ManagementRecord, {
      id: product.id,
    });
    product = await save(
      district,
      'product',
      { action: 'moderate', status: 'blocked', reason: 'Review' },
      product,
    );
    await expect(
      save(vendorUser, 'product', productData(), product),
    ).rejects.toThrow('moderation');
    expect(
      (await service.catalog()).items.find((p) => p.id === product.id),
    ).toBeUndefined();
    vendor = await save(
      state,
      'vendor',
      { status: 'blocked', reason: 'Business review' },
      vendor,
    );
    await expect(service.snapshot(vendorUser, {})).rejects.toThrow(
      'active vendor',
    );
    expect((await service.catalog()).items).toEqual([]);
    expect((await service.snapshot(root, {})).audit.length).toBeGreaterThan(0);
  });
});
