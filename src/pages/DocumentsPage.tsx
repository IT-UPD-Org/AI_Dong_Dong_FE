import { useEffect, useState, useRef } from 'react';
import { useConfirm } from '../components/useConfirm';
import { FileText, UploadCloud, Trash2, File, FileSpreadsheet, FileIcon as FilePdf, MonitorPlay, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { applyDocumentUpdate, documentApi } from '../api/document.api';
import type { Document, DocumentStatus, StorageUsage } from '../api/types';
import { useLanguage } from '../contexts/LanguageContext';

const STATUS_LABELS_VI: Record<DocumentStatus, string> = {
  uploading: 'Đang tải lên',
  converting: 'Đang chuyển đổi...',
  processing: 'Đang lập chỉ mục...',
  ready: 'Sẵn sàng',
  error: 'Lỗi',
};

const STATUS_LABELS_EN: Record<DocumentStatus, string> = {
  uploading: 'Uploading',
  converting: 'Converting...',
  processing: 'Indexing...',
  ready: 'Ready',
  error: 'Error',
};

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getFileIcon(filename: string, fileType: Document['file_type']) {
  if (fileType === 'image') return <ImageIcon className="text-purple-500" />;
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return <FilePdf className="text-red-500" />;
    case 'doc':
    case 'docx': return <FileText className="text-blue-500" />;
    case 'xls':
    case 'xlsx': return <FileSpreadsheet className="text-green-600" />;
    case 'ppt':
    case 'pptx': return <MonitorPlay className="text-orange-500" />;
    default: return <File className="text-gray-500" />;
  }
}

