import { apiRequest, createQueryString } from '../../../lib/api-client';

export interface LoginEventItem { id: string; email: string; ipAddress: string | null; userAgent: string | null; successful: boolean; createdAt: string; }
export interface LoginHistoryResponse { items: LoginEventItem[]; page: number; limit: number; total: number; totalPages: number; }
export interface ListLoginHistoryOptions { page: number; limit: number; search: string; successful: string; sortBy: 'createdAt' | 'email' | 'ipAddress' | 'successful'; sortOrder: 'ASC' | 'DESC'; }

export function getLoginHistory(options: ListLoginHistoryOptions): Promise<LoginHistoryResponse> {
  return apiRequest(`/login-history?${createQueryString(options)}`);
}
