import { apiRequest } from '../../../lib/api-client';

export interface PermissionItem { id: string; key: string; description: string | null; }
export interface ManagedRole {
  id: string; name: string; description: string | null; isActive: boolean;
  permissions: PermissionItem[]; createdAt: string; updatedAt: string;
}

export interface RoleMetadataInput { name: string; description?: string; }

const json = (data: unknown) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, data });

export const rolesApi = {
  list: () => apiRequest<{ roles: ManagedRole[] }>('/roles?includeInactive=true'),
  permissions: () => apiRequest<{ permissions: PermissionItem[] }>('/roles/permissions'),
  get: (id: string) => apiRequest<ManagedRole>(`/roles/${id}`),
  create: (data: RoleMetadataInput) => apiRequest<ManagedRole>('/roles', json(data)),
  update: (id: string, data: RoleMetadataInput) => apiRequest<ManagedRole>(`/roles/${id}`, { ...json(data), method: 'PATCH' }),
  updatePermissions: (id: string, permissionIds: string[]) => apiRequest<ManagedRole>(`/roles/${id}/permissions`, { ...json({ permissionIds }), method: 'PATCH' }),
  deactivate: (id: string) => apiRequest<ManagedRole>(`/roles/${id}/deactivate`, { method: 'PATCH' }),
  activate: (id: string) => apiRequest<ManagedRole>(`/roles/${id}/activate`, { method: 'PATCH' }),
};
