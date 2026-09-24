import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AuthModule } from '../src/modules/auth/auth.module';
import { AuthSession, User } from '../src/modules/auth/auth.entities';
import { UsersModule } from '../src/modules/users/users.module';

jest.setTimeout(30000);

describe('Authentication (isolated PostgreSQL schema)', () => {
  let app: INestApplication;
  let db: DataSource;
  let setup: DataSource;
  let cookie: string;
  let userId: string;
  const schema = `auth_test_${randomUUID().replaceAll('-', '')}`;
  const credentials = {
    email: 'auth-test@example.com',
    password: 'a-long-test-password',
  };
  const post = (path: string) =>
    request(app.getHttpServer())
      .post(`/api/auth/${path}`)
      .set('X-Shopping-Client', 'web');

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
          entities: [User, AuthSession],
          synchronize: true,
        }),
        AuthModule,
        UsersModule,
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    db = app.get(DataSource);
  });

  afterAll(async () => {
    if (app) await app.close();
    if (setup?.isInitialized) {
      // Only the randomly named schema created by this test can be removed.
      if (!/^auth_test_[a-f0-9]{32}$/.test(schema))
        throw new Error('Unsafe test schema');
      await setup.query(`DROP SCHEMA "${schema}" CASCADE`);
      await setup.destroy();
    }
  });

  it('rejects unauthenticated access and untrusted browser requests', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    await request(app.getHttpServer()).get('/api/users').expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(credentials)
      .expect(403);
    await post('login')
      .set('Origin', 'https://untrusted.example')
      .send(credentials)
      .expect(403);
  });

  it('validates registration and prevents assigning privileged roles', async () => {
    await post('register')
      .send({ ...credentials, name: 'Test', password: 'short' })
      .expect(400);
    await post('register')
      .send({ ...credentials, name: ' ' })
      .expect(400);
    const response = await post('register')
      .send({
        ...credentials,
        email: ' AUTH-TEST@EXAMPLE.COM ',
        name: ' Test User ',
        role: 'superadmin',
      })
      .expect(201);
    expect(response.body.user).toMatchObject({
      name: 'Test User',
      email: credentials.email,
      role: 'customer',
    });
    expect(response.body.user.passwordHash).toBeUndefined();
    cookie = response.headers['set-cookie'][0].split(';')[0];
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(response.headers['set-cookie'][0]).toContain('SameSite=Lax');
    userId = response.body.user.id;
    const stored = await db
      .getRepository(User)
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .getOneOrFail();
    expect(stored.passwordHash).not.toContain(credentials.password);
    const session = await db
      .getRepository(AuthSession)
      .findOneByOrFail({ userId });
    expect(session.tokenHash).not.toBe(cookie.split('=')[1]);
  });

  it('restores the customer session and blocks admin data', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', cookie)
      .expect(200);
    expect(response.body.user.id).toBe(userId);
    await request(app.getHttpServer())
      .get('/api/users')
      .set('Cookie', cookie)
      .expect(403);
    await post('register')
      .send({ ...credentials, name: 'Duplicate' })
      .expect(409);
  });

  it('rejects wrong and unknown credentials with the same response', async () => {
    const wrong = await post('login')
      .send({ ...credentials, password: 'wrong-password' })
      .expect(401);
    const unknown = await post('login')
      .send({ ...credentials, email: 'unknown@example.com' })
      .expect(401);
    expect(wrong.body).toEqual(unknown.body);
  });

  it('invalidates expired sessions', async () => {
    await db
      .getRepository(AuthSession)
      .update({ userId }, { expiresAt: new Date(0) });
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', cookie)
      .expect(401);
  });

  it('logs in and authorizes server-assigned admins, then revokes logout sessions', async () => {
    await db.getRepository(User).update(userId, { role: 'admin' });
    const response = await post('login').send(credentials).expect(200);
    cookie = response.headers['set-cookie'][0].split(';')[0];
    await request(app.getHttpServer())
      .get('/api/users')
      .set('Cookie', cookie)
      .expect(200);
    await post('logout').set('Cookie', cookie).send({}).expect(204);
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', cookie)
      .expect(401);
  });

  it('limits repeated login attempts', async () => {
    let status = 0;
    for (let i = 0; i < 21 && status !== 429; i++)
      status = (await post('login').send({})).status;
    expect(status).toBe(429);
  });
});
