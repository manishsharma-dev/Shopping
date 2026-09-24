import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, publicUser } from './auth.service';

export type AuthRequest = Request & { user: ReturnType<typeof publicUser> };
export function sessionToken(request: Request): string {
  return (
    request.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('shopping_session='))
      ?.slice('shopping_session='.length) ?? ''
  );
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    request.user = await this.auth.authenticate(sessionToken(request));
    return true;
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const { user } = context.switchToHttp().getRequest<AuthRequest>();
    if (!user || !['admin', 'superadmin'].includes(user.role))
      throw new ForbiddenException('Administrator access required');
    return true;
  }
}
