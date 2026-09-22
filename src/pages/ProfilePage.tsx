import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LogOut, Mail, Shield } from "lucide-react";

export function ProfilePage() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav("/login", { replace: true });
  };

  return (
    <main>
      <p className="font-mono text-xs uppercase tracking-[.18em] text-[#04714a]">
        Hồ sơ cá nhân
      </p>
      <h1 className="mt-3 text-5xl font-bold tracking-[-.07em]">Tài khoản</h1>

      <div className="mt-10 max-w-xl rounded-3xl border border-black/10 bg-white p-7">
        {/* Avatar */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#04714a]/10 text-[#04714a] font-bold text-2xl">
          {user?.email?.charAt(0).toUpperCase() ?? "?"}
        </div>

        <h2 className="mt-6 text-xl font-semibold">
          {user?.name ?? "Người dùng"}
        </h2>

        <div className="mt-2 flex items-center gap-2 text-sm text-black/55">
          <Mail size={14} />
          <span>{user?.email ?? "—"}</span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Shield size={14} className="text-[#04714a]" />
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            user?.role === "teacher"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}>
            {user?.role === "teacher" ? "Giảng viên" : "Sinh viên"}
          </span>
        </div>

        <hr className="my-6 border-black/10" />

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
        >
          <LogOut size={15} />
          Đăng xuất khỏi tất cả thiết bị
        </button>
      </div>
    </main>
  );
}
