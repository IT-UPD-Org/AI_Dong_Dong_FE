import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Paperclip, X, FileText } from "lucide-react";
import {
  AgentLevel,
  AGENT_LEVEL_CONFIGS,
  AgentEffortModal,
} from "./AgentEffortModal";
import { DocumentUploadPopup } from "./DocumentUploadPopup";
import { documentApi } from "../../api/document.api";
import type { Document } from "../../api/types";
import { useVoiceInput } from "../../hooks/useVoiceInput";

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
    const unsubscribe = documentApi.subscribe((doc) => {
      setAllDocs((current) => [
        doc,
        ...current.filter((item) => item.document_id !== doc.document_id),
      ]);
    });

    documentApi.listDocuments().then((docs) => {
      if (!mountedRef.current) return;
      setAllDocs((current) => [
        ...current,
        ...docs.filter((doc) => !current.some((item) => item.document_id === doc.document_id)),
      ]);
    }).catch((error: unknown) => {
      if (mountedRef.current) {
        onUploadError?.(error instanceof Error ? error.message : "Không thể tải danh sách tài liệu.");
      }
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, []);

  const selectedIds = [...new Set([...attachmentIds, ...mentionedDocumentIds])];
  const attachedDocs = selectedIds.flatMap((id) => {
    const doc = allDocs.find((item) => item.document_id === id);
    return doc ? [doc] : [];
  });
  const processing = attachedDocs.some((doc) => doc.status === "uploading" || doc.status === "processing");
  const documentFailed = attachedDocs.some((doc) => doc.status === "error");
  const submitDisabled = loading || uploading || processing || documentFailed ||
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
    const cleanedText =
      `${before.trimEnd()}${before && !before.endsWith(" ") ? " " : ""}${after.trimStart()}`.trim();
    onChange(cleanedText);

    // Chèn document vào danh sách đính kèm có nút X xóa
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
        e.preventDefault();
        return;
      }
      if (e.key === "Enter") {
        const filteredDocs = allDocs.filter((d) =>
          d.filename.toLowerCase().includes(mentionQuery.toLowerCase()),
        );
        if (filteredDocs.length > 0) {
          insertMention(filteredDocs[0]);
          e.preventDefault();
          return;
        }
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleTextChange(val: string) {
    onChange(val);

    // Check for @mention
    const cursor = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursor);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");

    if (lastAtIdx !== -1) {
      if (
        lastAtIdx === 0 ||
        textBeforeCursor[lastAtIdx - 1] === " " ||
        textBeforeCursor[lastAtIdx - 1] === "\n"
      ) {
        const query = textBeforeCursor.slice(lastAtIdx + 1);
        if (!query.includes(" ") && !query.includes("\n")) {
          setShowMentions(true);
          setMentionQuery(query);
          setMentionCursorIdx(lastAtIdx);
          return;
        }
      }
    }
    setShowMentions(false);
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

  return (
    <div className="relative shrink-0">
      {/* Upload Popup */}
      {isUploadOpen && (
        <DocumentUploadPopup
          onClose={() => setIsUploadOpen(false)}
          onUploadFiles={uploadFiles}
        />
      )}

      {/* Mention Dropdown */}
      {showMentions && mentionFilteredDocs.length > 0 && (
        <div className="absolute bottom-full left-4 mb-2 max-h-60 w-80 max-w-[calc(100%_-_2rem)] overflow-y-auto rounded-xl border border-black/10 bg-white p-2 shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <p className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
            Gợi ý tài liệu
          </p>
          {mentionFilteredDocs.map((doc) => (
            <button
              key={doc.document_id}
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => insertMention(doc)}
            >
              <Paperclip size={14} className="text-gray-400 shrink-0" />
              <span className="truncate flex-1">{doc.filename}</span>
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-black/10 bg-white px-3 py-2"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-2">
          {/* Attachments Display with X to remove */}
          {attachedDocs.length > 0 && (
            <div className="flex flex-wrap gap-2 px-1">
              {attachedDocs.map((doc) => (
                <div
                  key={doc.document_id}
                  className="flex items-center gap-2 rounded-xl border border-[#04714a]/20 bg-[#e8f7ef] px-3 py-1.5 text-xs text-[#013422] shadow-xs"
                >
                  <FileText size={14} className="text-[#04714a] shrink-0" />
                  <span className="max-w-[200px] truncate font-medium">
                    {doc.filename}
                  </span>
                  <button
                    type="button"
                    disabled={loading || uploading}
                    onClick={() => {
                      attachmentIdsRef.current = attachmentIds.filter((id) => id !== doc.document_id);
                      if (onAttachmentChange)
                        onAttachmentChange(
                          attachmentIds.filter((id) => id !== doc.document_id),
                        );
                      if (onMentionChange)
                        onMentionChange(
                          mentionedDocumentIds.filter(
                            (id) => id !== doc.document_id,
                          ),
                        );
                    }}
                    className="ml-1 rounded-full p-0.5 text-black/40 hover:bg-black/10 hover:text-black transition-colors cursor-pointer"
                    title="Xóa tài liệu đính kèm"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Ô nhập — chứa nút Effort, Mic, Textarea, Send */}
          {/* Đã xóa focus-within:ring-2 và focus-within:border-[#04714a]/30 ở div cha */}
          <div className="flex items-end gap-1.5 rounded-2xl border border-black/10 bg-white p-1.5 shadow-sm transition-all">
            <button
              type="button"
              onClick={() => setIsUploadOpen(!isUploadOpen)}
              disabled={loading || uploading}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-black/50 hover:bg-black/5 hover:text-black/80 transition-colors cursor-pointer focus:outline-none"
              title="Tải lên tài liệu"
            >
              <PlusIcon />
            </button>

            {/* Nút Effort lồng trong Input Bar */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              title={`Cấu hình Effort (${currentConfig.label})`}
              className="flex h-8 shrink-0 items-center gap-1 rounded-xl bg-black/5 px-2.5 text-xs font-semibold text-[#04714a] transition-colors hover:bg-black/10 cursor-pointer focus:outline-none"
            >
              <SlidersIcon />
              <span>{currentConfig.label}</span>
            </button>

            {/* Input Textarea — Đã thêm triệt để các class xóa ring / outline / border */}
            <textarea
              ref={textareaRef}
              aria-label="Nội dung câu hỏi"
              onPaste={(event) => {
                const files = Array.from(event.clipboardData.files);
                if (files.length > 0) {
                  event.preventDefault();
                  void uploadFiles(files);
                }
              }}
              rows={1}
              value={value}
              placeholder={placeholder}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{ outline: "none", boxShadow: "none" }}
              className="max-h-[120px] min-w-0 flex-1 resize-none bg-transparent py-1.5 text-sm text-[#11130f] border-0 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-black/35 px-1"
            />

            {/* Nút Giọng nói */}
            <button
              type="button"
              onClick={toggle}
              disabled={!supported || loading}
              title={
                supported
                  ? listening
                    ? "Dừng ghi âm"
                    : "Nói để nhập"
                  : "Trình duyệt không hỗ trợ giọng nói"
              }
              className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-30 cursor-pointer focus:outline-none ${
                listening
                  ? "bg-red-500 text-white animate-pulse"
                  : "text-black/40 hover:bg-black/5 hover:text-black/70"
              }`}
            >
              <MicIcon />
            </button>

            {/* Nút Gửi */}
            <button
              type="submit"
              disabled={submitDisabled}
              title="Gửi"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#04714a] text-white transition-opacity disabled:opacity-30 hover:bg-[#035e3f] cursor-pointer focus:outline-none"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </form>

      {(uploading || processing) && <p role="status" className="px-4 pb-2 text-xs text-black/50">Đang xử lý tài liệu, vui lòng đợi trước khi gửi.</p>}
      {documentFailed && <p role="alert" className="px-4 pb-2 text-xs text-red-600">Tài liệu xử lý không thành công. Hãy xóa tài liệu lỗi và thử tải lại.</p>}
      {voiceError && <p role="alert" className="px-4 pb-2 text-xs text-red-600">{voiceError}</p>}

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
