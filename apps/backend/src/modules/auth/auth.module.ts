import { AuthSecurityMiddleware } from './auth-security.middleware';
import { Global, Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSession, User } from './auth.entities';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminGuard, AuthGuard } from './auth.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User, AuthSession])],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, AdminGuard],
  exports: [AuthService, AuthGuard, AdminGuard],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthSecurityMiddleware).forRoutes(AuthController);
  }
}
