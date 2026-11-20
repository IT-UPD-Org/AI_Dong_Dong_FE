import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  File,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import { libraryApi, type LibraryDocument } from "../../api/library.api";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useConfirm } from "../useConfirm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { formatBytes, inputClass, primaryButtonClass, secondaryButtonClass } from "../../pages/admin/shared";

export function getSafeDownloadUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
  } catch {
    // Malformed or non-absolute URL
  }
  return null;
}

export function getDocumentIcon(filename: string, contentType: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const ct = (contentType || "").toLowerCase();

  if (ext === "pdf" || ct.includes("pdf")) {
    return <FileText className="text-rose-500 shrink-0" size={20} />;
  }

  // Check spreadsheet/excel formats before generic word formats to avoid false match on 'officedocument'
  if (
    ext === "xls" ||
    ext === "xlsx" ||
    ext === "csv" ||
    ct.includes("sheet") ||
    ct.includes("excel") ||
    ct.includes("spreadsheetml")
  ) {
    return <FileSpreadsheet className="text-emerald-500 shrink-0" size={20} />;
  }

  if (
    ext === "doc" ||
    ext === "docx" ||
    ct.includes("word") ||
    ct.includes("wordprocessingml")
  ) {
    return <FileText className="text-blue-500 shrink-0" size={20} />;
  }

  return <File className="text-muted-foreground shrink-0" size={20} />;
}

function formatMimeBadge(contentType: string, filename: string): string {
  const ext = filename.split(".").pop()?.toUpperCase();
  if (ext && ext.length <= 4) return ext;
  if (contentType.includes("pdf")) return "PDF";
  if (contentType.includes("word") || contentType.includes("wordprocessingml")) return "DOC";
  if (contentType.includes("sheet") || contentType.includes("excel") || contentType.includes("spreadsheetml")) return "XLS";
  if (contentType.includes("text")) return "TXT";
  return "TÀI LIỆU";
}

interface LibraryManagerProps {
  hideHeader?: boolean;
}

