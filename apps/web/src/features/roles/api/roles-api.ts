import { apiRequest } from '../../../lib/api-client';

export interface PermissionItem { id: string; key: string; description: string | null; }
export interface ManagedRole {
  id: string; name: string; description: string | null; isActive: boolean;
  permissions: PermissionItem[]; createdAt: string; updatedAt: string;
}

const json = (body: Record<string, unknown>): RequestInit => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export const rolesApi = {
  list: () => apiRequest<{ roles: ManagedRole[] }>('/roles?includeInactive=true'),
  permissions: () => apiRequest<{ permissions: PermissionItem[] }>('/roles/permissions'),
  create: (data: Record<string, unknown>) => apiRequest<ManagedRole>('/roles', json(data)),
  update: (id: string, data: Record<string, unknown>) => apiRequest<ManagedRole>(`/roles/${id}`, { ...json(data), method: 'PATCH' }),
  deactivate: (id: string) => apiRequest<ManagedRole>(`/roles/${id}/deactivate`, { method: 'PATCH' }),
};
