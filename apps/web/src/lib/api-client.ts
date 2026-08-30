export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiErrorBody = { message?: string | string[] };

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: 'include',
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as ApiErrorBody | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(' ')
      : body?.message ?? defaultErrorMessage(response.status);
    throw new ApiError(message, response.status);
  }

  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export function createQueryString(values: Record<string, string | number | boolean | undefined>) {
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
