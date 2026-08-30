export interface RoleOption {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface ManagedUser {
  id: string;
  email: string;
  name: string | null;
  mobile: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  roles: Array<{ id: string; name: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface UsersPageResponse {
  items: ManagedUser[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { credentials: 'include', ...options });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(typeof payload?.message === 'string' ? payload.message : 'Request failed.');
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export const usersApi = {
  list: (page: number, search: string) => request<UsersPageResponse>(`/users?${new URLSearchParams({ page: String(page), limit: '20', ...(search ? { search } : {}) })}`),
  roles: () => request<{ roles: RoleOption[] }>('/roles'),
  create: (data: Record<string, unknown>) => request<ManagedUser>('/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) => request<ManagedUser>(`/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deactivate: (id: string) => request<ManagedUser>(`/users/${id}/deactivate`, { method: 'PATCH' }),
};
