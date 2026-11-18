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
      className="absolute bottom-full left-0 z-50 mb-2 w-80 max-w-full rounded-2xl border border-border bg-elevated p-4 shadow-xl text-foreground animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          {isEn ? "Upload documents" : "Tải tài liệu lên"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label={isEn ? "Close upload" : "Đóng tải tài liệu"}
          className="rounded-full p-1 text-muted-foreground hover:bg-hover hover:text-foreground cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      <button
        type="button"
        className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          isDragging
            ? "border-brand bg-brand-soft"
            : "border-border hover:border-brand/40 bg-surface"
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
        <Paperclip size={24} className="mb-2 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          {isEn ? "Drag & drop or click to select files" : "Kéo thả hoặc nhấn để chọn file"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">.doc, .docx, .xls, .xlsx, .pdf, .ppt, .pptx</p>
      </button>

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200 border border-amber-500/20">
        <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
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
