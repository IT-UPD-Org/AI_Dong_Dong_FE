import { apiClient } from './client';
import type { ModelInfoModel, ProviderInfoModel, ProviderTypeResponse } from './types';

export const adminApi = {
  /**
   * Lấy danh sách model có sẵn
   */
  async getModels(page: number = 1): Promise<ModelInfoModel[]> {
    return await apiClient<ModelInfoModel[]>(`/admin/models?p=${page}`);
  },

  /**
   * Lấy danh sách provider AI có sẵn
   */
  async getProviders(page: number = 1): Promise<ProviderInfoModel[]> {
    return await apiClient<ProviderInfoModel[]>(`/admin/providers?p=${page}`);
  },

  /**
   * Lấy danh sách các loại provider được hỗ trợ kèm schema cấu hình
   */
  async getProviderTypes(): Promise<ProviderTypeResponse[]> {
    return await apiClient<ProviderTypeResponse[]>('/admin/provider_types');
  },
};
