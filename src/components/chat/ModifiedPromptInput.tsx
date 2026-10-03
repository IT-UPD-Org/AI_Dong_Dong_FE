import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Paperclip, X, Plus, SlidersHorizontal, Mic, Send } from "lucide-react";
import {
  AgentLevel,
  AGENT_LEVEL_CONFIGS,
  AgentEffortModal,
} from "./AgentEffortModal";
import { DocumentUploadPopup } from "./DocumentUploadPopup";
import { documentApi } from "../../api/document.api";
import { useVoiceInput } from "./useVoiceInput";
import type { Document } from "../../api/types";

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

  // Attachments UI
  const [attachedDocs, setAttachedDocs] = useState<Document[]>([]);

  useEffect(() => {
    documentApi.listDocuments().then(setAllDocs);
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        e.preventDefault();
        const files = Array.from(e.clipboardData.files);
        // Only accept if they are files. Not just text.
        for (const file of files) {
          documentApi
            .uploadDocument(file)
            .then((doc) => {
              setAttachedDocs((prev) => [...prev, doc]);
              if (onAttachmentChange)
                onAttachmentChange([...attachmentIds, doc.document_id]);
            })
            .catch((err) => {
              if (onUploadError) onUploadError(err.message);
            });
        }
      }
    };

    const textarea = textareaRef.current;
    if (textarea) textarea.addEventListener("paste", handlePaste);
    return () => {
      if (textarea) textarea.removeEventListener("paste", handlePaste);
    };
  }, [attachmentIds, onAttachmentChange, onUploadError]);

  // Subscribe to newly uploaded docs that might have been uploaded by drag & drop
  useEffect(() => {
    const unsub = documentApi.subscribe((doc) => {
      setAllDocs((prev) => {
        if (!prev.find((d) => d.document_id === doc.document_id))
          return [doc, ...prev];
        return prev;
      });
      // also update attachedDocs if they changed status
      setAttachedDocs((prev) =>
        prev.map((d) => (d.document_id === doc.document_id ? doc : d)),
      );
    });
    return () => unsub();
  }, []);

  function appendVoiceText(text: string) {
    if (!text.trim()) return;
    onChange(value ? `${value} ${text}` : text);
  }

  const { listening, supported, toggle } = useVoiceInput(
    onVoiceResult ?? appendVoiceText,
  );

  function insertMention(doc: Document) {
    if (mentionCursorIdx === -1) return;
    const before = value.slice(0, mentionCursorIdx);
    const after = value.slice(mentionCursorIdx + mentionQuery.length + 1);
    onChange(`${before}@${doc.filename} ${after}`);

    if (onMentionChange && !mentionedDocumentIds.includes(doc.document_id)) {
      onMentionChange([...mentionedDocumentIds, doc.document_id]);
    }

    setShowMentions(false);
    setMentionQuery("");
    setMentionCursorIdx(-1);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
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
          insertMention(filteredDocs[0]); // For simplicity, pick first
          e.preventDefault();
          return;
        }
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  function handleTextChange(val: string) {
    onChange(val);

    // Check for @mention
    const cursor = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursor);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");

    if (lastAtIdx !== -1) {
      // make sure @ is at start of string or preceded by space
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
    <div className="relative">
      {/* Upload Popup */}
      {isUploadOpen && (
        <DocumentUploadPopup
          onClose={() => setIsUploadOpen(false)}
          onUploadError={onUploadError || console.error}
        />
      )}

      {/* Mention Dropdown */}
      {showMentions && mentionFilteredDocs.length > 0 && (
        <div className="absolute bottom-full left-4 mb-2 max-h-60 w-80 overflow-y-auto rounded-xl border border-black/10 bg-white p-2 shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <p className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
            Gợi ý tài liệu
          </p>
          {mentionFilteredDocs.map((doc) => (
            <button
              key={doc.document_id}
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
              onClick={() => insertMention(doc)}
            >
              <Paperclip size={14} className="text-gray-400" />
              <span className="truncate">{doc.filename}</span>
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="shrink-0 border-t border-black/10 bg-white px-3 py-2"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-2">
          {/* Attachments Display */}
          {attachedDocs.length > 0 && (
            <div className="flex flex-wrap gap-2 px-1">
              {attachedDocs.map((doc) => (
                <div
                  key={doc.document_id}
                  className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-sm"
                >
                  <Paperclip size={14} className="text-gray-500" />
                  <span className="max-w-[150px] truncate">{doc.filename}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachedDocs((prev) =>
                        prev.filter((d) => d.document_id !== doc.document_id),
                      );
                      if (onAttachmentChange)
                        onAttachmentChange(
                          attachmentIds.filter((id) => id !== doc.document_id),
                        );
                    }}
                    className="ml-1 rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Ô nhập — chứa nút Effort, Mic, Textarea, Send */}
          <div className="flex items-end gap-1.5 rounded-2xl border border-black/10 bg-white p-1.5 shadow-sm focus-within:border-[#04714a]/30 focus-within:ring-2 focus-within:ring-[#04714a]/10 transition-all">
            <button
              type="button"
              onClick={() => setIsUploadOpen(!isUploadOpen)}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-black/50 hover:bg-black/5 hover:text-black/80 transition-colors"
              title="Tải lên tài liệu"
            >
              <Plus size={18} />
            </button>

            {/* Nút Effort lồng trong Input Bar */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              title={`Cấu hình Effort (${currentConfig.label})`}
              className="flex h-8 shrink-0 items-center gap-1 rounded-xl bg-black/5 px-2.5 text-xs font-semibold text-[#04714a] transition-colors hover:bg-black/10"
            >
              <SlidersHorizontal size={14} />
              <span>{currentConfig.label}</span>
            </button>

            {/* Input Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={value}
              placeholder={placeholder}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="max-h-[120px] flex-1 resize-none bg-transparent py-1.5 text-sm text-[#11130f] outline-none placeholder:text-black/35 px-1"
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
              className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-30 ${
                listening
                  ? "bg-red-500 text-white"
                  : "text-black/40 hover:bg-black/5 hover:text-black/70"
              }`}
            >
              <Mic size={16} />
            </button>

            {/* Nút Gửi */}
            <button
              type="submit"
              disabled={loading || (!value.trim() && attachedDocs.length === 0)}
              title="Gửi"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#04714a] text-white transition-opacity disabled:opacity-30 hover:bg-[#035e3f]"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </form>

      {/* Modal giữ nguyên */}
      <AgentEffortModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        level={level}
        onLevelChange={onLevelChange}
      />
    </div>
  );
}

export type { AgentLevel };
