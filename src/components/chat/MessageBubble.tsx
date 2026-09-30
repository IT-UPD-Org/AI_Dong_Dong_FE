import { forwardRef, useState, type ReactNode } from "react";
import {
  FileText,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import type { ChatMessage } from "./types";

type Reaction = "like" | "dislike";

interface MessageBubbleProps {
  message: ChatMessage;
  reaction?: Reaction;
  onLike?: () => void;
  onDislike?: () => void;
  onRegenerate?: () => void;
  regenerateDisabled?: boolean;
}

interface ActionButtonProps {
  title: string;
  icon: ReactNode;
  onClick?: () => void;
  active?: boolean;
  activeClassName?: string;
  disabled?: boolean;
}

const USER_BUBBLE_CLASS = `
  ml-auto
  max-w-[78%]
  cursor-pointer
  select-none
  rounded-2xl
  rounded-br-sm
  bg-black/5
  px-5
  py-4
  text-sm
  leading-7
  text-[#11130f]
`;

const ASSISTANT_BUBBLE_CLASS = `
  max-w-[88%]
  py-1
  text-sm
  leading-7
  text-[#11130f]
`;

const ACTION_BUTTON_CLASS = `
  rounded-md
  p-1.5
  transition-colors
  hover:bg-black/5
  hover:text-black
  disabled:cursor-not-allowed
  disabled:opacity-30
`;

/* ----------------------------------
 * Attachment
 * ---------------------------------- */

function MessageAttachments({
  attachments,
}: {
  attachments: ChatMessage["attachments"];
}) {
  if (!attachments?.length) {
    return null;
  }

  return (
    <div className="mb-2.5 flex flex-wrap gap-1.5">
      {attachments.map((file, index) => (
        <div
          key={`${file.name}-${file.size}-${index}`}
          className="
            flex items-center gap-1.5
            rounded-xl
            border border-black/10
            bg-white/90
            px-3 py-1.5
            text-xs text-[#11130f]
            shadow-xs
          "
        >
          <FileText
            size={13}
            className="shrink-0 text-[#04714a]"
          />

          <span className="max-w-[170px] truncate font-medium">
            {file.name}
          </span>

          <span className="font-mono text-[10px] text-black/45">
            ({file.size})
          </span>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------
 * Loading
 * ---------------------------------- */

function MessageLoading() {
  return (
    <span
      className="inline-flex items-center gap-1.5 py-1 text-black/40"
      aria-label="Đang tạo câu trả lời"
    >
      <span className="size-1.5 animate-bounce rounded-full bg-[#04714a] [animation-delay:-0.3s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-[#04714a] [animation-delay:-0.15s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-[#04714a]" />
    </span>
  );
}

/* ----------------------------------
 * Action button
 * ---------------------------------- */

function ActionButton({
  title,
  icon,
  onClick,
  active = false,
  activeClassName = "",
  disabled = false,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${ACTION_BUTTON_CLASS}
        ${active ? activeClassName : ""}
      `}
    >
      {icon}
    </button>
  );
}

/* ----------------------------------
 * Assistant actions
 * ---------------------------------- */

function MessageActions({
  reaction,
  onLike,
  onDislike,
  onRegenerate,
  regenerateDisabled,
}: Pick<
  MessageBubbleProps,
  | "reaction"
  | "onLike"
  | "onDislike"
  | "onRegenerate"
  | "regenerateDisabled"
>) {
  if (!onLike && !onDislike && !onRegenerate) {
    return null;
  }

  return (
    <div className="mt-2 flex items-center gap-1 text-black/40">
      {onLike && (
        <ActionButton
          title="Hữu ích"
          icon={<ThumbsUp size={14} />}
          onClick={onLike}
          active={reaction === "like"}
          activeClassName="bg-black/5 text-[#00a86b]"
        />
      )}

      {onDislike && (
        <ActionButton
          title="Chưa tốt"
          icon={<ThumbsDown size={14} />}
          onClick={onDislike}
          active={reaction === "dislike"}
          activeClassName="bg-black/5 text-red-500"
        />
      )}

      {onRegenerate && (
        <ActionButton
          title="Tạo lại câu trả lời"
          icon={<RotateCcw size={14} />}
          onClick={onRegenerate}
          disabled={regenerateDisabled}
        />
      )}
    </div>
  );
}

/* ----------------------------------
 * Message Bubble
 * ---------------------------------- */

export const MessageBubble = forwardRef<
  HTMLDivElement,
  MessageBubbleProps
>(function MessageBubble(
  {
    message,
    reaction,
    onLike,
    onDislike,
    onRegenerate,
    regenerateDisabled = false,
  },
  ref,
) {
  const isUser = message.role === "user";
  const [expanded, setExpanded] = useState(false);

  const handleToggleExpanded = () => {
    if (!isUser) {
      return;
    }

    setExpanded((previous) => !previous);
  };

  const contentClassName = `
    whitespace-pre-wrap
    [overflow-wrap:anywhere]
    ${isUser && !expanded ? "line-clamp-3" : ""}
  `;

  return (
    <div
      ref={ref}
      onClick={handleToggleExpanded}
      className={
        isUser
          ? USER_BUBBLE_CLASS
          : ASSISTANT_BUBBLE_CLASS
      }
    >
      <MessageAttachments attachments={message.attachments} />

      <div className={contentClassName}>
        {message.content || <MessageLoading />}
      </div>

      {!isUser && (
        <MessageActions
          reaction={reaction}
          onLike={onLike}
          onDislike={onDislike}
          onRegenerate={onRegenerate}
          regenerateDisabled={regenerateDisabled}
        />
      )}
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";