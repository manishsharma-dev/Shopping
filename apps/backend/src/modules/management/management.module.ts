import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/auth.entities';
import { AuthSecurityMiddleware } from '../auth/auth-security.middleware';
import { ManagementRecord } from './management.entity';
import { ManagementController } from './management.controller';
import { ManagementService } from './management.service';

@Module({
  imports: [TypeOrmModule.forFeature([ManagementRecord, User])],
  controllers: [ManagementController],
  providers: [ManagementService],
  exports: [ManagementService],
})
export class ManagementModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthSecurityMiddleware).forRoutes(ManagementController);
  }
}
