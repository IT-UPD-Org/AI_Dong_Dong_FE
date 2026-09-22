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
  LogOut,
} from "lucide-react";

import { conversations } from "../../mocks/data";
import { useAuth } from "../../contexts/AuthContext";

const links = [
  ["/chat", "Trò chuyện", MessageCircle],
  ["/history", "Lịch sử", History],
  ["/knowledge", "Kho tri thức", BookOpen],
  ["/documents", "Tài liệu", FileText],
  ["/contributors", "Người đóng góp", Users],
] as const;

export function AppShell() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

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
            cursor-pointer
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
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-[#e8f7ef] font-semibold text-[#04714a]"
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
                  {user.role === 'teacher' ? 'Giảng viên' : 'Sinh viên'}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-0.5">
            <NavLink
              to="/profile"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-black/60 hover:bg-[#e8f7ef] hover:text-[#04714a] transition-colors"
            >
              <UserRound size={15} />
              Hồ sơ cá nhân
            </NavLink>
            <NavLink
              to="/settings"
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-black/60 hover:bg-[#e8f7ef] hover:text-[#04714a] transition-colors"
            >
              <Settings size={15} />
              Cài đặt
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors w-full text-left cursor-pointer"
            >
              <LogOut size={15} />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col px-5 py-6 md:px-10">
          <div className="mb-6 flex shrink-0 items-center justify-between md:hidden">
            <NavLink to="/" className="font-extrabold">
              IT UPD GenAI<span className="text-[#00a86b]">.</span>
            </NavLink>
            <div className="flex items-center gap-3">
              <NavLink to="/settings">
                <Settings size={18} />
              </NavLink>
              <button onClick={handleLogout} className="text-red-600">
                <LogOut size={18} />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
