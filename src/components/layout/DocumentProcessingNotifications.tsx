import { useEffect, useState } from "react";
import { applyDocumentUpdate, documentApi } from "../../api/document.api";
import type { Document, DocumentStatus } from "../../api/types";
import { FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const STATUS_TEXT: Record<DocumentStatus, string> = {
  uploading: "Đang tải lên...",
  converting: "Đang chuyển đổi nội dung...",
  processing: "Đang lập chỉ mục...",
  ready: "Đã sẵn sàng",
  error: "Lỗi xử lý",
};

export function DocumentProcessingNotifications() {
  const [docs, setDocs] = useState<Document[]>([]);

  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();

    const unsubscribe = documentApi.subscribe((update) => {
      setDocs((prev) => applyDocumentUpdate(prev, update));

      // Dismiss finished uploads after a short delay.
      const { doc } = update;
      if (doc.status === "ready" || doc.status === "error") {
        const timer = setTimeout(() => {
          setDocs((prev) => prev.filter((d) => d.document_id !== doc.document_id));
          timers.delete(timer);
        }, doc.status === "error" ? 6000 : 3000);
        timers.add(timer);
      }
    });

    return () => {
      unsubscribe();
      timers.forEach(clearTimeout);
    };
  }, []);

  if (docs.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {docs.map((doc) => (
        <div
          key={doc.document_id}
          className="flex items-center gap-3 w-80 rounded-xl border border-black/10 bg-white p-4 shadow-lg animate-in slide-in-from-right-2 fade-in duration-300"
        >
          <div className="shrink-0">
            {doc.status === "ready" && <CheckCircle2 className="text-green-500" size={20} />}
            {doc.status === "error" && <AlertCircle className="text-red-500" size={20} />}
            {doc.status !== "ready" && doc.status !== "error" && (
              <Loader2
                className={`animate-spin ${doc.status === "uploading" ? "text-blue-500" : "text-amber-500"}`}
                size={20}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-gray-900">
              <FileText size={14} className="shrink-0 text-gray-500" />
              <span className="truncate">{doc.title}</span>
            </p>
            <p className={`text-xs ${doc.status === "error" ? "text-red-600" : "text-gray-500"}`}>
              {doc.status === "error" && doc.error ? doc.error : STATUS_TEXT[doc.status]}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
