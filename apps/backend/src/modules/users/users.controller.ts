import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminGuard, AuthGuard } from '../auth/auth.guard';
import { User } from '../auth/auth.entities';
import { publicUser } from '../auth/auth.service';

@Controller('users')
@UseGuards(AuthGuard, AdminGuard)
export class UsersController {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}
  @Get()
  async listUsers() {
    const users = await this.users.find({
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return { data: users.map(publicUser) };
  }
}
