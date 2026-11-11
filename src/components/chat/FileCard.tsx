import { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  File as FileGeneric,
  Eye,
  Download,
  Loader2,
  Check,
} from "lucide-react";
import {
  PreviewFile,
  getFileCategory,
  getFileExtension,
  formatBytes,
  downloadFileWithAuth,
} from "../../lib/filePreviewUtils";
import { toast } from "sonner";
import { useLanguage } from "../../contexts/LanguageContext";

interface FileCardProps {
  file: PreviewFile;
  onPreview?: (file: PreviewFile) => void;
  onDownload?: (file: PreviewFile) => void;
  compact?: boolean;
  className?: string;
}

export function FileCard({
  file,
  onPreview,
  onDownload,
  compact = false,
  className = "",
}: FileCardProps) {
  const { lang } = useLanguage();
  const isEn = lang === "en";
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const ext = (file.extension || getFileExtension(file.name || file.url)).toLowerCase();
  const category = getFileCategory(ext);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloading) return;

    if (onDownload) {
      onDownload(file);
      return;
    }

    try {
      setDownloading(true);
      await downloadFileWithAuth(file.url, file.name);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
      toast.success(isEn ? `Started downloading ${file.name}` : `Đã bắt đầu tải xuống ${file.name}`);
    } catch (err) {
      toast.error(isEn ? `Failed to download: ${(err as Error).message}` : `Không thể tải xuống: ${(err as Error).message}`);
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPreview) {
      onPreview(file);
    }
  };

  // Color schemes based on file category
  const colorMap = {
    pdf: {
      badgeBg: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      iconBg: "bg-red-500/10 text-red-600 dark:text-red-400",
      border: "hover:border-red-500/40",
      icon: <FileText size={20} className="text-red-600 dark:text-red-400" />,
    },
    word: {
      badgeBg: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      border: "hover:border-blue-500/40",
      icon: <FileText size={20} className="text-blue-600 dark:text-blue-400" />,
    },
    excel: {
      badgeBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      border: "hover:border-emerald-500/40",
      icon: <FileSpreadsheet size={20} className="text-emerald-600 dark:text-emerald-400" />,
    },
    csv: {
      badgeBg: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20",
      iconBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
      border: "hover:border-teal-500/40",
      icon: <FileSpreadsheet size={20} className="text-teal-600 dark:text-teal-400" />,
    },
    image: {
      badgeBg: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
      iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      border: "hover:border-purple-500/40",
      icon: <FileGeneric size={20} className="text-purple-600 dark:text-purple-400" />,
    },
    archive: {
      badgeBg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      border: "hover:border-amber-300",
      icon: <FileGeneric size={20} className="text-amber-600 dark:text-amber-400" />,
    },
    code: {
      badgeBg: "bg-muted text-foreground border-border",
      iconBg: "bg-muted text-foreground",
      border: "hover:border-border",
      icon: <FileGeneric size={20} className="text-foreground" />,
    },
    other: {
      badgeBg: "bg-muted text-muted-foreground border-border",
      iconBg: "bg-muted text-muted-foreground",
      border: "hover:border-border",
      icon: <FileGeneric size={20} className="text-muted-foreground" />,
    },
  };

  const scheme = colorMap[category] || colorMap.other;
  const sizeString = formatBytes(file.size);

  return (
    <span
      onClick={handlePreview}
      className={`group/card relative my-2 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-foreground shadow-xs transition-all hover:bg-hover hover:shadow-sm ${scheme.border} ${className}`}
    >
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover/card:scale-105 ${scheme.iconBg}`}
        >
          {scheme.icon}
        </span>

        <span className="min-w-0 flex-1 block">
          <span className="flex items-center gap-2">
            <span
              className="truncate text-xs sm:text-sm font-semibold text-foreground group-hover/card:text-brand-text"
              title={file.name}
            >
              {file.name}
            </span>
          </span>

          <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span
              className={`rounded px-1.5 py-0.2 font-mono text-[10px] font-semibold uppercase tracking-wider border ${scheme.badgeBg}`}
            >
              {(ext || "FILE").toUpperCase()}
            </span>
            {sizeString && (
              <>
                <span>·</span>
                <span>{sizeString}</span>
              </>
            )}
          </span>
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-1.5">
        {onPreview && (
          <button
            type="button"
            onClick={handlePreview}
            title={isEn ? "Preview document" : "Xem ngay tài liệu"}
            aria-label={isEn ? `Preview ${file.name}` : `Xem ngay ${file.name}`}
            className="flex items-center gap-1 rounded-lg bg-brand-soft px-2.5 py-1.5 text-xs font-semibold text-brand-text transition-all hover:opacity-90 active:scale-95 cursor-pointer"
          >
            <Eye size={13} />
            <span className="hidden sm:inline">{isEn ? "Preview" : "Xem ngay"}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          title={downloadSuccess ? (isEn ? "Downloaded" : "Đã tải xong") : (isEn ? "Download document" : "Tải xuống tài liệu")}
          aria-label={isEn ? `Download ${file.name}` : `Tải xuống ${file.name}`}
          className={`flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-all hover:bg-hover active:scale-95 cursor-pointer disabled:opacity-50 ${
            downloadSuccess
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "text-fg-secondary"
          }`}
        >
          {downloading ? (
            <Loader2 size={13} className="animate-spin text-muted-foreground" />
          ) : downloadSuccess ? (
            <Check size={13} className="text-brand-bright" />
          ) : (
            <Download size={13} />
          )}
          <span className="hidden sm:inline">
            {downloading
              ? isEn ? "Downloading..." : "Đang tải..."
              : downloadSuccess
              ? isEn ? "Done" : "Đã tải"
              : isEn ? "Download" : "Tải xuống"}
          </span>
        </button>
      </span>
    </span>
  );
}
