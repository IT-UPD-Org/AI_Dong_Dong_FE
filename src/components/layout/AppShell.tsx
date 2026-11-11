import { useEffect, useState, type SVGProps } from "react";
import { NavLink, Outlet, useMatch, useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { chatApi } from "../../api/chat.api";
import type { Conversation } from "../../api/types";
import { useDeleteChat } from "../../lib/deleteChat";
import { DocumentProcessingNotifications } from "./DocumentProcessingNotifications";
import { useLanguage } from "../../contexts/LanguageContext";
import { ThemeToggle, LanguageToggle } from "../theme/ThemeToggle";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

const BaseIcon = ({ size = 16, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  />
);

const MessageCircleIcon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </BaseIcon>
);

const HistoryIcon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
    <path d="M12 7v5l3 2" />
  </BaseIcon>
);

const BookOpenIcon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H20v15H4.5A2.5 2.5 0 0 0 2 20.5v-15Z" />
    <path d="M2 18.5A2.5 2.5 0 0 1 4.5 16H20" />
    <path d="M7 7h6" />
    <path d="M7 11h10" />
  </BaseIcon>
);

const FileTextIcon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M9 13h6" />
    <path d="M9 17h6" />
  </BaseIcon>
);

const UsersIcon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <path d="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" />
    <circle cx="10" cy="7" r="3" />
    <path d="M22 19v-1a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </BaseIcon>
);

const ShieldCheckIcon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </BaseIcon>
);

const Trash2Icon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </BaseIcon>
);

const SettingsIcon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.84l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.1.4l-.09.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.8a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0 .4-1.1V7.4a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 9.4 8.6a1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.1-.4l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 15 9.4a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.09a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.1.4 1.7 1.7 0 0 0-.4 1Z" />
  </BaseIcon>
);

const UserRoundIcon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20a8 8 0 0 1 16 0" />
  </BaseIcon>
);

const PlusIcon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </BaseIcon>
);

const LogOutIcon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </BaseIcon>
);

function isGenericTitle(title?: string): boolean {
  if (!title) return true;
  const lower = title.trim().toLowerCase();
  return (
    lower === "new conversation" ||
    lower === "cuộc trò chuyện mới" ||
    lower === "cuộc trò chuyện" ||
    lower === "new chat"
  );
}

