import { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Download,
  FileText,
  FileSpreadsheet,
  File as FileGeneric,
  Maximize2,
  Minimize2,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import {
  PreviewFile,
  getFileCategory,
  getFileExtension,
  formatBytes,
  downloadFileWithAuth,
  fetchFileBlob,
  fetchFileText,
  fetchFileArrayBuffer,
  parseCsv,
  parseExcelWorkbook,
  parseDocxToHtml,
  SheetData,
} from "../../lib/filePreviewUtils";
import { toast } from "sonner";
import { useLanguage } from "../../contexts/LanguageContext";

interface FilePreviewPanelProps {
  file: PreviewFile | null;
  onClose: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function FilePreviewPanel({
  file,
  onClose,
  isExpanded = false,
  onToggleExpand,
}: FilePreviewPanelProps) {
  const { lang } = useLanguage();
  const isEn = lang === "en";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // PDF blob state
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  // CSV state
  const [csvData, setCsvData] = useState<{
    headers: string[];
    rows: string[][];
    totalRows: number;
    isTruncated: boolean;
  } | null>(null);

  // Excel state
  const [excelData, setExcelData] = useState<{
    sheetNames: string[];
    sheets: Record<string, SheetData>;
  } | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>("");

  // Word state
  const [docxHtml, setDocxHtml] = useState<string | null>(null);

  // Table search & pagination state (for CSV & Excel)
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const activePdfUrlRef = useRef<string | null>(null);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (activePdfUrlRef.current) {
        URL.revokeObjectURL(activePdfUrlRef.current);
        activePdfUrlRef.current = null;
      }
    };
  }, []);

  // Load content whenever file changes
  useEffect(() => {
    if (!file) return;

    if (activePdfUrlRef.current) {
      URL.revokeObjectURL(activePdfUrlRef.current);
      activePdfUrlRef.current = null;
    }

    setPdfBlobUrl(null);
    setCsvData(null);
    setExcelData(null);
    setActiveSheet("");
    setDocxHtml(null);
    setError(null);
    setSearchTerm("");
    setPage(1);

    const ext = (file.extension || getFileExtension(file.name || file.url)).toLowerCase();

    // Word .doc fallback (binary format)
    if (ext === "doc") {
      setLoading(false);
      return;
    }

    let isCancelled = false;
    setLoading(true);

    async function loadFileContent() {
      if (!file) return;
      try {
        if (ext === "pdf") {
          const blob = await fetchFileBlob(file.url);
          if (isCancelled) return;
          const blobUrl = URL.createObjectURL(blob);
          activePdfUrlRef.current = blobUrl;
          setPdfBlobUrl(blobUrl);
        } else if (ext === "csv") {
          const text = await fetchFileText(file.url);
          if (isCancelled) return;
          const parsed = parseCsv(text);
          setCsvData(parsed);
        } else if (ext === "xlsx" || ext === "xls") {
          const buffer = await fetchFileArrayBuffer(file.url);
          if (isCancelled) return;
          const parsed = parseExcelWorkbook(buffer);
          setExcelData(parsed);
          if (parsed.sheetNames.length > 0) {
            setActiveSheet(parsed.sheetNames[0]);
          }
        } else if (ext === "docx") {
          const buffer = await fetchFileArrayBuffer(file.url);
          if (isCancelled) return;
          const { html } = await parseDocxToHtml(buffer);
          setDocxHtml(html);
        } else {
          // Unsupported direct preview
          setError("Định dạng file không hỗ trợ xem trước trực tiếp. Bạn có thể tải file về để xem.");
        }
      } catch (err) {
        if (isCancelled) return;
        setError((err as Error).message || "Không thể tải nội dung file.");
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadFileContent();

    return () => {
      isCancelled = true;
    };
  }, [file]);

  const handleDownload = async () => {
    if (!file || downloading) return;
    try {
      setDownloading(true);
      await downloadFileWithAuth(file.url, file.name);
      toast.success(`Đã bắt đầu tải xuống ${file.name}`);
    } catch (err) {
      toast.error(`Không thể tải xuống: ${(err as Error).message}`);
    } finally {
      setDownloading(false);
    }
  };

  const ext = file ? (file.extension || getFileExtension(file.name || file.url)).toLowerCase() : "";
  const category = getFileCategory(ext);

  // Table data computation for CSV and Excel
  const currentTableData = useMemo(() => {
    if (ext === "csv" && csvData) {
      return {
        headers: csvData.headers,
        rows: csvData.rows,
        totalRows: csvData.totalRows,
        isTruncated: csvData.isTruncated,
      };
    }
    if ((ext === "xlsx" || ext === "xls") && excelData && activeSheet && excelData.sheets[activeSheet]) {
      const sheet = excelData.sheets[activeSheet];
      return {
        headers: sheet.headers,
        rows: sheet.rows,
        totalRows: sheet.totalRows,
        isTruncated: false,
      };
    }
    return null;
  }, [ext, csvData, excelData, activeSheet]);

  const filteredRows = useMemo(() => {
    if (!currentTableData) return [];
    if (!searchTerm.trim()) return currentTableData.rows;

    const query = searchTerm.toLowerCase();
    return currentTableData.rows.filter((row) =>
      row.some((cell) => cell !== null && cell !== undefined && String(cell).toLowerCase().includes(query)),
    );
  }, [currentTableData, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  if (!file) return null;

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-[#181818] dark:text-gray-100">
      {/* Panel Toolbar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-black/10 px-4 bg-zinc-50/70 dark:border-white/10 dark:bg-[#1e1e1e]">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 mr-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/5 dark:bg-white/10">
            {category === "pdf" ? (
              <FileText size={16} className="text-red-600" />
            ) : category === "word" ? (
              <FileText size={16} className="text-blue-600" />
            ) : category === "excel" || category === "csv" ? (
              <FileSpreadsheet size={16} className="text-emerald-600" />
            ) : (
              <FileGeneric size={16} className="text-zinc-600 dark:text-zinc-400" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white" title={file.name}>
              {file.name}
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-gray-400">
              <span className="font-mono font-medium uppercase">{ext}</span>
              {file.size && file.size > 0 && (
                <>
                  <span>·</span>
                  <span>{formatBytes(file.size)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            aria-label={isEn ? "Download file" : "Tải file xuống"}
            title={isEn ? "Download file" : "Tải file xuống"}
            className="flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer disabled:opacity-50"
          >
            {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            <span className="hidden sm:inline">
              {downloading
                ? isEn ? "Downloading..." : "Đang tải..."
                : isEn ? "Download" : "Tải xuống"}
            </span>
          </button>

          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              aria-label={isExpanded ? (isEn ? "Collapse" : "Thu nhỏ xem trước") : (isEn ? "Expand" : "Phóng to xem trước")}
              title={isExpanded ? (isEn ? "Collapse" : "Thu nhỏ xem trước") : (isEn ? "Expand" : "Phóng to xem trước")}
              className="hidden md:flex items-center justify-center rounded-lg p-2 text-zinc-500 hover:bg-black/5 hover:text-black dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white cursor-pointer"
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? "Close preview" : "Đóng xem trước file"}
            title={isEn ? "Close preview" : "Đóng xem trước"}
            className="flex items-center justify-center rounded-lg p-2 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/40 dark:hover:text-red-400 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Panel Body Content */}
      <div className="relative min-h-0 flex-1 overflow-auto bg-zinc-50/30 dark:bg-[#121212]">
        {loading && (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <Loader2 size={32} className="animate-spin text-[#04714a] mb-3" />
            <p className="text-sm font-medium text-zinc-700 dark:text-gray-200">
              {isEn ? "Loading and processing document..." : "Đang tải và xử lý tài liệu..."}
            </p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-gray-500">
              {isEn ? "Please wait a moment" : "Vui lòng chờ trong giây lát"}
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
            <div className="rounded-full bg-red-50 p-3 text-red-500 dark:bg-red-950/40 dark:text-red-400 mb-3">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              {isEn ? "Cannot preview file" : "Không thể xem trước file"}
            </h3>
            <p className="mt-1.5 text-xs text-zinc-600 dark:text-gray-300">{error}</p>
            <button
              type="button"
              onClick={handleDownload}
              className="mt-4 flex items-center gap-2 rounded-xl bg-[#04714a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#035e3f] cursor-pointer"
            >
              <Download size={14} />
              {isEn ? "Download file" : "Tải file về máy"}
            </button>
          </div>
        )}

        {/* Word .doc Legacy Notice */}
        {!loading && !error && ext === "doc" && (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
            <div className="rounded-2xl bg-blue-50 p-4 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 mb-3">
              <FileText size={36} />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
              {isEn ? "Legacy Word .doc format" : "Định dạng Word .doc cũ"}
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-gray-300 leading-relaxed">
              {isEn
                ? "This document uses the older binary Word (.doc) format. Direct preview in browser requires modern (.docx) files."
                : "Tài liệu này sử dụng định dạng nhị phân Word (.doc) đời cũ. Trình duyệt chỉ hỗ trợ xem trực tiếp các file Word hiện đại (.docx)."}
            </p>
            <button
              type="button"
              onClick={handleDownload}
              className="mt-5 flex items-center gap-2 rounded-xl bg-[#04714a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#035e3f] shadow-sm cursor-pointer"
            >
              <Download size={16} />
              {isEn ? "Download .doc file" : "Tải xuống file .doc"}
            </button>
          </div>
        )}

        {/* PDF Viewer */}
        {!loading && !error && ext === "pdf" && pdfBlobUrl && (
          <iframe
            src={pdfBlobUrl}
            title={file.name}
            className="h-full w-full border-0"
          />
        )}

        {/* Word .docx Viewer */}
        {!loading && !error && ext === "docx" && docxHtml && (
          <div className="p-4 sm:p-8 flex justify-center">
            <div className="w-full max-w-3xl rounded-xl border border-black/10 bg-white p-6 sm:p-10 shadow-xs dark:border-white/10 dark:bg-[#1e1e1e]">
              <div
                className="docx-content text-zinc-900 dark:text-gray-100 text-[14.5px] leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:border [&_table]:border-black/15 dark:[&_table]:border-white/15 [&_th]:border [&_th]:border-black/15 dark:[&_th]:border-white/15 [&_th]:bg-black/5 dark:[&_th]:bg-white/5 [&_th]:p-2 [&_td]:border [&_td]:border-black/15 dark:[&_td]:border-white/15 [&_td]:p-2"
                dangerouslySetInnerHTML={{ __html: docxHtml }}
              />
            </div>
          </div>
        )}

        {/* CSV & Excel Table Viewer */}
        {!loading && !error && currentTableData && (
          <div className="flex h-full flex-col">
            {/* Excel Sheet selector tabs */}
            {(ext === "xlsx" || ext === "xls") && excelData && excelData.sheetNames.length > 1 && (
              <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-black/10 bg-white px-3 py-1.5 dark:border-white/10 dark:bg-[#1e1e1e]">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-gray-400 mr-1 shrink-0">
                  {isEn ? "Sheets:" : "Trang tính:"}
                </span>
                {excelData.sheetNames.map((sheetName) => (
                  <button
                    key={sheetName}
                    type="button"
                    onClick={() => {
                      setActiveSheet(sheetName);
                      setPage(1);
                    }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                      activeSheet === sheetName
                        ? "bg-[#04714a] text-white"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                    }`}
                  >
                    {sheetName}
                  </button>
                ))}
              </div>
            )}

            {/* Table Search & Metrics Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 bg-white px-4 py-2 dark:border-white/10 dark:bg-[#1e1e1e]">
              <div className="relative min-w-[180px] max-w-xs flex-1">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  placeholder={isEn ? "Search in table..." : "Tìm kiếm trong bảng..."}
                  className="w-full rounded-lg border border-black/15 bg-zinc-50 py-1 pl-8 pr-3 text-xs outline-none focus:border-[#04714a] focus:bg-white dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-[#121212]"
                />
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-gray-400">
                <span>
                  {isEn ? "Showing " : "Hiển thị "}
                  <strong className="text-zinc-900 font-semibold dark:text-white">{filteredRows.length}</strong> /{" "}
                  {currentTableData.totalRows} {isEn ? "rows" : "dòng"}
                </span>
                {currentTableData.isTruncated && (
                  <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                    {isEn ? "Limited to 2,000 rows" : "Đã giới hạn 2,000 dòng"}
                  </span>
                )}
              </div>
            </div>

            {/* Table Body with horizontal & vertical scroll */}
            <div className="min-h-0 flex-1 overflow-auto bg-white dark:bg-[#121212]">
              {filteredRows.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center p-4 text-center text-xs text-zinc-400">
                  <p>{isEn ? "No rows matching search query" : "Không tìm thấy dòng nào khớp với từ khóa tìm kiếm"}</p>
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="sticky top-0 z-10 border-b border-black/10 bg-zinc-100 font-semibold text-zinc-800 shadow-2xs dark:border-white/10 dark:bg-[#1e1e1e] dark:text-gray-200">
                    <tr>
                      <th className="w-10 px-3 py-2 text-center text-zinc-400 select-none border-r border-black/5 dark:border-white/5">
                        #
                      </th>
                      {currentTableData.headers.map((header, idx) => (
                        <th
                          key={idx}
                          className="px-3.5 py-2 font-semibold select-none border-r border-black/5 dark:border-white/5 whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row, rowIdx) => {
                      const absoluteIdx = (page - 1) * pageSize + rowIdx + 1;
                      return (
                        <tr
                          key={rowIdx}
                          className="border-b border-black/5 transition-colors hover:bg-black/[0.02] dark:border-white/5 dark:hover:bg-white/5"
                        >
                          <td className="w-10 px-3 py-1.5 text-center font-mono text-[11px] text-zinc-400 select-none border-r border-black/5 bg-zinc-50/50 dark:border-white/5 dark:bg-white/5">
                            {absoluteIdx}
                          </td>
                          {currentTableData.headers.map((_, colIdx) => {
                            const val = row[colIdx];
                            return (
                              <td
                                key={colIdx}
                                className="px-3.5 py-1.5 text-zinc-800 dark:text-gray-300 border-r border-black/5 dark:border-white/5 whitespace-nowrap max-w-xs truncate"
                                title={val !== null && val !== undefined ? String(val) : ""}
                              >
                                {val !== null && val !== undefined ? String(val) : ""}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Table Pagination Bar */}
            {totalPages > 1 && (
              <div className="flex shrink-0 items-center justify-between border-t border-black/10 bg-white px-4 py-2 text-xs dark:border-white/10 dark:bg-[#1e1e1e] dark:text-gray-300">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-500 dark:text-gray-400">{isEn ? "Per page:" : "Mỗi trang:"}</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="rounded border border-black/15 bg-white px-1.5 py-0.5 text-xs outline-none dark:border-white/15 dark:bg-[#121212] dark:text-white"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 dark:text-gray-400">
                    {isEn ? "Page" : "Trang"} {page} / {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      aria-label={isEn ? "Previous page" : "Trang trước"}
                      className="rounded p-1 text-zinc-600 hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      aria-label={isEn ? "Next page" : "Trang sau"}
                      className="rounded p-1 text-zinc-600 hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
