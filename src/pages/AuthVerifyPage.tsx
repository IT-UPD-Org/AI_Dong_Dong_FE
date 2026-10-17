import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { readMicrosoftCallback } from "../lib/microsoftAuth";

/** Landing page for the Microsoft redirect; exchanges the code with the backend. */
export function AuthVerifyPage() {
  const nav = useNavigate();
  const { microsoftLogin } = useAuth();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  // StrictMode runs effects twice in dev; the code is single-use, so exchange it once.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let callback: ReturnType<typeof readMicrosoftCallback>;
    try {
      callback = readMicrosoftCallback(window.location.search);
    } catch (err) {
      setStatus("error");
      setErrorMessage((err as Error).message);
      return;
    }

    microsoftLogin(callback.code, callback.codeVerifier, callback.nonce)
      .then(() => {
        setStatus("success");
        setTimeout(() => nav(callback.returnTo, { replace: true }), 800);
      })
      .catch((err: Error) => {
        setStatus("error");
        setErrorMessage(err.message || "Đăng nhập Microsoft không thành công.");
      });
  }, [microsoftLogin, nav]);

  return (
    <main className="grid min-h-[calc(100vh-80px)] place-items-center px-6 py-6">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 text-center shadow-sm">
        {status === "verifying" && (
          <>
            <Loader2 className="mx-auto animate-spin text-[#04714a]" size={36} />
            <h1 className="mt-5 text-xl font-bold text-gray-900">Đang xác thực...</h1>
            <p className="mt-2 text-sm text-black/55">Vui lòng chờ trong giây lát.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="mx-auto text-[#04714a]" size={40} />
            <h1 className="mt-5 text-xl font-bold text-gray-900">Đăng nhập thành công</h1>
            <p className="mt-2 text-sm text-black/55">Đang chuyển hướng...</p>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="mx-auto text-red-600" size={40} />
            <h1 className="mt-5 text-xl font-bold text-gray-900">Không thể đăng nhập</h1>
            <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
            <Link
              to="/login"
              replace
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#11130f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#04714a]"
            >
              Thử lại <ArrowRight size={16} />
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
