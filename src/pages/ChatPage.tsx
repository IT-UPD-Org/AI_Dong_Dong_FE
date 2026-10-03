import { FormEvent, useEffect, useState, useRef, Fragment } from "react";
import { useSearchParams } from "react-router-dom";
import { streamChatMessage, getConversationMessages } from "../services/chat.service";
import {
  AgentLevel,
  ModifiedPromptInput,
} from "../components/chat/ModifiedPromptInput";
import { ScrollToLatestButton } from "../components/chat/ScrollToLatestButton";
import { ConversationScrollbar } from "../components/chat/ConversationScrollbar";
import { useConversationNav } from "../components/chat/useConversationNav";
import { MessageBubble } from "../components/chat/MessageBubble";
import { MessageFeedbackPanel } from "../components/chat/MessageFeedbackPanel";
import type { ChatMessage, ChatStreamChunk } from "../api/types";

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
        className={`rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-medium text-[#11130f] shadow-sm transition-all duration-500 ease-out ${
          shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        Hãy hỏi bất cứ điều gì
      </div>
    </div>
  );
}

export function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationId = searchParams.get("id") || undefined;
  const conversationIdRef = useRef<string | undefined>(conversationId);

  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState<AgentLevel>("L2");
  const [reactions, setReactions] = useState<Record<string, Reaction>>({});
  const [closedFeedbackId, setClosedFeedbackId] = useState<string | null>(null);

  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
  const [mentionedDocumentIds, setMentionedDocumentIds] = useState<string[]>([]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Load conversation messages when conversationId changes
  useEffect(() => {
    let isCancelled = false;
    async function loadConversation() {
      if (conversationId) {
        setLoading(true);
        try {
          const loadedMsgs = await getConversationMessages(conversationId);
          if (!isCancelled) {
            setMsgs(loadedMsgs);
          }
        } catch (err) {
          console.error("Failed to load conversation:", err);
        } finally {
          if (!isCancelled) {
            setLoading(false);
          }
        }
      } else {
        setMsgs([]);
      }
    }

    loadConversation();
    return () => {
      isCancelled = true;
    };
  }, [conversationId]);

  const isEmpty = msgs.length === 0;

  const latestAssistantId = [...msgs]
    .reverse()
    .find((message) => message.role === "assistant")?.id;

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

  async function processStream(
    payload: {
      message: string;
      conversationId?: string;
      attachmentIds?: string[];
      mentionedDocumentIds?: string[];
    },
    assistantMsgId: string,
  ) {
    markNearBottom();
    setLoading(true);
    try {
      await streamChatMessage(
        {
          ...payload,
          modelLevel: level,
        },
        (chunk: ChatStreamChunk) => {
          if (chunk.conversationId && !conversationIdRef.current) {
            conversationIdRef.current = chunk.conversationId;
            setSearchParams({ id: chunk.conversationId }, { replace: true });
            window.dispatchEvent(new CustomEvent("chats:updated"));
          }

          setMsgs((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content:
                      chunk.delta !== undefined
                        ? msg.content + chunk.delta
                        : msg.content,
                    status: chunk.status || msg.status,
                  }
                : msg,
            ),
          );
        },
        (finalMsg) => {
          setMsgs((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    id: finalMsg.id || assistantMsgId,
                    content: finalMsg.content,
                    sources: finalMsg.sources,
                    status: finalMsg.status,
                  }
                : msg,
            ),
          );
          window.dispatchEvent(new CustomEvent("chats:updated"));
        },
      );
    } finally {
      setLoading(false);
    }
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if ((!input.trim() && attachmentIds.length === 0) || loading) return;

    const text = input.trim();
    setInput("");

    const currentAttachments = [...attachmentIds];
    const currentMentions = [...mentionedDocumentIds];
    setAttachmentIds([]);
    setMentionedDocumentIds([]);

    const assistantMsgId = crypto.randomUUID();

    setMsgs((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "user", content: text },
      { id: assistantMsgId, role: "assistant", content: "", status: "idle" },
    ]);

    await processStream(
      {
        message: text,
        conversationId: conversationIdRef.current,
        attachmentIds: currentAttachments,
        mentionedDocumentIds: currentMentions,
      },
      assistantMsgId,
    );
  }

  async function handleEdit(index: number, newContent: string) {
    if (loading) return;
    const assistantMsgId = crypto.randomUUID();

    setMsgs((m) => [
      ...m.slice(0, index),
      { ...m[index], content: newContent },
      { id: assistantMsgId, role: "assistant", content: "", status: "idle" },
    ]);

    await processStream(
      {
        message: newContent,
        conversationId: conversationIdRef.current,
      },
      assistantMsgId,
    );
  }

  async function handleRegenerate(index: number) {
    if (loading) return;
    const prevUserMsg = msgs
      .slice(0, index)
      .reverse()
      .find((m) => m.role === "user");
    if (!prevUserMsg) return;

    const assistantMsgId = crypto.randomUUID();
    setMsgs((m) => [
      ...m.slice(0, index),
      { id: assistantMsgId, role: "assistant", content: "", status: "idle" },
    ]);

    await processStream(
      {
        message: prevUserMsg.content,
        conversationId: conversationIdRef.current,
      },
      assistantMsgId,
    );
  }

  function handleReaction(id: string, type: Reaction) {
    setReactions((prev) => {
      if (prev[id] === type) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: type };
    });
  }

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto py-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="mx-auto w-full max-w-4xl px-2 md:pr-8">
            <div className="flex flex-col gap-5">
              {msgs.map((message, idx) => (
                <Fragment key={message.id}>
                  <MessageBubble
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
                    onEdit={
                      message.role === "user"
                        ? (newContent) => handleEdit(idx, newContent)
                        : undefined
                    }
                    regenerateDisabled={loading}
                  />

                  {/* Hiển thị Feedback Panel ngay dưới câu trả lời mới nhất sau khi AI hoàn tất */}
                  {message.id === latestAssistantId &&
                    message.content &&
                    !loading &&
                    closedFeedbackId !== message.id && (
                      <MessageFeedbackPanel
                        onClose={() => setClosedFeedbackId(message.id)}
                      />
                    )}
                </Fragment>
              ))}
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
        attachmentIds={attachmentIds}
        onAttachmentChange={setAttachmentIds}
        mentionedDocumentIds={mentionedDocumentIds}
        onMentionChange={setMentionedDocumentIds}
        onUploadError={(err) => alert(err)}
      />
    </div>
  );
}
