import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  AlertCircle,
  Mail,
  RefreshCw,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const { requestMagicLink } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [mockVerifyUrl, setMockVerifyUrl] = useState<string | null>(null);

  // Đếm ngược gửi lại
  useEffect(() => {
    let timer: any;
    if (isSent && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSent, resendCountdown]);

  // Nhận diện vai trò hoặc đuôi email
  const getRoleInfo = (emailValue: string) => {
    const cleanEmail = emailValue.trim().toLowerCase();
    if (!cleanEmail) return null;

    if (cleanEmail.endsWith("@gmail.com")) {
      return {
        type: "restricted" as const,
        label: "Không được cấp phép (Chỉ chấp nhận email trường)",
      };
    }
    if (cleanEmail.endsWith("@phuongdong.edu.vn")) {
      return { type: "teacher" as const, label: "Giảng viên Phương Đông" };
    }
    if (cleanEmail.endsWith("@pduni.edu.vn")) {
      return { type: "student" as const, label: "Sinh viên Phương Đông" };
    }
    return { type: "unknown" as const, label: "Email chưa được hỗ trợ" };
  };

  const roleInfo = getRoleInfo(email);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (
      !roleInfo ||
      roleInfo.type === "restricted" ||
      roleInfo.type === "unknown"
    ) {
      setError(
        "Email phải thuộc tên miền @phuongdong.edu.vn (Giảng viên) hoặc @pduni.edu.vn (Sinh viên).",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await requestMagicLink(email.trim().toLowerCase());
      setIsSent(true);
      setResendCountdown(60);
      if (res.mockVerifyUrl) {
        setMockVerifyUrl(res.mockVerifyUrl);
      }
    } catch (err: any) {
      setError(
        err.message || "Không thể gửi email đăng nhập. Vui lòng thử lại sau.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-[calc(100vh-80px)] place-items-center px-6 py-6">
      <div className="w-full max-w-lg">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-black/55 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} />
          Trở về trang chủ
        </Link>

        {!isSent ? (
          <div>
            <p className="text-xs uppercase tracking-[.18em] text-[#04714a]">
              Xác thực không cần mật khẩu
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-[-.06em] md:text-4xl text-[#11130f]">
              Đăng nhập vào IT UPD GenAI.
            </h1>
            <p className="mt-2 text-black/60 text-sm leading-relaxed">
              Nhập email nhà trường của bạn. Chúng tôi sẽ gửi một liên kết đăng
              nhập an toàn trực tiếp đến hộp thư của bạn.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
              <div className="relative flex flex-col">
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-3.5 text-black/35"
                    size={18}
                  />
                  <input
                    className={`w-full rounded-xl border bg-white pl-11 pr-4 py-3 text-sm outline-none transition-all ${
                      roleInfo?.type === "restricted" ||
                      roleInfo?.type === "unknown"
                        ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500"
                        : "border-black/15 focus:border-[#00a86b] focus:ring-1 focus:ring-[#00a86b]"
                    }`}
                    type="email"
                    placeholder="ví_dụ: sinhvien@pduni.edu.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {/* Nhãn vai trò */}
                {roleInfo && (
                  <div className="mt-2 flex justify-end">
                    {roleInfo.type === "restricted" ||
                    roleInfo.type === "unknown" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                        <AlertCircle size={13} />
                        {roleInfo.label}
                      </span>
                    ) : roleInfo.type === "teacher" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
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

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex items-center justify-center rounded-xl bg-[#11130f] px-4 py-3 font-semibold text-white transition-all hover:bg-[#04714a] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="animate-spin" size={16} />
                    Đang gửi liên kết...
                  </span>
                ) : (
                  <>
                    Gửi liên kết đăng nhập{" "}
                    <ArrowUpRight className="ml-1 inline" size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 rounded-2xl border border-black/5 bg-[#fcfcfb] p-4 text-xs text-black/50 leading-relaxed">
              <p className="font-semibold text-black/70 mb-1 flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#04714a]" /> Bảo mật & Tiện
                lợi:
              </p>
              Bạn không cần phải nhớ mật khẩu. Khi nhấp vào liên kết trong
              email, hệ thống sẽ xác thực và tự động cấp quyền truy cập vào
              phòng chat AI và kho tri thức.
            </div>
          </div>
        ) : (
          /* MÀN HÌNH ĐÃ GỬI EMAIL THÀNH CÔNG */
          <div className="rounded-3xl border border-black/10 bg-white p-7 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#04714a]/10 text-[#04714a] mb-5">
              <Mail size={28} />
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Kiểm tra hộp thư của bạn
            </h2>
            <p className="mt-2 text-sm text-black/60 leading-relaxed">
              Chúng tôi đã gửi một liên kết đăng nhập an toàn đến địa chỉ:
            </p>
            <p className="mt-1 font-semibold text-[#04714a] text-base break-all bg-green-50/60 border border-green-200/60 rounded-xl px-3.5 py-2">
              {email}
            </p>
            <p className="mt-3 text-xs text-black/50 leading-relaxed">
              Vui lòng mở email và nhấn vào liên kết xác thực để hoàn tất đăng
              nhập. Nếu không thấy trong hộp thư chính, bạn hãy kiểm tra thêm
              mục <strong>Thư rác (Spam)</strong>.
            </p>

            {/* Dev Mock Helper: Khi BE chưa xong, cho phép dev click trực tiếp */}
            {mockVerifyUrl && (
              <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50/70 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-900">
                    Chế độ Dev (BE chưa xong):
                  </span>
                  <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-full">
                    Giả lập click email
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 mt-1">
                  Nhấn vào nút bên dưới để mô phỏng hành động mở link từ email:
                </p>
                <Link
                  to={mockVerifyUrl}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#04714a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#03593a] transition-colors"
                >
                  <ExternalLink size={13} />
                  Mở liên kết xác thực ngay
                </Link>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 pt-4 border-t border-black/10">
              <button
                type="button"
                disabled={resendCountdown > 0 || isSubmitting}
                onClick={handleSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/15 bg-white px-4 py-2.5 text-xs font-semibold text-black/75 hover:bg-black/5 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <RefreshCw
                  size={13}
                  className={isSubmitting ? "animate-spin" : ""}
                />
                {resendCountdown > 0
                  ? `Gửi lại email sau (${resendCountdown}s)`
                  : "Gửi lại email xác thực"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSent(false);
                  setMockVerifyUrl(null);
                  setError("");
                }}
                className="text-xs font-medium text-black/55 hover:text-black text-center transition-colors py-1 cursor-pointer"
              >
                Nhập địa chỉ email khác
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
