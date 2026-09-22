export type UserRole = 'student' | 'teacher' | 'admin' | 'guest';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface MagicLinkRequest {
  email: string;
}

export interface MagicLinkResponse {
  status: 'ok' | 'error';
  message: string;
  mockVerifyUrl?: string; // Hỗ trợ dev test trực tiếp khi BE chưa xong
}

export interface VerifyMagicLinkRequest {
  token: string;
}

export interface AuthResponse {
  status: 'ok' | 'error';
  access_token: string;
  token_type?: string;
  user: User;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  sources?: string[];
  createdAt?: string;
}

export interface SendMessagePayload {
  message: string;
  conversationId?: string;
  modelLevel?: 'L1' | 'L2' | 'L3';
}

export interface ChatStreamChunk {
  delta?: string;
  done?: boolean;
  messageId?: string;
  sources?: string[];
  error?: string;
}
