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
      toast.success(`Đã bắt đầu tải xuống ${file.name}`);
    } catch (err) {
      toast.error(`Không thể tải xuống: ${(err as Error).message}`);
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
      badgeBg: "bg-red-50 text-red-700 border-red-200",
      iconBg: "bg-red-500/10 text-red-600",
      border: "hover:border-red-300",
      icon: <FileText size={20} className="text-red-600" />,
    },
    word: {
      badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
      iconBg: "bg-blue-500/10 text-blue-600",
      border: "hover:border-blue-300",
      icon: <FileText size={20} className="text-blue-600" />,
    },
    excel: {
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      iconBg: "bg-emerald-500/10 text-emerald-600",
      border: "hover:border-emerald-300",
      icon: <FileSpreadsheet size={20} className="text-emerald-600" />,
    },
    csv: {
      badgeBg: "bg-teal-50 text-teal-700 border-teal-200",
      iconBg: "bg-teal-500/10 text-teal-600",
      border: "hover:border-teal-300",
      icon: <FileSpreadsheet size={20} className="text-teal-600" />,
    },
    image: {
      badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
      iconBg: "bg-purple-500/10 text-purple-600",
      border: "hover:border-purple-300",
      icon: <FileGeneric size={20} className="text-purple-600" />,
    },
    archive: {
      badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
      iconBg: "bg-amber-500/10 text-amber-600",
      border: "hover:border-amber-300",
      icon: <FileGeneric size={20} className="text-amber-600" />,
    },
    code: {
      badgeBg: "bg-slate-50 text-slate-700 border-slate-200",
      iconBg: "bg-slate-500/10 text-slate-600",
      border: "hover:border-slate-300",
      icon: <FileGeneric size={20} className="text-slate-600" />,
    },
    other: {
      badgeBg: "bg-zinc-100 text-zinc-700 border-zinc-200",
      iconBg: "bg-zinc-500/10 text-zinc-600",
      border: "hover:border-zinc-300",
      icon: <FileGeneric size={20} className="text-zinc-600" />,
    },
  };

  const scheme = colorMap[category] || colorMap.other;
  const sizeString = formatBytes(file.size);

  return (
    <span
      onClick={handlePreview}
      className={`group/card relative my-2 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-black/10 bg-white p-3 text-[#11130f] shadow-xs transition-all hover:bg-black/[0.015] hover:shadow-sm ${scheme.border} ${className}`}
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
              className="truncate text-xs sm:text-sm font-semibold text-zinc-900 group-hover/card:text-[#04714a]"
              title={file.name}
            >
              {file.name}
            </span>
          </span>

          <span className="mt-0.5 flex items-center gap-2 text-[11px] text-black/50">
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
            title="Xem ngay tài liệu"
            aria-label={`Xem ngay ${file.name}`}
            className="flex items-center gap-1 rounded-lg bg-[#e8f7ef] px-2.5 py-1.5 text-xs font-semibold text-[#04714a] transition-all hover:bg-[#d0f0df] hover:text-[#035e3f] active:scale-95 cursor-pointer"
          >
            <Eye size={13} />
            <span className="hidden sm:inline">Xem ngay</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          title={downloadSuccess ? "Đã tải xong" : "Tải xuống tài liệu"}
          aria-label={`Tải xuống ${file.name}`}
          className={`flex items-center gap-1 rounded-lg border border-black/10 px-2.5 py-1.5 text-xs font-medium transition-all hover:bg-black/5 active:scale-95 cursor-pointer disabled:opacity-50 ${
            downloadSuccess ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "text-zinc-700"
          }`}
        >
          {downloading ? (
            <Loader2 size={13} className="animate-spin text-zinc-500" />
          ) : downloadSuccess ? (
            <Check size={13} className="text-emerald-600" />
          ) : (
            <Download size={13} />
          )}
          <span className="hidden sm:inline">
            {downloading ? "Đang tải..." : downloadSuccess ? "Đã tải" : "Tải xuống"}
          </span>
        </button>
      </span>
    </span>
  );
}
