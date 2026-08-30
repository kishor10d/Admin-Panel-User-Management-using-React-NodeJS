export interface LoginEventItem { id: string; email: string; ipAddress: string | null; userAgent: string | null; successful: boolean; createdAt: string; }
export interface LoginHistoryResponse { items: LoginEventItem[]; page: number; limit: number; total: number; totalPages: number; }

export async function getLoginHistory(page: number, search: string, successful: string): Promise<LoginHistoryResponse> {
  const query = new URLSearchParams({ page: String(page), limit: '20', ...(search ? { search } : {}), ...(successful ? { successful } : {}) });
  const response = await fetch(`/api/login-history?${query}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Unable to load login history.');
  return response.json() as Promise<LoginHistoryResponse>;
}
