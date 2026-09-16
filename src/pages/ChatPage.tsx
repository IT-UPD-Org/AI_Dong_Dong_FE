import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  Paperclip,
  RotateCcw,
  Send,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import { messages as initial } from "../mocks/data";
import { sendChatMessage } from "../services/chat.service";

const NEAR_BOTTOM_THRESHOLD = 120;

export function ChatPage() {
  const [msgs, setMsgs] = useState(initial);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // State lưu trạng thái Like / Dislike cho từng tin nhắn (key: message.id, value: 'like' | 'dislike')
  const [reactions, setReactions] = useState<
    Record<string, "like" | "dislike">
  >({});

  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  function isNearBottom() {
    const el = scrollRef.current;
    if (!el) return true;
    return (
      el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD
    );
  }

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    setShowJumpToLatest(false);
  }

  function handleScroll() {
    const nearBottom = isNearBottom();
    isNearBottomRef.current = nearBottom;
    setShowJumpToLatest(!nearBottom);
  }

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom(msgs.length <= 1 ? "auto" : "smooth");
    } else {
      setShowJumpToLatest(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgs.length, loading]);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const text = input.trim();
    setInput("");

    setMsgs((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      },
    ]);

    isNearBottomRef.current = true;
    setLoading(true);

    try {
      const reply = await sendChatMessage(text);
      setMsgs((m) => [...m, reply]);
    } finally {
      setLoading(false);
    }
  }

  // Hàm xử lý Like / Dislike
  function handleReaction(id: string, type: "like" | "dislike") {
    setReactions((prev) => {
      if (prev[id] === type) {
        const next = { ...prev };
        delete next[id];
        return next;
      }

      return {
        ...prev,
        [id]: type,
      };
    });
  }

  // Hàm xử lý Tạo lại câu trả lời (Regenerate)
  async function handleRegenerate(index: number) {
    if (loading) return;

    // Tìm tin nhắn user gần nhất ngay trước tin nhắn AI này
    const prevUserMsg = msgs
      .slice(0, index)
      .reverse()
      .find((m) => m.role === "user");

    if (!prevUserMsg) return;

    // Xóa câu trả lời hiện tại và các tin nhắn phía sau
    setMsgs((m) => m.slice(0, index));

    isNearBottomRef.current = true;
    setLoading(true);

    try {
      const reply = await sendChatMessage(prevUserMsg.content);
      setMsgs((m) => [...m, reply]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      {/* Header */}
      <header
        className="
          flex shrink-0
          items-center justify-between
          border-b border-black/10
          pb-5
        "
      >
        <div className="min-w-0">
          <h1 className="mt-1 truncate text-xl font-semibold text-[#11130f]">
            Đông Đông
          </h1>
        </div>

        <span
          className="
            ml-4 flex shrink-0
            items-center gap-2
            text-xs text-black/45
          "
        >
          <span className="size-2 rounded-full bg-[#00a86b]" />
          Online
        </span>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto py-8"
        >
          <div className="mx-auto w-full max-w-4xl px-2">
            <div className="flex flex-col gap-5">
              {msgs.map((message, idx) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? `
                        ml-auto
                        max-w-[78%]
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
                  <div className="whitespace-pre-wrap">{message.content}</div>

                  {/* Thanh công cụ Like / Unlike / Restart cho câu trả lời của AI */}
                  {message.role !== "user" && (
                    <div className="mt-2 flex items-center gap-1 text-black/40">
                      <button
                        type="button"
                        title="Hữu ích"
                        onClick={() => handleReaction(message.id, "like")}
                        className={`rounded-md p-1.5 transition-colors hover:bg-black/5 hover:text-black ${
                          reactions[message.id] === "like"
                            ? "bg-black/5 text-[#00a86b]"
                            : ""
                        }`}
                      >
                        <ThumbsUp size={14} />
                      </button>

                      <button
                        type="button"
                        title="Chưa tốt"
                        onClick={() => handleReaction(message.id, "dislike")}
                        className={`rounded-md p-1.5 transition-colors hover:bg-black/5 hover:text-black ${
                          reactions[message.id] === "dislike"
                            ? "bg-black/5 text-red-500"
                            : ""
                        }`}
                      >
                        <ThumbsDown size={14} />
                      </button>

                      <button
                        type="button"
                        title="Tạo lại câu trả lời"
                        onClick={() => handleRegenerate(idx)}
                        disabled={loading}
                        className="rounded-md p-1.5 transition-colors hover:bg-black/5 hover:text-black disabled:opacity-30"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-1 px-4 py-2">
                  <span className="size-2 animate-bounce rounded-full bg-[#00a86b]" />
                  <span className="size-2 animate-bounce rounded-full bg-[#00a86b] [animation-delay:100ms]" />
                  <span className="size-2 animate-bounce rounded-full bg-[#00a86b] [animation-delay:200ms]" />
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>
        </div>

        {showJumpToLatest && (
          <button
            type="button"
            onClick={() => scrollToBottom()}
            className="
              absolute bottom-4 left-1/2
              flex -translate-x-1/2
              items-center gap-1.5
              rounded-full
              border border-black/10
              bg-white
              px-4 py-2
              text-xs font-medium
              text-[#11130f]
              shadow-md
              transition-all
              hover:bg-black/5
            "
          >
            <ArrowDown size={14} />
            Tin nhắn mới nhất
          </button>
        )}
      </div>

      {/* Input Form */}
      <div className="shrink-0">
        <form
          onSubmit={submit}
          className="
            mx-auto
            flex w-full
            max-w-4xl
            items-end gap-2
            rounded-full
            border border-black/15
            bg-white
            p-2
            shadow-sm
            transition-all
            focus-within:border-[#00a86b]/50
            focus-within:shadow-[0_0_0_3px_rgba(0,168,107,0.08)]
          "
        >
          <button
            type="button"
            aria-label="Attach a file"
            className="
              shrink-0
              rounded-full
              p-3
              text-black/40
              transition-colors
              hover:bg-black/5
              hover:text-[#04714a]
            "
          >
            <Paperclip size={18} />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing &&
                e.keyCode !== 229
              ) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="Ask Đông Đông anything..."
            className="
              max-h-32
              min-h-12
              min-w-0
              flex-1
              resize-none
              bg-transparent
              px-2 py-3
              text-sm
              leading-6
              outline-none
              placeholder:text-black/35
            "
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!input.trim() || loading}
            className="
              shrink-0
              rounded-full
              bg-[#00a86b]
              p-3
              text-black
              transition-all
              hover:bg-[#04714a]
              hover:text-white
              disabled:cursor-not-allowed
              disabled:opacity-30
            "
          >
            <Send size={18} />
          </button>
        </form>

        <p className="mt-3 text-center text-[11px] text-black/35">
          Đông Đông có thể mắc lỗi, vui lòng kiểm tra lại thông tin trước khi áp
          dụng vào thực tế.
        </p>
      </div>
    </div>
  );
}
