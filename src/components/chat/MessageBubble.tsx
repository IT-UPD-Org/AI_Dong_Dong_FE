// src\components\chat\MessageBubble.tsx
import { forwardRef, useState, useEffect, useRef } from "react";
import { RotateCcw, ThumbsDown, ThumbsUp, Edit2 } from "lucide-react";
import type { ChatMessage } from "../../api/types";
import { SafeMarkdown } from "./SafeMarkdown";

interface MessageBubbleProps {
  message: ChatMessage;
  reaction?: "like" | "dislike";
  onLike?: () => void;
  onDislike?: () => void;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
  regenerateDisabled?: boolean;
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
    },
    ref,
  ) {
    const isUser = message.role === "user";
    const [expanded, setExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
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

    if (isEditing) {
      return (
        <div
          ref={ref}
          className="ml-auto w-full max-w-[78%] rounded-2xl rounded-br-sm bg-black/5 p-3"
        >
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => {
              setEditContent(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            className="w-full resize-none bg-transparent text-sm leading-7 text-[#11130f] outline-none"
            rows={1}
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(message.content);
              }}
              className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-300"
            >
              Hủy
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={!editContent.trim()}
              className="rounded-lg bg-[#04714a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#035e3f] disabled:opacity-50"
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
              ? `max-w-[78%] cursor-pointer select-none rounded-2xl rounded-br-sm bg-black/5 px-5 py-4 text-sm leading-7 text-[#11130f]`
              : `max-w-[88%] py-1 text-sm leading-7 text-[#11130f]`
          }`}
        >
          {isUser && onEdit && !regenerateDisabled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="absolute -left-10 top-2 hidden rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 group-hover:flex"
              title="Chỉnh sửa tin nhắn"
            >
              <Edit2 size={14} />
            </button>
          )}

          {/* User messages: plain text with whitespace preserved */}
          {isUser ? (
            <div
              className={`whitespace-pre-wrap [overflow-wrap:anywhere] ${
                !expanded ? "line-clamp-3" : ""
              }`}
            >
              {message.content}
            </div>
          ) : /* AI messages: SafeMarkdown (no images, no dangerous HTML, safe links) */
          message.content ? (
            <SafeMarkdown
              content={message.content}
              className="min-w-0 [overflow-wrap:anywhere]"
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
            (onLike || onDislike || onRegenerate) &&
            (!message.status ||
              message.status === "completed" ||
              message.status === "error") && (
              <div className="mt-2 flex items-center gap-1 text-black/40">
                <button
                  type="button"
                  title="Hữu ích"
                  onClick={onLike}
                  className={`rounded-md p-1.5 transition-colors hover:bg-black/5 hover:text-black ${
                    reaction === "like" ? "bg-black/5 text-[#00a86b]" : ""
                  }`}
                >
                  <ThumbsUp size={14} />
                </button>

                <button
                  type="button"
                  title="Chưa tốt"
                  onClick={onDislike}
                  className={`rounded-md p-1.5 transition-colors hover:bg-black/5 hover:text-black ${
                    reaction === "dislike" ? "bg-black/5 text-red-500" : ""
                  }`}
                >
                  <ThumbsDown size={14} />
                </button>

                <button
                  type="button"
                  title="Tạo lại câu trả lời"
                  onClick={onRegenerate}
                  disabled={regenerateDisabled}
                  className="rounded-md p-1.5 transition-colors hover:bg-black/5 hover:text-black disabled:opacity-30"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            )}
        </div>
      </div>
    );
  },
);
