import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, ArrowRight, Clock, Trash2 } from "lucide-react";
import { chatApi } from "../api/chat.api";
import type { Conversation } from "../api/types";
import { useDeleteChat } from "../lib/deleteChat";
import { formatSnowflakeDate } from "../lib/snowflake";
import { useLanguage } from "../contexts/LanguageContext";

function isGeneric(title?: string): boolean {
  if (!title) return true;
  const lower = title.trim().toLowerCase();
  return (
    lower === "new conversation" ||
    lower === "cuộc trò chuyện mới" ||
    lower === "cuộc trò chuyện" ||
    lower === "new chat"
  );
}

export function HistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  useEffect(() => {
    async function load() {
      try {
        const chats = await chatApi.getConversations(1);
        setConversations(chats);
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const { requestDelete: handleDelete, dialog: deleteDialog } = useDeleteChat((id) =>
    setConversations((current) => current.filter((c) => c.id !== id)),
  );

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8 text-[#11130f] dark:text-gray-100 transition-colors">
      <div className="max-w-4xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-[.18em] text-[#04714a] dark:text-[#4ade80] font-semibold">
          {language === "vi" ? "Lịch sử trò chuyện" : "Chat History"}
        </p>
        <h1 className="mt-2 mb-8 text-3xl sm:text-4xl font-bold tracking-tight">
          {t("navHistory")}
        </h1>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 w-full animate-pulse rounded-2xl bg-black/5 dark:bg-white/5"
              />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181a1e] p-12 text-center transition-colors">
            <MessageSquare className="mx-auto text-black/30 dark:text-white/30" size={36} />
            <h2 className="mt-4 font-semibold text-gray-900 dark:text-gray-100">
              {t("noRecentChats")}
            </h2>
            <p className="mt-2 text-sm text-black/50 dark:text-gray-400">
              {language === "vi"
                ? "Hãy bắt đầu cuộc trò chuyện mới để khám phá trợ lý AI của bạn."
                : "Start a new conversation to explore your AI assistant."}
            </p>
            <Link
              to="/chat"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#11130f] dark:bg-[#22252a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#04714a] dark:hover:bg-[#04714a] transition-colors"
            >
              {language === "vi" ? "Bắt đầu trò chuyện" : "Start chatting"}
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {conversations.map((c) => {
              const cachedPrompt = typeof window !== "undefined" ? localStorage.getItem(`chat_first_prompt_${c.id}`) : null;
              const displayTitle = cachedPrompt || (!isGeneric(c.title) ? c.title : t("newChat"));

              return (
                <Link
                  key={c.id}
                  to={`/c/${c.id}`}
                  className="group flex items-center justify-between rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181a1e] p-5 transition-all hover:border-[#04714a]/30 hover:bg-[#e8f7ef]/20 dark:hover:bg-white/5 hover:shadow-xs"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#04714a]/10 dark:bg-[#04714a]/20 text-[#04714a] dark:text-[#4ade80] transition-colors group-hover:bg-[#04714a] group-hover:text-white">
                      <MessageSquare size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="truncate font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#04714a] dark:group-hover:text-[#4ade80] block text-sm">
                        {displayTitle}
                      </span>
                      {c.disabled && (
                        <span className="text-xs text-red-600 dark:text-red-400 mt-0.5 block">
                          {language === "vi" ? "Đã bị khoá" : "Disabled"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-black/40 dark:text-gray-400 group-hover:text-[#04714a] dark:group-hover:text-[#4ade80] shrink-0">
                    {formatSnowflakeDate(c.id) && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatSnowflakeDate(c.id)}
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label={`${t("delete")} ${displayTitle}`}
                      title={t("delete")}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleDelete(c.id, displayTitle);
                      }}
                      className="rounded-lg p-2 text-black/40 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      {deleteDialog}
    </main>
  );
}
