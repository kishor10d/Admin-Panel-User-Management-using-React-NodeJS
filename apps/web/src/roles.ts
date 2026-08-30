export interface PermissionItem {
  id: string;
  key: string;
  description: string | null;
}

export interface ManagedRole {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  permissions: PermissionItem[];
  createdAt: string;
  updatedAt: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { credentials: 'include', ...options });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(typeof payload?.message === 'string' ? payload.message : 'Request failed.');
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export const rolesApi = {
  list: () => request<{ roles: ManagedRole[] }>('/roles?includeInactive=true'),
  permissions: () => request<{ permissions: PermissionItem[] }>('/roles/permissions'),
  create: (data: Record<string, unknown>) => request<ManagedRole>('/roles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) => request<ManagedRole>(`/roles/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deactivate: (id: string) => request<ManagedRole>(`/roles/${id}/deactivate`, { method: 'PATCH' }),
};
