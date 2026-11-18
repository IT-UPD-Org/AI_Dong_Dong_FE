import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  HardDrive,
  LogIn,
  RefreshCw,
  Send,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";
import {
  type AccountRequest,
  type RequestStatus,
  type StorageRequest,
  type StorageRequestSize,
  type StudentStatus,
  STORAGE_REQUEST_SIZES_MB,
  requestApi,
} from "../api/approval.api";
import { ApiError } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { LandingFooter } from "../components/layout/LandingFooter";

const MB = 1024 * 1024;
type ActiveTab = "storage" | "bug";

const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: "Đang chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Bị từ chối",
};
const STATUS_STYLE: Record<RequestStatus, string> = {
  pending: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

function errorText(err: unknown, fallback: string): string {
  if (err instanceof ApiError || err instanceof Error) return err.message || fallback;
  return fallback;
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleString("vi-VN") : "";
}

const inputClass =
  "w-full rounded-xl border border-border bg-field text-foreground placeholder:text-muted-foreground px-4 py-3 text-sm outline-none transition-all focus:border-brand-bright focus:ring-2 focus:ring-brand/20";
const labelClass = "mb-2 block text-xs font-semibold uppercase tracking-wider text-fg-secondary";

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">{children}</div>;
}

function Notice({ tone, children }: { tone: "error" | "success" | "info"; children: React.ReactNode }) {
  const styles = {
    error: "border-destructive/20 bg-destructive/10 text-destructive",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
    info: "border-border bg-surface text-fg-secondary",
  }[tone];
  const Icon = tone === "error" ? AlertCircle : tone === "success" ? CheckCircle2 : AlertTriangle;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${styles}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Signed out: requests need a school Microsoft account. */
function SignInPrompt() {
  const navigate = useNavigate();
  return (
    <Card>
      <h2 className="text-xl font-bold text-foreground">Đăng nhập để gửi yêu cầu</h2>
      <p className="mt-2 text-sm text-fg-secondary">
        Mọi yêu cầu cần đăng nhập bằng tài khoản Microsoft của trường (@pduni.edu.vn cho sinh viên, @phuongdong.edu.vn
        cho giảng viên).
      </p>
      <button
        type="button"
        onClick={() => navigate("/login", { state: { from: "/approve" } })}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand-hover cursor-pointer"
      >
        <LogIn size={16} /> Đăng nhập bằng Microsoft
      </button>
    </Card>
  );
}

/** INACTIVE: the access request form. */
function AccountRequestForm({ onSent }: { onSent: () => Promise<void> }) {
  const [studentStatus, setStudentStatus] = useState<StudentStatus>("student");
  const [form, setForm] = useState({
    full_name: "",
    date_of_birth: "",
    student_id: "",
    class_code: "",
    major: "",
    faculty: "",
    phone_number: "",
    reason: "",
  });
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (form.full_name.trim().length < 2) return setError("Vui lòng nhập họ và tên.");
    if (!form.date_of_birth) return setError("Vui lòng nhập ngày sinh.");
    if (studentStatus === "student" && (!form.student_id.trim() || !form.class_code.trim()))
      return setError("Sinh viên cần nhập mã sinh viên và lớp.");
    if (form.reason.trim().length < 10) return setError("Mục đích sử dụng cần ít nhất 10 ký tự.");
    setSending(true);
    try {
      const trimmed = (value: string) => value.trim() || undefined;
      await requestApi.createAccount({
        full_name: form.full_name.trim(),
        date_of_birth: form.date_of_birth,
        student_status: studentStatus,
        student_id: studentStatus === "student" ? trimmed(form.student_id) : undefined,
        class_code: studentStatus === "student" ? trimmed(form.class_code) : undefined,
        major: trimmed(form.major),
        faculty: trimmed(form.faculty),
        phone_number: trimmed(form.phone_number),
        reason: form.reason.trim(),
      });
      await onSent();
    } catch (err) {
      setError(errorText(err, "Không thể gửi yêu cầu. Vui lòng thử lại."));
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-2 text-brand-text">
        <UserCheck size={20} />
        <h2 className="text-xl font-bold text-foreground">Yêu cầu cấp quyền truy cập</h2>
      </div>
      <p className="mt-2 text-sm text-fg-secondary">
        Tài khoản của bạn chưa được kích hoạt. Gửi thông tin bên dưới, quản trị viên sẽ xem xét và kích hoạt.
      </p>
      <form onSubmit={submit} className="mt-6 grid gap-5 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="req-name">Họ và tên *</label>
          <input id="req-name" className={inputClass} value={form.full_name} onChange={set("full_name")} maxLength={120} />
        </div>
        <div>
          <label className={labelClass} htmlFor="req-dob">Ngày sinh *</label>
          <input id="req-dob" type="date" className={inputClass} value={form.date_of_birth} onChange={set("date_of_birth")} />
        </div>
        <div>
          <span className={labelClass}>Bạn là *</span>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            {(["student", "teacher"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStudentStatus(value)}
                className={`rounded-lg py-2.5 text-sm font-semibold cursor-pointer ${
                  studentStatus === value ? "bg-card text-brand-text shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {value === "student" ? "Sinh viên" : "Giảng viên"}
              </button>
            ))}
          </div>
        </div>
        {studentStatus === "student" && (
          <>
            <div>
              <label className={labelClass} htmlFor="req-sid">Mã sinh viên *</label>
              <input id="req-sid" className={inputClass} value={form.student_id} onChange={set("student_id")} maxLength={40} />
            </div>
            <div>
              <label className={labelClass} htmlFor="req-class">Lớp *</label>
              <input id="req-class" className={inputClass} value={form.class_code} onChange={set("class_code")} maxLength={40} />
            </div>
          </>
        )}
        <div>
          <label className={labelClass} htmlFor="req-major">Ngành</label>
          <input id="req-major" className={inputClass} value={form.major} onChange={set("major")} maxLength={120} />
        </div>
        <div>
          <label className={labelClass} htmlFor="req-faculty">Khoa</label>
          <input id="req-faculty" className={inputClass} value={form.faculty} onChange={set("faculty")} maxLength={120} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="req-phone">Số điện thoại</label>
          <input id="req-phone" className={inputClass} value={form.phone_number} onChange={set("phone_number")} maxLength={20} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="req-reason">Mục đích sử dụng *</label>
          <textarea
            id="req-reason"
            rows={4}
            className={inputClass}
            value={form.reason}
            onChange={set("reason")}
            maxLength={2000}
            placeholder="Học tập, làm đồ án, nghiên cứu khoa học..."
          />
        </div>
        {error && (
          <div className="sm:col-span-2">
            <Notice tone="error">{error}</Notice>
          </div>
        )}
        <div className="sm:col-span-2">
          <SubmitButton sending={sending} label="Gửi yêu cầu cấp quyền" />
        </div>
      </form>
    </Card>
  );
}

function SubmitButton({ sending, label }: { sending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={sending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground hover:bg-brand-hover disabled:opacity-60 cursor-pointer sm:w-auto"
    >
      {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
      {sending ? "Đang gửi..." : label}
    </button>
  );
}

/** PENDING: the request is waiting for an admin. */
function PendingNotice({ request }: { request: AccountRequest | undefined }) {
  return (
    <Card>
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
        <Clock size={20} />
        <h2 className="text-xl font-bold text-foreground">Yêu cầu đang chờ duyệt</h2>
      </div>
      <p className="mt-2 text-sm text-fg-secondary">
        Quản trị viên sẽ xem xét yêu cầu của bạn. Khi được duyệt, bạn có thể dùng UAI ngay.
      </p>
      {request && (
        <p className="mt-4 text-xs text-muted-foreground">Đã gửi lúc {formatDate(request.created_at)}</p>
      )}
    </Card>
  );
}

function RejectedNotice({ request }: { request: AccountRequest }) {
  return (
    <div className="mb-4">
      <Notice tone="error">
        <p className="font-semibold">Yêu cầu trước đã bị từ chối.</p>
        {request.admin_note && <p className="mt-1">Lý do: {request.admin_note}</p>}
        <p className="mt-1">Bạn có thể gửi lại yêu cầu bên dưới.</p>
      </Notice>
    </div>
  );
}

/** ACTIVE: ask for more storage. */
function StorageRequestPanel({ limit, used }: { limit: number; used: number }) {
  const [requests, setRequests] = useState<StorageRequest[]>([]);
  const [size, setSize] = useState<StorageRequestSize | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    requestApi.listStorage().then(setRequests).catch(() => setRequests([]));
  }, []);
  useEffect(load, [load]);

  const choices = STORAGE_REQUEST_SIZES_MB.filter((mb) => mb * MB > limit);
  const pending = requests.find((r) => r.status === "pending");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!size) return setError("Vui lòng chọn dung lượng.");
    if (reason.trim().length < 10) return setError("Lý do cần ít nhất 10 ký tự.");
    setSending(true);
    try {
      await requestApi.createStorage(size, reason.trim());
      setSent(true);
      setReason("");
      load();
    } catch (err) {
      setError(errorText(err, "Không thể gửi yêu cầu. Vui lòng thử lại."));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-fg-secondary">
        Đang dùng <strong>{(used / MB).toFixed(1)} MB</strong> / {Math.round(limit / MB)} MB.
      </p>
      {sent && <Notice tone="success">Đã gửi yêu cầu. Quản trị viên sẽ xem xét sớm.</Notice>}
      {pending ? (
        <Notice tone="info">
          Bạn đã có yêu cầu {pending.storage_mb} MB đang chờ duyệt (gửi lúc {formatDate(pending.created_at)}).
        </Notice>
      ) : choices.length === 0 ? (
        <Notice tone="info">Bạn đã có mức dung lượng cao nhất.</Notice>
      ) : (
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div>
            <span className={labelClass}>Dung lượng mong muốn *</span>
            <div className="grid gap-3 sm:grid-cols-2">
              {choices.map((mb) => (
                <button
                  key={mb}
                  type="button"
                  onClick={() => setSize(mb)}
                  className={`rounded-xl border p-4 text-left cursor-pointer transition-colors ${
                    size === mb
                      ? "border-brand bg-brand-soft text-brand-text"
                      : "border-border hover:border-brand-bright text-foreground bg-card"
                  }`}
                >
                  <span className="block text-lg font-bold">{mb} MB</span>
                  <span className="text-xs text-muted-foreground">
                    {mb === 512 ? "Mở rộng tài liệu học tập" : "Nghiên cứu & đồ án tốt nghiệp"}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="storage-reason">Lý do *</label>
            <textarea
              id="storage-reason"
              rows={3}
              className={inputClass}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={2000}
            />
          </div>
          {error && <Notice tone="error">{error}</Notice>}
          <SubmitButton sending={sending} label="Gửi yêu cầu" />
        </form>
      )}
      {requests.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-fg-secondary">Yêu cầu đã gửi</h3>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  {r.storage_mb} MB · <span className="text-muted-foreground">{formatDate(r.created_at)}</span>
                  {r.admin_note && <span className="block text-xs text-muted-foreground">Ghi chú: {r.admin_note}</span>}
                </span>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** ACTIVE: report a bug through Sentry user feedback. */
function BugReportPanel() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [affectedPage, setAffectedPage] = useState("");
  const [error, setError] = useState("");
  const [sentId, setSentId] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (title.trim().length < 5) return setError("Tiêu đề cần ít nhất 5 ký tự.");
    if (description.trim().length < 10) return setError("Mô tả cần ít nhất 10 ký tự.");
    try {
      setSentId(requestApi.reportBug({
          title: title.trim(),
          description: description.trim(),
          affectedPage: affectedPage.trim(),
          name: user?.name,
          email: user?.email,
        }));
      setTitle("");
      setDescription("");
      setAffectedPage("");
    } catch (err) {
      setError(errorText(err, "Không thể gửi báo lỗi. Vui lòng thử lại."));
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {sentId && <Notice tone="success">Cảm ơn bạn! Báo lỗi đã được gửi (mã {sentId.slice(0, 8)}).</Notice>}
      <div>
        <label className={labelClass} htmlFor="bug-title">Tiêu đề *</label>
        <input id="bug-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
      </div>
      <div>
        <label className={labelClass} htmlFor="bug-page">Trang gặp lỗi</label>
        <input
          id="bug-page"
          className={inputClass}
          value={affectedPage}
          onChange={(e) => setAffectedPage(e.target.value)}
          placeholder="Ví dụ: Trò chuyện, Tài liệu..."
          maxLength={120}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="bug-desc">Mô tả lỗi *</label>
        <textarea
          id="bug-desc"
          rows={5}
          className={inputClass}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={4000}
          placeholder="Bạn đã làm gì, điều gì xảy ra, và bạn mong đợi điều gì?"
        />
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <SubmitButton sending={false} label="Gửi báo lỗi" />
    </form>
  );
}

function ActiveRequests() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: ActiveTab = searchParams.get("type") === "bug_report" ? "bug" : "storage";
  const select = (next: ActiveTab) => setSearchParams({ type: next === "bug" ? "bug_report" : "storage_increase" });
  if (!user) return null;

  return (
    <Card>
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1.5">
        {(
          [
            ["storage", "Tăng dung lượng lưu trữ", HardDrive],
            ["bug", "Báo lỗi hệ thống", AlertTriangle],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => select(key)}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold cursor-pointer ${
              tab === key ? "bg-card text-brand-text shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>
      {tab === "storage" ? <StorageRequestPanel limit={user.storage_limit} used={user.storage_used} /> : <BugReportPanel />}
    </Card>
  );
}

export function ApprovePage() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const [accountRequests, setAccountRequests] = useState<AccountRequest[] | null>(null);

  const loadAccountRequests = useCallback(async () => {
    try {
      setAccountRequests(await requestApi.listAccount());
    } catch {
      setAccountRequests([]);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) void loadAccountRequests();
  }, [isAuthenticated, loadAccountRequests]);

  const onAccountRequestSent = async () => {
    await refreshUser();
    await loadAccountRequests();
  };

  const latest = accountRequests?.[0];
  let body: React.ReactNode;
  if (isLoading) {
    body = (
      <Card>
        <div className="flex items-center gap-2 text-sm text-fg-secondary">
          <RefreshCw size={16} className="animate-spin" /> Đang tải...
        </div>
      </Card>
    );
  } else if (!isAuthenticated || !user) {
    body = <SignInPrompt />;
  } else if (user.state === "disable") {
    body = (
      <Card>
        <div className="flex items-center gap-2 text-destructive">
          <XCircle size={20} />
          <h2 className="text-xl font-bold text-foreground">Tài khoản đã bị khoá</h2>
        </div>
        <p className="mt-2 text-sm text-fg-secondary">Vui lòng liên hệ quản trị viên.</p>
      </Card>
    );
  } else if (user.state === "pending") {
    body = <PendingNotice request={latest} />;
  } else if (user.state === "inactive") {
    body = (
      <>
        {latest?.status === "rejected" && <RejectedNotice request={latest} />}
        <AccountRequestForm onSent={onAccountRequestSent} />
      </>
    );
  } else {
    body = <ActiveRequests />;
  }

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <section className="border-b border-border bg-card px-4 py-8 sm:px-6 md:px-12">
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Đường dẫn trang" className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Link to="/" className="hover:text-brand-text">Trang chủ</Link>
            <ChevronRight size={14} className="opacity-40" />
            <span className="font-semibold text-brand-text">Cấp phép tài khoản</span>
          </nav>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-text">
            <ShieldCheck size={14} /> CỔNG TIẾP NHẬN YÊU CẦU UAI
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">Cấp phép tài khoản UAI</h1>
          <p className="mt-3 max-w-2xl text-sm text-fg-secondary sm:text-base">
            Yêu cầu cấp quyền truy cập, tăng dung lượng lưu trữ hoặc báo lỗi khi sử dụng UAI.
          </p>
        </div>
      </section>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">{body}</main>
      <LandingFooter />
    </div>
  );
}
