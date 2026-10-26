import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, ArrowRight, Clock, Trash2 } from "lucide-react";
import { chatApi } from "../api/chat.api";
import type { Conversation } from "../api/types";
import { confirmAndDeleteChat } from "../lib/deleteChat";
import { formatSnowflakeDate } from "../lib/snowflake";

export function HistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

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

  async function handleDelete(id: string, title: string) {
    try {
      if (await confirmAndDeleteChat(id, title)) {
        setConversations((current) => current.filter((c) => c.id !== id));
      }
    } catch {
      window.alert("Không thể xoá cuộc trò chuyện. Vui lòng thử lại.");
    }
  }

  return (
    <main>
      <p className="font-mono text-xs uppercase tracking-[.18em] text-[#04714a]">
        Lịch sử trò chuyện
      </p>
      <h1 className="mt-3 mb-8 text-5xl font-bold tracking-[-.07em]">
        Conversations
      </h1>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 w-full animate-pulse rounded-2xl bg-black/5"
            />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-3xl border border-black/10 bg-white p-12 text-center">
          <MessageSquare className="mx-auto text-black/30" size={36} />
          <h2 className="mt-4 font-semibold text-gray-900">
            Chưa có cuộc trò chuyện nào
          </h2>
          <p className="mt-2 text-sm text-black/50">
            Hãy bắt đầu cuộc trò chuyện mới để khám phá trợ lý AI của bạn.
          </p>
          <Link
            to="/chat"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#11130f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#04714a] transition-colors"
          >
            Bắt đầu trò chuyện
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {conversations.map((c) => (
            <Link
              key={c.id}
              to={`/c/${c.id}`}
              className="group flex items-center justify-between rounded-2xl border border-black/10 bg-white p-5 transition-all hover:border-[#04714a]/30 hover:bg-[#e8f7ef]/20 hover:shadow-sm"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#04714a]/10 text-[#04714a] transition-colors group-hover:bg-[#04714a] group-hover:text-white">
                  <MessageSquare size={18} />
                </div>
                <div className="min-w-0">
                  <span className="truncate font-semibold text-gray-900 group-hover:text-[#04714a] block text-sm">
                    {c.title}
                  </span>
                  {c.disabled && (
                    <span className="text-xs text-red-600 mt-0.5 block">Đã bị khoá</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-black/40 group-hover:text-[#04714a] shrink-0">
                {formatSnowflakeDate(c.id) && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatSnowflakeDate(c.id)}
                  </span>
                )}
                <button
                  type="button"
                  aria-label={`Xoá cuộc trò chuyện ${c.title}`}
                  title="Xoá"
                  onClick={(event) => {
                    // Inside the link: keep the click from opening the chat.
                    event.preventDefault();
                    event.stopPropagation();
                    void handleDelete(c.id, c.title);
                  }}
                  className="rounded-lg p-1.5 text-black/35 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
