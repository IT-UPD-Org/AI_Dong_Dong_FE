import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Mail,
  RefreshCw,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { startMicrosoftLogin } from "../lib/microsoftAuth";
import { authApi } from "../api/auth.api";
import type { AuthMethods } from "../api/types";
import { TemporaryLogin } from "../components/auth/TemporaryLogin";

// Dev login also needs `vite dev`; the backend separately refuses it outside dev mode.
const IS_DEV = import.meta.env.DEV;
const USE_TEMPORARY_LOGIN = true;

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
  return {
    type: "other" as const,
    label: "Tài khoản thử nghiệm (chỉ dùng khi dev)",
  };
}

export function LoginPage() {
  const { devLogin, passwordLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTo: string =
    (location.state as { from?: string } | null)?.from ?? "/chat";

  // Cho phép chuyển đổi nhanh giữa 2 chế độ ngay trên UI khi đang dev
  const [activeMode, setActiveMode] = useState<"temporary" | "official">(
    USE_TEMPORARY_LOGIN ? "temporary" : "official",
  );

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [methods, setMethods] = useState<AuthMethods | null>(null);

  useEffect(() => {
    let cancelled = false;
    authApi
      .getMethods()
      .then((m) => {
        if (!cancelled) setMethods(m);
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "Không thể tải phương thức đăng nhập. Vui lòng tải lại trang.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const roleInfo = getRoleInfo(email);
  const microsoftReady = Boolean(methods?.microsoft);
  const showPassword = Boolean(methods?.password);
  const showDev = IS_DEV && Boolean(methods?.dev);

  async function handlePasswordLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }
    setIsSubmitting(true);
    try {
      await passwordLogin(cleanEmail, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError((err as Error).message || "Email hoặc mật khẩu không đúng.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMicrosoftLogin() {
    setError("");
    setIsSubmitting(true);
    try {
      await startMicrosoftLogin(redirectTo);
    } catch (err) {
      setError(
        (err as Error).message || "Không thể bắt đầu đăng nhập Microsoft.",
      );
      setIsSubmitting(false);
    }
  }

  async function handleDevLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    const displayName = name.trim() || cleanEmail.split("@")[0];
    if (!cleanEmail) {
      setError("Vui lòng nhập email.");
      return;
    }

    setIsSubmitting(true);
    try {
      await devLogin(cleanEmail, displayName);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(
        (err as Error).message || "Đăng nhập thất bại. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // =======================================================================
  // LOGIN MODE A — TEMPORARY DEVELOPMENT LOGIN
  // Dùng cho phát triển và demo nội bộ.
  // Khi cần dùng lại đăng nhập chuẩn, đổi USE_TEMPORARY_LOGIN = false
  // hoặc comment khối if bên dưới.
  // =======================================================================
  if (activeMode === "temporary") {
    return (
      <TemporaryLogin
        redirectTo={redirectTo}
        onSwitchToOfficial={() => setActiveMode("official")}
      />
    );
  }

  // =======================================================================
  // LOGIN MODE B — OFFICIAL AUTHENTICATION
  // Luồng đăng nhập chuẩn hiện tại của dự án (Microsoft OAuth + Dev form).
  // Khi quay lại production, đảm bảo nhánh này hoạt động và USE_TEMPORARY_LOGIN = false.
  // =======================================================================
  return (
    <main className="grid min-h-[calc(100vh-80px)] place-items-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-black/55 hover:text-black transition-colors"
          >
            <ArrowLeft size={16} />
            Trở về trang chủ
          </Link>
          {IS_DEV && (
            <button
              type="button"
              onClick={() => setActiveMode("temporary")}
              className="text-xs font-semibold text-[#04714a] bg-[#e8f7ef] hover:bg-[#d1efe0] px-2.5 py-1 rounded-full transition-colors cursor-pointer"
            >
              Chuyển sang Đăng nhập thử nghiệm
            </button>
          )}
        </div>

        <p className="text-xs uppercase tracking-[.18em] text-[#04714a]">
          Tài khoản nhà trường
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-.06em] sm:text-3xl md:text-4xl text-[#11130f]">
          Đăng nhập vào IT UPD GenAI.
        </h1>
        <p className="mt-2 text-black/60 text-xs sm:text-sm leading-relaxed">
          Sử dụng tài khoản Microsoft của trường (@pduni.edu.vn cho sinh viên,
          @phuongdong.edu.vn cho giảng viên).
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleMicrosoftLogin}
          disabled={isSubmitting || !microsoftReady}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-[#11130f] px-4 py-3 font-semibold text-white transition-all hover:bg-[#04714a] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting && !IS_DEV ? (
            <RefreshCw className="animate-spin" size={16} />
          ) : (
            <MicrosoftLogo />
          )}
          Đăng nhập bằng Microsoft
          <ArrowUpRight size={16} />
        </button>
        {!microsoftReady && (
          <p className="mt-2 text-xs text-black/45">
            Đăng nhập Microsoft chưa được cấu hình (VITE_MICROSOFT_TENANT_ID,
            VITE_MICROSOFT_CLIENT_ID).
          </p>
        )}

        {showDev && (
          <form
            onSubmit={handleDevLogin}
            className="mt-8 flex flex-col gap-4 rounded-2xl border border-amber-300 bg-amber-50/60 p-4 sm:p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900">
                Đăng nhập Dev (Thủ công)
              </span>
              <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-full">
                Chỉ khi chạy vite dev
              </span>
            </div>

            <div className="relative">
              <Mail
                className="absolute left-4 top-3.5 text-black/35"
                size={18}
              />
              <input
                className="w-full rounded-xl border border-black/15 bg-white pl-11 pr-4 py-3 text-sm outline-none focus:border-[#00a86b] focus:ring-1 focus:ring-[#00a86b]"
                type="email"
                placeholder="ví_dụ: sinhvien@pduni.edu.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <UserRound
                className="absolute left-4 top-3.5 text-black/35"
                size={18}
              />
              <input
                className="w-full rounded-xl border border-black/15 bg-white pl-11 pr-4 py-3 text-sm outline-none focus:border-[#00a86b] focus:ring-1 focus:ring-[#00a86b]"
                type="text"
                placeholder="Tên hiển thị (tuỳ chọn)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {roleInfo && (
              <div className="flex justify-end">
                {roleInfo.type === "teacher" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
                    <Check size={13} className="stroke-[2.5]" />
                    {roleInfo.label}
                  </span>
                ) : roleInfo.type === "student" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    <CheckCircle2 size={13} />
                    {roleInfo.label}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-black/60 bg-white px-2.5 py-0.5 rounded-full border border-black/15">
                    {roleInfo.label}
                  </span>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center rounded-xl bg-[#04714a] px-4 py-3 font-semibold text-white transition-all hover:bg-[#03593a] disabled:opacity-50 cursor-pointer text-sm sm:text-base"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="animate-spin" size={16} />
                  Đang đăng nhập...
                </span>
              ) : (
                "Đăng nhập Dev"
              )}
            </button>
          </form>
        )}

        <div className="mt-8 rounded-2xl border border-black/5 bg-[#fcfcfb] p-4 text-xs text-black/50 leading-relaxed">
          <p className="font-semibold text-black/70 mb-1 flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#04714a]" /> Bảo mật & Tiện
            lợi:
          </p>
          Hệ thống dùng đăng nhập một lần (SSO) của Microsoft, bạn không cần tạo
          mật khẩu riêng.
        </div>
      </div>
    </main>
  );
}
