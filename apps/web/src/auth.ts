export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  roles: string[];
  permissions: string[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { credentials: 'include', ...options });
  if (!response.ok) {
    const message = response.status === 401 ? 'Invalid email or password.' : 'Something went wrong. Please try again.';
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const authApi = {
  me: () => request<{ user: CurrentUser }>('/auth/me'),
  login: (email: string, password: string) => request<{ user: CurrentUser }>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  changePassword: (currentPassword: string, newPassword: string) => request<void>('/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) }),
  forgotPassword: (email: string) => request<void>('/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) => request<void>('/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) }),
};
