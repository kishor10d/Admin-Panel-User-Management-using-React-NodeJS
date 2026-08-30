export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  mobile: string | null;
  roles: string[];
  permissions: string[];
}

export interface JwtPayload {
  sub: string;
  email: string;
}
