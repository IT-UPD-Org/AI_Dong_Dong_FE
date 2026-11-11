import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LogOut, Mail, Shield, Coins, HardDrive } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export function ProfilePage() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { lang, t } = useLanguage();
  const isEn = lang === "en";

  const handleLogout = () => {
    logout();
    nav("/login", { replace: true });
  };

  const getRoleName = () => {
    if (user?.role === "teacher") return isEn ? "Teacher" : "Giảng viên";
    if (user?.role === "admin") return isEn ? "Administrator" : "Quản trị viên";
    return isEn ? "Student" : "Sinh viên";
  };

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8 text-zinc-900 dark:text-gray-100">
      <p className="font-mono text-xs uppercase tracking-[.18em] text-[#04714a] dark:text-emerald-400">
        {isEn ? "Personal Profile" : "Hồ sơ cá nhân"}
      </p>
      <h1 className="mt-3 text-3xl sm:text-5xl font-bold tracking-[-.07em] text-gray-900 dark:text-white">
        {isEn ? "Account" : "Tài khoản"}
      </h1>

      <div className="mt-10 max-w-xl rounded-3xl border border-black/10 bg-white p-7 shadow-sm dark:border-white/10 dark:bg-[#1a1d21]">
        {/* Avatar */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#04714a]/10 text-[#04714a] dark:bg-emerald-500/20 dark:text-emerald-400 font-bold text-2xl">
          {user?.email?.charAt(0).toUpperCase() ?? "?"}
        </div>

        <h2 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">
          {user?.name ?? (isEn ? "User" : "Người dùng")}
        </h2>

        <div className="mt-2 flex items-center gap-2 text-sm text-black/55 dark:text-gray-400">
          <Mail size={14} />
          <span>{user?.email ?? "—"}</span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Shield size={14} className="text-[#04714a] dark:text-emerald-400" />
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              user?.role === "teacher"
                ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800"
                : user?.role === "admin"
                ? "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
            }`}
          >
            {getRoleName()}
          </span>
        </div>

        {/* Thống kê dung lượng & credits */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-black/10 dark:border-white/10 pt-5">
          <div className="rounded-2xl border border-black/5 bg-[#fcfcfb] p-3.5 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-2 text-xs font-medium text-black/55 dark:text-gray-400">
              <Coins size={14} className="text-[#04714a] dark:text-emerald-400" />
              <span>{isEn ? "AI Credits" : "Tín dụng AI"}</span>
            </div>
            <p className="mt-1.5 text-lg font-bold text-gray-900 dark:text-white">
              {user?.credits !== undefined ? `${user.credits} credits` : "1,000 credits"}
            </p>
          </div>

          <div className="rounded-2xl border border-black/5 bg-[#fcfcfb] p-3.5 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-2 text-xs font-medium text-black/55 dark:text-gray-400">
              <HardDrive size={14} className="text-[#04714a] dark:text-emerald-400" />
              <span>{isEn ? "Storage Used" : "Dung lượng đã dùng"}</span>
            </div>
            <p className="mt-1.5 text-lg font-bold text-gray-900 dark:text-white">
              {formatBytes(user?.storage_used)} / 236 MB
            </p>
          </div>
        </div>

        <hr className="my-6 border-black/10 dark:border-white/10" />

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
        >
          <LogOut size={15} />
          {t("nav.logout")}
        </button>
      </div>
    </main>
  );
}
