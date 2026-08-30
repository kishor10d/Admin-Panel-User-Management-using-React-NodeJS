import { apiRequest } from '../../../lib/api-client';

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  roles: string[];
  permissions: string[];
}

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const authApi = {
  me: () => apiRequest<{ user: CurrentUser }>('/auth/me'),
  login: (email: string, password: string) => apiRequest<{ user: CurrentUser }>('/auth/login', json({ email, password })),
  logout: () => apiRequest<void>('/auth/logout', { method: 'POST' }),
  changePassword: (currentPassword: string, newPassword: string) => apiRequest<void>('/auth/change-password', json({ currentPassword, newPassword })),
  forgotPassword: (email: string) => apiRequest<void>('/auth/forgot-password', json({ email })),
  resetPassword: (token: string, password: string) => apiRequest<void>('/auth/reset-password', json({ token, password })),
};
