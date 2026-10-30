/**
 * Microsoft Entra ID sign-in using the authorization-code flow with PKCE.
 *
 * Flow: the browser fetches the public Microsoft settings from the backend,
 * redirects to Microsoft, and Microsoft sends it back to this app's
 * `/callback` page. That page then posts the code to the backend, which
 * exchanges it (it holds the client secret), checks the nonce and returns the
 * session. No Microsoft values are needed at build time.
 */

import { authApi } from '../api/auth.api';
import type { AuthMethods, MicrosoftConfig } from '../api/types';

const STORAGE_KEY = 'ms_auth_pending';
const CONFIG_CACHE_KEY = 'auth_methods';
// Public settings change only when the Azure app changes; refresh them hourly.
const CONFIG_CACHE_MS = 60 * 60 * 1000;

// Earlier builds kept this in localStorage; it now lives per tab in sessionStorage.
try {
  localStorage.removeItem(CONFIG_CACHE_KEY);
} catch {
  // Storage unavailable: nothing to clean up.
}

/** Page Microsoft sends the browser back to; registered as a redirect URI in Azure. */
export const CALLBACK_PATH = '/callback';

/**
 * Where Microsoft returns the browser: always this site's own `/callback`, built
 * from the page's origin, so it keeps the scheme the user is on (https in
 * production) and never depends on a backend setting.
 */
export function redirectUri(): string {
  return `${window.location.origin}${CALLBACK_PATH}`;
}

interface PendingLogin {
  state: string;
  nonce: string;
  codeVerifier: string;
  returnTo: string;
  redirectUri: string;
}

export interface MicrosoftCallbackResult {
  code: string;
  codeVerifier: string;
  nonce: string;
  returnTo: string;
  /** The exact redirect URI used to start sign-in; the backend must reuse it. */
  redirectUri: string;
}

interface CachedMethods {
  methods: AuthMethods;
  savedAt: number;
}

let methodsPromise: Promise<AuthMethods> | null = null;

function readCachedMethods(): AuthMethods | null {
  try {
    const raw = sessionStorage.getItem(CONFIG_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedMethods;
    return Date.now() - cached.savedAt < CONFIG_CACHE_MS ? cached.methods : null;
  } catch {
    return null;
  }
}

/**
 * The login options and Microsoft settings from `GET /api/auth/methods`: one
 * request, cached in memory and in sessionStorage (this tab, up to an hour). The login page
 * renders from it, and "Đăng nhập bằng Microsoft" redirects at once instead of
 * waiting for the backend.
 */
export function loadAuthMethods(): Promise<AuthMethods> {
  if (!methodsPromise) {
    const cached = readCachedMethods();
    methodsPromise = cached
      ? Promise.resolve(cached)
      : authApi.getMethods().then((methods) => {
          try {
            sessionStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify({ methods, savedAt: Date.now() } satisfies CachedMethods));
          } catch {
            // Private mode or full storage: the in-memory copy is enough.
          }
          return methods;
        });
    // A failed fetch must not stick: the next call tries again.
    methodsPromise.catch(() => {
      methodsPromise = null;
    });
  }
  return methodsPromise;
}

/** Forget the cached login options, e.g. after a logout or in tests. */
export function clearAuthMethodsCache(): void {
  methodsPromise = null;
  try {
    sessionStorage.removeItem(CONFIG_CACHE_KEY);
  } catch {
    // Nothing cached.
  }
}

async function loadMicrosoftConfig(): Promise<MicrosoftConfig> {
  const config = (await loadAuthMethods()).microsoft;
  if (!config) throw new Error('Microsoft login is not configured');
  return config;
}

function randomString(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function codeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

/** Redirect the browser to the Microsoft sign-in page. */
export async function startMicrosoftLogin(returnTo = '/chat'): Promise<void> {
  let config: MicrosoftConfig;
  try {
    config = await loadMicrosoftConfig();
  } catch {
    throw new Error('Đăng nhập Microsoft chưa được cấu hình.');
  }

  const callbackUri = redirectUri();

  // 64 random bytes -> 86 base64url chars, within the 43-128 range PKCE requires.
  const pending: PendingLogin = {
    state: randomString(),
    nonce: randomString(),
    codeVerifier: randomString(64),
    returnTo,
    redirectUri: callbackUri,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending));

  const params = new URLSearchParams({
    client_id: config.client_id,
    response_type: 'code',
    redirect_uri: callbackUri,
    response_mode: 'query',
    scope: config.scopes,
    state: pending.state,
    nonce: pending.nonce,
    code_challenge: await codeChallenge(pending.codeVerifier),
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });

  window.location.assign(`${config.authorize_url}?${params}`);
}

/**
 * Read the authorization response from the callback URL.
 *
 * Verifies `state` against the value stored before redirecting, which protects
 * against login CSRF. The pending entry is consumed so a code can't be replayed.
 */
export function readMicrosoftCallback(search: string): MicrosoftCallbackResult {
  const params = new URLSearchParams(search);
  const raw = sessionStorage.getItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);

  const error = params.get('error');
  if (error) {
    throw new Error(params.get('error_description') || `Microsoft trả về lỗi: ${error}`);
  }

  const code = params.get('code');
  const state = params.get('state');
  if (!code || !state) {
    throw new Error('Thiếu mã xác thực từ Microsoft.');
  }
  if (!raw) {
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng thử lại.');
  }

  const pending = JSON.parse(raw) as PendingLogin;
  if (pending.state !== state) {
    throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng thử lại.');
  }

  return {
    code,
    codeVerifier: pending.codeVerifier,
    nonce: pending.nonce,
    returnTo: pending.returnTo,
    redirectUri: pending.redirectUri,
  };
}
