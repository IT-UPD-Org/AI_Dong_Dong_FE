import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BookOpen,
  FileText,
  History,
  Settings,
  Users,
  MessageCircle,
  UserRound,
  Plus,
} from "lucide-react";

import { conversations } from "../../mocks/data";

const links = [
  ["/chat", "Trò chuyện", MessageCircle],
  ["/history", "Lịch sử", History],
  ["/knowledge", "Kho tri thức", BookOpen],
  ["/documents", "Tài liệu", FileText],
  ["/contributors", "Người đóng góp", Users],
] as const;

export function AppShell() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-white md:flex-row">
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-black/10 bg-white p-5 md:flex">
        <NavLink to="/" className="mb-6 shrink-0 text-lg font-extrabold">
          IT UPD GenAI<span className="text-[#00a86b]">.</span>
        </NavLink>
        <button
          type="button"
          onClick={() => navigate("/chat")}
          className="
            mb-6 flex w-full shrink-0 items-center gap-2
            rounded-full
            bg-[#11130f]
            px-3 py-2.5
            text-left text-sm font-medium text-white
            transition-all
            hover:bg-[#04714a]
          "
        >
          <Plus size={16} strokeWidth={2} />
          <span className="truncate">Cuộc trò chuyện mới</span>
        </button>

        <nav className="flex shrink-0 flex-col gap-1">
          {links.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${isActive ? "bg-[#e8f7ef] font-semibold text-[#04714a]" : "text-black/55 hover:bg-[#e8f7ef] hover:text-[#04714a]"}`
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
            {conversations.map((conversation) => (
              <NavLink
                key={conversation.id}
                to="/chat"
                className="
                  w-full min-w-0
                  truncate
                  rounded-lg
                  px-2.5 py-2
                  text-left text-xs
                  text-black/55
                  transition-colors
                  hover:bg-[#e8f7ef]
                  hover:text-[#04714a]
                "
              >
                {conversation.title}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="mt-4 flex shrink-0 flex-col gap-1 border-t border-black/10 pt-4">
          <NavLink
            to="/profile"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-black/55 hover:bg-[#e8f7ef] hover:text-[#04714a]"
          >
            <UserRound size={17} />
            Hồ sơ cá nhân
          </NavLink>
          <NavLink
            to="/settings"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-black/55 hover:bg-[#e8f7ef] hover:text-[#04714a]"
          >
            <Settings size={17} />
            Cài đặt
          </NavLink>
        </div>
      </aside>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col px-5 py-6 md:px-10">
          <div className="mb-6 flex shrink-0 items-center justify-between md:hidden">
            <NavLink to="/" className="font-extrabold">
              IT UPD GenAI<span className="text-[#00a86b]">.</span>
            </NavLink>
            <NavLink to="/settings">
              <Settings size={18} />
            </NavLink>
          </div>

          <div className="min-h-0 flex-1">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
