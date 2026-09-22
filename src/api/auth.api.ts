import { apiClient, removeStoredToken, setStoredToken } from './client';
import type { AuthResponse, MagicLinkRequest, MagicLinkResponse, User } from './types';
import { mockSendMagicLink, mockVerifyToken } from '../mocks/auth.mock';

const USE_MOCK_FALLBACK = true;

// Nhận diện mock token — chỉ những token do mockVerifyToken sinh ra mới được decode cục bộ.
function isMockToken(token: string): boolean {
  return token.endsWith('.mock_signature');
}

function decodeMockToken(token: string): User | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    // Kiểm tra token chưa hết hạn
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null; // Hết hạn
    }
    const email: string = payload.sub || '';
    if (!email) return null;
    return {
      id: 'usr_current',
      email,
      name: email.split('@')[0].replace(/[._-]/g, ' ').toUpperCase(),
      role: payload.role ?? (email.endsWith('@phuongdong.edu.vn') ? 'teacher' : 'student'),
    };
  } catch {
    return null;
  }
}

export const authApi = {
  /**
   * Bước 1: Gửi email lên BE — BE gửi magic link về hộp thư
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
   * Lấy thông tin user hiện tại.
   *
   * Ưu tiên gọi BE (/api/auth/me).
   * Nếu BE chưa có endpoint (404/0/5xx) VÀ token là mock token,
   * thì decode cục bộ — nhưng vẫn phải pass kiểm tra hết hạn.
   * Token thật (từ BE production) không được decode cục bộ.
   */
  async getCurrentUser(): Promise<User | null> {
    const storedToken = localStorage.getItem('access_token');
    if (!storedToken) return null;

    try {
      return await apiClient<User>('/api/auth/me');
    } catch (err: any) {
      // Chỉ fallback decode cục bộ với mock token khi BE chưa sẵn sàng
      if (USE_MOCK_FALLBACK && (err.status === 404 || err.status === 0 || err.status >= 500)) {
        if (isMockToken(storedToken)) {
          const user = decodeMockToken(storedToken);
          if (user) {
            console.warn('[authApi] Fallback mock: decoded user from mock JWT');
            return user;
          }
        }
        // Token không phải mock hoặc đã hết hạn → xoá và bắt đăng nhập lại
        removeStoredToken();
        return null;
      }
      // Lỗi 401/403 hoặc các lỗi khác → token không hợp lệ
      removeStoredToken();
      return null;
    }
  },

  logout(): void {
    removeStoredToken();
    localStorage.removeItem('user_info');
  },
};
