import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/auth.entities';
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
})
export class UsersModule {}
