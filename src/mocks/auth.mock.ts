import type { AuthResponse, MagicLinkResponse, User } from '../api/types';

export const ALLOWED_DOMAINS = ['@phuongdong.edu.vn', '@pduni.edu.vn'];

export function isAllowedEmail(email: string): boolean {
  const clean = email.trim().toLowerCase();
  return ALLOWED_DOMAINS.some((domain) => clean.endsWith(domain));
}

export function detectUserRole(email: string): 'teacher' | 'student' {
  const clean = email.trim().toLowerCase();
  return clean.endsWith('@phuongdong.edu.vn') ? 'teacher' : 'student';
}

const MOCK_TOKENS_STORE = new Map<string, { email: string; expiresAt: number }>();

export async function mockSendMagicLink(email: string): Promise<MagicLinkResponse> {
  await new Promise((r) => setTimeout(r, 600));

  if (!isAllowedEmail(email)) {
    throw new Error('Email phải thuộc tên miền @phuongdong.edu.vn hoặc @pduni.edu.vn');
  }

  // Tạo mock token
  const token = `magic_${Math.random().toString(36).substring(2)}_${Date.now()}`;
  MOCK_TOKENS_STORE.set(token, {
    email: email.trim().toLowerCase(),
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 phút
  });

  const mockVerifyUrl = `/auth/verify?token=${encodeURIComponent(token)}`;

  return {
    status: 'ok',
    message: `Đã gửi liên kết xác thực tới ${email}. Vui lòng kiểm tra hộp thư.`,
    mockVerifyUrl,
  };
}

export async function mockVerifyToken(token: string): Promise<AuthResponse> {
  await new Promise((r) => setTimeout(r, 800));

  let email = 'user@pduni.edu.vn';
  const entry = MOCK_TOKENS_STORE.get(token);

  if (entry) {
    if (Date.now() > entry.expiresAt) {
      throw new Error('Liên kết xác thực đã hết hạn. Vui lòng yêu cầu liên kết mới.');
    }
    email = entry.email;
  } else if (!token.startsWith('magic_')) {
    // Nếu token giả lập nhanh từ dev helper
    if (token.includes('@')) {
      email = decodeURIComponent(token);
    }
  }

  const role = detectUserRole(email);
  const nameFromEmail = email.split('@')[0].replace(/[._-]/g, ' ').toUpperCase();

  const user: User = {
    id: `usr_${Date.now()}`,
    email,
    name: nameFromEmail,
    role,
  };

  const fakeJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
    JSON.stringify({ sub: email, role, exp: Math.floor(Date.now() / 1000) + 86400 })
  )}.mock_signature`;

  return {
    status: 'ok',
    access_token: fakeJwt,
    token_type: 'Bearer',
    user,
  };
}
