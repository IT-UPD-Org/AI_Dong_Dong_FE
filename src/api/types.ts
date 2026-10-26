// ---------------------------------------------------------------------------
// Users & auth
// ---------------------------------------------------------------------------

export type UserRole = 'student' | 'teacher' | 'admin';

/** Shape of `UserModel` returned by the backend. */
export interface BEUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  first_use: string | null;
  disable: boolean;
  credits: number;
  storage_used: number;
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
  first_use: string | null;
  disable: boolean;
}

/** Response of every login endpoint (`fake-login`, `login`, `microsoft/callback`). */
export interface LoginResponse {
  access_token: string;
  user: BEUser;
}

/** `GET /api/auth/methods`: which login options the backend allows. */
export interface AuthMethods {
  microsoft: boolean;
  password: boolean;
  dev: boolean;
}

/** `GET /api/auth/microsoft`: public values needed to start Microsoft login. */
export interface MicrosoftConfig {
  tenant_id: string;
  client_id: string;
  /** Null unless the backend pins one; the frontend then uses `{origin}/callback`. */
  redirect_uri: string | null;
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

export type ChatStatus = 'idle' | 'thinking' | 'searching' | 'generating' | 'completed' | 'error';

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

export interface BEToolCall {
  id: string;
  tool_name: string;
  parameters: string;
  response?: string | null;
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
}

/** Conversation summary for lists/sidebar. */
export interface Conversation {
  id: string;
  title: string;
  disabled?: boolean;
  asyncStatus?: AsyncStatus;
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
