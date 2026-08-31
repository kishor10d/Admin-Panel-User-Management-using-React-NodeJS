import { apiRequest, createQueryString } from '../../../lib/api-client';

export interface RoleOption { id: string; name: string; description: string | null; isActive: boolean; }
export type UserType = 'REGULAR' | 'SYSTEM_ADMINISTRATOR' | 'SERVICE';
export interface ManagedUser {
  id: string; email: string; name: string | null; mobile: string | null; userType: UserType; isActive: boolean;
  mustChangePassword: boolean; roles: Array<{ id: string; name: string }>;
  createdAt: string; updatedAt: string;
}
export interface UsersPageResponse { items: ManagedUser[]; page: number; limit: number; total: number; totalPages: number; }
export interface ListUsersOptions { page: number; limit: number; search: string; sortBy: 'createdAt' | 'name' | 'email' | 'userType' | 'isActive'; sortOrder: 'ASC' | 'DESC'; }

const json = (data: Record<string, unknown>) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, data });

export const usersApi = {
  list: (options: ListUsersOptions) => apiRequest<UsersPageResponse>(`/users?${createQueryString(options)}`),
  roles: () => apiRequest<{ roles: RoleOption[] }>('/users/role-options'),
  create: (data: Record<string, unknown>) => apiRequest<ManagedUser>('/users', json(data)),
  update: (id: string, data: Record<string, unknown>) => apiRequest<ManagedUser>(`/users/${id}`, { ...json(data), method: 'PATCH' }),
  deactivate: (id: string) => apiRequest<ManagedUser>(`/users/${id}/deactivate`, { method: 'PATCH' }),
  activate: (id: string) => apiRequest<ManagedUser>(`/users/${id}/activate`, { method: 'PATCH' }),
};