export function AppShell() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  // The shell sits above the routes, so it reads the chat ID from the path itself.
  const currentChatId = useMatch("/c/:id")?.params.id ?? null;
  const { user, isAdmin, logout } = useAuth();
  const [recentChats, setRecentChats] = useState<Conversation[]>([]);
  const [promptSnippets, setPromptSnippets] = useState<Record<string, string>>({});

  const loadRecentChats = async () => {
    try {
      const chats = await chatApi.getConversations(1);
      setRecentChats(chats);

      // Yêu cầu 2: Với các chat chưa có nội dung tiêu đề câu hỏi đầu tiên, tự động tìm và cập nhật
      chats.forEach((chat) => {
        const cached = localStorage.getItem(`chat_first_prompt_${chat.id}`);
        if (cached) {
          setPromptSnippets((prev) => ({ ...prev, [chat.id]: cached }));
        } else if (isGenericTitle(chat.title)) {
          chatApi
            .getConversation(chat.id)
            .then((detail) => {
              const userMsg = detail.messages?.find((m: any) => {
                if (m.type === "user" && m.content) return true;
                if (m.role === "user" && m.content) return true;
                return false;
              });
              if (userMsg && userMsg.content) {
                const cleaned = userMsg.content.trim().replace(/\s+/g, " ");
                const snippet = cleaned.length > 40 ? cleaned.slice(0, 40) + "..." : cleaned;
                try {
                  localStorage.setItem(`chat_first_prompt_${chat.id}`, snippet);
                } catch {
                  // ignore
                }
                setPromptSnippets((prev) => ({ ...prev, [chat.id]: snippet }));
                chatApi.patchTitle(chat.id, snippet).catch(() => {});
              }
            })
            .catch(() => {});
        }
      });
    } catch {
      setRecentChats([]);
    }
  };

  useEffect(() => {
    loadRecentChats();

    const handleChatsUpdated = (e: Event) => {
      const custom = e as CustomEvent<{ conversationId?: string; prompt?: string }>;
      if (custom.detail?.conversationId && custom.detail?.prompt) {
        const cleaned = custom.detail.prompt.trim().replace(/\s+/g, " ");
        const snippet = cleaned.length > 40 ? cleaned.slice(0, 40) + "..." : cleaned;
        try {
          localStorage.setItem(`chat_first_prompt_${custom.detail.conversationId}`, snippet);
        } catch {
          // ignore
        }
        setPromptSnippets((prev) => ({ ...prev, [custom.detail!.conversationId!]: snippet }));
      }
      loadRecentChats();
    };

    window.addEventListener("chats:updated", handleChatsUpdated);
    return () => window.removeEventListener("chats:updated", handleChatsUpdated);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleNewChat = () => {
    navigate("/chat", { state: { newChatKey: crypto.randomUUID() } });
  };

  const { requestDelete: handleDeleteChat, dialog: deleteChatDialog } = useDeleteChat((id) => {
    // Leaving a chat that no longer exists.
    if (currentChatId === id) navigate("/chat", { state: { newChatKey: crypto.randomUUID() } });
  });

  const links = [
    ["/chat", t("navChat"), MessageCircleIcon],
    ["/history", t("navHistory"), HistoryIcon],
    ["/knowledge", t("navKnowledge"), BookOpenIcon],
    ["/documents", t("navDocuments"), FileTextIcon],
    ["/contributors", t("navContributors"), UsersIcon],
  ] as const;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-white dark:bg-[#111215] text-[#11130f] dark:text-gray-100 transition-colors md:flex-row">
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-black/10 dark:border-white/10 bg-white dark:bg-[#16181b] p-5 md:flex transition-colors">
        <NavLink to="/" className="mb-6 shrink-0 text-lg font-extrabold text-[#11130f] dark:text-gray-100">
          IT UPD GenAI<span className="text-[#00a86b]">.</span>
        </NavLink>
        <button
          type="button"
          onClick={handleNewChat}
          className="
            mb-5 flex w-full shrink-0 items-center gap-2
            rounded-full
            bg-[#11130f] dark:bg-[#22252a]
            px-3 py-2.5
            text-left text-sm font-medium text-white
            transition-all
            hover:bg-[#04714a] dark:hover:bg-[#04714a]
            shadow-xs
            cursor-pointer
          "
        >
          <PlusIcon size={16} strokeWidth={2} />
          <span className="truncate">{t("newChat")}</span>
        </button>

        <nav className="flex shrink-0 flex-col gap-1">
          {links.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/chat"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isActive && (to !== "/chat" || !currentChatId)
                    ? "bg-[#e8f7ef] dark:bg-[#04714a]/25 font-semibold text-[#013422] dark:text-[#4ade80]"
                    : "text-black/60 dark:text-gray-400 hover:bg-[#e8f7ef] dark:hover:bg-white/5 hover:text-[#04714a] dark:hover:text-[#4ade80]"
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-[#e8f7ef] dark:bg-[#04714a]/25 font-semibold text-[#013422] dark:text-[#4ade80]"
                    : "text-black/60 dark:text-gray-400 hover:bg-[#e8f7ef] dark:hover:bg-white/5 hover:text-[#04714a] dark:hover:text-[#4ade80]"
                }`
              }
            >
              <ShieldCheckIcon size={17} />
              {t("navAdmin")}
            </NavLink>
          )}
        </nav>

        {/* Section: GẦN ĐÂY (Recent) */}
        <div className="mt-5 flex min-h-0 flex-1 flex-col">
          <p
            className="
              mb-2 shrink-0 px-2
              font-mono text-[9px]
              uppercase tracking-[0.18em]
              text-black/40 dark:text-gray-500 font-semibold
            "
          >
            {t("recent")}
          </p>

          <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto [scrollbar-width:thin]">
            {recentChats.length === 0 ? (
              <p className="px-2 py-3 text-xs text-black/40 dark:text-gray-500 italic">
                {t("noRecentChats")}
              </p>
            ) : (
              recentChats.map((conversation) => {
                const isCurrent = currentChatId === conversation.id;
                // Yêu cầu 2: Hiển thị nội dung của câu prompt đầu tiên trong cuộc trò chuyện đó
                const cachedSnippet =
                  promptSnippets[conversation.id] ||
                  (typeof window !== "undefined"
                    ? localStorage.getItem(`chat_first_prompt_${conversation.id}`)
                    : null);
                const displayTitle = cachedSnippet || (!isGenericTitle(conversation.title) ? conversation.title : t("newChat"));

                return (
                  <div key={conversation.id} className="group relative">
                    <NavLink
                      to={`/c/${conversation.id}`}
                      title={displayTitle}
                      className={`
                        block w-full min-w-0
                        truncate
                        rounded-lg
                        py-2 pl-2.5 pr-8
                        text-left text-xs
                        transition-colors
                        ${
                          isCurrent
                            ? "bg-[#e8f7ef] dark:bg-[#04714a]/25 font-semibold text-[#013422] dark:text-[#4ade80]"
                            : "text-black/65 dark:text-gray-300 hover:bg-[#e8f7ef] dark:hover:bg-white/5 hover:text-[#04714a] dark:hover:text-[#4ade80]"
                        }
                      `}
                    >
                      {displayTitle}
                    </NavLink>
                    <button
                      type="button"
                      aria-label={`${t("delete")} ${displayTitle}`}
                      title={t("delete")}
                      onClick={() => handleDeleteChat(conversation.id, displayTitle)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1 text-black/40 dark:text-gray-500 opacity-0 transition-opacity hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 focus:opacity-100 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2Icon size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* User Card, Controls & Logout */}
        <div className="mt-3 flex shrink-0 flex-col gap-2 border-t border-black/10 dark:border-white/10 pt-3">
          {/* Quick Language & Theme Controls */}
          <div className="flex items-center justify-between px-1 py-0.5">
            <span className="font-mono text-[9px] uppercase tracking-wider text-black/40 dark:text-gray-500">
              {t("preferences")}
            </span>
            <div className="flex items-center gap-1">
              <LanguageToggle />
              <ThemeToggle compact />
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#04714a]/10 dark:bg-[#04714a]/25 text-[#04714a] dark:text-[#4ade80] font-bold text-xs">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-semibold text-black/80 dark:text-gray-200">
                  {user.name || user.email}
                </span>
                <span className="truncate text-[10px] text-black/45 dark:text-gray-400">
                  {user.role === "teacher"
                    ? t("roleTeacher")
                    : user.role === "admin"
                    ? t("roleAdmin")
                    : t("roleStudent")}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-0.5">
            <NavLink
              to="/profile"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-black/60 dark:text-gray-400 hover:bg-[#e8f7ef] dark:hover:bg-white/5 hover:text-[#04714a] dark:hover:text-[#4ade80] transition-colors"
            >
              <UserRoundIcon size={15} />
              {t("profile")}
            </NavLink>
            <NavLink
              to="/settings"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-black/60 dark:text-gray-400 hover:bg-[#e8f7ef] dark:hover:bg-white/5 hover:text-[#04714a] dark:hover:text-[#4ade80] transition-colors"
            >
              <SettingsIcon size={15} />
              {t("settings")}
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-full text-left cursor-pointer"
            >
              <LogOutIcon size={15} />
              {t("logout")}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-black/10 dark:border-white/10 bg-white dark:bg-[#16181b] px-4 md:hidden transition-colors">
          <NavLink to="/" className="text-base font-extrabold text-[#11130f] dark:text-gray-100">
            IT UPD GenAI<span className="text-[#00a86b]">.</span>
          </NavLink>
          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageToggle />
            <ThemeToggle compact />
            <button
              type="button"
              onClick={handleNewChat}
              className="p-1.5 text-black/70 dark:text-gray-300 hover:text-black dark:hover:text-white cursor-pointer"
              title={t("newChat")}
            >
              <PlusIcon size={18} />
            </button>
            <NavLink to="/profile" className="p-1.5 text-black/70 dark:text-gray-300 hover:text-[#04714a] dark:hover:text-[#4ade80]">
              <UserRoundIcon size={18} />
            </NavLink>
            <button
              onClick={handleLogout}
              className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-700 cursor-pointer"
              title={t("logout")}
            >
              <LogOutIcon size={18} />
            </button>
          </div>
        </header>

        {/* Main content — pb-16 on mobile to clear the bottom nav */}
        <main className="flex-1 min-h-0 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-40 flex md:hidden border-t border-black/10 dark:border-white/10 bg-white dark:bg-[#16181b] safe-area-inset-bottom transition-colors">
        {links.map(([to, label, Icon]) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/chat"}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors ${
                isActive && (to !== "/chat" || !currentChatId)
                  ? "text-[#04714a] dark:text-[#4ade80] font-semibold"
                  : "text-black/45 dark:text-gray-400 hover:text-[#04714a] dark:hover:text-[#4ade80]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={20}
                  className={isActive && (to !== "/chat" || !currentChatId) ? "text-[#04714a] dark:text-[#4ade80]" : ""}
                />
                <span className="leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors ${
                isActive ? "text-[#04714a] dark:text-[#4ade80] font-semibold" : "text-black/45 dark:text-gray-400 hover:text-[#04714a] dark:hover:text-[#4ade80]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <ShieldCheckIcon size={20} className={isActive ? "text-[#04714a] dark:text-[#4ade80]" : ""} />
                <span className="leading-none">{t("navAdmin")}</span>
              </>
            )}
          </NavLink>
        )}
      </nav>

      <DocumentProcessingNotifications />
      {deleteChatDialog}
    </div>
  );
}
