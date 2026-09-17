import { forwardRef, useState } from "react";
import { RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";

import type { ChatMessage } from "./types";

interface MessageBubbleProps {
  message: ChatMessage;
  reaction?: "like" | "dislike";
  onLike?: () => void;
  onDislike?: () => void;
  onRegenerate?: () => void;
  regenerateDisabled?: boolean;
}

// forwardRef: để ChatPage lấy được offsetTop của TỪNG tin nhắn người dùng,
// dùng cho ConversationScrollbar (thanh điều hướng kiểu ChatGPT).
export const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(
  function MessageBubble(
    { message, reaction, onLike, onDislike, onRegenerate, regenerateDisabled },
    ref,
  ) {
    const isUser = message.role === "user";

    // Chỉ tin nhắn người dùng: mặc định thu gọn 3 dòng + "...", bấm để
    // mở rộng/thu gọn lại. Width KHÔNG đổi (max-w giữ nguyên), chỉ chiều cao thay đổi.
    const [expanded, setExpanded] = useState(false);

    return (
      <div
        ref={ref}
        onClick={isUser ? () => setExpanded((v) => !v) : undefined}
        className={
          isUser
            ? `
              ml-auto
              max-w-[78%]
              cursor-pointer
              select-none
              rounded-2xl
              rounded-br-sm
              bg-black/5
              px-5 py-4
              text-sm leading-7
              text-[#11130f]
            `
            : `
              max-w-[88%]
              py-1
              text-sm leading-7
              text-[#11130f]
            `
        }
      >
        {/* FIX: [overflow-wrap:anywhere] — chuỗi dài không có khoảng trắng
            (link, mã lỗi, spam...) sẽ tự xuống dòng thay vì đẩy tràn ngang
            cả khung chat (nguyên nhân gây thanh cuộn ngang ở dưới). */}
        <div
          className={`whitespace-pre-wrap [overflow-wrap:anywhere] ${
            isUser && !expanded ? "line-clamp-3" : ""
          }`}
        >
          {message.content}
        </div>

        {!isUser && (onLike || onDislike || onRegenerate) && (
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
    );
  },
);
