import { SetMetadata } from '@nestjs/common';

export const REQUIRED_ANY_PERMISSIONS = 'required_any_permissions';
export const RequireAnyPermissions = (...permissions: string[]) => SetMetadata(REQUIRED_ANY_PERMISSIONS, permissions);
