import type { Document, StorageUsage } from './types';

// Mock storage
let mockDocuments: Document[] = [];
let usedBytes = 0;
const TOTAL_QUOTA = 236 * 1024 * 1024; // 236 MB

type DocumentStatusListener = (doc: Document) => void;
const listeners: DocumentStatusListener[] = [];

export const documentApi = {
  subscribe(listener: DocumentStatusListener) {
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx > -1) listeners.splice(idx, 1);
    };
  },

  notify(doc: Document) {
    listeners.forEach((l) => l({ ...doc }));
  },

  async getStorageUsage(): Promise<StorageUsage> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          total_bytes: TOTAL_QUOTA,
          used_bytes: usedBytes,
          free_bytes: TOTAL_QUOTA - usedBytes,
        });
      }, 300);
    });
  },

  async listDocuments(): Promise<Document[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...mockDocuments].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }, 400);
    });
  },

  async deleteDocument(documentId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockDocuments.findIndex((d) => d.document_id === documentId);
        if (index === -1) {
          reject(new Error("Document not found"));
          return;
        }
        usedBytes -= mockDocuments[index].size_bytes;
        mockDocuments.splice(index, 1);
        resolve();
      }, 500);
    });
  },

  async uploadDocument(file: File): Promise<Document> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (usedBytes + file.size > TOTAL_QUOTA) {
          reject(new Error("Không đủ dung lượng. Bạn còn " + ((TOTAL_QUOTA - usedBytes) / (1024 * 1024)).toFixed(1) + " MB nhưng đang tải lên " + (file.size / (1024 * 1024)).toFixed(1) + " MB. Vui lòng vào Documents để xóa tài liệu cũ."));
          return;
        }

        const newDoc: Document = {
          document_id: `doc_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          user_id: 'usr_current',
          filename: file.name,
          mime_type: file.type || 'application/octet-stream',
          size_bytes: file.size,
          status: 'uploading',
          created_at: new Date().toISOString(),
        };

        usedBytes += file.size;
        mockDocuments.push(newDoc);
        this.notify(newDoc);

        // Resolve immediately so the UI knows the document_id
        resolve(newDoc);

        // Simulate MarkItDown processing in background
        setTimeout(() => {
          const index = mockDocuments.findIndex(d => d.document_id === newDoc.document_id);
          if (index > -1) {
            mockDocuments[index].status = 'processing';
            this.notify(mockDocuments[index]);
          }

          setTimeout(() => {
            const index2 = mockDocuments.findIndex(d => d.document_id === newDoc.document_id);
            if (index2 > -1) {
              mockDocuments[index2].status = 'ready';
              this.notify(mockDocuments[index2]);
            }
          }, 3000); // 3 seconds processing
        }, 1000); // 1 second upload
      }, 500);
    });
  }
};
