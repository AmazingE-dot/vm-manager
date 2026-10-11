const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export interface ApiErrorDetail {
  path: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorDetail[];

  constructor(status: number, code: string, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;

/** Registra el manejador que limpia la sesión cuando la API responde 401. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    signal,
    headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    onUnauthorized?.();
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const apiError = extractError(data);
    throw new ApiError(response.status, apiError.code, apiError.message, apiError.details);
  }

  return data as T;
}

function extractError(data: unknown): {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
} {
  if (typeof data === 'object' && data !== null && 'error' in data) {
    const { error } = data as { error?: unknown };
    if (typeof error === 'object' && error !== null) {
      const { code, message, details } = error as {
        code?: unknown;
        message?: unknown;
        details?: unknown;
      };
      return {
        code: typeof code === 'string' ? code : 'UNKNOWN',
        message: typeof message === 'string' ? message : 'Error inesperado',
        details: Array.isArray(details) ? (details as ApiErrorDetail[]) : undefined,
      };
    }
  }
  return { code: 'UNKNOWN', message: 'Error inesperado' };
}

export const httpClient = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
