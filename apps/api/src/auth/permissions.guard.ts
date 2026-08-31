import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSIONS } from './require-permissions.decorator';
import { REQUIRED_ANY_PERMISSIONS } from './require-any-permissions.decorator';
import type { AuthenticatedRequest } from './access-token.guard';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS, [context.getHandler(), context.getClass()]) ?? [];
    const requiredAny = this.reflector.getAllAndOverride<string[]>(REQUIRED_ANY_PERMISSIONS, [context.getHandler(), context.getClass()]) ?? [];
    if (!required.length && !requiredAny.length) return true;
    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().currentUser;
    if (user?.userType === 'SYSTEM_ADMINISTRATOR') return true;
    if (!user || !required.every((permission) => user.permissions.includes(permission)) || (requiredAny.length > 0 && !requiredAny.some((permission) => user.permissions.includes(permission)))) {
      throw new ForbiddenException('You do not have permission to perform this action.');
    }
    return true;
  }
}
