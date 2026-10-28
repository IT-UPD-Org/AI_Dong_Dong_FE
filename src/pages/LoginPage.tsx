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
  Sparkles,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { startMicrosoftLogin } from "../lib/microsoftAuth";
import { authApi } from "../api/auth.api";
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
    authApi
      .getMethods()
      .then((m) => {
        if (!cancelled) {
          setMethods(m);
        }
      })
      .catch(() => {
        // Nếu backend chưa kết nối được methods, giữ methods = null
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const roleInfo = getRoleInfo(email);
  const microsoftReady = Boolean(methods?.microsoft);
  // Khi methods chưa tải xong hoặc backend cho phép password, hiển thị form mật khẩu
  const showPasswordForm = methods ? Boolean(methods.password) : true;

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
            className="inline-flex items-center gap-2 text-sm text-black/55 hover:text-black transition-colors"
          >
            <ArrowLeft size={16} />
            Trở về trang chủ
          </Link>
        </div>

        {/* Header */}
        <p className="text-xs uppercase tracking-[.18em] text-[#04714a] font-semibold">
          Tài khoản nhà trường
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-.06em] sm:text-3xl md:text-4xl text-[#11130f]">
          Đăng nhập vào IT UPD GenAI.
        </h1>
        <p className="mt-2 text-black/60 text-xs sm:text-sm leading-relaxed">
          Sử dụng tài khoản Microsoft của trường (@pduni.edu.vn cho sinh viên,
          @phuongdong.edu.vn cho giảng viên) hoặc email và mật khẩu.
        </p>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 flex items-start gap-2 animate-in fade-in duration-200"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Microsoft OAuth Login button */}
        {microsoftReady && (
          <button
            type="button"
            onClick={handleMicrosoftLogin}
            disabled={isSubmitting}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-[#11130f] px-4 py-3 font-semibold text-white transition-all hover:bg-[#04714a] hover:shadow-md disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-sm sm:text-base"
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
              <div className="w-full border-t border-black/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#fafaf9] px-3 text-black/45 font-medium">
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
                  className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-2"
                >
                  Email tài khoản
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-3.5 text-black/35 pointer-events-none"
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
                    className="w-full rounded-xl border border-black/15 bg-white pl-11 pr-4 py-3 text-sm outline-none transition-all placeholder:text-black/35 focus:border-[#00a86b] focus:ring-1 focus:ring-[#00a86b] disabled:bg-black/5 disabled:opacity-60"
                  />
                </div>

                {roleInfo && (
                  <div className="mt-2 flex justify-end animate-in fade-in duration-200">
                    {roleInfo.type === "teacher" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <Check size={13} className="stroke-[2.5]" />
                        {roleInfo.label}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
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
                  className="block text-xs font-semibold uppercase tracking-wider text-black/70 mb-2"
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-3.5 text-black/35 pointer-events-none"
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
                    className="w-full rounded-xl border border-black/15 bg-white pl-11 pr-11 py-3 text-sm outline-none transition-all placeholder:text-black/35 focus:border-[#00a86b] focus:ring-1 focus:ring-[#00a86b] disabled:bg-black/5 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="absolute right-3.5 top-3 text-black/40 hover:text-black/70 transition-colors p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#04714a] px-4 py-3 font-semibold text-white transition-all hover:bg-[#03593a] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-sm text-sm sm:text-base"
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
        ) : (
          /* Khi backend tắt password và chỉ cho phép Microsoft */
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-900 leading-relaxed">
            <p className="font-semibold mb-1">Phương thức xác thực Microsoft SSO</p>
            Hệ thống hiện đang áp dụng phương thức đăng nhập Microsoft SSO cho toàn bộ cán bộ, giảng viên và sinh viên. Vui lòng bấm vào nút “Đăng nhập bằng Microsoft” ở trên.
          </div>
        )}

        {/* Links below form */}
        <div className="mt-6 flex flex-col gap-2.5 text-xs text-black/60 sm:flex-row sm:items-center sm:justify-between border-t border-black/10 pt-4">
          <span>
            Chưa có tài khoản?{" "}
            <Link
              to="/approve"
              className="font-semibold text-[#04714a] hover:underline"
            >
              Cấp phép tài khoản
            </Link>
          </span>
          <Link
            to="/admin/create"
            className="text-black/50 hover:text-[#04714a] hover:underline"
          >
            Khởi tạo tài khoản quản trị
          </Link>
        </div>

        {/* Security and privacy note */}
        <div className="mt-8 rounded-2xl border border-black/5 bg-[#fcfcfb] p-4 text-xs text-black/55 leading-relaxed">
          <p className="font-semibold text-black/75 mb-1 flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#04714a]" /> Bảo mật & Tiện ích:
          </p>
          Tài khoản Phương Đông gồm email sinh viên (<code>@pduni.edu.vn</code>) và giảng viên (<code>@phuongdong.edu.vn</code>). Phiên đăng nhập được duy trì an toàn và phân quyền chính xác theo tài khoản đã được phê duyệt.
        </div>
      </div>
    </main>
  );
}
