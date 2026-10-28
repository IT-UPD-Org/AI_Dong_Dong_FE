import { FormEvent, useEffect, useState, useRef, Fragment } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  streamChatMessage,
  getConversationState,
} from "../services/chat.service";
import {
  AgentLevel,
  ModifiedPromptInput,
} from "../components/chat/ModifiedPromptInput";
import { ScrollToLatestButton } from "../components/chat/ScrollToLatestButton";
import { ConversationScrollbar } from "../components/chat/ConversationScrollbar";
import { useConversationNav } from "../components/chat/useConversationNav";
import { MessageBubble } from "../components/chat/MessageBubble";
import { MessageFeedbackPanel } from "../components/chat/MessageFeedbackPanel";
import { FilePreviewPanel } from "../components/chat/FilePreviewPanel";
import { PreviewFile, getFileExtension } from "../lib/filePreviewUtils";
import { buildApiUrl } from "../api/client";
import { documentApi } from "../api/document.api";
import { chatApi } from "../api/chat.api";
import type { ChatMessage, ChatStreamChunk, Document } from "../api/types";

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
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const conversationId = routeId || undefined;
  const newChatKey = (location.state as { newChatKey?: string } | null)?.newChatKey;

  const conversationIdRef = useRef<string | undefined>(conversationId);
  const pendingCreatedIdRef = useRef<string | undefined>(undefined);
  const streamControllerRef = useRef<AbortController | null>(null);
  const sessionRef = useRef(0);

  const [composerKey, setComposerKey] = useState(0);
  const [error, setError] = useState("");
  // Set when the backend says a reply is already running. The user chooses
  // whether to follow it; it is never resumed automatically.
  const [runningElsewhere, setRunningElsewhere] = useState(false);
  // True while this page is reading a reply stream (send or resume); shows the Stop button.
  const [streaming, setStreaming] = useState(false);

  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [level, setLevel] = useState<AgentLevel>("L2");
  const [reactions, setReactions] = useState<Record<string, Reaction>>({});
  const [closedFeedbackId, setClosedFeedbackId] = useState<string | null>(null);

  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
  const [mentionedDocumentIds, setMentionedDocumentIds] = useState<string[]>([]);

  // File Preview Workspace state
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [docsMap, setDocsMap] = useState<Record<string, Document>>({});

  useEffect(() => {
    let mounted = true;
    documentApi
      .listDocuments(1, 100)
      .then((docs) => {
        if (!mounted) return;
        setDocsMap((prev) => {
          const next = { ...prev };
          for (const d of docs) next[d.document_id] = d;
          return next;
        });
      })
      .catch(() => {});

    const unsub = documentApi.subscribe(({ doc }) => {
      setDocsMap((prev) => ({ ...prev, [doc.document_id]: doc }));
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  useEffect(() => {
    const unknownIds = new Set<string>();
    for (const msg of msgs) {
      for (const fid of msg.files || []) {
        if (!docsMap[fid]) unknownIds.add(fid);
      }
    }
    if (unknownIds.size === 0) return;

    let cancelled = false;
    for (const fid of unknownIds) {
      documentApi
        .getDocument(fid)
        .then((doc) => {
          if (!cancelled) {
            setDocsMap((prev) => ({ ...prev, [doc.document_id]: doc }));
          }
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [msgs, docsMap]);

  function getAttachedFilesForMessage(message: ChatMessage): PreviewFile[] {
    const files: PreviewFile[] = [];
    const seen = new Set<string>();

    if (message.files && message.files.length > 0) {
      for (const fid of message.files) {
        if (seen.has(fid)) continue;
        seen.add(fid);
        const doc = docsMap[fid];
        if (doc) {
          files.push({
            id: doc.document_id,
            name: doc.filename || doc.title,
            url: doc.file_url || buildApiUrl(`/api/files/${doc.document_id}`),
            extension: getFileExtension(doc.filename),
            size: doc.size_bytes,
            source: "attachment",
          });
        } else {
          files.push({
            id: fid,
            name: `Tài liệu đính kèm`,
            url: buildApiUrl(`/api/files/${fid}`),
            extension: "pdf",
            source: "attachment",
          });
        }
      }
    }

    if (message.sources && message.sources.length > 0) {
      for (const src of message.sources) {
        const id = src.document_id || src.url || src.title;
        if (seen.has(id)) continue;
        seen.add(id);

        const url = src.url || (src.document_id ? buildApiUrl(`/api/files/${src.document_id}`) : "");
        if (url) {
          files.push({
            id: src.document_id,
            name: src.title || "Tài liệu nguồn",
            url,
            extension: getFileExtension(src.title || url) || "pdf",
            source: "source",
          });
        }
      }
    }

    return files;
  }

  useEffect(() => {
    // The first SSE event assigns an ID to the chat already visible on screen.
    // Do not reload incomplete server history over the live response.
    if (conversationId && pendingCreatedIdRef.current === conversationId) {
      pendingCreatedIdRef.current = undefined;
      return;
    }

    let cancelled = false;
    streamControllerRef.current?.abort();
    streamControllerRef.current = null;
    setStreaming(false);
    sessionRef.current += 1;
    conversationIdRef.current = conversationId;
    pendingCreatedIdRef.current = undefined;
    setMsgs([]);
    setInput("");
    setError("");
    setRunningElsewhere(false);
    setLoading(Boolean(conversationId));
    setAttachmentIds([]);
    setMentionedDocumentIds([]);
    setReactions({});
    setClosedFeedbackId(null);
    setComposerKey((key) => key + 1);

    if (conversationId) {
      getConversationState(conversationId)
        .then(({ messages, asyncStatus }) => {
          if (cancelled) return;
          setMsgs(messages);
          // A reply is queued or being written in the background (for example
          // after a reload, or opening the chat from the sidebar while other
          // chats are busy): follow it so the user sees it arrive.
          if (asyncStatus !== "none") void followRunningReply();
        })
        .catch(() => {
          if (!cancelled) setError("Không thể tải cuộc trò chuyện. Vui lòng thử lại.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [conversationId, newChatKey]);

  useEffect(() => {
    return () => {
      streamControllerRef.current?.abort();
      sessionRef.current += 1;
    };
  }, []);

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
      userMsgId?: string;
    },
    assistantMsgId: string,
  ) {
    const controller = new AbortController();
    streamControllerRef.current = controller;
    setStreaming(true);
    const session = ++sessionRef.current;
    const isCurrent = () => session === sessionRef.current && !controller.signal.aborted;

    markNearBottom();
    setError("");
    setLoading(true);

    try {
      await streamChatMessage(
        {
          message: payload.message,
          conversationId: payload.conversationId,
          // The backend has a single attachment list; mentioned documents are attachments too.
          attachmentIds: Array.from(
            new Set([
              ...(payload.attachmentIds ?? []),
              ...(payload.mentionedDocumentIds ?? []),
            ]),
          ),
          modelLevel: level,
        },
        (chunk: ChatStreamChunk) => {
          if (!isCurrent()) return;
          if (chunk.runInProgress) {
            // The message was not saved: drop the optimistic user message and
            // the empty reply placeholder, keep the text for a retry.
            setMsgs((prev) => prev.filter((msg) => msg.id !== assistantMsgId && msg.id !== payload.userMsgId));
            if (payload.message) setInput(payload.message);
            setRunningElsewhere(true);
            return;
          }
          if (chunk.violation) {
            // Rejected by moderation and not saved: drop the optimistic messages,
            // keep the text so the user can edit it, and show why.
            setMsgs((prev) => prev.filter((msg) => msg.id !== assistantMsgId && msg.id !== payload.userMsgId));
            if (payload.message) setInput(payload.message);
            setError(chunk.violation);
            return;
          }
          if (chunk.conversationId && !conversationIdRef.current) {
            conversationIdRef.current = chunk.conversationId;
            pendingCreatedIdRef.current = chunk.conversationId;
            navigate(`/c/${chunk.conversationId}`, { replace: true, state: location.state });
            window.dispatchEvent(new CustomEvent("chats:updated"));
          }

          setMsgs((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    content:
                      chunk.error !== undefined
                        ? msg.content || `⚠️ ${chunk.error}`
                        : chunk.delta !== undefined
                          ? msg.content + chunk.delta
                          : msg.content,
                    status: chunk.status || msg.status,
                    toolCalls: chunk.toolCalls ?? msg.toolCalls,
                  }
                : msg,
            ),
          );
        },
        (finalMsg) => {
          if (!isCurrent()) return;
          setMsgs((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? {
                    ...msg,
                    id: finalMsg.id || assistantMsgId,
                    content: finalMsg.content,
                    sources: finalMsg.sources,
                    toolCalls: finalMsg.toolCalls,
                    status: finalMsg.status,
                    hidden: finalMsg.hidden,
                  }
                : msg,
            ),
          );
          window.dispatchEvent(new CustomEvent("chats:updated"));
        },
        undefined,
        controller.signal,
      );
    } catch {
      if (!isCurrent()) return;
      const message = "Không thể nhận câu trả lời. Vui lòng thử lại.";
      setError(message);
      setMsgs((current) =>
        current.map((item) =>
          item.id === assistantMsgId
            ? { ...item, content: item.content || message, status: "error" }
            : item,
        ),
      );
    } finally {
      if (isCurrent()) {
        setLoading(false);
        streamControllerRef.current = null;
        setStreaming(false);
      }
    }
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (
      (!input.trim() && attachmentIds.length === 0 && mentionedDocumentIds.length === 0) ||
      loading ||
      streamControllerRef.current
    ) {
      return;
    }

    const text = input.trim();
    setInput("");

    const currentAttachments = [...attachmentIds];
    const currentMentions = [...mentionedDocumentIds];
    setAttachmentIds([]);
    setMentionedDocumentIds([]);

    const assistantMsgId = crypto.randomUUID();
    const userMsgId = crypto.randomUUID();

    setMsgs((m) => [
      ...m,
      {
        id: userMsgId,
        role: "user",
        content: text,
        files: Array.from(new Set([...currentAttachments, ...currentMentions])),
      },
      { id: assistantMsgId, role: "assistant", content: "", status: "idle" },
    ]);

    await processStream(
      {
        message: text,
        conversationId: conversationIdRef.current,
        attachmentIds: currentAttachments,
        mentionedDocumentIds: currentMentions,
        userMsgId,
      },
      assistantMsgId,
    );
  }

  /** Ask the backend to stop the running reply; the stream then ends with `stopped`. */
  async function stopReply() {
    const id = conversationIdRef.current;
    if (!id) {
      // A new chat whose ID has not arrived yet: just stop reading.
      streamControllerRef.current?.abort();
      return;
    }
    try {
      await chatApi.stopReply(id);
    } catch {
      // 409: it already finished. Nothing to stop.
    }
  }

  /** Follow the reply that is queued or running: on opening the chat, or when the user asks to. */
  async function followRunningReply() {
    const id = conversationIdRef.current;
    if (!id || streamControllerRef.current) return;
    setRunningElsewhere(false);
    const assistantMsgId = crypto.randomUUID();
    setMsgs((m) => [...m, { id: assistantMsgId, role: "assistant", content: "", status: "idle" }]);

    const controller = new AbortController();
    streamControllerRef.current = controller;
    setStreaming(true);
    const session = ++sessionRef.current;
    const isCurrent = () => session === sessionRef.current && !controller.signal.aborted;
    markNearBottom();
    setError("");
    setLoading(true);
    const update = (patch: (msg: ChatMessage) => ChatMessage) =>
      setMsgs((prev) => prev.map((msg) => (msg.id === assistantMsgId ? patch(msg) : msg)));
    try {
      await chatApi.resumeReply(
        id,
        (chunk) => {
          if (!isCurrent()) return;
          if (chunk.violation) {
            setMsgs((prev) => prev.filter((msg) => msg.id !== assistantMsgId));
            setError(chunk.violation);
            return;
          }
          update((msg) => ({
            ...msg,
            content: chunk.error !== undefined ? msg.content || `⚠️ ${chunk.error}` : msg.content + (chunk.delta ?? ""),
            status: chunk.status || msg.status,
            toolCalls: chunk.toolCalls ?? msg.toolCalls,
          }));
        },
        (finalMsg) => {
          if (!isCurrent()) return;
          update((msg) => ({
            ...msg,
            id: finalMsg.id || assistantMsgId,
            content: finalMsg.content,
            status: finalMsg.status,
            hidden: finalMsg.hidden,
          }));
          window.dispatchEvent(new CustomEvent("chats:updated"));
        },
        undefined,
        controller.signal,
      );
    } catch (err) {
      if (!isCurrent()) return;
      // 400/409: the reply finished before we connected. Drop the placeholder.
      setMsgs((prev) => prev.filter((msg) => msg.id !== assistantMsgId));
      setError((err as Error).message || "Không thể theo dõi câu trả lời.");
    } finally {
      if (isCurrent()) {
        setLoading(false);
        streamControllerRef.current = null;
        setStreaming(false);
      }
    }
  }

  async function handleEdit(index: number, newContent: string) {
    if (loading || streamControllerRef.current) return;
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
    if (loading || streamControllerRef.current) return;
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
    <div className="relative flex h-full min-w-0 flex-row overflow-hidden">
      {/* Chat Column */}
      <div
        className={`flex h-full min-w-0 flex-col overflow-hidden transition-all duration-200 ${
          previewFile
            ? isPreviewExpanded
              ? "hidden md:flex md:w-[35%] lg:w-[35%] shrink-0 border-r border-black/10"
              : "hidden md:flex md:w-[58%] lg:w-[60%] shrink-0 border-r border-black/10"
            : "w-full"
        }`}
      >
        <div className="relative min-h-0 flex-1">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-full overflow-y-auto py-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div
              className={`mx-auto w-full px-2 md:pr-8 transition-all ${
                previewFile ? "max-w-2xl" : "max-w-4xl"
              }`}
            >
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
                      onPreviewFile={(f) => setPreviewFile(f)}
                      attachedFiles={getAttachedFilesForMessage(message)}
                    />

                    {/* Hiển thị Feedback Panel ngay dưới câu trả lời mới nhất sau khi AI hoàn tất */}
                    {message.id === latestAssistantId &&
                      message.content &&
                      message.status !== "error" &&
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

        {error && (
          <p role="alert" className="shrink-0 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {runningElsewhere && (
          <div className="mx-auto flex w-full max-w-4xl shrink-0 items-center justify-between gap-3 px-4 py-2 text-sm">
            <span className="text-black/60">Một câu trả lời khác đang chạy. Tin nhắn của bạn chưa được gửi.</span>
            <button
              type="button"
              onClick={followRunningReply}
              className="rounded-full border border-black/15 px-3 py-1 font-medium text-[#04714a] hover:bg-[#e8f7ef] cursor-pointer"
            >
              Theo dõi câu trả lời
            </button>
          </div>
        )}

        {streaming && (
          <div className="mx-auto flex w-full max-w-4xl shrink-0 justify-center px-4 pb-1">
            <button
              type="button"
              onClick={stopReply}
              className="flex items-center gap-1.5 rounded-full border border-black/15 bg-white px-3 py-1 text-sm font-medium text-black/70 shadow-sm hover:bg-black/5 cursor-pointer"
            >
              <span className="size-2.5 rounded-sm bg-current" aria-hidden />
              Dừng trả lời
            </button>
          </div>
        )}

        <ModifiedPromptInput
          key={composerKey}
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
          onUploadError={setError}
        />
      </div>

      {/* File Preview Workspace Column */}
      {previewFile && (
        <div
          className={`fixed inset-0 z-50 bg-white md:static md:z-auto md:flex md:h-full md:min-w-0 transition-all duration-200 ${
            isPreviewExpanded ? "md:w-[65%] lg:w-[65%]" : "md:flex-1"
          }`}
        >
          <FilePreviewPanel
            file={previewFile}
            onClose={() => setPreviewFile(null)}
            isExpanded={isPreviewExpanded}
            onToggleExpand={() => setIsPreviewExpanded((v) => !v)}
          />
        </div>
      )}
    </div>
  );
}
