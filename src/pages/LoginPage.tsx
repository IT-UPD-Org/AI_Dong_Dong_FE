import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { mockSignIn } from "../services/auth.service";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Trạng thái hiển thị thẻ Authenticator
  const [showAuthCard, setShowAuthCard] = useState(false);
  const [authCode, setAuthCode] = useState<number | null>(null);

  const nav = useNavigate();

  // Xác định vai trò hoặc kiểm tra hạn chế đuôi email
  const getRoleInfo = (emailValue: string) => {
    const cleanEmail = emailValue.trim().toLowerCase();

    // Kiểm tra nếu là tài khoản Gmail cá nhân
    if (cleanEmail.endsWith("@gmail.com")) {
      return { type: "restricted" as const, label: "Không được cấp phép" };
    }

    // Kiểm tra email nhà trường
    if (cleanEmail.endsWith("@phuongdong.edu.vn")) {
      return { type: "teacher" as const, label: "Giảng viên" };
    }
    if (cleanEmail.endsWith("@pduni.edu.vn")) {
      return { type: "student" as const, label: "Sinh viên" };
    }
    return null;
  };

  const roleInfo = getRoleInfo(email);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    // Chặn đăng nhập nếu là tài khoản Gmail
    if (roleInfo?.type === "restricted") {
      setError("Tài khoản Gmail cá nhân không được cấp phép truy cập.");
      return;
    }

    if (!roleInfo) {
      setError(
        "Email phải thuộc tên miền @phuongdong.edu.vn hoặc @pduni.edu.vn",
      );
      return;
    }

    try {
      await mockSignIn(email, password);

      // Tạo số ngẫu nhiên cho Authenticator
      const randomCode = Math.floor(10 + Math.random() * 90);
      setAuthCode(randomCode);
      setShowAuthCard(true);

      // Giả lập tự động chuyển hướng sau khi bấm/xác nhận trên app
      setTimeout(() => {
        nav("/chat");
      }, 5000);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    /* Đã giảm py-12 xuống py-4 để tối ưu khoảng trống thừa phía trên */
    <main className="grid min-h-[calc(100vh-60px)] place-items-center px-6 py-4">
      <div className="w-full max-w-md">
        {/* Đã giảm mb-12 xuống mb-6 */}
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-black/55 hover:text-black"
        >
          <ArrowLeft size={16} />
          Trở về trang chủ
        </Link>
        <p className="mono text-xs uppercase tracking-[.18em] text-[#04714a]">
          Chào mừng trở lại
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-.06em] md:text-5xl">
          Đăng nhập vào IT UPD GenAI.
        </h1>
        <p className="mt-2 text-black/55">
          Sử dụng email nhà trường của bạn để tiếp tục.
        </p>

        <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
          {/* Container cho input email và badge hiển thị góc phải */}
          <div className="relative flex flex-col">
            <input
              className={`rounded-xl border bg-white px-4 py-3 outline-none transition-colors ${
                roleInfo?.type === "restricted"
                  ? "border-red-500 focus:border-red-600"
                  : "border-black/15 focus:border-[#00a86b]"
              }`}
              type="email"
              placeholder="Email nhà trường"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Nhãn hiển thị vai trò / cảnh báo bên dưới góc phải */}
            {roleInfo && (
              <div className="mt-1.5 flex justify-end">
                {roleInfo.type === "restricted" ? (
                  /* Cảnh báo Gmail: Chữ đỏ + Icon cảnh báo */
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                    <AlertCircle size={14} />
                    {roleInfo.label}
                  </span>
                ) : roleInfo.type === "teacher" ? (
                  /* Giảng viên: Chữ xanh + Tích V */
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                    <Check size={14} className="stroke-[2.5]" />
                    {roleInfo.label}
                  </span>
                ) : (
                  /* Sinh viên: Chữ vàng + Tích tròn */
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <CheckCircle2 size={14} />
                    {roleInfo.label}
                  </span>
                )}
              </div>
            )}
          </div>

          <input
            className="rounded-xl border border-black/15 bg-white px-4 py-3 outline-none focus:border-[#00a86b]"
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            className="rounded-xl bg-[#11130f] px-4 py-3 font-semibold text-white hover:bg-[#04714a] transition-colors"
          >
            Tiếp tục <ArrowUpRight className="ml-1 inline" size={16} />
          </button>
        </form>

        {/* THẺ AUTHENTICATOR HIỂN THỊ BÊN DƯỚI SAU KHÍ SUBMIT */}
        {showAuthCard && (
          <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#04714a]/10 text-[#04714a]">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  Đang gửi Authenticator...
                </h3>
                <p className="text-xs text-gray-500">
                  Xác nhận số dưới đây vào ứng dụng của bạn
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Mã xác nhận:
              </span>
              <span className="text-3xl font-extrabold text-[#04714a] tracking-widest">
                {authCode}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
              <Loader2 className="animate-spin" size={14} />
              <span>Đang chờ phê duyệt từ thiết bị...</span>
            </div>
          </div>
        )}

        <p className="mt-6 text-sm text-black/55">
          Bạn mới sử dụng lần đầu?{" "}
          <Link className="font-semibold text-[#04714a]" to="/register">
            Tạo tài khoản mới
          </Link>
        </p>
      </div>
    </main>
  );
}
