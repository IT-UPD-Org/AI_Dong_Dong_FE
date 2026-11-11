import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Paperclip, X, FileText } from "lucide-react";
import {
  AgentLevel,
  AGENT_LEVEL_CONFIGS,
  AgentEffortModal,
} from "./AgentEffortModal";
import { DocumentUploadPopup } from "./DocumentUploadPopup";
import { applyDocumentUpdate, documentApi } from "../../api/document.api";
import type { Document } from "../../api/types";
import { useVoiceInput } from "../../hooks/useVoiceInput";
import { useLanguage } from "../../contexts/LanguageContext";

interface ModifiedPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e?: FormEvent) => void;
  loading?: boolean;
  level: AgentLevel;
  onLevelChange: (level: AgentLevel) => void;
  placeholder?: string;
  onVoiceResult?: (text: string) => void;
  mentionedDocumentIds?: string[];
  onMentionChange?: (ids: string[]) => void;
  attachmentIds?: string[];
  onAttachmentChange?: (ids: string[]) => void;
  onUploadError?: (error: string) => void;
}

export function ModifiedPromptInput({
  value,
  onChange,
  onSubmit,
  loading = false,
  level,
  onLevelChange,
  placeholder = "Hãy hỏi bất cứ điều gì...",
  onVoiceResult,
  mentionedDocumentIds = [],
  onMentionChange,
  attachmentIds = [],
  onAttachmentChange,
  onUploadError,
}: ModifiedPromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Mentions
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [allDocs, setAllDocs] = useState<Document[]>([]);
  const [mentionCursorIdx, setMentionCursorIdx] = useState(-1);

  const [uploading, setUploading] = useState(false);
  const mountedRef = useRef(false);
  const uploadingRef = useRef(false);
  const attachmentIdsRef = useRef(attachmentIds);

  useEffect(() => {
    attachmentIdsRef.current = attachmentIds;
  }, [attachmentIds]);

  useEffect(() => {
    mountedRef.current = true;
    const unsubscribe = documentApi.subscribe((update) => {
      setAllDocs((current) => applyDocumentUpdate(current, update));
    });

    documentApi
      .listDocuments()
      .then((docs) => {
        if (!mountedRef.current) return;
        setAllDocs((current) => [
          ...current,
          ...docs.filter((doc) => !current.some((item) => item.document_id === doc.document_id)),
        ]);
      })
      .catch((error: unknown) => {
        if (mountedRef.current) {
          onUploadError?.(error instanceof Error ? error.message : "Không thể tải danh sách tài liệu.");
        }
      });

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [onUploadError]);

  const selectedIds = [...new Set([...attachmentIds, ...mentionedDocumentIds])];
  const attachedDocs = selectedIds.flatMap((id) => {
    const doc = allDocs.find((item) => item.document_id === id);
    return doc ? [doc] : [];
  });
  const processing = attachedDocs.some((doc) => doc.status === "uploading" || doc.status === "processing" || doc.status === "converting");
  const documentFailed = attachedDocs.some((doc) => doc.status === "error");
  const submitDisabled =
    loading ||
    uploading ||
    processing ||
    documentFailed ||
    (!value.trim() && attachmentIds.length === 0 && mentionedDocumentIds.length === 0);

  function attachDocument(doc: Document) {
    setAllDocs((current) => [
      doc,
      ...current.filter((item) => item.document_id !== doc.document_id),
    ]);
    const ids = [...new Set([...attachmentIdsRef.current, doc.document_id])];
    attachmentIdsRef.current = ids;
    onAttachmentChange?.(ids);
  }

  async function uploadFiles(files: File[]) {
    if (loading || uploadingRef.current || files.length === 0) return;
    uploadingRef.current = true;
    setUploading(true);
    for (const file of files) {
      if (!mountedRef.current) break;
      try {
        const doc = await documentApi.uploadDocument(file);
        if (mountedRef.current) attachDocument(doc);
      } catch (error: unknown) {
        if (mountedRef.current) {
          onUploadError?.(error instanceof Error ? error.message : "Không thể tải tài liệu lên.");
        }
      }
    }
    uploadingRef.current = false;
    if (mountedRef.current) setUploading(false);
  }

  function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (!submitDisabled) onSubmit(event);
  }

  function appendVoiceText(text: string) {
    if (!text.trim()) return;
    onChange(value ? `${value} ${text}` : text);
  }

  const { listening, supported, toggle, error: voiceError } = useVoiceInput(
    onVoiceResult ?? appendVoiceText,
  );

  function insertMention(doc: Document) {
    if (mentionCursorIdx === -1) return;
    const before = value.slice(0, mentionCursorIdx);
    const after = value.slice(mentionCursorIdx + mentionQuery.length + 1);
    const cleanedText = `${before.trimEnd()}${before && !before.endsWith(" ") ? " " : ""}${after.trimStart()}`.trim();
    onChange(cleanedText);

    attachDocument(doc);
    if (onMentionChange && !mentionedDocumentIds.includes(doc.document_id)) {
      onMentionChange([...mentionedDocumentIds, doc.document_id]);
    }

    setShowMentions(false);
    setMentionQuery("");
    setMentionCursorIdx(-1);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (loading || uploading || processing || documentFailed) return;

    if (showMentions) {
      if (e.key === "Escape") {
        setShowMentions(false);
        return;
      }
      if (e.key === "Enter" && mentionFilteredDocs.length > 0) {
        e.preventDefault();
        insertMention(mentionFilteredDocs[0]);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleTextChange(val: string) {
    onChange(val);

    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);

    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const charBeforeAt =
        lastAtIndex === 0 ? " " : textBeforeCursor[lastAtIndex - 1];
      const isWordBoundary = /\s/.test(charBeforeAt);

      if (isWordBoundary) {
        const query = textBeforeCursor.slice(lastAtIndex + 1);
        if (!/\s/.test(query)) {
          setShowMentions(true);
          setMentionQuery(query);
          setMentionCursorIdx(lastAtIndex);
          return;
        }
      }
    }

    setShowMentions(false);
    setMentionQuery("");
    setMentionCursorIdx(-1);
  }

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  const currentConfig = AGENT_LEVEL_CONFIGS[level];

  const mentionFilteredDocs = allDocs.filter((d) =>
    d.filename.toLowerCase().includes(mentionQuery.toLowerCase()),
  );

  const { t } = useLanguage();
  const effectivePlaceholder = placeholder || t("inputPlaceholder");

  return (
    <div className="relative">
      {/* Upload Popup */}
      {isUploadOpen && (
        <DocumentUploadPopup
          onClose={() => setIsUploadOpen(false)}
          onUploadFiles={uploadFiles}
        />
      )}

      {/* Mention Dropdown */}
      {showMentions && mentionFilteredDocs.length > 0 && (
        <div className="absolute bottom-full left-4 mb-2 max-h-60 w-80 max-w-[calc(100%_-_2rem)] overflow-y-auto rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1f2227] p-2 shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <p className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            {t("suggestDocs")}
          </p>
          {mentionFilteredDocs.map((doc) => (
            <button
              key={doc.document_id}
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 transition-colors cursor-pointer"
              onClick={() => insertMention(doc)}
            >
              <Paperclip size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
              <span className="truncate flex-1">{doc.filename}</span>
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="w-full"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col px-3 sm:px-4">
          {(uploading || processing) && (
            <p role="status" className="pb-1 text-center text-xs text-black/50 dark:text-white/50">
              {t("processingDocs")}
            </p>
          )}
          {documentFailed && (
            <p role="alert" className="pb-1 text-center text-xs text-red-600 dark:text-red-400">
              {t("docFailed")}
            </p>
          )}
          {voiceError && (
            <p role="alert" className="pb-1 text-center text-xs text-red-600 dark:text-red-400">
              {voiceError}
            </p>
          )}

          {/* Ô nhập chính — Glassmorphism với bo góc lớn, shadow nhẹ và viền mảnh */}
          <div className="flex flex-col rounded-[24px] sm:rounded-[26px] border border-black/[0.12] dark:border-white/15 bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-xl p-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-all focus-within:border-[#04714a]/45 focus-within:bg-white/95 dark:focus-within:bg-[#242424]/95 focus-within:shadow-[0_6px_24px_rgba(0,168,107,0.12)]">
            {/* Danh sách file đính kèm hiển thị gọn gàng bên trong card */}
            {attachedDocs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-2 pt-1 pb-1.5">
                {attachedDocs.map((doc) => (
                  <div
                    key={doc.document_id}
                    className="flex items-center gap-1.5 rounded-lg border border-[#04714a]/20 dark:border-emerald-500/30 bg-[#e8f7ef]/80 dark:bg-emerald-950/60 px-2.5 py-1 text-xs text-[#013422] dark:text-emerald-200 shadow-2xs backdrop-blur-xs"
                  >
                    <FileText size={13} className="text-[#04714a] dark:text-emerald-400 shrink-0" />
                    <span className="max-w-[180px] truncate font-medium text-[11px]">
                      {doc.filename}
                    </span>
                    <button
                      type="button"
                      disabled={loading || uploading}
                      onClick={() => {
                        const updatedIds = attachmentIds.filter((id) => id !== doc.document_id);
                        attachmentIdsRef.current = updatedIds;
                        if (onAttachmentChange) onAttachmentChange(updatedIds);
                        if (onMentionChange) {
                          onMentionChange(
                            mentionedDocumentIds.filter((id) => id !== doc.document_id),
                          );
                        }
                      }}
                      className="ml-0.5 rounded-full p-0.5 text-black/40 dark:text-white/50 hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                      title={t("removeAttachment")}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Hàng điều khiển: Nút (+), Nút Standard, Textarea, Mic, Send */}
            <div className="flex items-end gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => setIsUploadOpen(!isUploadOpen)}
                disabled={loading || uploading}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-black/55 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10 hover:text-black/85 dark:hover:text-white transition-colors cursor-pointer focus:outline-none disabled:opacity-40"
                title={t("uploadDoc")}
              >
                <PlusIcon />
              </button>

              {/* Nút Effort / Chế độ AI (Standard) */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                title={`${t("configEffort")} (${currentConfig.label})`}
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] px-3 text-xs font-semibold text-[#04714a] dark:text-[#4ade80] transition-colors hover:bg-black/[0.08] dark:hover:bg-white/[0.12] cursor-pointer focus:outline-none"
              >
                <SlidersIcon />
                <span>{currentConfig.label}</span>
              </button>

              {/* Input Textarea tự động mở rộng theo nội dung */}
              <textarea
                ref={textareaRef}
                aria-label={t("inputPlaceholder")}
                rows={1}
                value={value}
                placeholder={effectivePlaceholder}
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={(event) => {
                  const files = Array.from(event.clipboardData.files);
                  if (files.length > 0) {
                    event.preventDefault();
                    void uploadFiles(files);
                  }
                }}
                disabled={loading}
                style={{ outline: "none", boxShadow: "none" }}
                className="max-h-[140px] min-w-0 flex-1 resize-none bg-transparent py-2 text-sm text-[#11130f] dark:text-gray-100 border-0 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-black/40 dark:placeholder:text-white/40 px-2"
              />

              {/* Nút Giọng nói */}
              <button
                type="button"
                onClick={toggle}
                disabled={!supported || loading}
                title={
                  supported
                    ? listening
                      ? t("voiceStop")
                      : t("voiceInput")
                    : t("voiceUnsupported")
                }
                className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-30 cursor-pointer focus:outline-none ${
                  listening
                    ? "bg-red-500 text-white animate-pulse"
                    : "text-black/45 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10 hover:text-black/75 dark:hover:text-white"
                }`}
              >
                <MicIcon />
              </button>

              {/* Nút Gửi với màu xanh thương hiệu Đông Đông */}
              <button
                type="submit"
                disabled={submitDisabled}
                title={t("send")}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#04714a] text-white transition-all shadow-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#035e3f] cursor-pointer focus:outline-none"
              >
                <SendIcon />
              </button>
            </div>
          </div>

          <p className="mt-1.5 text-center text-[11px] text-black/35 dark:text-white/40 select-none tracking-tight">
            {t("disclaimer")}
          </p>
        </div>
      </form>

      <AgentEffortModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        level={level}
        onLevelChange={onLevelChange}
      />
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
      <path d="M19 11a7 7 0 0 1-14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  );
}
export type { AgentLevel };
