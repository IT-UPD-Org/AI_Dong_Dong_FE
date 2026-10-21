import { apiClient } from './client';
import { toUser } from './auth.api';
import { chatApi } from './chat.api';
import type {
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

export const adminApi = {
  // ---- Users ----------------------------------------------------------------
  async getUsers(page = 1): Promise<User[]> {
    const users = await apiClient<BEUser[]>(`/api/admin/users?p=${page}`);
    return users.map(toUser);
  },

  async setUserRole(userId: string, role: 'student' | 'teacher'): Promise<User> {
    return toUser(
      await apiClient<BEUser>(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
    );
  },

  async setUserDisabled(userId: string, disable: boolean): Promise<User> {
    return toUser(
      await apiClient<BEUser>(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ disable }),
      }),
    );
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
  /** All users' conversations, via the admin-only `all_chats` flag. */
  getAllChats(page = 1) {
    return chatApi.getConversations(page, true);
  },
};
