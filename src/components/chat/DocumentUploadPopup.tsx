import { useState, useRef, useEffect } from "react";
import { Paperclip, X, AlertTriangle } from "lucide-react";
import { documentApi } from "../../api/document.api";
import type { Document } from "../../api/types";

interface DocumentUploadPopupProps {
  onClose: () => void;
  onUploadError: (error: string) => void;
}

export function DocumentUploadPopup({ onClose, onUploadError }: DocumentUploadPopupProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onClose(); // Đóng popup ngay khi bắt đầu upload

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        await documentApi.uploadDocument(file);
      } catch (err: any) {
        onUploadError(err.message || "Không thể tải tài liệu lên.");
      }
    }
  };

  return (
    <div
      ref={popupRef}
      className="absolute bottom-16 left-0 z-50 mb-2 w-80 rounded-2xl border border-black/10 bg-white p-4 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Tải tài liệu lên</h3>
        <button type="button" onClick={onClose} className="rounded-full p-1 text-gray-500 hover:bg-gray-100">
          <X size={16} />
        </button>
      </div>

      <div
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          isDragging ? "border-[#04714a] bg-[#04714a]/5" : "border-gray-200 hover:border-gray-300"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <Paperclip size={24} className="mb-2 text-gray-400" />
        <p className="text-sm font-medium text-gray-700">Kéo thả hoặc nhấn để chọn file</p>
        <p className="mt-1 text-xs text-gray-500">.doc, .docx, .xls, .xlsx, .pdf, .ppt, .pptx</p>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
        <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
        <p>
          ⚠ Khuyến nghị không upload PDF nếu không cần thiết. Với tài liệu có thể chỉnh sửa, Word thường phù hợp hơn cho việc xử lý nội dung.
        </p>
      </div>

      <input
        type="file"
        multiple
        ref={fileInputRef}
        className="hidden"
        accept=".doc,.docx,.xls,.xlsx,.pdf,.ppt,.pptx"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
