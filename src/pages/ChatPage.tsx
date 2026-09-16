import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowDown, Paperclip, Send } from "lucide-react";

import { messages as initial } from "../mocks/data";
import { sendChatMessage } from "../services/chat.service";

// Ngưỡng (px) tính từ đáy khung cuộn để coi là "đang ở gần cuối"
const NEAR_BOTTOM_THRESHOLD = 120;

export function ChatPage() {
  const [msgs, setMsgs] = useState(initial);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Có tin nhắn mới bị che khuất phía dưới hay không (khi user đã cuộn lên)
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

  // Tự động cuộn xuống khi có tin nhắn mới, NHƯNG chỉ khi user đang ở gần đáy.
  // Nếu user đã cuộn lên đọc lại tin cũ, không "giật" xuống dưới ép buộc.
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

    // Gửi tin của chính mình luôn kéo về đáy
    isNearBottomRef.current = true;

    setLoading(true);

    try {
      const reply = await sendChatMessage(text);

      setMsgs((m) => [...m, reply]);
    } finally {
      setLoading(false);
    }
  }

  return (
    // FIX: "New conversation" + "Recent" đã chuyển sang sidebar chính (AppLayout),
    // ChatPage giờ chỉ còn đúng 1 cột, chiếm trọn phần nội dung mà AppLayout cấp
    // (h-full thay vì tự tính "100vh - 3rem" như trước, vì giờ chiều cao do
    // AppLayout.main quyết định, tránh xung đột 2 nơi cùng set chiều cao).
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
          <p
            className="
              font-mono text-[10px]
              uppercase tracking-[0.18em]
              text-[#04714a]
            "
          >
            Conversation / 001
          </p>

          <h1 className="mt-1 truncate text-xl font-semibold text-[#11130f]">
            New conversation
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

      {/* =========================================
          MESSAGES AREA
      ========================================== */}
      {/* min-h-0 là bắt buộc trong flex column để flex-1 thực sự co lại được
          và overflow-y-auto phát huy tác dụng, thay vì bị nội dung đẩy giãn. */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto py-8"
        >
          <div className="mx-auto w-full max-w-4xl px-2">
            <div className="flex flex-col gap-5">
              {msgs.map((message) => (
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
                  {/* Message content */}
                  <div className="whitespace-pre-wrap">{message.content}</div>

                  {/* Sources */}
                  {message.sources && (
                    <div
                      className="
                        mt-4
                        border-t border-black/10
                        pt-3
                        text-xs text-black/45
                      "
                    >
                      <span className="font-medium text-black/55">Sources</span>

                      <span className="mx-1">·</span>

                      {message.sources.join(" · ")}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading */}
              {loading && (
                <div className="flex items-center gap-1 px-4 py-2">
                  <span className="size-2 animate-bounce rounded-full bg-[#00a86b]" />
                  <span className="size-2 animate-bounce rounded-full bg-[#00a86b] [animation-delay:100ms]" />
                  <span className="size-2 animate-bounce rounded-full bg-[#00a86b] [animation-delay:200ms]" />
                </div>
              )}

              {/* Điểm neo để cuộn tới */}
              <div ref={bottomRef} />
            </div>
          </div>
        </div>

        {/* =========================================
            NÚT "XUỐNG TIN MỚI NHẤT"
        ========================================== */}
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

      {/* =========================================
          COMPOSER
      ========================================== */}
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
          {/* Attachment */}
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

          {/* Input */}
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

          {/* Send */}
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
          Đông Đông can make mistakes. Check important information.
        </p>
      </div>
    </div>
  );
}