export function LibraryManager({ hideHeader = false }: LibraryManagerProps) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isEn = lang === "en";

  // Teacher and Admin can upload, edit, and delete shared documents.
  const canManage = user?.role === "teacher" || user?.role === "admin";

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterQuery, setFilterQuery] = useState("");

  const { confirm, dialog: confirmDialog } = useConfirm();

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit modal state
  const [editingDoc, setEditingDoc] = useState<LibraryDocument | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Generation guard against stale out-of-order responses
  const fetchGenerationRef = useRef(0);

  const loadDocuments = useCallback(async () => {
    const generation = ++fetchGenerationRef.current;
    setLoading(true);
    try {
      const data = await libraryApi.getDocuments(page, pageSize);
      if (generation === fetchGenerationRef.current) {
        setDocuments(data);
        setError("");
      }
    } catch (err) {
      if (generation === fetchGenerationRef.current) {
        setError((err as Error).message || "Không thể tải danh sách tài liệu.");
        setDocuments([]);
      }
    } finally {
      if (generation === fetchGenerationRef.current) {
        setLoading(false);
      }
    }
  }, [page, pageSize]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Client-side quick filter on currently loaded page
  const filteredDocuments = useMemo(() => {
    if (!filterQuery.trim()) return documents;
    const q = filterQuery.trim().toLowerCase();
    return documents.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.filename.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q))
    );
  }, [documents, filterQuery]);

  const hasNext = documents.length >= pageSize;

  // Handle file selection in upload dialog
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadError("");
      if (!uploadTitle.trim()) {
        const defaultName = file.name.replace(/\.[^/.]+$/, "");
        setUploadTitle(defaultName.slice(0, 200));
      }
    }
  };

  const openUploadModal = () => {
    setUploadFile(null);
    setUploadTitle("");
    setUploadDesc("");
    setUploadError("");
    setUploading(false);
    setIsUploadOpen(true);
  };

  // Reset helper that immediately closes and clears upload form
  const resetUploadModal = () => {
    setIsUploadOpen(false);
    setUploadFile(null);
    setUploadTitle("");
    setUploadDesc("");
    setUploadError("");
    setUploading(false);
  };

  // Manual cancel guard (keeps busy guard for user clicks)
  const handleUserCancelUpload = () => {
    if (uploading) return;
    resetUploadModal();
  };

  const handleUploadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError(isEn ? "Please select a file." : "Vui lòng chọn tệp tài liệu.");
      return;
    }
    const trimmedTitle = uploadTitle.trim();
    if (!trimmedTitle) {
      setUploadError(isEn ? "Title is required." : "Vui lòng nhập tiêu đề tài liệu.");
      return;
    }

    setUploading(true);
    setUploadError("");
    try {
      await libraryApi.uploadDocument(uploadFile, trimmedTitle, uploadDesc.trim() || undefined);
      toast.success(isEn ? "Document uploaded and indexed successfully!" : "Đã tải lên và lập chỉ mục tài liệu thành công!");
      resetUploadModal();
      if (page === 1) {
        loadDocuments();
      } else {
        setPage(1);
      }
    } catch (err) {
      setUploadError((err as Error).message || (isEn ? "Upload failed." : "Không thể tải lên tài liệu."));
      setUploading(false);
    }
  };

  const openEditModal = (doc: LibraryDocument) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditDesc(doc.description || "");
    setEditError("");
    setSavingEdit(false);
  };

  // Reset helper that immediately closes and clears edit form
  const resetEditModal = () => {
    setEditingDoc(null);
    setEditTitle("");
    setEditDesc("");
    setEditError("");
    setSavingEdit(false);
  };

  // Manual cancel guard
  const handleUserCancelEdit = () => {
    if (savingEdit) return;
    resetEditModal();
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setEditError(isEn ? "Title is required." : "Tiêu đề không được để trống.");
      return;
    }

    setSavingEdit(true);
    setEditError("");
    try {
      await libraryApi.updateDocument(editingDoc.id, {
        title: trimmedTitle,
        description: editDesc.trim() || null,
      });
      toast.success(isEn ? "Document updated successfully!" : "Đã cập nhật thông tin tài liệu.");
      resetEditModal();
      loadDocuments();
    } catch (err) {
      setEditError((err as Error).message || (isEn ? "Update failed." : "Không thể cập nhật tài liệu."));
      setSavingEdit(false);
    }
  };

  const handleDelete = async (doc: LibraryDocument) => {
    const ok = await confirm({
      title: isEn ? "Delete shared document?" : "Xoá tài liệu khỏi kho?",
      description: isEn
        ? `"${doc.title}" will be permanently removed from the shared library and search index.`
        : `Tài liệu "${doc.title}" (${doc.filename}) sẽ bị xoá khỏi kho tri thức chung và gỡ khỏi chỉ mục tìm kiếm của trợ lý AI.`,
      confirmLabel: isEn ? "Delete" : "Xoá tài liệu",
      destructive: true,
    });
    if (!ok) return;

    try {
      await libraryApi.deleteDocument(doc.id);
      toast.success(isEn ? "Document deleted." : "Đã xoá tài liệu thành công.");
      loadDocuments();
    } catch (err) {
      toast.error((err as Error).message || (isEn ? "Failed to delete document." : "Không thể xoá tài liệu."));
    }
  };

  return (
    <div className="w-full">
      {/* Page / Section Header */}
      {!hideHeader && (
        <div className="mb-6">
          <p className="font-mono text-xs uppercase tracking-[.18em] text-brand-text">
            {isEn ? "Shared Knowledge Repository" : "Kho tri thức chung"}
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              {isEn ? "Shared Library" : "Kho tài liệu"}
            </h1>
            {canManage && (
              <button
                type="button"
                onClick={openUploadModal}
                className={primaryButtonClass}
              >
                <Plus size={16} />
                <span>{isEn ? "Upload Document" : "Tải lên tài liệu"}</span>
              </button>
            )}
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {isEn
              ? "Shared academic documents and institutional references. Dong Dong AI can search this library for relevant context when answering questions."
              : "Tài liệu học tập, quy định và giáo trình dùng chung. Đông Đông AI có thể tìm kiếm trong kho để lấy ngữ cảnh phù hợp khi trả lời."}
          </p>
        </div>
      )}

      {/* Control Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={isEn ? "Filter loaded page by title or file..." : "Lọc danh sách trang hiện tại theo tên..."}
              className={`${inputClass} pl-9 pr-8 text-xs sm:text-sm`}
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-muted-foreground">
          {hideHeader && canManage && (
            <button
              type="button"
              onClick={openUploadModal}
              className={primaryButtonClass}
            >
              <Plus size={15} />
              <span>{isEn ? "Upload" : "Tải lên"}</span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <span>{isEn ? "Per page:" : "Hiển thị:"}</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground outline-none cursor-pointer"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => loadDocuments()}
            disabled={loading}
            title={isEn ? "Refresh list" : "Làm mới danh sách"}
            className="flex items-center gap-1 rounded-lg border border-border bg-card p-1.5 text-foreground hover:bg-hover disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main Content State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="animate-spin text-brand-text mb-3" size={30} />
          <p className="text-sm text-muted-foreground">
            {isEn ? "Loading shared documents..." : "Đang tải danh sách tài liệu..."}
          </p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center">
          <p className="text-sm font-medium text-destructive mb-3">{error}</p>
          <button
            type="button"
            onClick={() => loadDocuments()}
            className={secondaryButtonClass}
          >
            <RefreshCw size={14} />
            <span>{isEn ? "Try again" : "Thử lại"}</span>
          </button>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-text mb-4">
            <UploadCloud size={28} />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {filterQuery
              ? isEn ? "No matching documents" : "Không tìm thấy tài liệu phù hợp trong trang"
              : isEn ? "Shared library is empty" : "Kho tài liệu chung hiện chưa có tài liệu nào"}
          </h3>
          <p className="mt-1 max-w-sm mx-auto text-xs text-muted-foreground">
            {filterQuery
              ? isEn
                ? "Try clearing the filter or changing page."
                : "Thử xoá bộ lọc hoặc chuyển sang trang khác."
              : canManage
              ? isEn
                ? "Upload the first document to enrich the university's AI knowledge base."
                : "Giảng viên và Quản trị viên có thể tải lên tài liệu để làm giàu kho tri thức cho toàn trường."
              : isEn
              ? "New documents will appear here once uploaded by teachers or administrators."
              : "Tài liệu học tập mới sẽ hiển thị tại đây khi được giảng viên hoặc ban quản trị cập nhật."}
          </p>
          {canManage && !filterQuery && (
            <button
              type="button"
              onClick={openUploadModal}
              className={`${primaryButtonClass} mt-4`}
            >
              <Plus size={15} />
              <span>{isEn ? "Upload First Document" : "Tải lên tài liệu đầu tiên"}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-surface/50">
                <TableHead className="py-3 px-4 text-xs font-semibold text-foreground">
                  {isEn ? "Title & Description" : "Tiêu đề & Nội dung"}
                </TableHead>
                <TableHead className="py-3 px-3 text-xs font-semibold text-foreground">
                  {isEn ? "File name" : "Tên tệp"}
                </TableHead>
                <TableHead className="py-3 px-3 text-xs font-semibold text-foreground">
                  {isEn ? "Size" : "Kích thước"}
                </TableHead>
                <TableHead className="py-3 px-3 text-xs font-semibold text-foreground">
                  {isEn ? "Format" : "Định dạng"}
                </TableHead>
                <TableHead className="py-3 px-4 text-right text-xs font-semibold text-foreground">
                  {isEn ? "Actions" : "Thao tác"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => {
                const safeUrl = getSafeDownloadUrl(doc.file_url);

                return (
                  <TableRow key={doc.id} className="border-b border-border-subtle hover:bg-hover transition-colors">
                    <TableCell className="py-3.5 px-4 max-w-md">
                      <div className="flex items-start gap-3">
                        {getDocumentIcon(doc.filename, doc.content_type)}
                        <div className="min-w-0">
                          <span className="font-semibold text-sm text-foreground block truncate" title={doc.title}>
                            {doc.title}
                          </span>
                          {doc.description ? (
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2" title={doc.description}>
                              {doc.description}
                            </p>
                          ) : (
                            <p className="mt-0.5 text-[11px] text-muted-foreground/60 italic">
                              {isEn ? "No description provided" : "Chưa có mô tả"}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-3 max-w-[200px]">
                      <span className="font-mono text-xs text-muted-foreground truncate block" title={doc.filename}>
                        {doc.filename}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5 px-3 text-xs text-foreground whitespace-nowrap">
                      {formatBytes(doc.size)}
                    </TableCell>
                    <TableCell className="py-3.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                        {formatMimeBadge(doc.content_type, doc.filename)}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {safeUrl ? (
                          <a
                            href={safeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            title={isEn ? "Download file" : "Tải tệp xuống"}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-hover hover:text-brand-text transition-colors"
                          >
                            <Download size={14} />
                            <span className="sr-only">{isEn ? "Download" : "Tải xuống"}</span>
                          </a>
                        ) : (
                          <span
                            title={isEn ? "No safe download link available" : "Tệp không có đường dẫn tải hợp lệ"}
                            className="flex h-8 w-8 items-center justify-center text-muted-foreground/40 cursor-not-allowed"
                          >
                            <Download size={14} />
                          </span>
                        )}

                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditModal(doc)}
                              title={isEn ? "Edit metadata" : "Chỉnh sửa thông tin"}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-hover hover:text-brand-text transition-colors cursor-pointer"
                            >
                              <Pencil size={14} />
                              <span className="sr-only">{isEn ? "Edit" : "Sửa"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(doc)}
                              title={isEn ? "Delete document" : "Xoá tài liệu"}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                              <span className="sr-only">{isEn ? "Delete" : "Xoá"}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <div>
          {isEn
            ? `Showing ${filteredDocuments.length} document${filteredDocuments.length === 1 ? "" : "s"}`
            : `Hiển thị ${filteredDocuments.length} tài liệu`}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="rounded-lg border border-border px-3 py-1.5 text-foreground hover:bg-hover disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            {isEn ? "Previous" : "Trước"}
          </button>
          <span className="px-1 text-foreground font-medium">
            {isEn ? `Page ${page}` : `Trang ${page}`}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext || loading}
            className="rounded-lg border border-border px-3 py-1.5 text-foreground hover:bg-hover disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            {isEn ? "Next" : "Sau"}
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      <Dialog open={isUploadOpen} onOpenChange={(open) => !uploading && (open ? setIsUploadOpen(true) : handleUserCancelUpload())}>
        <DialogContent className="sm:max-w-lg p-6 bg-elevated border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              {isEn ? "Upload to Shared Library" : "Tải lên tài liệu vào Kho chung"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isEn
                ? "The document will be automatically indexed into the RAG system for the whole institution."
                : "Tài liệu sẽ được hệ thống chuyển đổi và lập chỉ mục ngữ cảnh để phục vụ giải đáp thông minh."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
            {uploadError && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                {uploadError}
              </div>
            )}

            {/* File Input */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                {isEn ? "File document" : "Tệp tài liệu"} <span className="text-destructive">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                disabled={uploading}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md"
                className="hidden"
                id="library-file-input"
              />
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-colors cursor-pointer ${
                  uploadFile
                    ? "border-brand-bright/50 bg-brand-soft/20"
                    : "border-border hover:border-brand-bright/40 bg-surface/40"
                } ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <UploadCloud className="text-brand-text mb-2" size={24} />
                {uploadFile ? (
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground max-w-xs truncate">
                      {uploadFile.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatBytes(uploadFile.size)}
                    </p>
                    <span className="mt-2 inline-block text-[11px] text-brand-text hover:underline">
                      {isEn ? "Choose another file" : "Chọn tệp khác"}
                    </span>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {isEn ? "Click to select document" : "Bấm để chọn tệp tài liệu"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      PDF, Word, Excel, PowerPoint, Text, Markdown
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Title Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-foreground">
                  {isEn ? "Title" : "Tiêu đề tài liệu"} <span className="text-destructive">*</span>
                </label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {uploadTitle.length}/200
                </span>
              </div>
              <input
                type="text"
                value={uploadTitle}
                maxLength={200}
                disabled={uploading}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder={isEn ? "e.g. Academic Regulation 2026" : "Ví dụ: Quy chế đào tạo đại học năm 2026"}
                className={inputClass}
                required
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                {isEn ? "Description (optional)" : "Mô tả tài liệu (tuỳ chọn)"}
              </label>
              <textarea
                value={uploadDesc}
                disabled={uploading}
                onChange={(e) => setUploadDesc(e.target.value)}
                placeholder={isEn ? "Brief description or relevant subjects..." : "Tóm tắt nội dung chính hoặc đối tượng áp dụng..."}
                rows={3}
                className={inputClass}
              />
            </div>

            {/* Indexing Indicator during Upload */}
            {uploading && (
              <div className="rounded-xl border border-brand/20 bg-brand-soft/40 p-3 text-xs text-foreground animate-in fade-in-50">
                <div className="flex items-center gap-2 font-semibold text-brand-text">
                  <Loader2 className="animate-spin" size={15} />
                  <span>
                    {isEn ? "Uploading & indexing document..." : "Đang tải lên và trích xuất chỉ mục ngữ cảnh..."}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                  {isEn
                    ? "The server is converting content and syncing semantic vectors into the shared knowledge base. Please wait a moment."
                    : "Hệ thống đang chuyển đổi nội dung và tạo chỉ mục tìm kiếm thông minh. Quá trình này có thể mất vài giây tuỳ theo độ dài tài liệu."}
                </p>
              </div>
            )}

            <DialogFooter className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={uploading}
                onClick={handleUserCancelUpload}
                className={secondaryButtonClass}
              >
                {isEn ? "Cancel" : "Huỷ"}
              </button>
              <button
                type="submit"
                disabled={uploading || !uploadFile || !uploadTitle.trim()}
                className={primaryButtonClass}
              >
                {uploading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>{isEn ? "Processing..." : "Đang xử lý..."}</span>
                  </>
                ) : (
                  <span>{isEn ? "Upload" : "Tải lên"}</span>
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editingDoc !== null} onOpenChange={(open) => !savingEdit && (open ? null : handleUserCancelEdit())}>
        <DialogContent className="sm:max-w-md p-6 bg-elevated border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">
              {isEn ? "Edit Document Metadata" : "Chỉnh sửa thông tin tài liệu"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isEn ? "Update title and description in the shared library." : "Cập nhật tiêu đề và mô tả trong kho tài liệu chung."}
            </DialogDescription>
          </DialogHeader>

          {editingDoc && (
            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              {editError && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                  {editError}
                </div>
              )}

              <div>
                <span className="block text-[11px] text-muted-foreground mb-1">
                  {isEn ? "File name:" : "Tên tệp:"} <span className="font-mono text-foreground">{editingDoc.filename}</span>
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-foreground">
                    {isEn ? "Title" : "Tiêu đề"} <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {editTitle.length}/200
                  </span>
                </div>
                <input
                  type="text"
                  value={editTitle}
                  maxLength={200}
                  disabled={savingEdit}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {isEn ? "Description" : "Mô tả"}
                </label>
                <textarea
                  value={editDesc}
                  disabled={savingEdit}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className={inputClass}
                />
              </div>

              <DialogFooter className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={handleUserCancelEdit}
                  className={secondaryButtonClass}
                >
                  {isEn ? "Cancel" : "Huỷ"}
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || !editTitle.trim()}
                  className={primaryButtonClass}
                >
                  {savingEdit ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>{isEn ? "Saving..." : "Đang lưu..."}</span>
                    </>
                  ) : (
                    <span>{isEn ? "Save changes" : "Lưu thay đổi"}</span>
                  )}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      {confirmDialog}
    </div>
  );
}
