import type { ReplyStep } from '../lib/groupMessages';

// ---------------------------------------------------------------------------
// Users & auth
// ---------------------------------------------------------------------------

export type UserRole = 'student' | 'teacher' | 'admin';

/** Account state: `inactive` (new) -> `pending` (access requested) -> `active`; `disable` is blocked. */
export type UserState = 'inactive' | 'pending' | 'active' | 'disable';

/** Shape of `UserModel` returned by the backend. */
export interface BEUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  first_use: string | null;
  state: UserState;
  credits: number;
  storage_used: number;
  storage_limit: number;
  microsoft_tenant_id?: string | null;
  microsoft_object_id?: string | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  credits: number;
  storage_used: number;
  storage_limit: number;
  first_use: string | null;
  state: UserState;
}

/** `PATCH /api/admin/users/{id}`: only the sent fields change. */
export interface AdminUserUpdate {
  name?: string;
  email?: string;
  role?: UserRole;
  state?: UserState;
  credits?: number;
  storage_limit?: number;
}

/** Response of every login endpoint (`fake-login`, `login`, `microsoft/callback`). */
export interface LoginResponse {
  access_token: string;
  user: BEUser;
}

/** `GET /api/auth/methods`: which login options the backend allows. */
/** `GET /api/auth/methods`: which login options to show. `microsoft` is `false` when off, or its settings when on. */
export interface AuthMethods {
  microsoft: MicrosoftConfig | false;
  password: boolean;
  dev: boolean;
}

/** Public values needed to start Microsoft login. The redirect URI is built by the frontend: `{origin}/callback`. */
export interface MicrosoftConfig {
  tenant_id: string;
  client_id: string;
  authorize_url: string;
  scopes: string;
}

export type AccountRole = 'student' | 'teacher' | 'admin';

export interface CreateAccountInput {
  setup_key: string;
  email: string;
  name: string;
  password: string;
  role: AccountRole;
}

export interface Session {
  id: string;
  expires_at: string;
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export type MessageRole = 'user' | 'assistant' | 'system';

export type ChatStatus = 'idle' | 'thinking' | 'searching' | 'generating' | 'completed' | 'stopped' | 'error';

export type ModelTypeEnum = 'instant' | 'standard' | 'detailed';

export type AgentLevel = 'L1' | 'L2' | 'L3';

export type AsyncStatus = 'none' | 'pending' | 'in_progress';

export interface ChatSource {
  document_id?: string;
  title: string;
  page?: number;
  chunk_id?: string;
  url?: string;
}

/** A tool the assistant used. The API sends only its user-facing name, never its arguments or result. */
export interface BEToolCall {
  id: string;
  /** e.g. "Search My Files"; null for tool calls saved before names were recorded. */
  display_name: string | null;
}

export interface BEUserMessage {
  type: 'user';
  id: string;
  content: string;
  files?: string[];
}

export interface BEAgentMessage {
  type: 'agent';
  id: string;
  content: string | null;
  tool_calls?: BEToolCall[];
  complete: boolean;
  /** Set when moderation flagged the reply; its content must not be shown. */
  hidden?: boolean;
  hidden_reason?: string | null;
}

export interface BESystemMessage {
  type: 'system';
  content: string;
}

export type BEMessage = BEUserMessage | BEAgentMessage | BESystemMessage;

/** `ChatConversationListResponse` from `GET /api/chats`. */
export interface ConversationSummary {
  id: string;
  title: string;
  disabled: boolean;
  async_status: AsyncStatus;
}

/** `AdminChatConversationListResponse` from `GET /api/admin/chats`. */
export interface AdminConversationSummary extends ConversationSummary {
  user_id: string;
}

/** `ChatConversationResponse` from `GET /api/chats/{id}`. */
export interface ConversationDetail extends ConversationSummary {
  messages: BEMessage[];
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  sources?: ChatSource[];
  createdAt?: string;
  status?: ChatStatus;
  toolCalls?: BEToolCall[];
  files?: string[];
  /** The reply was hidden by moderation; content holds the notice instead. */
  hidden?: boolean;
  /** A streamed reply's steps (text, then that round's tool calls), kept while it is shown live. */
  steps?: ReplyStep[];
}

export interface SendMessagePayload {
  message: string;
  conversationId?: string;
  modelLevel?: AgentLevel;
  modelType?: ModelTypeEnum;
  attachmentIds?: string[];
}

export interface ChatStreamChunk {
  delta?: string;
  done?: boolean;
  messageId?: string;
  error?: string;
  status?: ChatStatus;
  conversationId?: string;
  title?: string;
  toolCalls?: BEToolCall[];
  /** The reply so far, one step per assistant message (text, then that round's tool calls). */
  steps?: ReplyStep[];
  /** Another reply is already running; this message was not saved. Offer to follow it with resume. */
  runInProgress?: boolean;
  /** Moderation rejected the user's message; it was not saved. Holds the reason to show. */
  violation?: string;
}

/** Conversation summary for lists/sidebar. */
export interface Conversation {
  id: string;
  title: string;
  disabled?: boolean;
  asyncStatus?: AsyncStatus;
}

/** Conversation in the admin list, with its owner. */
export interface AdminConversation extends Conversation {
  userId: string;
}

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

export type FileType = 'image' | 'docs';

/** `FileListResponse` from the `/api/files` endpoints. */
export interface BEFile {
  id: string;
  title: string;
  size: number;
  filename: string;
  file_type: FileType;
  file_url: string | null;
}

export type DocumentStatus = 'uploading' | 'converting' | 'processing' | 'ready' | 'error';

/** File as shown in the UI, including transient upload progress. */
export interface Document {
  document_id: string;
  title: string;
  filename: string;
  file_type: FileType;
  size_bytes: number;
  file_url: string | null;
  status: DocumentStatus;
  error?: string;
}

export interface StorageUsage {
  total_bytes: number;
  used_bytes: number;
  free_bytes: number;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export interface ModelInfo {
  id: string;
  model_id: string;
  model_name: string;
  model_type: ModelTypeEnum;
  provider_id: string;
}

export type ModelInput = Omit<ModelInfo, 'id'>;

export interface ProviderInfo {
  id: string;
  provider_type: string;
  provider_name: string;
  config: Record<string, unknown>;
}

export interface ProviderInput {
  provider_type: string;
  provider_name: string;
  config: Record<string, unknown>;
}

/** JSON Schema property as produced by Pydantic's `model_json_schema()`. */
export interface JsonSchemaProperty {
  type?: string;
  title?: string;
  description?: string;
  default?: unknown;
}

export interface ProviderTypeResponse {
  provider_name: string;
  provider_id: string;
  config_schema: {
    properties?: Record<string, JsonSchemaProperty>;
    required?: string[];
  };
}

/** `AdminFileResponse` from `GET /api/admin/files`. */
export interface AdminFile extends BEFile {
  object_key: string;
  user_id: string;
}
