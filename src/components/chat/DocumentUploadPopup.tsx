import { useState, useRef, useEffect } from "react";
import { Paperclip, X, AlertTriangle } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

interface DocumentUploadPopupProps {
  onClose: () => void;
  onUploadFiles: (files: File[]) => void;
}

export function DocumentUploadPopup({ onClose, onUploadFiles }: DocumentUploadPopupProps) {
  const { lang } = useLanguage();
  const isEn = lang === "en";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Đóng khi click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Đóng khi ấn Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    // Snapshot the FileList before closing/unmounting the input.
    const selectedFiles = Array.from(files);
    onClose();
    onUploadFiles(selectedFiles);
  };

  return (
    <div
      ref={popupRef}
      className="absolute bottom-full left-0 z-50 mb-2 w-80 max-w-full rounded-2xl border border-black/10 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-[#1e1e1e] dark:text-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {isEn ? "Upload documents" : "Tải tài liệu lên"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label={isEn ? "Close upload" : "Đóng tải tài liệu"}
          className="rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      <button
        type="button"
        className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          isDragging
            ? "border-[#04714a] bg-[#04714a]/5 dark:border-emerald-500 dark:bg-emerald-500/10"
            : "border-gray-200 hover:border-gray-300 dark:border-white/15 dark:hover:border-white/30 dark:bg-white/5"
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
        <Paperclip size={24} className="mb-2 text-gray-400 dark:text-gray-500" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
          {isEn ? "Drag & drop or click to select files" : "Kéo thả hoặc nhấn để chọn file"}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">.doc, .docx, .xls, .xlsx, .pdf, .ppt, .pptx</p>
      </button>

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 dark:border dark:border-amber-900/40">
        <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <p>
          {isEn
            ? "Uploaded files will be used for this conversation and saved to your knowledge base."
            : "File sau khi tải lên sẽ được dùng cho đoạn chat này và lưu vào kho tài liệu."}
        </p>
      </div>

      <input
        type="file"
        multiple
        ref={fileInputRef}
        aria-label="Chọn tài liệu đính kèm"
        className="hidden"
        accept=".doc,.docx,.xls,.xlsx,.pdf,.ppt,.pptx"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
