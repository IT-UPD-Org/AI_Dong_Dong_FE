const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

// The backend mounts every route under this prefix (FastAPI root_path="/api").
const API_PREFIX = '/api';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem('access_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem('access_token', token);
}

export function removeStoredToken(): void {
  localStorage.removeItem('access_token');
}

/**
 * Resolve an API path such as `/chats` to a full URL.
 *
 * In development the Vite proxy forwards `/api` to the backend, so the base URL
 * stays empty and requests remain same-origin. In production `VITE_API_BASE_URL`
 * may point at a separate backend origin.
 */
export function buildApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const prefixed = path.startsWith(`${API_PREFIX}/`) || path === API_PREFIX ? path : `${API_PREFIX}${path}`;
  return `${API_BASE_URL}${prefixed}`;
}

export function authHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra || {});
  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

/** Turn a FastAPI error body into a readable message. */
export function describeError(body: unknown, status: number): string {
  if (body && typeof body === 'object' && 'detail' in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (item && typeof item === 'object' && 'msg' in item) {
            const loc = Array.isArray((item as { loc?: unknown[] }).loc)
              ? (item as { loc: unknown[] }).loc.filter((p) => p !== 'body').join('.')
              : '';
            return loc ? `${loc}: ${(item as { msg: string }).msg}` : (item as { msg: string }).msg;
          }
          return String(item);
        })
        .join('; ');
    }
    if (detail) return JSON.stringify(detail);
  }
  return `Request failed with status ${status}`;
}

/** Signal a 401 so the auth layer can clear the session. */
export function handleUnauthorized(status: number): void {
  if (status === 401) {
    removeStoredToken();
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = authHeaders(options.headers);
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(buildApiUrl(endpoint), { ...options, headers });
  } catch (error) {
    throw new ApiError((error as Error).message || 'Lỗi kết nối mạng đến máy chủ.', 0);
  }

  handleUnauthorized(response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(describeError(errorData, response.status), response.status, errorData);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
