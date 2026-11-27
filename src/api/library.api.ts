import { apiClient } from './client';

export interface LibraryDocument {
  id: string;
  title: string;
  description: string | null;
  filename: string;
  content_type: string;
  size: number;
  file_url: string | null;
}

export interface LibraryDocumentUpdate {
  title?: string;
  description?: string | null;
}

function normalizeDocument(raw: LibraryDocument): LibraryDocument {
  return {
    ...raw,
    id: String(raw.id),
    title: raw.title ?? '',
    description: raw.description ?? null,
    filename: raw.filename ?? '',
    content_type: raw.content_type ?? 'application/octet-stream',
    size: Number(raw.size) || 0,
    file_url: raw.file_url ?? null,
  };
}

export const libraryApi = {
  async getDocuments(page = 1, limit = 20): Promise<LibraryDocument[]> {
    const data = await apiClient<LibraryDocument[]>(
      `/api/library/documents?page=${Math.max(1, page)}&limit=${Math.min(100, Math.max(1, limit))}`
    );
    return (data || []).map(normalizeDocument);
  },

  async getDocument(id: string): Promise<LibraryDocument> {
    const data = await apiClient<LibraryDocument>(`/api/library/documents/${encodeURIComponent(id)}`);
    return normalizeDocument(data);
  },

  async uploadDocument(file: File, title: string, description?: string): Promise<LibraryDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());
    if (description?.trim()) {
      formData.append('description', description.trim());
    }

    const data = await apiClient<LibraryDocument>('/api/library/documents', {
      method: 'POST',
      body: formData,
    });
    return normalizeDocument(data);
  },

  async updateDocument(id: string, update: LibraryDocumentUpdate): Promise<LibraryDocument> {
    const data = await apiClient<LibraryDocument>(`/api/library/documents/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    });
    return normalizeDocument(data);
  },

  async deleteDocument(id: string): Promise<void> {
    await apiClient<void>(`/api/library/documents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
