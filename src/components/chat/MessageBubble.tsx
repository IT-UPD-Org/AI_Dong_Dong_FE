// src\components\chat\MessageBubble.tsx
import { forwardRef, useState, useEffect, useRef } from "react";
import { RotateCcw, ThumbsDown, ThumbsUp, Edit2, Copy, Check, Flag } from "lucide-react";
import type { ChatMessage, WayfindingCandidate } from "../../api/types";
import { SafeMarkdown } from "./SafeMarkdown";
import { FileCard } from "./FileCard";
import { PreviewFile } from "../../lib/filePreviewUtils";
import { copyToClipboard } from "../../lib/clipboard";
import { toast } from "sonner";
import type { ReplyStep } from "../../lib/groupMessages";
import { replyText } from "../../lib/groupMessages";
import { ToolCallList } from "./ToolCallList";
import { WayfindingStepsCard } from "./WayfindingStepsCard";
import { useLanguage } from "../../contexts/LanguageContext";

interface MessageBubbleProps {
  message: ChatMessage;
  reaction?: "like" | "dislike";
  onLike?: () => void;
  onDislike?: () => void;
  onRegenerate?: () => void;
  /** Opens the feedback panel on its "report an issue" tab. */
  onReport?: () => void;
  onEdit?: (newContent: string) => void;
  regenerateDisabled?: boolean;
  onPreviewFile?: (file: PreviewFile) => void;
  attachedFiles?: PreviewFile[];
  /** For an assistant reply: its steps (text, then the tools that step called), in order. */
  steps?: ReplyStep[];
  onSelectWayfindingCandidate?: (candidate: WayfindingCandidate) => void;
}

