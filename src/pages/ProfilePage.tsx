import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Coins, HardDrive, KeyRound, LogOut, Mail, Shield } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { authApi } from "../api/auth.api";
import type { Session } from "../api/types";

const MB = 1024 * 1024;
const DEFAULT_LIMIT = 236 * MB;

function formatMb(bytes: number): string {
  return `${(bytes / MB).toFixed(1)} MB`;
}

export function ProfilePage() {
  const { user, logout, setUser } = useAuth();
  const nav = useNavigate();
  const { lang, t } = useLanguage();
  const isEn = lang === "en";

  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [sessionsError, setSessionsError] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(user?.display_name ?? "");
  }, [user?.display_name]);

  useEffect(() => {
    let current = true;
    authApi
      .listSessions()
      .then((list) => {
        if (!current) return;
        setSessions(list);
        setSessionsError(false);
      })
      .catch(() => current && setSessionsError(true));
    return () => {
      current = false;
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    nav("/login", { replace: true });
  };

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // A blank name clears the custom one; the backend picks what to show.
      setUser(await authApi.updateProfile({ display_name: displayName.trim() || null }));
      toast.success(isEn ? "Display name saved." : "Đã lưu tên hiển thị.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (id: string) => {
    if (revokingId !== null) return;
    setRevokingId(id);
    try {
      await authApi.revokeSession(id);
      setSessions((prev) => prev?.filter((s) => s.id !== id) ?? null);
      toast.success(isEn ? "Session signed out." : "Đã đăng xuất phiên.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRevokingId(null);
    }
  };

  const roleName =
    user?.role === "teacher" ? t("roleTeacher") : user?.role === "admin" ? t("roleAdmin") : t("roleStudent");

  const used = user?.storage_used ?? 0;
  const limit = user?.storage_limit || DEFAULT_LIMIT;
  const percent = Math.min(100, Math.round((used / limit) * 100));
  const nearlyFull = percent >= 90;
  const dateFormat = new Intl.DateTimeFormat(isEn ? "en-GB" : "vi-VN", { dateStyle: "short", timeStyle: "short" });

  const card = "rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 text-foreground sm:px-6 sm:py-8">
      <p className="font-mono text-xs uppercase tracking-[.18em] text-brand-text">
        {isEn ? "Personal Profile" : "Hồ sơ cá nhân"}
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-[-.07em] text-foreground sm:text-5xl">
        {isEn ? "Account" : "Tài khoản"}
      </h1>

      {/* Header: who you are */}
      <section className={`${card} mt-6 sm:mt-8 flex flex-col gap-4 sm:gap-5 sm:flex-row sm:items-center`}>
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="flex size-14 sm:size-16 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xl sm:text-2xl font-bold text-brand-text">
            {(user?.display_name || user?.email || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg sm:text-xl font-semibold text-foreground">
              {user?.display_name ?? (isEn ? "User" : "Người dùng")}
            </h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-fg-secondary min-w-0">
              <Mail size={14} aria-hidden="true" className="shrink-0" />
              <span className="truncate">{user?.email ?? "—"}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Shield size={14} aria-hidden="true" className="shrink-0 text-brand-text" />
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  user?.role === "teacher"
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                    : user?.role === "admin"
                      ? "border-purple-500/30 bg-purple-500/15 text-purple-800 dark:text-purple-300"
                      : "border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300"
                }`}
              >
                {roleName}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex min-h-11 w-full sm:w-auto shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-destructive/15 dark:text-destructive"
        >
          <LogOut size={15} aria-hidden="true" />
          {t("logout")}
        </button>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Account info */}
        <section className={card} aria-labelledby="profile-info">
          <h2 id="profile-info" className="text-base font-semibold text-foreground">
            {isEn ? "Account information" : "Thông tin tài khoản"}
          </h2>
          <form onSubmit={saveName} className="mt-4 space-y-2">
            <label htmlFor="profile-display-name" className="block text-xs font-medium text-muted-foreground">
              {isEn ? "Display name" : "Tên hiển thị"}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="profile-display-name"
                value={displayName}
                maxLength={100}
                disabled={saving}
                onChange={(e) => setDisplayName(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-border bg-field px-3 py-2 text-sm text-foreground outline-none focus:border-brand-bright focus:ring-1 focus:ring-brand-bright"
              />
              <button
                type="submit"
                disabled={saving || displayName.trim() === (user?.display_name ?? "")}
                className="inline-flex min-h-11 w-full sm:w-auto shrink-0 cursor-pointer items-center justify-center rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-brand hover:text-brand-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("save")}
              </button>
            </div>
          </form>

          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 border-t border-border pt-5">
            <div className="min-w-0 rounded-2xl border border-border bg-surface p-3 sm:p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Coins size={14} aria-hidden="true" className="shrink-0 text-brand-text" />
                <span className="truncate">{isEn ? "AI Credits" : "Lượt dùng AI"}</span>
              </div>
              <p className="mt-1.5 truncate text-base sm:text-lg font-bold text-foreground">{user?.credits ?? 0} credits</p>
            </div>
            <div className="min-w-0 rounded-2xl border border-border bg-surface p-3 sm:p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <HardDrive size={14} aria-hidden="true" className="shrink-0 text-brand-text" />
                <span className="truncate">{isEn ? "Storage Used" : "Dung lượng đã dùng"}</span>
              </div>
              <p className="mt-1.5 truncate text-base sm:text-lg font-bold text-foreground">{formatMb(used)}</p>
            </div>
          </div>
        </section>

        {/* Storage */}
        <section className={card} aria-labelledby="profile-storage">
          <h2 id="profile-storage" className="text-base font-semibold text-foreground">
            {isEn ? "Storage" : "Dung lượng lưu trữ"}
          </h2>
          <p className="mt-4 text-sm text-fg-secondary">
            {formatMb(used)} / {Math.round(limit / MB)} MB
          </p>
          <div
            role="progressbar"
            aria-label={isEn ? "Storage used" : "Dung lượng đã dùng"}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className={`h-full rounded-full transition-all ${nearlyFull ? "bg-destructive" : "bg-brand"}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{percent}%</p>
          <Link
            to="/approve?type=storage_increase"
            className="mt-5 inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-hover"
          >
            <HardDrive size={15} aria-hidden="true" />
            {isEn ? "Request more storage" : "Yêu cầu thêm dung lượng"}
          </Link>
        </section>
      </div>

      {/* Sign-in sessions */}
      <section className={`${card} mt-6`} aria-labelledby="profile-sessions">
        <h2 id="profile-sessions" className="flex items-center gap-2 text-base font-semibold text-foreground">
          <KeyRound size={16} aria-hidden="true" className="shrink-0 text-brand-text" />
          {isEn ? "Sign-in sessions" : "Phiên đăng nhập"}
        </h2>
        {sessionsError ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {isEn ? "Could not load sessions." : "Không thể tải danh sách phiên."}
          </p>
        ) : sessions === null ? (
          <p className="mt-4 text-sm text-muted-foreground">{isEn ? "Loading..." : "Đang tải..."}</p>
        ) : sessions.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{isEn ? "No active sessions." : "Không có phiên nào."}</p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
            {sessions.map((s) => (
              <li key={s.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 px-4 py-3 text-sm">
                <span className="text-foreground">
                  {isEn ? "Expires" : "Hết hạn"}{" "}
                  <span className="text-muted-foreground">{dateFormat.format(new Date(s.expires_at))}</span>
                </span>
                <button
                  type="button"
                  disabled={revokingId !== null}
                  onClick={() => revoke(s.id)}
                  className="inline-flex min-h-10 sm:min-h-9 w-full sm:w-auto items-center justify-center cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isEn ? "Sign out" : "Đăng xuất phiên"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}