export function DocumentsPage() {
  const { lang } = useLanguage();
  const isEn = lang === "en";
  const statusLabels = isEn ? STATUS_LABELS_EN : STATUS_LABELS_VI;

  const { confirm, dialog: confirmDialog } = useConfirm();
  const [docs, setDocs] = useState<Document[]>([]);
  const [storage, setStorage] = useState<StorageUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loadError, setLoadError] = useState('');

  const fetchData = async () => {
    try {
      const [d, s] = await Promise.all([
        documentApi.listDocuments(),
        documentApi.getStorageUsage()
      ]);
      setDocs(d);
      setStorage(s);
      setLoadError('');
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const unsub = documentApi.subscribe((update) => {
      setDocs(prev => applyDocumentUpdate(prev, update));
      // Quota only changes once an upload has finished or rolled back.
      if (update.doc.status === 'ready' || update.doc.status === 'error') {
        documentApi.getStorageUsage().then(setStorage).catch(() => {});
      }
    });

    return () => unsub();
  }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        await documentApi.uploadDocument(file);
      } catch (err) {
        toast.error(`${file.name}: ${(err as Error).message}`);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (doc: Document) => {
    // A failed upload never reached the server; just drop it from the list.
    if (doc.status === 'error') {
      setDocs(prev => prev.filter(d => d.document_id !== doc.document_id));
      return;
    }
    const ok = await confirm({
      title: 'Xoá tài liệu?',
      description: `"${doc.title || doc.filename}" sẽ bị xoá vĩnh viễn.`,
      confirmLabel: 'Xoá',
      destructive: true,
    });
    if (!ok) return;
    try {
      await documentApi.deleteDocument(doc.document_id);
      toast.success('Đã xóa tài liệu.');
      await fetchData();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const percentUsed = storage ? Math.min(100, Math.round((storage.used_bytes / storage.total_bytes) * 100)) : 0;
  
  // Calculate SVG dash array for donut chart
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentUsed / 100) * circumference;

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8 text-zinc-900 dark:text-gray-100">
      <p className="font-mono text-xs uppercase tracking-[.18em] text-[#04714a] dark:text-emerald-400">
        {isEn ? "Document Repository" : "Kho tài liệu"}
      </p>
      <h1 className="mt-3 text-3xl sm:text-5xl font-bold tracking-[-.07em] text-gray-900 dark:text-white">
        {isEn ? "Documents" : "Tài liệu"}
      </h1>

      {storage && (
        <div className="mt-10 flex flex-col md:flex-row items-center gap-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1e1e1e]">
          <div className="relative h-24 w-24 shrink-0">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r={radius}
                fill="transparent"
                stroke="#e5e7eb"
                className="dark:stroke-white/10"
                strokeWidth="12"
              />
              <circle
                cx="50" cy="50" r={radius}
                fill="transparent"
                stroke="#04714a"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-in-out dark:stroke-emerald-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-gray-800 dark:text-white">{percentUsed}%</span>
            </div>
          </div>
          
          <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
            <p className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
              {isEn ? "Storage Capacity" : "Dung lượng lưu trữ"}
            </p>
            <div className="flex justify-between max-w-sm mb-1">
              <span>{isEn ? "Used:" : "Đã dùng:"}</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatBytes(storage.used_bytes)}</span>
            </div>
            <div className="flex justify-between max-w-sm mb-1">
              <span>{isEn ? "Free:" : "Còn lại:"}</span>
              <span className="font-medium text-[#04714a] dark:text-emerald-400">{formatBytes(storage.free_bytes)}</span>
            </div>
            <div className="flex justify-between max-w-sm text-gray-500 dark:text-gray-400 border-t border-black/10 dark:border-white/10 mt-1 pt-1">
              <span>{isEn ? "Total:" : "Tổng:"}</span>
              <span>{formatBytes(storage.total_bytes)}</span>
            </div>
          </div>
        </div>
      )}

      <div 
        className="mt-6 cursor-pointer rounded-3xl border border-dashed border-black/20 bg-white p-10 text-center transition-colors hover:border-[#04714a] hover:bg-[#04714a]/5 dark:border-white/15 dark:bg-[#1e1e1e]/60 dark:hover:border-emerald-500 dark:hover:bg-emerald-500/5"
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud className="mx-auto text-[#00a86b] dark:text-emerald-400" size={30} />
        <h2 className="mt-4 font-semibold text-gray-900 dark:text-white">
          {isEn ? "Upload documents" : "Tải tài liệu lên"}
        </h2>
        <p className="mt-2 text-sm text-black/50 dark:text-gray-400">
          {isEn
            ? "PDF, DOCX, XLSX, PPTX, Markdown and images · Powered by MarkItDown"
            : "PDF, DOCX, XLSX, PPTX, Markdown và hình ảnh · Hỗ trợ MarkItDown"}
        </p>
        <button className="mt-6 rounded-xl bg-[#11130f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#04714a] dark:bg-white/10 dark:hover:bg-emerald-600 transition-colors cursor-pointer">
          {isEn ? "Select files" : "Chọn file"}
        </button>
        <input 
          type="file" 
          multiple 
          ref={fileInputRef} 
          className="hidden" 
          accept=".doc,.docx,.xls,.xlsx,.pdf,.ppt,.pptx,.md,.txt,.csv,image/*"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      <div className="mt-8 flex flex-col gap-2">
        {loading && <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{isEn ? "Loading documents..." : "Đang tải tài liệu..."}</p>}
        {!loading && loadError && (
          <p className="text-sm text-red-600 dark:text-red-400 text-center py-4">{isEn ? `Cannot load documents: ${loadError}` : `Không thể tải tài liệu: ${loadError}`}</p>
        )}
        {!loading && !loadError && docs.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{isEn ? "No documents yet." : "Chưa có tài liệu nào."}</p>
        )}
        {docs.map(d => (
          <div key={d.document_id} className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#1e1e1e]">
            <div className="shrink-0 p-2 bg-gray-50 dark:bg-white/5 rounded-lg">
              {getFileIcon(d.filename, d.file_type)}
            </div>
            <div className="min-w-0 flex-1">
              {d.file_url && d.status === 'ready' ? (
                <a
                  href={d.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-sm font-semibold text-gray-900 hover:text-[#04714a] dark:text-white dark:hover:text-emerald-400 hover:underline"
                >
                  {d.title}
                </a>
              ) : (
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{d.title}</p>
              )}
              <p className="mt-1 flex items-center gap-2 text-xs text-black/45 dark:text-gray-400">
                <span className="truncate">{d.filename}</span>
                <span>·</span>
                <span>{d.file_type === 'image' ? (isEn ? 'Image' : 'Hình ảnh') : (isEn ? 'Document' : 'Tài liệu')}</span>
                <span>·</span>
                <span>{formatBytes(d.size_bytes)}</span>
              </p>
              {d.error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{d.error}</p>}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                d.status === 'ready' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300' :
                d.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' :
                'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
              }`}>
                {statusLabels[d.status]}
              </span>
              <button
                onClick={() => handleDelete(d)}
                disabled={d.status !== 'ready' && d.status !== 'error'}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title={isEn ? "Delete document" : "Xóa tài liệu"}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {confirmDialog}
    </main>
  );
}
