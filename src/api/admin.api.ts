import { apiClient } from './client';
import { toUser } from './auth.api';
import { toConversation } from './chat.api';
import type { AccountRequest, RequestStatus, StorageRequest } from './approval.api';
import type {
  AdminConversation,
  AdminUserUpdate,
  AdminConversationSummary,
  AdminFile,
  BEUser,
  ModelInfo,
  ModelInput,
  ProviderInfo,
  ProviderInput,
  ProviderTypeResponse,
  User,
} from './types';

/** Admin endpoints page by 10 (`?p=`); files use `page`/`limit`. */
export const ADMIN_PAGE_SIZE = 10;

function withStringIds<T extends { id: string | number }>(item: T): T {
  return { ...item, id: String(item.id) };
}

export type RequestKind = 'account' | 'storage';

/** Who sent a request, shown in the admin queue. */
interface RequestOwner {
  user_id: string;
  user_name: string;
  user_email: string;
}
export type AdminAccountRequest = AccountRequest & RequestOwner;
export type AdminStorageRequest = StorageRequest & RequestOwner;

/** Snowflake IDs can arrive as numbers; keep them as strings. */
function withRequestIds<T extends { id: string; user_id: string }>(item: T): T {
  return { ...item, id: String(item.id), user_id: String(item.user_id) };
}

function requestsUrl(kind: RequestKind, status: RequestStatus | null, page: number): string {
  const query = new URLSearchParams({ p: String(page) });
  if (status) query.set('status', status);
  return `/api/admin/requests/${kind}?${query}`;
}

function reviewUrl(kind: RequestKind, requestId: string): string {
  return `/api/admin/requests/${kind}/${requestId}/review`;
}

function reviewBody(approve: boolean, note?: string): RequestInit {
  return { method: 'POST', body: JSON.stringify({ approve, note: note?.trim() || null }) };
}

export const adminApi = {
  // ---- Users ----------------------------------------------------------------
  async getUsers(page = 1): Promise<User[]> {
    const users = await apiClient<BEUser[]>(`/api/admin/users?p=${page}`);
    return users.map(toUser);
  },

  /** Edit any user (an admin cannot change their own role or state). Only the given fields change. */
  async updateUser(userId: string, changes: AdminUserUpdate): Promise<User> {
    return toUser(
      await apiClient<BEUser>(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(changes),
      }),
    );
  },

  // ---- Requests -------------------------------------------------------------
  /** Access requests, newest first, 20 per page; `status` null lists all. */
  async getAccountRequests(status: RequestStatus | null, page = 1): Promise<AdminAccountRequest[]> {
    return (await apiClient<AdminAccountRequest[]>(requestsUrl('account', status, page))).map(withRequestIds);
  },

  async getStorageRequests(status: RequestStatus | null, page = 1): Promise<AdminStorageRequest[]> {
    return (await apiClient<AdminStorageRequest[]>(requestsUrl('storage', status, page))).map(withRequestIds);
  },

  /** Approve (user becomes active) or reject (user can ask again) an access request. */
  async reviewAccountRequest(requestId: string, approve: boolean, note?: string): Promise<AdminAccountRequest> {
    return withRequestIds(await apiClient<AdminAccountRequest>(reviewUrl('account', requestId), reviewBody(approve, note)));
  },

  /** Approve (raises the user's storage limit) or reject a storage request. */
  async reviewStorageRequest(requestId: string, approve: boolean, note?: string): Promise<AdminStorageRequest> {
    return withRequestIds(await apiClient<AdminStorageRequest>(reviewUrl('storage', requestId), reviewBody(approve, note)));
  },

  // ---- Files ----------------------------------------------------------------
  async getFiles(page = 1, limit = 50): Promise<AdminFile[]> {
    const files = await apiClient<AdminFile[]>(`/api/admin/files?page=${page}&limit=${limit}`);
    return files.map((f) => ({ ...withStringIds(f), user_id: String(f.user_id) }));
  },

  // ---- Models ---------------------------------------------------------------
  async getModels(page = 1): Promise<ModelInfo[]> {
    const models = await apiClient<ModelInfo[]>(`/api/admin/models?p=${page}`);
    return models.map((m) => ({ ...withStringIds(m), provider_id: String(m.provider_id) }));
  },

  createModel(input: ModelInput): Promise<ModelInfo> {
    return apiClient<ModelInfo>('/api/admin/models', { method: 'POST', body: JSON.stringify(input) });
  },

  updateModel(id: string, changes: Partial<ModelInput>): Promise<ModelInfo> {
    return apiClient<ModelInfo>(`/api/admin/models/${id}`, { method: 'PATCH', body: JSON.stringify(changes) });
  },

  deleteModel(id: string): Promise<void> {
    return apiClient<void>(`/api/admin/models/${id}`, { method: 'DELETE' });
  },

  // ---- Providers ------------------------------------------------------------
  async getProviders(page = 1): Promise<ProviderInfo[]> {
    const providers = await apiClient<ProviderInfo[]>(`/api/admin/providers?p=${page}`);
    return providers.map(withStringIds);
  },

  getProviderTypes(): Promise<ProviderTypeResponse[]> {
    return apiClient<ProviderTypeResponse[]>('/api/admin/provider_types');
  },

  createProvider(input: ProviderInput): Promise<ProviderInfo> {
    return apiClient<ProviderInfo>('/api/admin/providers', { method: 'POST', body: JSON.stringify(input) });
  },

  /** The provider type is fixed after creation; only name and config can change. */
  updateProvider(
    id: string,
    changes: { provider_name?: string; config?: Record<string, unknown> },
  ): Promise<ProviderInfo> {
    return apiClient<ProviderInfo>(`/api/admin/providers/${id}`, { method: 'PATCH', body: JSON.stringify(changes) });
  },

  deleteProvider(id: string): Promise<void> {
    return apiClient<void>(`/api/admin/providers/${id}`, { method: 'DELETE' });
  },

  // ---- Chats ----------------------------------------------------------------
  /** Every user's conversations, newest first, 10 per page, with their owner. */
  async getAllChats(page = 1): Promise<AdminConversation[]> {
    const chats = await apiClient<AdminConversationSummary[]>(`/api/admin/chats?p=${page}`);
    return chats.map((c) => ({ ...toConversation(c), userId: String(c.user_id) }));
  },
};
