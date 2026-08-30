import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AccessTokenGuard, type AuthenticatedRequest } from './access-token.guard';

const accessCookieName = 'access_token';
const accessCookieLifetimeMs = 15 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const { accessToken, user } = await this.authService.login(dto.email, dto.password, request.ip, request.get('user-agent'));
    response.cookie(accessCookieName, accessToken, this.cookieOptions());
    return { user };
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(accessCookieName, this.cookieOptions());
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  getCurrentUser(@Req() request: AuthenticatedRequest) {
    return { user: request.currentUser };
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: accessCookieLifetimeMs,
    };
  }
}
