import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import type { AuthUser } from './auth-user.type';

export interface AuthenticatedRequest extends Request {
  currentUser?: AuthUser;
  sessionId?: string;
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.access_token;
    if (!token || typeof token !== 'string') throw new UnauthorizedException();
    const verified = await this.authService.verifyAccessToken(token);
    request.currentUser = verified.user;
    request.sessionId = verified.sessionId;
    return true;
  }
}
