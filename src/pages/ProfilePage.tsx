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
    <main className="px-4 py-6 sm:px-6 sm:py-8 text-foreground">
      <p className="font-mono text-xs uppercase tracking-[.18em] text-brand-text">
        {isEn ? "Personal Profile" : "Hồ sơ cá nhân"}
      </p>
      <h1 className="mt-3 text-3xl sm:text-5xl font-bold tracking-[-.07em] text-foreground">
        {isEn ? "Account" : "Tài khoản"}
      </h1>

      <div className="mt-10 max-w-xl rounded-3xl border border-border bg-card p-7 shadow-sm">
        {/* Avatar */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand-text font-bold text-2xl">
          {user?.email?.charAt(0).toUpperCase() ?? "?"}
        </div>

        <h2 className="mt-6 text-xl font-semibold text-foreground">
          {user?.name ?? (isEn ? "User" : "Người dùng")}
        </h2>

        <div className="mt-2 flex items-center gap-2 text-sm text-fg-secondary">
          <Mail size={14} />
          <span>{user?.email ?? "—"}</span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Shield size={14} className="text-brand-text" />
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              user?.role === "teacher"
                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                : user?.role === "admin"
                ? "bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30"
                : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
            }`}
          >
            {getRoleName()}
          </span>
        </div>

        {/* Thống kê dung lượng & credits */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-5">
          <div className="rounded-2xl border border-border bg-surface p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Coins size={14} className="text-brand-text" />
              <span>{isEn ? "AI Credits" : "Tín dụng AI"}</span>
            </div>
            <p className="mt-1.5 text-lg font-bold text-foreground">
              {user?.credits !== undefined ? `${user.credits} credits` : "1,000 credits"}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <HardDrive size={14} className="text-brand-text" />
              <span>{isEn ? "Storage Used" : "Dung lượng đã dùng"}</span>
            </div>
            <p className="mt-1.5 text-lg font-bold text-foreground">
              {formatBytes(user?.storage_used)} / 236 MB
            </p>
          </div>
        </div>

        <hr className="my-6 border-border" />

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-red-700 dark:text-destructive hover:bg-destructive/15 transition-colors cursor-pointer"
        >
          <LogOut size={15} />
          {t("nav.logout")}
        </button>
      </div>
    </main>
  );
}
