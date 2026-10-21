import { apiClient, removeStoredToken, setStoredToken } from './client';
import type { BEUser, LoginResponse, Session, User } from './types';

export function toUser(user: BEUser): User {
  return {
    id: String(user.id),
    email: user.email,
    name: user.name || user.email.split('@')[0],
    role: user.role,
    credits: user.credits,
    storage_used: user.storage_used,
    first_use: user.first_use,
    disable: user.disable,
  };
}

async function completeLogin(request: Promise<LoginResponse>): Promise<User> {
  const res = await request;
  setStoredToken(res.access_token);
  return toUser(res.user);
}

export const authApi = {
  /** Development-only login; the backend returns 404 outside dev mode. */
  devLogin(email: string, name: string): Promise<User> {
    return completeLogin(
      apiClient<LoginResponse>('/api/auth/fake-login', {
        method: 'POST',
        body: JSON.stringify({ email, name }),
      }),
    );
  },

  /** Exchange a Microsoft authorization code (PKCE) for an internal token. */
  microsoftLogin(code: string, codeVerifier: string, nonce: string): Promise<User> {
    return completeLogin(
      apiClient<LoginResponse>('/api/auth/microsoft/callback', {
        method: 'POST',
        body: JSON.stringify({ code, code_verifier: codeVerifier, nonce }),
      }),
    );
  },

  async getCurrentUser(): Promise<User> {
    return toUser(await apiClient<BEUser>('/api/users/@me'));
  },

  async updateProfile(changes: { name?: string; email?: string }): Promise<User> {
    return toUser(
      await apiClient<BEUser>('/api/users/@me', {
        method: 'PATCH',
        body: JSON.stringify(changes),
      }),
    );
  },

  async listSessions(): Promise<Session[]> {
    const sessions = await apiClient<Session[]>('/api/users/@me/sessions');
    return sessions.map((s) => ({ ...s, id: String(s.id) }));
  },

  revokeSession(sessionId: string): Promise<void> {
    return apiClient<void>(`/api/users/@me/sessions/${sessionId}`, { method: 'DELETE' });
  },

  async logout(): Promise<void> {
    try {
      await apiClient<void>('/api/auth/logout', { method: 'POST' });
    } catch {
      // The local session is cleared regardless of whether revocation succeeded.
    } finally {
      removeStoredToken();
    }
  },
};