export const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(
  function MessageBubble(
    {
      message,
      reaction,
      onLike,
      onDislike,
      onRegenerate,
      onReport,
      onEdit,
      regenerateDisabled,
      onPreviewFile,
      attachedFiles = [],
      steps,
      onSelectWayfindingCandidate,
    },
    ref,
  ) {
    const { t } = useLanguage();
    const isUser = message.role === "user";
    const [expanded, setExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const [copiedMessage, setCopiedMessage] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      if (isEditing && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [isEditing]);

    const handleSaveEdit = () => {
      if (editContent.trim() && editContent !== message.content && onEdit) {
        onEdit(editContent.trim());
      }
      setIsEditing(false);
    };

    // An assistant reply may be several saved messages (one per tool round); show them as one.
    const replySteps: ReplyStep[] = steps ?? [{ id: message.id, content: message.content, toolCalls: message.toolCalls ?? [] }];
    const fullText = isUser ? message.content : replyText(replySteps);
    const isRunning = Boolean(message.status && !["completed", "idle", "error", "stopped"].includes(message.status));

    const handleCopyMessage = async () => {
      if (!fullText) return;
      const ok = await copyToClipboard(fullText);
      if (ok) {
        setCopiedMessage(true);
        setTimeout(() => setCopiedMessage(false), 2000);
      } else {
        toast.error(t("copyError"));
      }
    };

    if (isEditing) {
      return (
        <div
          ref={ref}
          className="ml-auto w-full min-w-0 max-w-full sm:max-w-[78%] rounded-2xl rounded-br-sm bg-muted p-3.5 transition-colors"
        >
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => {
              setEditContent(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 192)}px`;
            }}
            className="max-h-48 w-full resize-none overflow-y-auto bg-transparent text-base sm:text-[14.5px] leading-relaxed text-foreground outline-none"
            rows={1}
          />
          <div className="mt-2.5 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditContent(message.content);
              }}
              className="min-h-[38px] rounded-lg bg-surface border border-border px-3.5 py-1.5 text-xs font-semibold text-fg-secondary hover:bg-hover hover:text-foreground cursor-pointer"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={!editContent.trim()}
              className="min-h-[38px] rounded-lg bg-brand px-4 py-1.5 text-xs font-semibold text-brand-foreground hover:bg-brand-hover disabled:opacity-50 cursor-pointer"
            >
              {t("saveAndResend")}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={`group flex w-full min-w-0 ${isUser ? "justify-end" : "justify-start"}`}>
        <div
          ref={ref}
          onClick={isUser ? () => setExpanded((v) => !v) : undefined}
          className={`relative min-w-0 transition-colors ${
            isUser
              ? `max-w-[88%] sm:max-w-[78%] cursor-pointer select-none rounded-2xl rounded-br-sm bg-muted px-3.5 sm:px-4.5 py-2.5 sm:py-3.5 text-[14px] sm:text-[14.5px] leading-relaxed text-foreground`
              : `w-full max-w-full sm:max-w-[92%] py-1 text-[14.5px] sm:text-[15px] leading-[1.65] text-foreground`
          }`}
        >
          {isUser && onEdit && !regenerateDisabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="absolute -left-10 top-2 hidden size-9 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-hover hover:text-foreground focus-visible:opacity-100 sm:flex sm:group-hover:opacity-100 cursor-pointer"
              title={t("editMessage")}
              aria-label={t("editMessage")}
            >
              <Edit2 size={14} />
            </button>
          )}

          {/* Attached Files (User message or Assistant message) */}
          {attachedFiles.length > 0 && (
            <div className={`mb-2.5 flex w-full min-w-0 flex-col gap-2 ${isUser ? "max-w-full" : "max-w-full sm:max-w-md"}`}>
              {attachedFiles.map((file, idx) => (
                <FileCard
                  key={file.id || idx}
                  file={file}
                  onPreview={onPreviewFile}
                  compact={isUser}
                />
              ))}
            </div>
          )}

          {/* User messages: plain text with whitespace preserved */}
          {isUser ? (
            <>
              <div
                className={`whitespace-pre-wrap [overflow-wrap:anywhere] ${
                  !expanded ? "line-clamp-4" : ""
                }`}
              >
                {message.content}
              </div>
              {onEdit && !regenerateDisabled && expanded && (
                <div className="mt-2 flex justify-end sm:hidden">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                    className="inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-surface/80 px-2.5 py-1 text-[11px] font-medium text-fg-secondary hover:bg-hover hover:text-foreground cursor-pointer"
                  >
                    <Edit2 size={12} />
                    <span>{t("editMessage")}</span>
                  </button>
                </div>
              )}
            </>
          ) : /* AI replies: each step's text (SafeMarkdown), then the tools it called */
          replySteps.some((step) => step.content || step.toolCalls.length) ? (
            <div className="flex w-full min-w-0 flex-col gap-1.5">
              {replySteps.map((step, i) => (
                <div key={step.id} className="w-full min-w-0">
                  {step.content && (
                    <SafeMarkdown
                      content={step.content}
                      className="min-w-0 max-w-full [overflow-wrap:anywhere]"
                      onPreviewFile={onPreviewFile}
                    />
                  )}
                  <ToolCallList toolCalls={step.toolCalls} running={isRunning && i === replySteps.length - 1} />
                </div>
              ))}
              {message.wayfinding && (
                <WayfindingStepsCard
                  wayfinding={message.wayfinding}
                  onSelectCandidate={onSelectWayfindingCandidate}
                />
              )}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 py-1 text-muted-foreground">
              <span className="size-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.3s]" />
              <span className="size-1.5 rounded-full bg-brand animate-bounce [animation-delay:-0.15s]" />
              <span className="size-1.5 rounded-full bg-brand animate-bounce" />
            </span>
          )}

          {!isUser &&
            message.status &&
            message.status !== "completed" &&
            message.status !== "idle" &&
            message.status !== "error" && (
              <div className="mt-1 flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                {message.status === "thinking" && "Đang suy nghĩ..."}
                {message.status === "searching" && "Đang tìm kiếm..."}
                {message.status === "generating" && "Đang tổng hợp..."}
              </div>
            )}

          {!isUser &&
            (onLike || onDislike || onRegenerate || onReport || fullText) &&
            (!message.status ||
              message.status === "completed" ||
              message.status === "error") && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1 text-muted-foreground">
                {fullText && (
                  <button
                    type="button"
                    title={copiedMessage ? t("copySuccess") : "Sao chép câu trả lời"}
                    aria-label="Sao chép câu trả lời"
                    onClick={handleCopyMessage}
                    className={`flex size-9 sm:size-8 items-center justify-center rounded-lg transition-colors hover:bg-hover hover:text-foreground cursor-pointer ${
                      copiedMessage ? "bg-active text-brand-text" : ""
                    }`}
                  >
                    {copiedMessage ? <Check size={15} className="text-brand-text" /> : <Copy size={15} />}
                  </button>
                )}

                {onLike && (
                  <button
                    type="button"
                    title={t("like")}
                    aria-label={t("like")}
                    onClick={onLike}
                    className={`flex size-9 sm:size-8 items-center justify-center rounded-lg transition-colors hover:bg-hover hover:text-foreground cursor-pointer ${
                      reaction === "like" ? "bg-active text-brand-text" : ""
                    }`}
                  >
                    <ThumbsUp size={15} />
                  </button>
                )}

                {onDislike && (
                  <button
                    type="button"
                    title={t("dislike")}
                    aria-label={t("dislike")}
                    onClick={onDislike}
                    className={`flex size-9 sm:size-8 items-center justify-center rounded-lg transition-colors hover:bg-hover hover:text-foreground cursor-pointer ${
                      reaction === "dislike" ? "bg-active text-destructive" : ""
                    }`}
                  >
                    <ThumbsDown size={15} />
                  </button>
                )}

                {onRegenerate && (
                  <button
                    type="button"
                    title={t("regenerate")}
                    aria-label={t("regenerate")}
                    onClick={onRegenerate}
                    disabled={regenerateDisabled}
                    className="flex size-9 sm:size-8 items-center justify-center rounded-lg transition-colors hover:bg-hover hover:text-foreground disabled:opacity-30 cursor-pointer"
                  >
                    <RotateCcw size={15} />
                  </button>
                )}
                {onReport && (
                  <button
                    type="button"
                    title={t("report")}
                    aria-label={t("report")}
                    onClick={onReport}
                    className="flex size-9 sm:size-8 items-center justify-center rounded-lg transition-colors hover:bg-hover hover:text-foreground cursor-pointer"
                  >
                    <Flag size={15} />
                  </button>
                )}
              </div>
            )}
        </div>
      </div>
    );
  },
);
