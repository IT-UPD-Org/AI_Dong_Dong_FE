import { FormEvent, useEffect, useState, useRef, Fragment } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Loader2, Sparkles } from "lucide-react";
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
import { groupMessages } from "../lib/groupMessages";
import { MessageBubble } from "../components/chat/MessageBubble";
import { MessageFeedbackPanel, type FeedbackMode } from "../components/chat/MessageFeedbackPanel";
import { FilePreviewPanel } from "../components/chat/FilePreviewPanel";
import { PreviewFile, getFileExtension } from "../lib/filePreviewUtils";
import { buildApiUrl } from "../api/client";
import { documentApi } from "../api/document.api";
import { chatApi } from "../api/chat.api";
import type { ChatMessage, ChatStreamChunk, Document } from "../api/types";
import { useLanguage } from "../contexts/LanguageContext";

type Reaction = "like" | "dislike";

function EmptyStatePrompt() {
  const { t } = useLanguage();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div className="flex justify-center px-2 pb-2">
      <div
        className={`rounded-full border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#1f2227]/90 px-4 py-1.5 text-xs sm:text-sm font-semibold text-[#11130f] dark:text-gray-100 shadow-sm backdrop-blur-md transition-all duration-500 ease-out ${
          shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#04714a] animate-pulse" />
          {t("askAnythingTitle")}
        </span>
      </div>
    </div>
  );
}

export function ChatPage() {
  const { t } = useLanguage();
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
  // The reply whose feedback panel is open, and which tab: opened by like/dislike or report, never on its own.
  const [feedbackFor, setFeedbackFor] = useState<{ id: string; mode: FeedbackMode } | null>(null);

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
    setFeedbackFor(null);
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
          if (!cancelled) setError(t("loadError"));
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
            const promptText = payload.message;
            if (promptText) {
              const snippet = promptText.trim().replace(/\s+/g, " ").slice(0, 50);
              try {
                localStorage.setItem(`chat_first_prompt_${chunk.conversationId}`, snippet);
                chatApi.patchTitle(chunk.conversationId, snippet).catch(() => {});
              } catch {
                // ignore
              }
            }
            navigate(`/c/${chunk.conversationId}`, { replace: true, state: location.state });
            window.dispatchEvent(
              new CustomEvent("chats:updated", {
                detail: { conversationId: chunk.conversationId, prompt: payload.message },
              }),
            );
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
                    steps: chunk.steps ?? msg.steps,
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
            steps: finalMsg.steps,
                  }
                : msg,
            ),
          );
          window.dispatchEvent(
            new CustomEvent("chats:updated", {
              detail: { conversationId: conversationIdRef.current, prompt: payload.message },
            }),
          );
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
                    steps: chunk.steps ?? msg.steps,
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
            steps: finalMsg.steps,
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
    const removing = reactions[id] === type;
    setReactions((prev) => {
      if (prev[id] === type) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: type };
    });
    // Ask for details once the user has given a thumbs up or down; un-reacting closes it.
    setFeedbackFor(removing ? null : { id, mode: "suggestion" });
  }

  function handleReport(id: string) {
    setFeedbackFor({ id, mode: "issue" });
  }

  return (
    <div className="relative flex h-full min-w-0 flex-row overflow-hidden bg-white dark:bg-[#121212] text-[#11130f] dark:text-gray-100 transition-colors">
      {/* Chat Column */}
      <div
        className={`relative flex h-full min-w-0 flex-col overflow-hidden transition-all duration-200 ${
          previewFile
            ? isPreviewExpanded
              ? "hidden md:flex md:w-[35%] lg:w-[35%] shrink-0 border-r border-black/10 dark:border-white/10"
              : "hidden md:flex md:w-[58%] lg:w-[60%] shrink-0 border-r border-black/10 dark:border-white/10"
            : "w-full"
        }`}
      >
        {/* Scrollable message area — pb ensures content clears the fixed input */}
        <div className="relative min-h-0 flex-1">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-full overflow-y-auto pt-8 pb-40 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div
              className={`mx-auto w-full px-2 md:pr-8 transition-all ${
                previewFile ? "max-w-2xl" : "max-w-4xl"
              }`}
            >
              <div className="flex flex-col gap-5">
                {/* Hero Greeting when conversation is empty */}
                {isEmpty && !loading && (
                  <div className="flex min-h-[42vh] flex-col items-center justify-center px-4 py-8 text-center select-none animate-in fade-in duration-500">
                    <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#04714a]/10 dark:bg-[#04714a]/20 text-[#04714a] dark:text-[#4ade80] shadow-xs">
                      <Sparkles size={28} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#11130f] dark:text-gray-100">
                      {t("askAnythingTitle")}
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-black/55 dark:text-gray-400 max-w-md leading-relaxed">
                      {t("askAnythingSubtitle")}
                    </p>
                  </div>
                )}

                {groupMessages(msgs).map((item) => {
                  const { message } = item;
                  // Regenerating a reply replaces all of it, from its first message.
                  const idx = item.kind === "reply" ? item.firstIndex : item.index;
                  return (
                  <Fragment key={message.id}>
                    <MessageBubble
                      message={message}
                      steps={item.kind === "reply" ? item.steps : undefined}
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
                      onReport={
                        message.role !== "user"
                          ? () => handleReport(message.id)
                          : undefined
                      }
                      regenerateDisabled={loading}
                      onPreviewFile={(f) => setPreviewFile(f)}
                      attachedFiles={getAttachedFilesForMessage(message)}
                    />

                    {/* Feedback panel: opens under a reply after like/dislike or report */}
                    {feedbackFor?.id === message.id && (
                      <MessageFeedbackPanel
                        key={`-`}
                        initialMode={feedbackFor.mode}
                        onClose={() => setFeedbackFor(null)}
                      />
                    )}
                  </Fragment>
                  );
                })}
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

        {loading && msgs.length === 0 && conversationId && (
          <div className="flex justify-center py-12">
            <div className="flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#1e1e1e]/80 px-4 py-2 text-xs font-medium text-black/60 dark:text-gray-300 shadow-xs backdrop-blur-xs">
              <Loader2 className="size-3.5 animate-spin text-[#04714a] dark:text-[#4ade80]" />
              <span>{t("loadingConversation")}</span>
            </div>
          </div>
        )}

        {/* Fixed Glassmorphism Chat Input — always anchored to bottom */}
        <div
          className="absolute bottom-0 inset-x-0 z-20 pointer-events-none pb-2 sm:pb-3 md:pb-4 pt-10 bg-gradient-to-t from-white via-white/85 to-transparent dark:from-[#121212] dark:via-[#121212]/85 dark:to-transparent"
        >
          {/* Status banners above the input */}
          {error && (
            <p role="alert" className="pointer-events-auto px-4 pb-2 text-sm text-red-600 dark:text-red-400 text-center font-medium">
              {error}
            </p>
          )}

          {runningElsewhere && (
            <div className="pointer-events-auto mx-auto mb-2 flex w-full max-w-4xl items-center justify-between gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-white/85 dark:bg-[#1e1e1e]/90 px-4 py-2 text-sm shadow-sm backdrop-blur-md">
              <span className="text-black/70 dark:text-gray-300">{t("replyRunningElsewhere")}</span>
              <button
                type="button"
                onClick={followRunningReply}
                className="rounded-full border border-black/15 dark:border-white/15 bg-white dark:bg-[#242424] px-3 py-1 font-medium text-[#04714a] dark:text-[#4ade80] hover:bg-[#e8f7ef] dark:hover:bg-[#04714a]/20 cursor-pointer"
              >
                {t("followReply")}
              </button>
            </div>
          )}

          {streaming && (
            <div className="pointer-events-auto mx-auto mb-2 flex w-full max-w-4xl justify-center px-4">
              <button
                type="button"
                onClick={stopReply}
                className="flex items-center gap-1.5 rounded-full border border-black/15 dark:border-white/15 bg-white/90 dark:bg-[#242424]/90 px-3.5 py-1.5 text-xs font-semibold text-black/70 dark:text-gray-200 shadow-sm backdrop-blur-md hover:bg-white dark:hover:bg-[#2e2e2e] cursor-pointer"
              >
                <span className="size-2 rounded-xs bg-current" aria-hidden />
                {t("stopReply")}
              </button>
            </div>
          )}

          {/* Yêu cầu 1: Đưa phần "Hãy hỏi bất cứ điều gì" lên TRÊN input prompt, sau khi chat câu đầu tiên thì biến mất */}
          {isEmpty && !loading && (
            <div className="pointer-events-auto">
              <EmptyStatePrompt />
            </div>
          )}

          <div className="pointer-events-auto">
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
        </div>
      </div>

      {/* File Preview Workspace Column */}
      {previewFile && (
        <div
          className={`fixed inset-0 z-50 bg-white dark:bg-[#181818] md:static md:z-auto md:flex md:h-full md:min-w-0 transition-all duration-200 ${
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
