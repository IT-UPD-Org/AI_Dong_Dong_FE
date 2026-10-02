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

export type ChatStatus = 'idle' | 'thinking' | 'searching' | 'generating' | 'completed' | 'error';

export interface ChatSource {
  document_id?: string;
  title: string;
  page?: number;
  chunk_id?: string;
  url?: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  sources?: ChatSource[];
  createdAt?: string;
  attachments?: { name: string; size: string; type?: string }[];
  status?: ChatStatus;

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
  sources?: ChatSource[];
  error?: string;
  status?: ChatStatus;
}

// New API Contracts for BE Integration

export interface Document {
  document_id: string;
  user_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  storage_id?: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  created_at: string;
}

export interface StorageUsage {
  total_bytes: number;
  used_bytes: number;
  free_bytes: number;
}

export interface ChatRequest {
  request_id: string;
  user_id: string;
  conversation_id?: string;
  prompt: string;
  attachment_ids?: string[];
  mentioned_document_ids?: string[];
  mode?: 'chat';
}

export interface ChatResponse {
  request_id: string;
  conversation_id: string;
  content: string;
  model?: string;
  used_knowledge?: boolean;
  sources?: ChatSource[];
}

export interface ChatEvent {
  event: 'status' | 'token' | 'source' | 'done' | 'error';
  data: any;
}
