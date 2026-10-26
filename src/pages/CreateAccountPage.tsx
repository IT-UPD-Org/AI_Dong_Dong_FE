import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle2, KeyRound, Mail, RefreshCw, Terminal, UserRound } from "lucide-react";
import { authApi } from "../api/auth.api";
import type { AccountRole } from "../api/types";

const ROLES: { value: AccountRole; label: string }[] = [
  { value: "student", label: "Sinh viên" },
  { value: "teacher", label: "Giảng viên" },
  { value: "admin", label: "Quản trị viên" },
];

const INPUT =
  "w-full rounded-xl border border-black/15 bg-white pl-11 pr-4 py-3 text-sm outline-none focus:border-[#00a86b] focus:ring-1 focus:ring-[#00a86b]";

/**
 * Create a password account while Microsoft login is off. The backend prints
 * a one-time key to its console; only someone with access to the server logs
 * can complete this form.
 */
export function CreateAccountPage() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [setupKey, setSetupKey] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AccountRole>("student");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState("");
  const [created, setCreated] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    authApi
      .getMethods()
      .then((m) => setAvailable(m.password))
      .catch(() => setAvailable(false));
  }, []);

  useEffect(() => {
    if (expiresAt === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  const secondsLeft = expiresAt === null ? 0 : Math.max(0, Math.ceil((expiresAt - now) / 1000));

  async function requestKey() {
    setError("");
    setBusy(true);
    try {
      const seconds = await authApi.requestSetupKey();
      setNow(Date.now());
      setExpiresAt(Date.now() + seconds * 1000);
    } catch (err) {
      setError((err as Error).message || "Không thể tạo mã.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Mật khẩu cần ít nhất 8 ký tự.");
      return;
    }
    setBusy(true);
    try {
      const user = await authApi.createAccount({
        setup_key: setupKey.trim(),
        email: email.trim().toLowerCase(),
        name: name.trim(),
        password,
        role,
      });
      setCreated(user.email);
      setSetupKey("");
      setPassword("");
      setExpiresAt(null);
    } catch (err) {
      // Any attempt, right or wrong, uses up the key, so a new one is needed.
      setSetupKey("");
      setExpiresAt(null);
      setError((err as Error).message || "Không thể tạo tài khoản.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-[calc(100vh-80px)] place-items-center px-6 py-6">
      <div className="w-full max-w-lg">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-2 text-sm text-black/55 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} />
          Quay lại đăng nhập
        </Link>

        <p className="text-xs uppercase tracking-[.18em] text-[#04714a]">Quản trị</p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-.06em] md:text-4xl text-[#11130f]">Tạo tài khoản.</h1>
        <p className="mt-2 text-black/60 text-sm leading-relaxed">
          Chỉ dùng khi chưa bật đăng nhập Microsoft. Mã xác nhận được in ra console của backend và hết hạn sau 1 phút.
        </p>

        {available === null && (
          <div className="mt-8 flex items-center gap-2 text-sm text-black/50">
            <RefreshCw className="animate-spin" size={16} /> Đang tải...
          </div>
        )}

        {available === false && (
          <div className="mt-8 rounded-xl border border-black/10 bg-[#fcfcfb] p-4 text-sm text-black/60">
            Đăng nhập Microsoft đang bật, nên không thể tạo tài khoản bằng mật khẩu.
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {created && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-medium text-green-800 flex items-start gap-2">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span>
              Đã tạo tài khoản <strong>{created}</strong>.{" "}
              <Link to="/login" className="underline">
                Đăng nhập
              </Link>
            </span>
          </div>
        )}

        {available && (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div className="rounded-2xl border border-black/10 bg-[#fcfcfb] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-[#11130f]">
                  <Terminal size={16} className="text-[#04714a]" /> Mã xác nhận
                </span>
                <button
                  type="button"
                  onClick={requestKey}
                  disabled={busy || secondsLeft > 0}
                  className="rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold hover:border-[#04714a] disabled:opacity-50 cursor-pointer"
                >
                  {secondsLeft > 0 ? `Còn ${secondsLeft}s` : "In mã ra console"}
                </button>
              </div>
              <p className="mt-2 text-xs text-black/50">
                Tìm dòng <code className="font-mono">[account-setup]</code> trong log của backend.
              </p>
              <div className="relative mt-3">
                <KeyRound className="absolute left-4 top-3.5 text-black/35" size={18} />
                <input
                  className={`${INPUT} font-mono`}
                  type="text"
                  autoComplete="off"
                  placeholder="Dán mã từ console"
                  value={setupKey}
                  onChange={(e) => setSetupKey(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-black/35" size={18} />
              <input
                className={INPUT}
                type="email"
                autoComplete="off"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <UserRound className="absolute left-4 top-3.5 text-black/35" size={18} />
              <input
                className={INPUT}
                type="text"
                placeholder="Tên hiển thị"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <KeyRound className="absolute left-4 top-3.5 text-black/35" size={18} />
              <input
                className={INPUT}
                type="password"
                autoComplete="new-password"
                placeholder="Mật khẩu (ít nhất 8 ký tự)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <select
              className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#00a86b]"
              value={role}
              onChange={(e) => setRole(e.target.value as AccountRole)}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={busy}
              className="flex items-center justify-center rounded-xl bg-[#11130f] px-4 py-3 font-semibold text-white transition-all hover:bg-[#04714a] disabled:opacity-50 cursor-pointer"
            >
              {busy ? <RefreshCw className="animate-spin" size={16} /> : "Tạo tài khoản"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
