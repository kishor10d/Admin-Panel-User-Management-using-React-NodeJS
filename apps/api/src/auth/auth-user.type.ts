import type { UserType } from '../common/user-type';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  mobile: string | null;
  userType: UserType;
  roles: string[];
  permissions: string[];
}

export interface JwtPayload {
  sub: string;
  email: string;
}
