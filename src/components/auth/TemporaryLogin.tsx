import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  Info,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import type { UserRole } from "../../api/types";

interface TemporaryLoginProps {
  redirectTo?: string;
  onSwitchToOfficial?: () => void;
}

interface DemoAccount {
  id: string;
  role: UserRole;
  roleCode: string;
  name: string;
  email: string;
  label: string;
  badge: string;
  badgeColor: string;
  description: string;
  credits: number;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "usr_demo_student",
    role: "student",
    roleCode: "PDlearner",
    name: "Nguyễn Văn Sinh Viên",
    email: "sinhvien.demo@pduni.edu.vn",
    label: "Sinh viên Phương Đông",
    badge: "Sinh viên",
    badgeColor: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
    description: "Học tập, hỏi đáp với AI, tra cứu tài liệu học phần",
    credits: 1000,
  },
  {
    id: "usr_demo_teacher",
    role: "teacher",
    roleCode: "PDteacher",
    name: "ThS. Trần Thị Giảng Viên",
    email: "giangvien.demo@phuongdong.edu.vn",
    label: "Giảng viên Phương Đông",
    badge: "Giảng viên",
    badgeColor: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
    description: "Quản lý bài giảng, tải tài liệu chuyên sâu, khai thác kho tri thức",
    credits: 2500,
  },
  {
    id: "usr_demo_admin",
    role: "admin",
    roleCode: "admin",
    name: "Quản trị viên Đông Đông",
    email: "admin.demo@phuongdong.edu.vn",
    label: "Quản trị viên hệ thống",
    badge: "Quản trị viên",
    badgeColor: "bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30",
    description: "Toàn quyền quản trị Dashboard (/admin), người dùng, tệp, models và providers",
    credits: 9999,
  },
];

export function TemporaryLogin({ redirectTo = "/chat", onSwitchToOfficial }: TemporaryLoginProps) {
  const { devLogin } = useAuth();
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  async function handleQuickLogin(account: DemoAccount) {
    setError("");
    setLoadingRole(account.roleCode);

    try {
      // Chỉ gửi yêu cầu xác thực thật tới backend (/api/auth/fake-login)
      await devLogin(account.email, account.name);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(
        (err as Error).message ||
          "Đăng nhập phát triển thất bại. Backend không hỗ trợ endpoint /api/auth/fake-login hoặc đang tắt chế độ DEV."
      );
    } finally {
      setLoadingRole(null);
    }
  }

  return (
    <main className="grid min-h-[calc(100vh-80px)] place-items-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Trở về trang chủ
        </Link>

        {/* Header thông tin */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300">
              <Sparkles size={16} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Chế độ thử nghiệm
              </p>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Đăng nhập thử nghiệm
              </h1>
            </div>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-fg-secondary leading-relaxed">
            Chỉ sử dụng trong môi trường phát triển và demo nội bộ. Bấm vào một vai trò bên dưới để tạo phiên đăng nhập tức thì.
          </p>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs font-medium text-destructive">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Danh sách các nút vai trò được hỗ trợ */}
        <div className="mt-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Chọn vai trò đăng nhập nhanh
          </p>

          {DEMO_ACCOUNTS.map((account) => {
            const isLoggingIn = loadingRole === account.roleCode;
            const RoleIcon =
              account.role === "admin"
                ? ShieldCheck
                : account.role === "teacher"
                ? UserCheck
                : GraduationCap;

            return (
              <button
                key={account.roleCode}
                type="button"
                onClick={() => handleQuickLogin(account)}
                disabled={loadingRole !== null}
                className="group relative flex w-full flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5 text-left transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:bg-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand-text transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                    <RoleIcon size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-foreground group-hover:text-brand-text transition-colors">
                        {account.label}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${account.badgeColor}`}
                      >
                        {account.roleCode}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-fg-secondary truncate">
                      {account.email} · {account.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {account.description}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-end sm:self-center">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3.5 py-2 text-xs font-semibold text-background transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                    {isLoggingIn ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        Đang vào...
                      </>
                    ) : (
                      <>
                        Vào bằng vai trò này
                        <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Lưu ý về các vai trò mở rộng chưa có trong enum */}
        <div className="mt-6 rounded-2xl border border-border bg-surface p-4 text-xs text-muted-foreground leading-relaxed">
          <div className="flex items-center gap-1.5 font-semibold text-fg-secondary mb-1">
            <Info size={14} className="text-brand-text shrink-0" />
            <span>Thông tin phân quyền hệ thống:</span>
          </div>
          <p>
            Hệ thống hiện tại hỗ trợ 3 vai trò chính thức trong enum dữ liệu (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-brand-text">student</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-brand-text">teacher</code>,{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-brand-text">admin</code>
            ). Các vai trò như Kế toán (<span className="font-mono text-[11px]">PDaccountant</span>), Lãnh đạo (<span className="font-mono text-[11px]">PDheadleader</span>) và Tài khoản công khai (<span className="font-mono text-[11px]">PDpublic</span>) sẽ được tích hợp khi Backend hoàn tất mô hình phân quyền mở rộng.
          </p>
        </div>

        {/* Nút chuyển đổi sang giao diện chính thức nếu muốn */}
        {onSwitchToOfficial && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={onSwitchToOfficial}
              className="text-xs text-muted-foreground underline hover:text-brand-text cursor-pointer"
            >
              Chuyển sang giao diện đăng nhập Microsoft chính thức
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
