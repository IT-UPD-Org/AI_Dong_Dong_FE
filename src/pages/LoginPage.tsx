import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { loadAuthMethods, startMicrosoftLogin } from "../lib/microsoftAuth";
import { ApiError } from "../api/client";
import type { AuthMethods } from "../api/types";

function MicrosoftLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

/** Placeholder while /api/auth/methods loads: the shape of the login form, pulsing. */
function LoginFormSkeleton() {
  return (
    <div className="mt-6 space-y-4 animate-pulse" role="status" aria-label="Đang tải phương thức đăng nhập">
      <div className="h-12 w-full rounded-xl bg-muted" />
      <div className="space-y-2">
        <div className="h-3 w-28 rounded bg-muted" />
        <div className="h-11 w-full rounded-xl bg-muted/70" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="h-11 w-full rounded-xl bg-muted/70" />
      </div>
      <div className="h-12 w-full rounded-xl bg-brand/20" />
      <span className="sr-only">Đang tải phương thức đăng nhập...</span>
    </div>
  );
}

function getRoleInfo(emailValue: string) {
  const cleanEmail = emailValue.trim().toLowerCase();
  if (!cleanEmail) return null;
  if (cleanEmail.endsWith("@phuongdong.edu.vn")) {
    return { type: "teacher" as const, label: "Giảng viên Phương Đông" };
  }
  if (cleanEmail.endsWith("@pduni.edu.vn")) {
    return { type: "student" as const, label: "Sinh viên Phương Đông" };
  }
  return null;
}

export function LoginPage() {
  const { passwordLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const stateFrom = (location.state as { from?: string } | null)?.from;
  const redirectTo: string =
    typeof stateFrom === "string" && stateFrom.startsWith("/") ? stateFrom : "/chat";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [methods, setMethods] = useState<AuthMethods | null>(null);

  useEffect(() => {
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    // Keep the form in its loading state until the backend says which methods exist;
    // retry with backoff instead of guessing (a wrong guess shows a form that cannot work).
    const load = () => {
      // One cached request gives both the login options and the Microsoft settings,
      // so the Microsoft button redirects without another round trip.
      loadAuthMethods()
        .then((m) => {
          if (!cancelled) setMethods(m);
        })
        .catch(() => {
          if (cancelled) return;
          attempt += 1;
          retry = setTimeout(load, Math.min(1000 * 2 ** attempt, 15000));
        });
    };
    load();
    return () => {
      cancelled = true;
      if (retry) clearTimeout(retry);
    };
  }, []);

  const roleInfo = getRoleInfo(email);
  const methodsLoading = methods === null;
  const microsoftReady = Boolean(methods?.microsoft);
  const showPasswordForm = Boolean(methods?.password);

  async function handlePasswordLogin(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Vui lòng nhập địa chỉ email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Địa chỉ email không đúng định dạng.");
      return;
    }

    if (!password) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    setIsSubmitting(true);
    try {
      await passwordLogin(cleanEmail, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("Email hoặc mật khẩu không chính xác.");
        } else if (err.status === 403) {
          setError(
            "Tài khoản đã bị vô hiệu hóa hoặc chưa được kích hoạt. Vui lòng liên hệ quản trị viên."
          );
        } else if (err.status === 404) {
          setError(
            "Phương thức đăng nhập bằng mật khẩu hiện không khả dụng trên hệ thống."
          );
        } else if (err.status === 0) {
          setError(
            "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau."
          );
        } else {
          setError(err.message || "Đăng nhập thất bại. Vui lòng thử lại.");
        }
      } else {
        setError((err as Error).message || "Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMicrosoftLogin() {
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    try {
      await startMicrosoftLogin(redirectTo);
    } catch (err) {
      setError(
        (err as Error).message || "Không thể bắt đầu đăng nhập Microsoft."
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-[calc(100vh-80px)] place-items-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-lg">
        {/* Navigation link */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Trở về trang chủ
          </Link>
        </div>

        {/* Header */}
        <p className="text-xs uppercase tracking-[.18em] text-brand-text font-semibold">
          Tài khoản nhà trường
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-.06em] sm:text-3xl md:text-4xl text-foreground">
          Đăng nhập vào IT UPD GenAI.
        </h1>
        <p className="mt-2 text-muted-foreground text-xs sm:text-sm leading-relaxed">
          Sử dụng tài khoản Microsoft của trường (@pduni.edu.vn cho sinh viên,
          @phuongdong.edu.vn cho giảng viên) hoặc email và mật khẩu.
        </p>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40 p-3 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-in fade-in duration-200"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login options load from the backend; until then show a placeholder of the form */}
        {methodsLoading && <LoginFormSkeleton />}

        {/* Microsoft OAuth Login button */}
        {microsoftReady && (
          <button
            type="button"
            onClick={handleMicrosoftLogin}
            disabled={isSubmitting}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-foreground px-4 py-3 font-semibold text-background transition-all hover:bg-brand hover:text-brand-foreground hover:shadow-md disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {isSubmitting ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : (
              <MicrosoftLogo />
            )}
            <span>Đăng nhập bằng Microsoft</span>
            <ArrowUpRight size={16} />
          </button>
        )}

        {/* Divider if both Microsoft and Password are visible */}
        {microsoftReady && showPasswordForm && (
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground font-medium">
                Hoặc đăng nhập bằng email & mật khẩu
              </span>
            </div>
          </div>
        )}

        {/* Email & Password Login Form */}
        {showPasswordForm ? (
          <form
            onSubmit={handlePasswordLogin}
            className={microsoftReady ? "" : "mt-6"}
            noValidate
          >
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-fg-secondary mb-2"
                >
                  Email tài khoản
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-3.5 text-muted-foreground pointer-events-none"
                    size={18}
                    aria-hidden="true"
                  />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="ví dụ: sinhvien@pduni.edu.vn"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-border bg-field pl-11 pr-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-bright focus:ring-1 focus:ring-brand-bright disabled:bg-muted disabled:opacity-60"
                  />
                </div>

                {roleInfo && (
                  <div className="mt-2 flex justify-end animate-in fade-in duration-200">
                    {roleInfo.type === "teacher" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <Check size={13} className="stroke-[2.5]" />
                        {roleInfo.label}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
                        <CheckCircle2 size={13} />
                        {roleInfo.label}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-fg-secondary mb-2"
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-3.5 text-muted-foreground pointer-events-none"
                    size={18}
                    aria-hidden="true"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-border bg-field pl-11 pr-11 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand-bright focus:ring-1 focus:ring-brand-bright disabled:bg-muted disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-semibold text-brand-foreground transition-all hover:bg-brand-hover disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-sm text-sm sm:text-base"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </button>
            </div>
          </form>
        ) : methodsLoading ? null : (
          /* Khi backend tắt password và chỉ cho phép Microsoft */
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 p-4 text-xs text-emerald-900 leading-relaxed">
            <p className="font-semibold mb-1">Phương thức xác thực Microsoft SSO</p>
            Hệ thống hiện đang áp dụng phương thức đăng nhập Microsoft SSO cho toàn bộ cán bộ, giảng viên và sinh viên. Vui lòng bấm vào nút “Đăng nhập bằng Microsoft” ở trên.
          </div>
        )}

        {/* Links below form */}
        <div className="mt-6 flex flex-col gap-2.5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between border-t border-border pt-4">
          <span>
            Chưa có tài khoản?{" "}
            <Link
              to="/approve"
              className="font-semibold text-brand-text hover:underline"
            >
              Cấp phép tài khoản
            </Link>
          </span>
        </div>
      </div>
    </main>
  );
}
