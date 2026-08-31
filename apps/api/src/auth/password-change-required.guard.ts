import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_PASSWORD_CHANGE_REQUIRED } from './allow-password-change-required.decorator';
import type { AuthenticatedRequest } from './access-token.guard';

@Injectable()
export class PasswordChangeRequiredGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowed = this.reflector.getAllAndOverride<boolean>(ALLOW_PASSWORD_CHANGE_REQUIRED, [context.getHandler(), context.getClass()]);
    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().currentUser;
    if (user?.mustChangePassword && !allowed) {
      throw new ForbiddenException('You must change your password before accessing the administration area.');
    }
    return true;
  }
}
