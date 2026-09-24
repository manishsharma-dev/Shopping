import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { User } from '../modules/auth/auth.entities';
import { seedSuperadmin } from '../modules/auth/seed-superadmin';

async function main() {
  if (process.env.NODE_ENV === 'production')
    throw new Error(
      'The development superadmin seed is disabled in production.',
    );
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error'],
  });
  try {
    const config = app.get(ConfigService);
    const result = await seedSuperadmin(
      app.get(DataSource).getRepository(User),
      {
        email: config.get<string>('SEED_SUPERADMIN_EMAIL', ''),
        password: config.get<string>('SEED_SUPERADMIN_PASSWORD', ''),
        nodeEnv: config.get<string>('NODE_ENV'),
      },
    );
    console.log(
      `Superadmin ${result.status}: ${result.user.email}. Passwords are never overwritten by this command.`,
    );
  } finally {
    await app.close();
  }
}
void main().catch((error) => {
  console.error((error as Error).message);
  process.exitCode = 1;
});
