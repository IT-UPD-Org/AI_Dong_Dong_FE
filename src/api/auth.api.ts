import { apiClient, removeStoredToken, setStoredToken } from './client';
import type { AuthResponse, MagicLinkRequest, MagicLinkResponse, User } from './types';
import { mockSendMagicLink, mockVerifyToken } from '../mocks/auth.mock';

const USE_MOCK_FALLBACK = true;

function isMockToken(token: string): boolean {
  return token.endsWith('.mock_signature');
}

function decodeMockToken(token: string): User | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }
    const email: string = payload.sub || '';
    if (!email) return null;
    return {
      id: String(payload.id || 'usr_current'),
      email,
      name: email.split('@')[0].replace(/[._-]/g, ' ').toUpperCase(),
      role: payload.perm || payload.role || (email.endsWith('@phuongdong.edu.vn') ? 'teacher' : 'student'),
    };
  } catch {
    return null;
  }
}

export const authApi = {
  /**
   * Bước 1: Gửi email lên BE — BE gửi magic link hoặc xử lý auth
   */
  async requestMagicLink(email: string): Promise<MagicLinkResponse> {
    try {
      return await apiClient<MagicLinkResponse>('/api/auth/magic-link', {
        method: 'POST',
        body: JSON.stringify({ email } as MagicLinkRequest),
      });
    } catch (err: any) {
      if (USE_MOCK_FALLBACK && (err.status === 404 || err.status === 0 || err.status >= 500)) {
        console.warn('[authApi] Fallback mock: requestMagicLink');
        return await mockSendMagicLink(email);
      }
      throw err;
    }
  },

  /**
   * Bước 2: Xác thực token từ link email, nhận access_token + user
   */
  async verifyMagicLink(token: string): Promise<AuthResponse> {
    try {
      const res = await apiClient<AuthResponse>('/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      if (res.access_token) setStoredToken(res.access_token);
      return res;
    } catch (err: any) {
      if (USE_MOCK_FALLBACK && (err.status === 404 || err.status === 0 || err.status >= 500)) {
        console.warn('[authApi] Fallback mock: verifyMagicLink');
        const res = await mockVerifyToken(token);
        if (res.access_token) setStoredToken(res.access_token);
        return res;
      }
      throw err;
    }
  },

  /**
   * Lấy thông tin user hiện tại từ BE (/users/@me hoặc /api/users/@me)
   */
  async getCurrentUser(): Promise<User | null> {
    const storedToken = localStorage.getItem('access_token');
    if (!storedToken) return null;

    try {
      // Gọi BE endpoint /users/@me (hoặc qua proxy /api/users/@me)
      const res = await apiClient<any>('/users/@me');
      if (res) {
        return {
          id: String(res.id),
          email: res.email,
          name: res.name || res.email.split('@')[0],
          role: res.role || 'student',
          credits: res.credits,
          storage_used: res.storage_used,
          disable: res.disable,
        };
      }
      return null;
    } catch (err: any) {
      if (USE_MOCK_FALLBACK && (err.status === 404 || err.status === 0 || err.status >= 500)) {
        if (isMockToken(storedToken)) {
          const user = decodeMockToken(storedToken);
          if (user) {
            return user;
          }
        }
        // Fallback default mock user if in dev
        return {
          id: 'usr_mock',
          email: 'user@pduni.edu.vn',
          name: 'SINH VIEN TEST',
          role: 'student',
          credits: 1000,
          storage_used: 0,
        };
      }
      removeStoredToken();
      return null;
    }
  },

  /**
   * Đăng xuất
   */
  async logout(): Promise<void> {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch {
      // Ignored if BE offline
    } finally {
      removeStoredToken();
      localStorage.removeItem('user_info');
    }
  },
};
