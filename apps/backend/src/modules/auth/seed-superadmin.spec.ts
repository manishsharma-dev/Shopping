import { Repository } from 'typeorm';
import { seedSuperadmin } from './seed-superadmin';
import { User } from './auth.entities';

describe('Development superadmin seed', () => {
  const config = {
    email: ' Admin@shopping.local ',
    password: 'a-test-password-123',
    nodeEnv: 'development',
  };
  const repository = () => ({
    findOneBy: jest.fn().mockResolvedValue(null),
    create: jest.fn((input) => input),
    save: jest
      .fn()
      .mockImplementation((input) =>
        Promise.resolve({ ...input, id: 'test-id' }),
      ),
  });
  it('creates a normalized superadmin with a salted password hash', async () => {
    const users = repository();
    const result = await seedSuperadmin(
      users as unknown as Repository<User>,
      config,
    );
    expect(result).toMatchObject({
      status: 'created',
      user: { email: 'admin@shopping.local', role: 'superadmin' },
    });
    expect(users.save.mock.calls[0][0].passwordHash).toMatch(
      /^[a-f0-9]{32}:[a-f0-9]{128}$/,
    );
    expect(JSON.stringify(result)).not.toContain('password');
  });
  it('is idempotent without resetting an existing password', async () => {
    const users = repository();
    users.findOneBy.mockResolvedValue({
      id: 'id',
      email: 'admin@shopping.local',
      role: 'superadmin',
      name: 'Existing',
    });
    expect(
      (await seedSuperadmin(users as unknown as Repository<User>, config))
        .status,
    ).toBe('exists');
    expect(users.save).not.toHaveBeenCalled();
  });
  it('does not elevate an existing customer', async () => {
    const users = repository();
    users.findOneBy.mockResolvedValue({ role: 'customer' });
    await expect(
      seedSuperadmin(users as unknown as Repository<User>, config),
    ).rejects.toThrow('will not change');
    expect(users.save).not.toHaveBeenCalled();
  });
  it('refuses production and invalid credentials before database access', async () => {
    const users = repository();
    for (const invalid of [
      { ...config, nodeEnv: 'production' },
      { ...config, email: 'invalid' },
      { ...config, password: 'short' },
    ]) {
      await expect(
        seedSuperadmin(users as unknown as Repository<User>, invalid),
      ).rejects.toThrow();
    }
    expect(users.findOneBy).not.toHaveBeenCalled();
  });
});
