import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, ArrowRight, Clock, Trash2, Search, X } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredConversations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return conversations;

    return conversations.filter((c) => {
      const cachedPrompt = typeof window !== "undefined" ? localStorage.getItem(`chat_first_prompt_${c.id}`) : null;
      const displayTitle = cachedPrompt || (!isGeneric(c.title) ? c.title : t("newChat"));
      const titleMatches = displayTitle.toLowerCase().includes(term);
      const rawTitleMatches = (c.title || "").toLowerCase().includes(term);
      const dateStr = formatSnowflakeDate(c.id);
      const dateMatches = dateStr ? dateStr.toLowerCase().includes(term) : false;

      return titleMatches || rawTitleMatches || dateMatches;
    });
  }, [conversations, searchTerm, t]);

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8 text-foreground transition-colors">
      <div className="max-w-4xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-[.18em] text-brand-text font-semibold">
          {language === "vi" ? "Lịch sử trò chuyện" : "Chat History"}
        </p>
        <h1 className="mt-2 mb-6 text-3xl sm:text-4xl font-bold tracking-tight">
          {t("navHistory")}
        </h1>

        {/* Input tìm kiếm trong phần Lịch sử */}
        {!loading && conversations.length > 0 && (
          <div className="relative mb-6">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              size={18}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("searchHistoryPlaceholder")}
              className="w-full rounded-2xl border border-border bg-field pl-11 pr-11 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-brand-bright focus:ring-2 focus:ring-brand/20 shadow-xs transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label={t("close")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-hover transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 w-full animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-12 text-center transition-colors">
            <MessageSquare className="mx-auto text-muted-foreground" size={36} />
            <h2 className="mt-4 font-semibold text-foreground">
              {t("noRecentChats")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {language === "vi"
                ? "Hãy bắt đầu cuộc trò chuyện mới để khám phá trợ lý AI của bạn."
                : "Start a new conversation to explore your AI assistant."}
            </p>
            <Link
              to="/chat"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand-hover transition-colors"
            >
              {language === "vi" ? "Bắt đầu trò chuyện" : "Start chatting"}
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card p-10 text-center transition-colors">
            <Search className="mx-auto text-muted-foreground" size={32} />
            <h2 className="mt-4 font-semibold text-foreground">
              {t("noSearchResults")}
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {language === "vi"
                ? `Không có cuộc trò chuyện nào khớp với "${searchTerm}". Hãy thử từ khoá khác.`
                : `No conversations match "${searchTerm}". Try another keyword.`}
            </p>
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="mt-4 text-xs font-semibold text-brand-text hover:underline cursor-pointer"
            >
              {language === "vi" ? "Xoá bộ lọc tìm kiếm" : "Clear search"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredConversations.map((c) => {
              const cachedPrompt = typeof window !== "undefined" ? localStorage.getItem(`chat_first_prompt_${c.id}`) : null;
              const displayTitle = cachedPrompt || (!isGeneric(c.title) ? c.title : t("newChat"));

              return (
                <Link
                  key={c.id}
                  to={`/c/${c.id}`}
                  className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:border-brand/40 hover:bg-hover hover:shadow-xs"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand-text transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                      <MessageSquare size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="truncate font-semibold text-foreground group-hover:text-brand-text block text-sm">
                        {displayTitle}
                      </span>
                      {c.disabled && (
                        <span className="text-xs text-destructive mt-0.5 block">
                          {language === "vi" ? "Đã bị khoá" : "Disabled"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-brand-text shrink-0">
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
                      className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
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
