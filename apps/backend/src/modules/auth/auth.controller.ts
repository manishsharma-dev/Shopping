import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService, SESSION_MS } from './auth.service';
import { LoginDto, RegisterDto } from './auth.dto';
import { AuthGuard, sessionToken } from './auth.guard';
import type { AuthRequest } from './auth.guard';

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api',
});

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.register(dto);
    response.cookie('shopping_session', result.token, {
      ...cookieOptions(),
      maxAge: SESSION_MS,
    });
    return { user: result.user };
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(dto);
    response.cookie('shopping_session', result.token, {
      ...cookieOptions(),
      maxAge: SESSION_MS,
    });
    return { user: result.user };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() request: AuthRequest) {
    return { user: request.user };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logout(sessionToken(request));
    response.clearCookie('shopping_session', cookieOptions());
  }
}
