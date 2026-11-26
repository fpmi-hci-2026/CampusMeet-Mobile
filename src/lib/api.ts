import { API_BASE } from './config';
import { secure } from './storage';
import type { ApiProblem, AuthResponse, User } from './types';

export class ApiError extends Error {
  status: number;
  code: string;
  errors?: Record<string, string>;

  constructor(problem: ApiProblem) {
    super(problem.message);
    this.name = 'ApiError';
    this.status = problem.status;
    this.code = problem.code;
    this.errors = problem.errors;
  }
}

export const isNetworkError = (error: unknown) => error instanceof ApiError && error.code === 'NETWORK_ERROR';

const ACCESS = 'cm.access';
const REFRESH = 'cm.refresh';
const USER = 'cm.user';

export const tokens = {
  access: () => secure.get(ACCESS),
  refresh: () => secure.get(REFRESH),
  async user(): Promise<User | null> {
    const raw = await secure.get(USER);
    return raw ? (JSON.parse(raw) as User) : null;
  },
  async save(auth: AuthResponse) {
    await Promise.all([secure.set(ACCESS, auth.access_token), secure.set(REFRESH, auth.refresh_token), secure.set(USER, JSON.stringify(auth.user))]);
  },
  async clear() {
    await Promise.all([secure.remove(ACCESS), secure.remove(REFRESH), secure.remove(USER)]);
  },
};

let onSignedOut: (() => void) | null = null;
export const setSignedOutListener = (listener: (() => void) | null) => (onSignedOut = listener);

async function problemOf(res: Response): Promise<ApiProblem> {
  try {
    const body = await res.json();
    return { status: res.status, code: body.code ?? `HTTP_${res.status}`, message: body.message ?? res.statusText, errors: body.errors };
  } catch {
    return { status: res.status, code: `HTTP_${res.status}`, message: res.statusText || 'Ошибка сервера' };
  }
}

let refreshing: Promise<boolean> | null = null;
function refreshTokens(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const token = await tokens.refresh();
      if (!token) return false;
      const res = await fetch(API_BASE + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: token }),
      });
      if (!res.ok) return false;
      await tokens.save(await res.json());
      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => (refreshing = null), 0);
    }
  })();
  return refreshing;
}

interface Options {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
  timeoutMs?: number;
}

/** JSON request with Bearer auth, one silent refresh on TOKEN_EXPIRED and a network timeout. */
export async function request<T>(path: string, options: Options = {}, retried = false): Promise<T> {
  const { method = 'GET', body, headers = {}, auth = true, timeoutMs = 10000 } = options;
  const access = auth ? await tokens.access() : null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(API_BASE + path, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Нет связи с сервером CampusMeet' });
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 401 && access && !retried) {
    const problem = await problemOf(res);
    if (problem.code === 'TOKEN_EXPIRED' && (await refreshTokens())) return request<T>(path, options, true);
    if (['TOKEN_EXPIRED', 'SESSION_REVOKED', 'INVALID_TOKEN'].includes(problem.code)) {
      await tokens.clear();
      onSignedOut?.();
    }
    throw new ApiError(problem);
  }
  if (!res.ok) throw new ApiError(await problemOf(res));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, body?: unknown, headers?: Record<string, string>) => request<T>(path, { method: 'POST', body, headers }),
  put: <T,>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  del: <T,>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export function newIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
