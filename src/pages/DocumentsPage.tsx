import { useEffect, useState, useRef } from 'react';
import { FileText, UploadCloud, Trash2, File, FileSpreadsheet, FileIcon as FilePdf, MonitorPlay } from 'lucide-react';
import { documentApi } from '../api/document.api';
import type { Document, StorageUsage } from '../api/types';

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getFileIcon(filename: string) {
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
  const [docs, setDocs] = useState<Document[]>([]);
  const [storage, setStorage] = useState<StorageUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const [d, s] = await Promise.all([
        documentApi.listDocuments(),
        documentApi.getStorageUsage()
      ]);
      setDocs(d);
      setStorage(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to live updates
    const unsub = documentApi.subscribe((updatedDoc) => {
      setDocs(prev => {
        const index = prev.findIndex(d => d.document_id === updatedDoc.document_id);
        if (index > -1) {
          const next = [...prev];
          next[index] = updatedDoc;
          return next;
        }
        return [updatedDoc, ...prev];
      });
      documentApi.getStorageUsage().then(setStorage);
    });

    return () => unsub();
  }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      try {
        await documentApi.uploadDocument(files[i]);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa tài liệu này?')) {
      try {
        await documentApi.deleteDocument(id);
        await fetchData(); // Refresh list & storage
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const percentUsed = storage ? Math.min(100, Math.round((storage.used_bytes / storage.total_bytes) * 100)) : 0;
  
  // Calculate SVG dash array for donut chart
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentUsed / 100) * circumference;

  return (
    <main>
      <p className="font-mono text-xs uppercase tracking-[.18em] text-[#04714a]">Kho tài liệu</p>
      <h1 className="mt-3 text-5xl font-bold tracking-[-.07em]">Documents</h1>

      {storage && (
        <div className="mt-10 flex flex-col md:flex-row items-center gap-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="relative h-24 w-24 shrink-0">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r={radius}
                fill="transparent"
                stroke="#e5e7eb"
                strokeWidth="12"
              />
              <circle
                cx="50" cy="50" r={radius}
                fill="transparent"
                stroke="#04714a"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-in-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-gray-800">{percentUsed}%</span>
            </div>
          </div>
          
          <div className="flex-1 text-sm text-gray-700">
            <p className="font-semibold text-lg text-gray-900 mb-1">Dung lượng lưu trữ</p>
            <div className="flex justify-between max-w-sm mb-1">
              <span>Đã dùng:</span>
              <span className="font-medium text-gray-900">{formatBytes(storage.used_bytes)}</span>
            </div>
            <div className="flex justify-between max-w-sm mb-1">
              <span>Còn lại:</span>
              <span className="font-medium text-[#04714a]">{formatBytes(storage.free_bytes)}</span>
            </div>
            <div className="flex justify-between max-w-sm text-gray-500 border-t mt-1 pt-1">
              <span>Tổng:</span>
              <span>{formatBytes(storage.total_bytes)}</span>
            </div>
          </div>
        </div>
      )}

      <div 
        className="mt-6 cursor-pointer rounded-3xl border border-dashed border-black/20 bg-white p-10 text-center transition-colors hover:border-[#04714a] hover:bg-[#04714a]/5"
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud className="mx-auto text-[#00a86b]" size={30} />
        <h2 className="mt-4 font-semibold text-gray-900">Tải tài liệu lên</h2>
        <p className="mt-2 text-sm text-black/50">PDF, DOCX, XLSX, PPTX và Markdown · Hỗ trợ MarkItDown</p>
        <button className="mt-6 rounded-xl bg-[#11130f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#04714a] transition-colors">
          Chọn file
        </button>
        <input 
          type="file" 
          multiple 
          ref={fileInputRef} 
          className="hidden" 
          accept=".doc,.docx,.xls,.xlsx,.pdf,.ppt,.pptx"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      <div className="mt-8 flex flex-col gap-2">
        {loading && <p className="text-sm text-gray-500 text-center py-4">Đang tải tài liệu...</p>}
        {!loading && docs.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">Chưa có tài liệu nào.</p>
        )}
        {docs.map(d => (
          <div key={d.document_id} className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="shrink-0 p-2 bg-gray-50 rounded-lg">
              {getFileIcon(d.filename)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{d.filename}</p>
              <p className="mt-1 flex items-center gap-2 text-xs text-black/45">
                <span>{d.mime_type.split('/').pop()?.toUpperCase() || 'FILE'}</span>
                <span>·</span>
                <span>{formatBytes(d.size_bytes)}</span>
                <span>·</span>
                <span>{new Date(d.created_at).toLocaleDateString('vi-VN')}</span>
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                d.status === 'ready' ? 'bg-green-100 text-green-700' : 
                d.status === 'error' ? 'bg-red-100 text-red-700' : 
                'bg-amber-100 text-amber-700'
              }`}>
                {d.status === 'uploading' ? 'Đang tải lên' :
                 d.status === 'processing' ? 'Đang xử lý...' :
                 d.status === 'ready' ? 'Sẵn sàng' : 'Lỗi'}
              </span>
              <button 
                onClick={() => handleDelete(d.document_id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Xóa tài liệu"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
