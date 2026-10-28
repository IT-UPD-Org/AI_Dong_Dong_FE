// src\components\chat\MessageBubble.tsx
import { forwardRef, useState, useEffect, useRef } from "react";
import { RotateCcw, ThumbsDown, ThumbsUp, Edit2, Copy, Check } from "lucide-react";
import type { ChatMessage } from "../../api/types";
import { SafeMarkdown } from "./SafeMarkdown";
import { FileCard } from "./FileCard";
import { PreviewFile } from "../../lib/filePreviewUtils";
import { copyToClipboard } from "../../lib/clipboard";
import { toast } from "sonner";

interface MessageBubbleProps {
  message: ChatMessage;
  reaction?: "like" | "dislike";
  onLike?: () => void;
  onDislike?: () => void;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
  regenerateDisabled?: boolean;
  onPreviewFile?: (file: PreviewFile) => void;
  attachedFiles?: PreviewFile[];
}

export const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(
  function MessageBubble(
    {
      message,
      reaction,
      onLike,
      onDislike,
      onRegenerate,
      onEdit,
      regenerateDisabled,
      onPreviewFile,
      attachedFiles = [],
    },
    ref,
  ) {
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

    const handleCopyMessage = async () => {
      if (!message.content) return;
      const ok = await copyToClipboard(message.content);
      if (ok) {
        setCopiedMessage(true);
        setTimeout(() => setCopiedMessage(false), 2000);
      } else {
        toast.error("Không thể sao chép vào bộ nhớ tạm");
      }
    };

    if (isEditing) {
      return (
        <div
          ref={ref}
          className="ml-auto w-full max-w-[85%] sm:max-w-[78%] rounded-2xl rounded-br-sm bg-black/5 p-3.5"
        >
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => {
              setEditContent(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            className="w-full resize-none bg-transparent text-[14px] sm:text-[14.5px] leading-relaxed text-[#11130f] outline-none"
            rows={1}
          />
          <div className="mt-2.5 flex justify-end gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(message.content);
              }}
              className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-300 cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={!editContent.trim()}
              className="rounded-lg bg-[#04714a] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#035e3f] disabled:opacity-50 cursor-pointer"
            >
              Lưu & Gửi lại
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={`group flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div
          ref={ref}
          onClick={isUser ? () => setExpanded((v) => !v) : undefined}
          className={`relative ${
            isUser
              ? `max-w-[85%] sm:max-w-[78%] cursor-pointer select-none rounded-2xl rounded-br-sm bg-black/5 px-4.5 py-3.5 text-[14px] sm:text-[14.5px] leading-relaxed text-[#11130f]`
              : `max-w-[95%] sm:max-w-[90%] py-1 text-[14.5px] sm:text-[15px] leading-[1.65] text-[#11130f]`
          }`}
        >
          {isUser && onEdit && !regenerateDisabled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="absolute -left-9 top-2.5 hidden rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 group-hover:flex cursor-pointer"
              title="Chỉnh sửa tin nhắn"
              aria-label="Chỉnh sửa tin nhắn"
            >
              <Edit2 size={13} />
            </button>
          )}

          {/* Attached Files (User message or Assistant message) */}
          {attachedFiles.length > 0 && (
            <div className={`mb-2.5 flex flex-col gap-2 ${isUser ? "max-w-full" : "max-w-md"}`}>
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
            <div
              className={`whitespace-pre-wrap [overflow-wrap:anywhere] ${
                !expanded ? "line-clamp-4" : ""
              }`}
            >
              {message.content}
            </div>
          ) : /* AI messages: SafeMarkdown (no images, no dangerous HTML, safe links, enhanced typography) */
          message.content ? (
            <SafeMarkdown
              content={message.content}
              className="min-w-0 [overflow-wrap:anywhere]"
              onPreviewFile={onPreviewFile}
            />
          ) : (
            <span className="inline-flex items-center gap-1.5 py-1 text-black/40">
              <span className="size-1.5 rounded-full bg-[#04714a] animate-bounce [animation-delay:-0.3s]" />
              <span className="size-1.5 rounded-full bg-[#04714a] animate-bounce [animation-delay:-0.15s]" />
              <span className="size-1.5 rounded-full bg-[#04714a] animate-bounce" />
            </span>
          )}

          {!isUser &&
            message.status &&
            message.status !== "completed" &&
            message.status !== "idle" &&
            message.status !== "error" && (
              <div className="mt-1 flex items-center gap-2 text-xs font-medium text-amber-600">
                {message.status === "thinking" && "Đang suy nghĩ..."}
                {message.status === "searching" && "Đang tìm kiếm..."}
                {message.status === "generating" && "Đang tổng hợp..."}
              </div>
            )}

          {!isUser &&
            (onLike || onDislike || onRegenerate || message.content) &&
            (!message.status ||
              message.status === "completed" ||
              message.status === "error") && (
              <div className="mt-2.5 flex items-center gap-1 text-black/40">
                {message.content && (
                  <button
                    type="button"
                    title={copiedMessage ? "Đã sao chép" : "Sao chép câu trả lời"}
                    aria-label="Sao chép câu trả lời"
                    onClick={handleCopyMessage}
                    className={`rounded-md p-1.5 transition-colors hover:bg-black/5 hover:text-black cursor-pointer ${
                      copiedMessage ? "bg-black/5 text-[#00a86b]" : ""
                    }`}
                  >
                    {copiedMessage ? <Check size={14} className="text-[#00a86b]" /> : <Copy size={14} />}
                  </button>
                )}

                {onLike && (
                  <button
                    type="button"
                    title="Hữu ích"
                    aria-label="Hữu ích"
                    onClick={onLike}
                    className={`rounded-md p-1.5 transition-colors hover:bg-black/5 hover:text-black cursor-pointer ${
                      reaction === "like" ? "bg-black/5 text-[#00a86b]" : ""
                    }`}
                  >
                    <ThumbsUp size={14} />
                  </button>
                )}

                {onDislike && (
                  <button
                    type="button"
                    title="Chưa tốt"
                    aria-label="Chưa tốt"
                    onClick={onDislike}
                    className={`rounded-md p-1.5 transition-colors hover:bg-black/5 hover:text-black cursor-pointer ${
                      reaction === "dislike" ? "bg-black/5 text-red-500" : ""
                    }`}
                  >
                    <ThumbsDown size={14} />
                  </button>
                )}

                {onRegenerate && (
                  <button
                    type="button"
                    title="Tạo lại câu trả lời"
                    aria-label="Tạo lại câu trả lời"
                    onClick={onRegenerate}
                    disabled={regenerateDisabled}
                    className="rounded-md p-1.5 transition-colors hover:bg-black/5 hover:text-black disabled:opacity-30 cursor-pointer"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
            )}
        </div>
      </div>
    );
  },
);
