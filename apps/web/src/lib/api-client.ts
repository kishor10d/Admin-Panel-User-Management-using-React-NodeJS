import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiErrorBody = { message?: string | string[] };

export const httpClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 15_000,
  headers: { Accept: 'application/json' },
});

httpClient.interceptors.request.use((config) => {
  if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
    const csrfToken = getCookie('csrf_token');
    if (csrfToken) config.headers.set('x-csrf-token', csrfToken);
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (error instanceof AxiosError) {
      const request = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
      const status = error.response?.status;
      const canRefresh = request?.url === '/auth/me' || !request?.url?.startsWith('/auth/');
      if (status === 401 && request && !request._retry && canRefresh) {
        request._retry = true;
        try {
          await httpClient.post('/auth/refresh');
          return httpClient.request(request);
        } catch {
          // The original request below supplies the user-facing error.
        }
      }
    }
    return Promise.reject(normalizeApiError(error));
  },
);

export async function apiRequest<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await httpClient.request<T>({ url: path, ...config });
  return response.data;
}

export function createQueryString(values: object) {
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') parameters.set(key, String(value));
  }
  return parameters.toString();
}

function defaultErrorMessage(status: number) {
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  return 'Something went wrong. Please try again.';
}

function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0;
    const body = error.response?.data as ApiErrorBody | undefined;
    const message = Array.isArray(body?.message)
      ? body.message.join(' ')
      : body?.message ?? (status ? defaultErrorMessage(status) : 'Unable to reach the API. Please try again.');
    return new ApiError(message, status);
  }

  return new ApiError('Something went wrong. Please try again.', 0);
}

function getCookie(name: string) {
  if (typeof document === 'undefined') return undefined;
  const prefix = `${encodeURIComponent(name)}=`;
  return document.cookie.split('; ').find((item) => item.startsWith(prefix))?.slice(prefix.length);
}
