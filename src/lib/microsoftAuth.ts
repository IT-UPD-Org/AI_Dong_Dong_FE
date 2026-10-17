/**
 * Microsoft Entra ID sign-in using the authorization-code flow with PKCE.
 *
 * The backend exchanges the code itself (it holds the client secret) and
 * validates the ID token's nonce, so the browser only creates the PKCE
 * verifier, state and nonce, redirects, and hands the code back.
 */

const STORAGE_KEY = 'ms_auth_pending';
const SCOPES = 'openid profile email';

interface PendingLogin {
  state: string;
  nonce: string;
  codeVerifier: string;
  returnTo: string;
}

export interface MicrosoftCallbackResult {
  code: string;
  codeVerifier: string;
  nonce: string;
  returnTo: string;
}

function config() {
  const tenantId = import.meta.env.VITE_MICROSOFT_TENANT_ID;
  const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
  const redirectUri =
    import.meta.env.VITE_MICROSOFT_REDIRECT_URI || `${window.location.origin}/auth/callback`;
  return { tenantId, clientId, redirectUri };
}

export function isMicrosoftConfigured(): boolean {
  const { tenantId, clientId } = config();
  return Boolean(tenantId && clientId);
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
  const { tenantId, clientId, redirectUri } = config();
  if (!tenantId || !clientId) {
    throw new Error('Đăng nhập Microsoft chưa được cấu hình.');
  }

  // 64 random bytes -> 86 base64url chars, within the 43-128 range PKCE requires.
  const pending: PendingLogin = {
    state: randomString(),
    nonce: randomString(),
    codeVerifier: randomString(64),
    returnTo,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending));

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: SCOPES,
    state: pending.state,
    nonce: pending.nonce,
    code_challenge: await codeChallenge(pending.codeVerifier),
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });

  window.location.assign(
    `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/authorize?${params}`,
  );
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
  };
}
