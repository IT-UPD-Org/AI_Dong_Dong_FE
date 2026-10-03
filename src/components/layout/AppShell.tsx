import { useEffect, useState, type SVGProps } from "react";
import { NavLink, Outlet, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { chatApi } from "../../api/chat.api";
import type { Conversation } from "../../api/types";
import { DocumentProcessingNotifications } from "./DocumentProcessingNotifications";

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

const links = [
  ["/chat", "Trò chuyện", MessageCircleIcon],
  ["/history", "Lịch sử", HistoryIcon],
  ["/knowledge", "Kho tri thức", BookOpenIcon],
  ["/documents", "Tài liệu", FileTextIcon],
  ["/contributors", "Người đóng góp", UsersIcon],
] as const;

export function AppShell() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentChatId = searchParams.get("id");
  const { user, logout } = useAuth();
  const [recentChats, setRecentChats] = useState<Conversation[]>([]);

  const loadRecentChats = async () => {
    try {
      const chats = await chatApi.getConversations(1);
      setRecentChats(chats);
    } catch {
      setRecentChats([]);
    }
  };

  useEffect(() => {
    loadRecentChats();

    const handleChatsUpdated = () => {
      loadRecentChats();
    };

    window.addEventListener("chats:updated", handleChatsUpdated);
    return () => window.removeEventListener("chats:updated", handleChatsUpdated);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleNewChat = () => {
    navigate("/chat", { state: { newChatKey: crypto.randomUUID() } });
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-white md:flex-row">
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-black/10 bg-white p-5 md:flex">
        <NavLink to="/" className="mb-6 shrink-0 text-lg font-extrabold">
          IT UPD GenAI<span className="text-[#00a86b]">.</span>
        </NavLink>
        <button
          type="button"
          onClick={handleNewChat}
          className="
            mb-6 flex w-full shrink-0 items-center gap-2
            rounded-full
            bg-[#11130f]
            px-3 py-2.5
            text-left text-sm font-medium text-white
            transition-all
            hover:bg-[#04714a]
            cursor-pointer
          "
        >
          <PlusIcon size={16} strokeWidth={2} />
          <span className="truncate">Cuộc trò chuyện mới</span>
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
                    ? "bg-[#e8f7ef] font-semibold text-[#013422]"
                    : "text-black/55 hover:bg-[#e8f7ef] hover:text-[#04714a]"
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 flex min-h-0 flex-1 flex-col">
          <p
            className="
              mb-2 shrink-0 px-2
              font-mono text-[9px]
              uppercase tracking-[0.18em]
              text-black/35
            "
          >
            Gần đây
          </p>

          <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
            {recentChats.length === 0 ? (
              <p className="px-2 py-3 text-xs text-black/40 italic">
                Chưa có cuộc trò chuyện
              </p>
            ) : (
              recentChats.map((conversation) => {
                const isCurrent = currentChatId === conversation.id;
                return (
                  <NavLink
                    key={conversation.id}
                    to={`/chat?id=${conversation.id}`}
                    className={`
                      w-full min-w-0
                      truncate
                      rounded-lg
                      px-2.5 py-2
                      text-left text-xs
                      transition-colors
                      ${
                        isCurrent
                          ? "bg-[#e8f7ef] font-semibold text-[#013422]"
                          : "text-black/55 hover:bg-[#e8f7ef] hover:text-[#04714a]"
                      }
                    `}
                  >
                    {conversation.title}
                  </NavLink>
                );
              })
            )}
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="mt-4 flex shrink-0 flex-col gap-2 border-t border-black/10 pt-4">
          {user && (
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-black/[0.02]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#04714a]/10 text-[#04714a] font-bold text-xs">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-semibold text-black/80">
                  {user.name || user.email}
                </span>
                <span className="truncate text-[10px] text-black/45">
                  {user.role === 'teacher' ? 'Giảng viên' : user.role === 'admin' ? 'Quản trị viên' : 'Sinh viên'}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-0.5">
            <NavLink
              to="/profile"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-black/60 hover:bg-[#e8f7ef] hover:text-[#04714a] transition-colors"
            >
              <UserRoundIcon size={15} />
              Hồ sơ cá nhân
            </NavLink>
            <NavLink
              to="/settings"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-black/60 hover:bg-[#e8f7ef] hover:text-[#04714a] transition-colors"
            >
              <SettingsIcon size={15} />
              Cài đặt
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors w-full text-left cursor-pointer"
            >
              <LogOutIcon size={15} />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto relative">
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col px-5 py-6 md:px-10">
          <div className="mb-6 flex shrink-0 items-center justify-between md:hidden">
            <NavLink to="/" className="font-extrabold">
              IT UPD GenAI<span className="text-[#00a86b]">.</span>
            </NavLink>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleNewChat}
                className="p-1 text-black/70 hover:text-black"
                title="Cuộc trò chuyện mới"
              >
                <PlusIcon size={20} />
              </button>
              <NavLink to="/settings">
                <SettingsIcon size={18} />
              </NavLink>
              <button onClick={handleLogout} className="text-red-600">
                <LogOutIcon size={18} />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <Outlet />
          </div>
        </div>
        <DocumentProcessingNotifications />
      </main>
    </div>
  );
}
