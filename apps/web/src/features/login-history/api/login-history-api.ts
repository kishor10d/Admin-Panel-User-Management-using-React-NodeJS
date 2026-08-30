import { apiRequest, createQueryString } from '../../../lib/api-client';

export interface LoginEventItem { id: string; email: string; ipAddress: string | null; userAgent: string | null; successful: boolean; createdAt: string; }
export interface LoginHistoryResponse { items: LoginEventItem[]; page: number; limit: number; total: number; totalPages: number; }

export function getLoginHistory(page: number, search: string, successful: string): Promise<LoginHistoryResponse> {
  return apiRequest(`/login-history?${createQueryString({ page, limit: 20, search, successful })}`);
}
