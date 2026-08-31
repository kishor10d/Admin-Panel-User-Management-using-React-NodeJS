import { apiRequest } from '../../../lib/api-client';

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  mobile: string | null;
  userType: 'REGULAR' | 'SYSTEM_ADMINISTRATOR' | 'SERVICE';
  roles: string[];
  permissions: string[];
}

const json = (data: unknown, method = 'POST') => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  data,
});

export const authApi = {
  me: () => apiRequest<{ user: CurrentUser }>('/auth/me'),
  updateProfile: (data: Pick<CurrentUser, 'email' | 'name' | 'mobile'>) => apiRequest<{ user: CurrentUser }>('/auth/profile', json(data, 'PATCH')),
  login: (email: string, password: string) => apiRequest<{ user: CurrentUser }>('/auth/login', json({ email, password })),
  logout: () => apiRequest<void>('/auth/logout', { method: 'POST' }),
  changePassword: (currentPassword: string, newPassword: string) => apiRequest<void>('/auth/change-password', json({ currentPassword, newPassword })),
  forgotPassword: (email: string) => apiRequest<void>('/auth/forgot-password', json({ email })),
  resetPassword: (token: string, password: string) => apiRequest<void>('/auth/reset-password', json({ token, password })),
};
