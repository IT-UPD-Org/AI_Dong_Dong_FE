export type UserRole = 'student' | 'teacher' | 'admin' | 'guest';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  credits?: number;
  storage_used?: number;
  first_use?: string | null;
  disable?: boolean;
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

export type ModelTypeEnum = 'instant' | 'standard' | 'detailed';

export type AgentLevel = 'L1' | 'L2' | 'L3';

export type AsyncStatus = 'none' | 'pending' | 'in_progress' | 'completed';

export interface ChatSource {
  document_id?: string;
  title: string;
  page?: number;
  chunk_id?: string;
  url?: string;
}

export interface BEToolCall {
  id: string | number;
  tool_name: string;
  parameters: string;
  response?: string | null;
}

export interface BEUserMessage {
  type: 'user';
  id: string | number;
  content: string;
  files?: (string | number)[];
}

export interface BEAgentMessage {
  type: 'agent';
  id: string | number;
  content: string | null;
  tool_calls?: BEToolCall[];
  complete: boolean;
}

export interface BESystemMessage {
  type: 'system';
  content: string;
}

export type BEMessageItem = BEUserMessage | BEAgentMessage | BESystemMessage;

export type BEMessage = BEMessageItem | { root: BEMessageItem };

export interface ChatConversationModel {
  id: string | number;
  user_id: string | number;
  title: string;
  reason_disabled?: string | null;
  messages: BEMessage[];
  async_status: AsyncStatus;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  sources?: ChatSource[];
  createdAt?: string;
  status?: ChatStatus;
  toolCalls?: BEToolCall[];
}

export interface SendMessagePayload {
  message: string;
  conversationId?: string;
  modelLevel?: AgentLevel;
  modelType?: ModelTypeEnum;
  attachmentIds?: string[];
  mentionedDocumentIds?: string[];
}

export interface ChatStreamChunk {
  delta?: string;
  done?: boolean;
  messageId?: string;
  sources?: ChatSource[];
  error?: string;
  status?: ChatStatus;
  conversationId?: string;
  title?: string;
}

// Conversation summary for lists/sidebar
export interface Conversation {
  id: string;
  title: string;
  date?: string;
  messageCount?: number;
}

// Admin types
export interface ModelInfoModel {
  id: string | number;
  model_id: string;
  model_name: string;
  model_type: ModelTypeEnum;
  provider_id: string | number;
}

export interface ProviderInfoModel {
  id: string | number;
  provider_type: string;
  provider_name: string;
  config: Record<string, any>;
}

export interface ProviderTypeResponse {
  provider_name: string;
  provider_id: string;
  config_schema: Record<string, any>;
}

// Document & Storage types
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
