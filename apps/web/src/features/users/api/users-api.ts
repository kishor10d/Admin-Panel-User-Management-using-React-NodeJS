import { apiRequest, createQueryString } from '../../../lib/api-client';

export interface RoleOption { id: string; name: string; description: string | null; isActive: boolean; }
export interface ManagedUser {
  id: string; email: string; name: string | null; mobile: string | null; isActive: boolean;
  mustChangePassword: boolean; roles: Array<{ id: string; name: string }>;
  createdAt: string; updatedAt: string;
}
export interface UsersPageResponse { items: ManagedUser[]; page: number; limit: number; total: number; totalPages: number; }

const json = (body: Record<string, unknown>): RequestInit => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export const usersApi = {
  list: (page: number, search: string) => apiRequest<UsersPageResponse>(`/users?${createQueryString({ page, limit: 20, search })}`),
  roles: () => apiRequest<{ roles: RoleOption[] }>('/roles'),
  create: (data: Record<string, unknown>) => apiRequest<ManagedUser>('/users', json(data)),
  update: (id: string, data: Record<string, unknown>) => apiRequest<ManagedUser>(`/users/${id}`, { ...json(data), method: 'PATCH' }),
  deactivate: (id: string) => apiRequest<ManagedUser>(`/users/${id}/deactivate`, { method: 'PATCH' }),
};
