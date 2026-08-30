export const PERMISSIONS = [
  'users.read',
  'users.create',
  'users.update',
  'users.delete',
  'roles.read',
  'roles.manage',
  'login-history.read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  roles: string[];
  permissions: Permission[];
}

export interface HealthResponse {
  status: 'ok';
  database: 'disabled' | 'configured';
}
