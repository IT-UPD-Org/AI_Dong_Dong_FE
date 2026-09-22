import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { completeMicrosoftLogin } from "../services/auth.service";

export function AuthCallbackPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    completeMicrosoftLogin(searchParams)
      .then((data) => {
        localStorage.setItem("access_token", data.access_token);
        nav("/chat", { replace: true });
      })
      .catch((err) => {
        setError(err.message || "Đăng nhập Microsoft thất bại.");
        setTimeout(() => nav("/login", { replace: true }), 2500);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="grid min-h-[calc(100vh-60px)] place-items-center px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        {error ? (
          <p className="text-sm font-medium text-red-600">{error}</p>
        ) : (
          <>
            <Loader2 className="animate-spin text-[#04714a]" size={28} />
            <p className="text-sm text-black/55">
              Đang xác thực với Microsoft...
            </p>
          </>
        )}
      </div>
    </main>
  );
}
