import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MessagesSquare } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_PAGE_SIZE, adminApi } from "../../api/admin.api";
import type { AdminUserUpdate, User, UserRole, UserState } from "../../api/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { useAuth } from "../../contexts/AuthContext";
import {
  ListState,
  Pager,
  adminTabUrl,
  formatBytes,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  usePagedList,
} from "./shared";

const ROLE_LABEL: Record<UserRole, string> = { student: "Sinh viên", teacher: "Giảng viên", admin: "Quản trị" };
const STATE_LABEL: Record<UserState, string> = {
  inactive: "Chưa kích hoạt",
  pending: "Chờ duyệt",
  active: "Hoạt động",
  disable: "Đã khoá",
};
const STATE_STYLE: Record<UserState, string> = {
  inactive: "border-border bg-muted text-muted-foreground",
  active: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  disable: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
};

export function UsersTab() {
  const { user: me, setUser: setMe } = useAuth();
  const load = useCallback((page: number) => adminApi.getUsers(page), []);
  const list = usePagedList(load, ADMIN_PAGE_SIZE);
  const [busyId, setBusyId] = useState<string | null>(null);

  // The opened user lives in the URL so the view can be linked (e.g. from the Chats tab).
  const [params, setParams] = useSearchParams();
  const openId = params.get("user_id");
  const [detail, setDetail] = useState<User | null>(null);
  const [detailState, setDetailState] = useState<"idle" | "loading" | "missing" | "error">("idle");

  // Fetch the opened user directly: they may not be on the current page of the list.
  useEffect(() => {
    setDetail(null);
    if (!openId) {
      setDetailState("idle");
      return;
    }
    let current = true;
    setDetailState("loading");
    adminApi
      .getUsers(1, openId)
      .then((found) => {
        if (!current) return;
        setDetail(found[0] ?? null);
        setDetailState(found[0] ? "idle" : "missing");
      })
      .catch(() => current && setDetailState("error"));
    return () => {
      current = false;
    };
  }, [openId]);

  const openUser = (id: string) => setParams({ tab: "users", user_id: id }, { replace: true });
  const closeUser = () => setParams({ tab: "users" }, { replace: true });

  const replace = (updated: User) => {
    list.setItems((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setDetail((prev) => (prev?.id === updated.id ? updated : prev));
    // Editing yourself: keep the signed-in account (sidebar, header) in step with the server answer.
    if (updated.id === me?.id) setMe(updated);
  };

  /** Send only what changed; the backend applies the given fields and returns the user. */
  async function update(user: User, changes: AdminUserUpdate, done: string): Promise<boolean> {
    setBusyId(user.id);
    try {
      replace(await adminApi.updateUser(user.id, changes));
      toast.success(done);
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusyId(null);
    }
  }

  function changeCredits(user: User, raw: string) {
    const credits = Number(raw);
    if (raw.trim() === "" || !Number.isInteger(credits) || credits < 0) {
      toast.error("Credits phải là số nguyên không âm.");
      return;
    }
    if (credits !== user.credits) void update(user, { credits }, `Đã đổi credits của ${user.display_name}.`);
  }

  return (
    <section className="min-w-0">
      <p className="mb-4 text-sm text-muted-foreground">
        Quản lý mọi tài khoản: vai trò, trạng thái và credits. Duyệt yêu cầu cấp quyền ở thẻ Yêu cầu.
      </p>
      <ListState loading={list.loading} error={list.error} empty={list.items.length === 0} emptyText="Chưa có người dùng.">
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead className="px-3 sm:px-4">Tên</TableHead>
                <TableHead className="px-3">Email</TableHead>
                <TableHead className="px-3">Vai trò</TableHead>
                <TableHead className="px-3">Dung lượng</TableHead>
                <TableHead className="px-3">Credits</TableHead>
                <TableHead className="px-3 sm:px-4 text-right">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((user) => {
                const busy = busyId === user.id;
                const isMe = me?.id === user.id;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="px-3 sm:px-4 font-medium text-foreground">
                      <button
                        type="button"
                        onClick={() => openUser(user.id)}
                        className="cursor-pointer rounded py-1 text-left font-medium text-foreground underline-offset-2 hover:text-brand-text hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {user.display_name}
                      </button>
                      {isMe && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(bạn)</span>}
                    </TableCell>
                    <TableCell className="px-3 text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="px-3">
                      <select
                        value={user.role}
                        disabled={busy}
                        onChange={(e) => {
                          const role = e.target.value as UserRole;
                          if (role !== user.role) void update(user, { role }, `Đã đổi vai trò của ${user.display_name}.`);
                        }}
                        className="min-h-9 rounded-md border border-border bg-field text-foreground px-2.5 py-1 text-sm disabled:opacity-60"
                      >
                        {(Object.keys(ROLE_LABEL) as UserRole[]).map((role) => (
                          <option key={role} value={role} className="bg-field text-foreground">
                            {ROLE_LABEL[role]}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="px-3 text-foreground">{formatBytes(user.storage_used)}</TableCell>
                    <TableCell className="px-3">
                      <input
                        key={`${user.id}-${user.credits}`}
                        type="number"
                        min={0}
                        step={1}
                        defaultValue={user.credits}
                        disabled={busy}
                        aria-label={`Credits của ${user.display_name}`}
                        onBlur={(e) => changeCredits(user, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                        className="min-h-9 w-24 rounded-md border border-border bg-field text-foreground px-2 py-1 text-sm outline-none focus:border-brand-bright"
                      />
                    </TableCell>
                    <TableCell className="px-3 sm:px-4 text-right">
                      <select
                        value={user.state}
                        disabled={busy}
                        onChange={(e) => {
                          const state = e.target.value as UserState;
                          if (state !== user.state)
                            void update(user, { state }, `${user.display_name}: ${STATE_LABEL[state]}.`);
                        }}
                        className={`min-h-9 rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer disabled:opacity-60 ${STATE_STYLE[user.state]}`}
                      >
                        {(Object.keys(STATE_LABEL) as UserState[]).map((state) => (
                          <option key={state} value={state} className="bg-field text-foreground">
                            {STATE_LABEL[state]}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </ListState>
      <Pager page={list.page} hasNext={list.hasNext} onChange={list.setPage} />

      <Dialog open={Boolean(openId)} onOpenChange={(open) => !open && closeUser()}>
        <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
          {detail ? (
            <UserDetails
              key={detail.id}
              user={detail}
              busy={busyId === detail.id}
              onSave={(display_name) => update(detail, { display_name }, "Đã lưu tên hiển thị.")}
            />
          ) : (
            <DialogHeader>
              <DialogTitle>Người dùng</DialogTitle>
              <DialogDescription>
                {detailState === "missing"
                  ? "Không tìm thấy người dùng này."
                  : detailState === "error"
                    ? "Không thể tải người dùng. Vui lòng thử lại."
                    : "Đang tải..."}
              </DialogDescription>
            </DialogHeader>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function UserDetails({
  user,
  busy,
  onSave,
}: {
  user: User;
  busy: boolean;
  onSave: (displayName: string | null) => Promise<boolean>;
}) {
  const [value, setValue] = useState(user.display_name);
  // Follow the server's answer (e.g. a cleared name falls back to the account name) without touching normal typing.
  useEffect(() => {
    setValue(user.display_name);
  }, [user.display_name]);

  function submit(e: FormEvent) {
    e.preventDefault();
    void onSave(value.trim() || null);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="break-words text-lg">{user.display_name}</DialogTitle>
        <DialogDescription className="break-all">{user.email}</DialogDescription>
      </DialogHeader>

      <dl className="grid grid-cols-2 gap-2.5 sm:gap-3 text-sm">
        <div className="min-w-0 rounded-xl border border-border bg-surface p-3">
          <dt className="text-xs text-muted-foreground">Vai trò</dt>
          <dd className="mt-1 truncate font-semibold text-foreground">{ROLE_LABEL[user.role]}</dd>
        </div>
        <div className="min-w-0 rounded-xl border border-border bg-surface p-3">
          <dt className="text-xs text-muted-foreground">Trạng thái</dt>
          <dd className="mt-1 truncate font-semibold text-foreground">{STATE_LABEL[user.state]}</dd>
        </div>
        <div className="min-w-0 rounded-xl border border-border bg-surface p-3">
          <dt className="text-xs text-muted-foreground">Credits</dt>
          <dd className="mt-1 truncate font-semibold text-foreground">{user.credits}</dd>
        </div>
        <div className="min-w-0 rounded-xl border border-border bg-surface p-3">
          <dt className="text-xs text-muted-foreground">Dung lượng</dt>
          <dd className="mt-1 break-words font-semibold text-foreground">
            {formatBytes(user.storage_used)} / {formatBytes(user.storage_limit)}
          </dd>
        </div>
      </dl>

      <form onSubmit={submit} className="space-y-2">
        <label htmlFor="admin-display-name" className="block text-xs font-medium text-muted-foreground">
          Tên hiển thị
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="admin-display-name"
            className={`${inputClass} min-h-10`}
            value={value}
            maxLength={100}
            disabled={busy}
            onChange={(e) => setValue(e.target.value)}
          />
          <button type="submit" disabled={busy} className={`${primaryButtonClass} w-full sm:w-auto`}>
            Lưu
          </button>
        </div>
      </form>

      <Link to={adminTabUrl("chats", user.id)} className={`${secondaryButtonClass} w-full whitespace-normal text-center`}>
        <MessagesSquare size={15} className="shrink-0" />
        <span>Xem cuộc trò chuyện của người dùng này</span>
      </Link>
    </>
  );
}
