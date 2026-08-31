import { Body, Controller, Get, HttpCode, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AccessTokenGuard, type AuthenticatedRequest } from './access-token.guard';
import { AllowPasswordChangeRequired } from './allow-password-change-required.decorator';
import { CsrfGuard } from './csrf.guard';
import { PasswordChangeRequiredGuard } from './password-change-required.guard';

const accessCookieName = 'access_token';
const refreshCookieName = 'refresh_token';
const accessCookieLifetimeMs = 15 * 60 * 1000;
const refreshCookieLifetimeMs = 7 * 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('csrf')
  @HttpCode(204)
  csrf() {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard, CsrfGuard)
  @Throttle({ auth: { limit: 5, ttl: 60_000, blockDuration: 15 * 60_000 } })
  async login(@Body() dto: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const { accessToken, refreshToken, user } = await this.authService.login(dto.email, dto.password, request.ip, request.get('user-agent'));
    this.setSessionCookies(response, accessToken, refreshToken);
    return { user };
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(CsrfGuard)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.authService.revokeRefreshToken(request.cookies?.[refreshCookieName]);
    this.clearSessionCookies(response);
  }

  @Post('refresh')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard, CsrfGuard)
  @Throttle({ auth: { limit: 20, ttl: 60_000, blockDuration: 5 * 60_000 } })
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const { accessToken, refreshToken, user } = await this.authService.refresh(request.cookies?.[refreshCookieName], request.ip, request.get('user-agent'));
    this.setSessionCookies(response, accessToken, refreshToken);
    return { user };
  }

  @Get('me')
  @UseGuards(AccessTokenGuard, PasswordChangeRequiredGuard)
  @AllowPasswordChangeRequired()
  getCurrentUser(@Req() request: AuthenticatedRequest) {
    return { user: request.currentUser };
  }

  @Patch('profile')
  @UseGuards(AccessTokenGuard, CsrfGuard, PasswordChangeRequiredGuard)
  @AllowPasswordChangeRequired()
  async updateProfile(@Req() request: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    return { user: await this.authService.updateProfile(request.currentUser!.id, dto) };
  }

  @Post('change-password')
  @HttpCode(204)
  @UseGuards(AccessTokenGuard, CsrfGuard, PasswordChangeRequiredGuard)
  @AllowPasswordChangeRequired()
  async changePassword(@Req() request: AuthenticatedRequest, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(request.currentUser!.id, request.sessionId!, dto.currentPassword, dto.newPassword);
  }

  @Post('forgot-password')
  @HttpCode(204)
  @UseGuards(ThrottlerGuard, CsrfGuard)
  @Throttle({ auth: { limit: 3, ttl: 60 * 60_000, blockDuration: 60 * 60_000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @HttpCode(204)
  @UseGuards(ThrottlerGuard, CsrfGuard)
  @Throttle({ auth: { limit: 5, ttl: 15 * 60_000, blockDuration: 15 * 60_000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
  }

  private setSessionCookies(response: Response, accessToken: string, refreshToken: string) {
    response.cookie(accessCookieName, accessToken, this.accessCookieOptions());
    response.cookie(refreshCookieName, refreshToken, this.refreshCookieOptions());
  }

  private clearSessionCookies(response: Response) {
    response.clearCookie(accessCookieName, this.clearCookieOptions('/'));
    response.clearCookie(refreshCookieName, this.clearCookieOptions('/api/auth'));
  }

  private accessCookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: accessCookieLifetimeMs,
    };
  }

  private refreshCookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      path: '/api/auth',
      maxAge: refreshCookieLifetimeMs,
    };
  }

  private clearCookieOptions(path: string) {
    return {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      path,
    };
  }
}
