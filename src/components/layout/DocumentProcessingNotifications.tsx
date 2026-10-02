import { useEffect, useState } from "react";
import { documentApi } from "../../api/document.api";
import type { Document } from "../../api/types";
import { FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function DocumentProcessingNotifications() {
  const [docs, setDocs] = useState<Document[]>([]);

  useEffect(() => {
    const unsubscribe = documentApi.subscribe((updatedDoc) => {
      setDocs((prev) => {
        const index = prev.findIndex((d) => d.document_id === updatedDoc.document_id);
        if (index > -1) {
          const newDocs = [...prev];
          newDocs[index] = updatedDoc;
          return newDocs;
        } else {
          return [...prev, updatedDoc];
        }
      });

      // Remove from list after 3 seconds if ready or error
      if (updatedDoc.status === 'ready' || updatedDoc.status === 'error') {
        setTimeout(() => {
          setDocs((prev) => prev.filter((d) => d.document_id !== updatedDoc.document_id));
        }, 3000);
      }
    });

    return () => unsubscribe();
  }, []);

  if (docs.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {docs.map((doc) => (
        <div key={doc.document_id} className="flex items-center gap-3 w-80 rounded-xl border border-black/10 bg-white p-4 shadow-lg animate-in slide-in-from-right-2 fade-in duration-300">
          <div className="shrink-0">
            {doc.status === 'uploading' && <Loader2 className="animate-spin text-blue-500" size={20} />}
            {doc.status === 'processing' && <Loader2 className="animate-spin text-amber-500" size={20} />}
            {doc.status === 'ready' && <CheckCircle2 className="text-green-500" size={20} />}
            {doc.status === 'error' && <AlertCircle className="text-red-500" size={20} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{doc.filename}</p>
            <p className="text-xs text-gray-500">
              {doc.status === 'uploading' && "Đang tải lên..."}
              {doc.status === 'processing' && "Đang xử lý tài liệu..."}
              {doc.status === 'ready' && "Đã xử lý xong"}
              {doc.status === 'error' && "Lỗi xử lý"}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
