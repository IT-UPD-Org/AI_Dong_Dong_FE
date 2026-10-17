import { ApiError, apiClient } from './client';
import { streamSse } from './sse';
import type { BEFile, Document, DocumentStatus, FileType, StorageUsage } from './types';

/** Matches MAX_STORAGE_LIMIT in the backend's user model (236 MB). */
export const STORAGE_QUOTA_BYTES = 236 * 1024 * 1024;

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|bmp|svg|heic|avif)$/i;

/**
 * Upload progress event. `replaces` is set when a finished upload swaps its
 * temporary placeholder id for the real file id.
 */
export interface DocumentUpdate {
  doc: Document;
  replaces?: string;
}

type DocumentStatusListener = (update: DocumentUpdate) => void;
const listeners = new Set<DocumentStatusListener>();

/** Backend upload stages mapped to the UI's status labels. */
const STAGE_STATUS: Record<string, DocumentStatus> = {
  converting: 'converting',
  uploading: 'uploading',
  saving: 'uploading',
  indexing: 'processing',
};

function notify(doc: Document, replaces?: string) {
  listeners.forEach((listener) => listener({ doc: { ...doc }, replaces }));
}

function toDocument(file: BEFile, status: DocumentStatus = 'ready'): Document {
  return {
    document_id: String(file.id),
    title: file.title,
    filename: file.filename,
    file_type: file.file_type,
    size_bytes: file.size,
    file_url: file.file_url,
    status,
  };
}

export function detectFileType(file: File): FileType {
  return file.type.startsWith('image/') || IMAGE_EXTENSIONS.test(file.name) ? 'image' : 'docs';
}

export const documentApi = {
  /** Listen for upload progress; returns an unsubscribe function. */
  subscribe(listener: DocumentStatusListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /** Storage usage is derived from the signed-in user's `storage_used`. */
  async getStorageUsage(): Promise<StorageUsage> {
    const me = await apiClient<{ storage_used: number }>('/users/@me');
    const used = me.storage_used;
    return {
      total_bytes: STORAGE_QUOTA_BYTES,
      used_bytes: used,
      free_bytes: Math.max(STORAGE_QUOTA_BYTES - used, 0),
    };
  },

  async listDocuments(page = 1, limit = 100): Promise<Document[]> {
    const files = await apiClient<BEFile[]>(`/files?page=${page}&limit=${limit}`);
    return files.map((file) => toDocument(file));
  },

  deleteDocument(documentId: string): Promise<void> {
    return apiClient<void>(`/files/${documentId}`, { method: 'DELETE' });
  },

  renameDocument(documentId: string, title: string): Promise<BEFile> {
    return apiClient<BEFile>(`/files/${documentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
  },

  /**
   * Upload a file and follow its server-side progress.
   *
   * The backend streams `progress` stages, then `completed` or `error`. A
   * placeholder document is emitted to subscribers while the upload runs and
   * replaced by the real file once it completes.
   */
  async uploadDocument(file: File, title?: string): Promise<Document> {
    const placeholderId = `upload_${crypto.randomUUID()}`;
    const fileType = detectFileType(file);
    let current: Document = {
      document_id: placeholderId,
      title: title || file.name,
      filename: file.name,
      file_type: fileType,
      size_bytes: file.size,
      file_url: null,
      status: 'uploading',
    };
    notify(current);

    const form = new FormData();
    form.append('file', file);
    form.append('file_type', fileType);
    if (title) form.append('title', title);

    const fail = (message: string): never => {
      current = { ...current, status: 'error', error: message };
      notify(current);
      throw new Error(message);
    };

    try {
      for await (const evt of streamSse('/files/upload', form)) {
        if (evt.event === 'progress') {
          const stage = (evt.data as { stage: string }).stage;
          current = { ...current, status: STAGE_STATUS[stage] ?? current.status };
          notify(current);
        } else if (evt.event === 'completed') {
          const done = toDocument(evt.data as BEFile);
          notify(done, placeholderId);
          return done;
        } else if (evt.event === 'error') {
          fail((evt.data as { detail?: string }).detail || 'Tải lên thất bại.');
        }
      }
    } catch (err) {
      if (current.status === 'error') throw err;
      fail(err instanceof ApiError || err instanceof Error ? err.message : 'Tải lên thất bại.');
    }

    return fail('Máy chủ đã đóng kết nối trước khi hoàn tất tải lên.');
  },
};

/** Apply an upload update to a document list, swapping placeholders for real files. */
export function applyDocumentUpdate(list: Document[], { doc, replaces }: DocumentUpdate): Document[] {
  const withoutPlaceholder = replaces ? list.filter((d) => d.document_id !== replaces) : list;
  const index = withoutPlaceholder.findIndex((d) => d.document_id === doc.document_id);
  if (index === -1) return [doc, ...withoutPlaceholder];
  const next = [...withoutPlaceholder];
  next[index] = doc;
  return next;
}
