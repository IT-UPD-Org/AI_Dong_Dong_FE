import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function AuthVerifyPage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const location = useLocation();
  const { verifyMagicLink } = useAuth();

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  const token = params.get("token");

  // Sau khi xác thực thành công, redirect về trang user muốn vào trước đó
  // (được lưu trong state.from khi ProtectedRoute chặn lại), hoặc về /chat
  const redirectTo: string = (location.state as any)?.from ?? "/chat";

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Liên kết đăng nhập không hợp lệ hoặc thiếu mã xác thực (token).");
      return;
    }

    let isMounted = true;

    verifyMagicLink(token)
      .then(() => {
        if (!isMounted) return;
        setStatus("success");
        setTimeout(() => {
          nav(redirectTo, { replace: true });
        }, 1200);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setStatus("error");
        setErrorMessage(
          err.message || "Xác thực liên kết không thành công. Liên kết có thể đã hết hạn hoặc đã được sử dụng."
        );
      });

    return () => { isMounted = false; };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="grid min-h-[calc(100vh-80px)] place-items-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 shadow-sm text-center">
        {status === "verifying" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#04714a]/10 text-[#04714a]">
              <Loader2 className="animate-spin" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Đang xác thực liên kết...</h2>
            <p className="text-sm text-black/60 max-w-xs leading-relaxed">
              Hệ thống đang kiểm tra chữ ký và cấp quyền truy cập vào tài khoản của bạn.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-700 animate-in zoom-in-50 duration-300">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Đăng nhập thành công!</h2>
            <p className="text-sm text-green-700 font-medium">
              Quyền truy cập đã được kích hoạt. Đang chuyển hướng...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <AlertCircle size={36} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Xác thực thất bại</h2>
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 text-left leading-relaxed">
              {errorMessage}
            </p>
            <div className="mt-4 flex flex-col gap-2 w-full">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#11130f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#04714a] transition-colors"
              >
                Gửi lại liên kết đăng nhập <ArrowRight size={16} />
              </Link>
              <Link to="/" className="text-xs text-black/55 hover:text-black py-2 transition-colors">
                Quay về trang chủ
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
