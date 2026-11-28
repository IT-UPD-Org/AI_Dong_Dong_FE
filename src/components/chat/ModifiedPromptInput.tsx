import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Paperclip, X, FileText, Loader2, Square } from "lucide-react";
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
  streaming?: boolean;
  onStop?: () => void;
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
  streaming = false,
  onStop,
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
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [value]);

  const currentConfig = AGENT_LEVEL_CONFIGS[level];

  const mentionFilteredDocs = allDocs.filter((d) =>
    d.filename.toLowerCase().includes(mentionQuery.toLowerCase()),
  );

  const { t } = useLanguage();
  const effectivePlaceholder = placeholder || t("inputPlaceholder");

  return (
    <div className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className="w-full"
      >
        <div className="relative mx-auto flex w-full max-w-3xl lg:max-w-4xl flex-col px-3 sm:px-4">
          {/* Upload Popup — scoped to composer container so it stays centered on desktop and inset on mobile */}
          {isUploadOpen && (
            <DocumentUploadPopup
              onClose={() => setIsUploadOpen(false)}
              onUploadFiles={uploadFiles}
            />
          )}

          {/* Mention Dropdown */}
          {showMentions && mentionFilteredDocs.length > 0 && (
            <div className="absolute bottom-full inset-x-3 sm:inset-x-auto sm:left-4 mb-2 max-h-56 sm:w-80 overflow-y-auto rounded-xl border border-border bg-elevated p-2 shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                {t("suggestDocs")}
              </p>
              {mentionFilteredDocs.map((doc) => (
                <button
                  key={doc.document_id}
                  type="button"
                  className="flex min-h-[44px] sm:min-h-[36px] w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-hover text-foreground transition-colors cursor-pointer"
                  onClick={() => insertMention(doc)}
                >
                  <Paperclip size={14} className="text-muted-foreground shrink-0" />
                  <span className="truncate flex-1">{doc.filename}</span>
                </button>
              ))}
            </div>
          )}

          {(uploading || processing) && (
            <p role="status" className="pb-1 text-center text-xs text-muted-foreground">
              {t("processingDocs")}
            </p>
          )}
          {documentFailed && (
            <p role="alert" className="pb-1 text-center text-xs text-destructive">
              {t("docFailed")}
            </p>
          )}
          {voiceError && (
            <p role="alert" className="pb-1 text-center text-xs text-destructive">
              {voiceError}
            </p>
          )}

          {/* Ô nhập chính — 2-row mobile-first composer card: full-width textarea + accessible bottom action bar */}
          <div className="flex flex-col rounded-[22px] sm:rounded-[26px] border border-border bg-field/95 backdrop-blur-xl px-2 py-1.5 sm:p-2 shadow-md transition-all focus-within:border-brand-bright/50 focus-within:bg-field focus-within:ring-2 focus-within:ring-brand/15">
            {/* Danh sách file đính kèm hiển thị gọn gàng bên trong card */}
            {attachedDocs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-1.5 pt-1 pb-1.5">
                {attachedDocs.map((doc) => (
                  <div
                    key={doc.document_id}
                    className="flex max-w-full items-center gap-1.5 rounded-lg border border-brand/20 bg-brand-soft pl-2.5 pr-1 py-1 text-xs text-brand-text shadow-2xs backdrop-blur-xs"
                  >
                    <FileText size={13} className="text-brand-text shrink-0" />
                    <span className="max-w-[calc(100vw-8.5rem)] sm:max-w-[200px] truncate font-medium text-[11px]">
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
                      className="flex size-7 sm:size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-hover hover:text-foreground transition-colors cursor-pointer"
                      aria-label={t("removeAttachment")}
                      title={t("removeAttachment")}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Full-width auto-growing textarea (16px on mobile avoids iOS Safari focus zoom) */}
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
              className="max-h-[132px] min-h-[40px] w-full min-w-0 resize-none overflow-y-auto bg-transparent px-2 sm:px-2.5 pt-1.5 pb-1 text-base sm:text-sm leading-6 text-foreground border-0 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground disabled:opacity-60"
            />

            {/* Hàng điều khiển: Left (+, Effort), Right (Mic, Send/Stop) with >= 44x44px mobile touch targets */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="flex min-w-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(!isUploadOpen)}
                  disabled={loading || uploading}
                  aria-label={t("uploadDoc")}
                  className="flex size-11 sm:size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-hover hover:text-foreground transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-40"
                  title={t("uploadDoc")}
                >
                  <PlusIcon />
                </button>

                {/* Nút Effort / Chế độ AI (Standard) */}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  disabled={loading}
                  aria-label={`${t("configEffort")} (${currentConfig.label})`}
                  title={`${t("configEffort")} (${currentConfig.label})`}
                  className="flex h-11 sm:h-9 min-w-0 shrink-0 items-center gap-1.5 rounded-full bg-brand-soft px-3 text-xs font-semibold text-brand-text transition-colors hover:opacity-85 cursor-pointer focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-50"
                >
                  <SlidersIcon />
                  <span className="truncate">{currentConfig.label}</span>
                </button>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {/* Nút Giọng nói */}
                <button
                  type="button"
                  onClick={toggle}
                  disabled={!supported || loading}
                  aria-label={
                    supported
                      ? listening
                        ? t("voiceStop")
                        : t("voiceInput")
                      : t("voiceUnsupported")
                  }
                  title={
                    supported
                      ? listening
                        ? t("voiceStop")
                        : t("voiceInput")
                      : t("voiceUnsupported")
                  }
                  className={`flex size-11 sm:size-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-30 cursor-pointer focus-visible:outline-2 focus-visible:outline-brand ${
                    listening
                      ? "bg-destructive text-destructive-foreground animate-pulse"
                      : "text-muted-foreground hover:bg-hover hover:text-foreground"
                  }`}
                >
                  <MicIcon />
                </button>

                {/* Nút Dừng (khi đang stream) hoặc Nút Gửi */}
                {streaming && onStop ? (
                  <button
                    type="button"
                    onClick={onStop}
                    aria-label={t("stopReply")}
                    title={t("stopReply")}
                    className="flex size-11 sm:h-9 sm:w-auto sm:px-3.5 shrink-0 items-center justify-center gap-1.5 rounded-full bg-foreground text-background transition-all shadow-xs hover:opacity-90 cursor-pointer focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    <Square size={14} className="fill-current shrink-0" aria-hidden />
                    <span className="hidden sm:inline text-xs font-semibold">{t("stopReply")}</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitDisabled}
                    aria-label={t("send")}
                    title={t("send")}
                    className="flex size-11 sm:size-9 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground transition-all shadow-xs disabled:opacity-35 disabled:cursor-not-allowed hover:bg-brand-hover cursor-pointer focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    {loading || uploading ? (
                      <Loader2 size={16} className="animate-spin" aria-hidden />
                    ) : (
                      <SendIcon />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <p className="mt-1.5 px-2 text-center text-[11px] leading-snug text-muted-foreground select-none tracking-tight">
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
