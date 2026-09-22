import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const MOCK_ACCOUNTS = [
  { email: "dung.nm@phuongdong.edu.vn", name: "Nguyễn Mạnh Dũng" },
  { email: "test.student@pduni.edu.vn", name: "Sinh viên Demo" },
];

export function MockMicrosoftLoginPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [selected, setSelected] = useState<string | null>(null);

  function approve() {
    const account = MOCK_ACCOUNTS.find((a) => a.email === selected);
    if (!account) return;
    const redirectUri = params.get("redirect_uri") || "/auth/callback";
    // Giả lập Microsoft trả code về FE
    nav(
      `${redirectUri}?mock_email=${encodeURIComponent(account.email)}&mock_name=${encodeURIComponent(account.name)}`,
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f3f2f1] px-4">
      <div className="w-full max-w-sm rounded-lg border border-black/10 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 23 23">
            <path fill="#f35325" d="M1 1h10v10H1z" />
            <path fill="#81bc06" d="M12 1h10v10H12z" />
            <path fill="#05a6f0" d="M1 12h10v10H1z" />
            <path fill="#ffba08" d="M12 12h10v10H12z" />
          </svg>
          <span className="text-lg text-[#1b1b1b]">Microsoft</span>
        </div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-600">
          Chế độ giả lập (mock) — chưa kết nối Azure AD thật
        </p>
        <h1 className="mb-6 text-xl font-semibold text-[#1b1b1b]">
          Chọn một tài khoản
        </h1>
        <div className="flex flex-col gap-2">
          {MOCK_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              onClick={() => setSelected(acc.email)}
              className={`rounded-md border px-4 py-3 text-left transition-colors ${
                selected === acc.email
                  ? "border-[#05a6f0] bg-[#05a6f0]/5"
                  : "border-black/10 hover:bg-black/[.03]"
              }`}
            >
              <div className="text-sm font-medium text-[#1b1b1b]">
                {acc.name}
              </div>
              <div className="text-xs text-black/55">{acc.email}</div>
            </button>
          ))}
        </div>
        <button
          disabled={!selected}
          onClick={approve}
          className="mt-6 w-full rounded-sm bg-[#0067b8] px-4 py-2.5 font-medium text-white disabled:opacity-40"
        >
          Đăng nhập
        </button>
      </div>
    </main>
  );
}
