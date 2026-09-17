import { FormEvent, useState } from "react";

import { messages as initial } from "../mocks/data";
import { sendChatMessage } from "../services/chat.service";
import { ChatComposer } from "../components/chat/ChatComposer";
import { ScrollToLatestButton } from "../components/chat/ScrollToLatestButton";
import { ConversationScrollbar } from "../components/chat/ConversationScrollbar";
import { useConversationNav } from "../components/chat/useConversationNav";
import { MessageBubble } from "../components/chat/MessageBubble.tsx";

type Reaction = "like" | "dislike";

export function ChatPage() {
  const [msgs, setMsgs] = useState(initial);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // State lưu trạng thái Like / Dislike cho từng tin nhắn (key: message.id)
  const [reactions, setReactions] = useState<Record<string, Reaction>>({});

  const {
    scrollRef,
    bottomRef,
    registerMessageRef,
    showJumpToLatest,
    navItems,
    activeId,
    handleScroll,
    scrollToBottom,
    scrollToMessage,
    markNearBottom,
  } = useConversationNav(msgs, loading);

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

    markNearBottom();
    setLoading(true);

    try {
      // Giữ đúng 2s30ms (2030ms) và gọi service song song
      const [reply] = await Promise.all([
        sendChatMessage(text),
        new Promise((resolve) => setTimeout(resolve, 2030)),
      ]);
      setMsgs((m) => [...m, reply]);
    } finally {
      setLoading(false);
    }
  }

  // Hàm xử lý Like / Dislike
  function handleReaction(id: string, type: Reaction) {
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

    markNearBottom();
    setLoading(true);

    try {
      const [reply] = await Promise.all([
        sendChatMessage(prevUserMsg.content),
        new Promise((resolve) => setTimeout(resolve, 2030)),
      ]);
      setMsgs((m) => [...m, reply]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-black/10">
        <div className="min-w-0">
          <h1 className=" truncate text-xl font-semibold text-[#11130f]">
            IT UPD GenAI
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
          Trực tuyến
        </span>
      </header>

      <div className="relative min-h-0 flex-1">
        {/* FIX: ẩn thanh cuộn mặc định của trình duyệt — thay bằng
            ConversationScrollbar (thanh vạch kiểu ChatGPT) ở ngay dưới, nằm
            sát mép phải (right-0) của khung chat. */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="
            h-full overflow-y-auto py-8
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          {/* md:pr-8: chừa chỗ bên phải cho ConversationScrollbar, tránh đè lên chữ */}
          <div className="mx-auto w-full max-w-4xl px-2 md:pr-8">
            <div className="flex flex-col gap-5">
              {msgs.map((message, idx) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  ref={
                    message.role === "user"
                      ? registerMessageRef(message.id)
                      : undefined
                  }
                  reaction={reactions[message.id]}
                  onLike={
                    message.role !== "user"
                      ? () => handleReaction(message.id, "like")
                      : undefined
                  }
                  onDislike={
                    message.role !== "user"
                      ? () => handleReaction(message.id, "dislike")
                      : undefined
                  }
                  onRegenerate={
                    message.role !== "user"
                      ? () => handleRegenerate(idx)
                      : undefined
                  }
                  regenerateDisabled={loading}
                />
              ))}

              {/* Hiển thị "Đang suy nghĩ..." khi AI phản hồi */}
              {loading && (
                <div className="flex animate-pulse items-center gap-2 px-2 py-2 text-sm font-medium text-[#04714a]">
                  <span className="size-2 rounded-full bg-[#00a86b]" />
                  Đang suy nghĩ...
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>
        </div>

        <ConversationScrollbar
          items={navItems}
          activeId={activeId}
          onSelect={scrollToMessage}
        />

        <ScrollToLatestButton
          visible={showJumpToLatest}
          onClick={() => scrollToBottom()}
        />
      </div>

      <ChatComposer
        value={input}
        onChange={setInput}
        onSubmit={submit}
        loading={loading}
      />
    </div>
  );
}
