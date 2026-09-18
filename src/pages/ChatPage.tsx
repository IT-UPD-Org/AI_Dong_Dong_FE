import { FormEvent, useEffect, useState } from "react";

import { messages as initial } from "../mocks/data";
import { sendChatMessage } from "../services/chat.service";
import {
  AgentLevel,
  ModifiedPromptInput,
} from "../components/chat/ModifiedPromptInput";
import { ScrollToLatestButton } from "../components/chat/ScrollToLatestButton";
import { ConversationScrollbar } from "../components/chat/ConversationScrollbar";
import { useConversationNav } from "../components/chat/useConversationNav";
import { MessageBubble } from "../components/chat/MessageBubble.tsx";

type Reaction = "like" | "dislike";

function EmptyStatePrompt() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="flex justify-center px-2 pb-3">
      <div
        className={`
          rounded-full border border-black/10 bg-white px-5 py-2.5
          text-sm font-medium text-[#11130f] shadow-sm
          transition-all duration-500 ease-out
          ${shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}
        `}
      >
        Hãy hỏi bất cứ điều gì
      </div>
    </div>
  );
}

export function ChatPage() {
  const [msgs, setMsgs] = useState(initial);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState<AgentLevel>("L2");
  const [reactions, setReactions] = useState<Record<string, Reaction>>({});

  const isEmpty = msgs.length === 0;

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
      const [reply] = await Promise.all([
        sendChatMessage(text),
        new Promise((resolve) => setTimeout(resolve, 2030)),
      ]);
      setMsgs((m) => [...m, reply]);
    } finally {
      setLoading(false);
    }
  }

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

  async function handleRegenerate(index: number) {
    if (loading) return;
    const prevUserMsg = msgs
      .slice(0, index)
      .reverse()
      .find((m) => m.role === "user");

    if (!prevUserMsg) return;

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
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="
            h-full overflow-y-auto py-8
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
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

        {!isEmpty && (
          <>
            <ConversationScrollbar
              items={navItems}
              activeId={activeId}
              onSelect={scrollToMessage}
            />

            <ScrollToLatestButton
              visible={showJumpToLatest}
              onClick={() => scrollToBottom()}
            />
          </>
        )}
      </div>

      {isEmpty && <EmptyStatePrompt />}

      <ModifiedPromptInput
        value={input}
        onChange={setInput}
        onSubmit={submit}
        loading={loading}
        level={level}
        onLevelChange={setLevel}
      />
    </div>
  );
}
