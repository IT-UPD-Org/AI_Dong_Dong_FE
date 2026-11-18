import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ADMIN_PAGE_SIZE, adminApi } from "../../api/admin.api";
import type { AdminUserUpdate, User, UserRole, UserState } from "../../api/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { useAuth } from "../../contexts/AuthContext";
import { ListState, Pager, formatBytes, usePagedList } from "./shared";

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
  const { user: me } = useAuth();
  const load = useCallback((page: number) => adminApi.getUsers(page), []);
  const list = usePagedList(load, ADMIN_PAGE_SIZE);
  const [busyId, setBusyId] = useState<string | null>(null);

  const replace = (updated: User) =>
    list.setItems((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

  /** Send only what changed; the backend applies the given fields and returns the user. */
  async function update(user: User, changes: AdminUserUpdate, done: string) {
    setBusyId(user.id);
    try {
      replace(await adminApi.updateUser(user.id, changes));
      toast.success(done);
    } catch (err) {
      toast.error((err as Error).message);
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
    if (credits !== user.credits) void update(user, { credits }, `Đã đổi credits của ${user.name}.`);
  }

  return (
    <section>
      <p className="mb-4 text-sm text-muted-foreground">
        Quản lý mọi tài khoản: vai trò, trạng thái và credits. Duyệt yêu cầu cấp quyền ở thẻ Yêu cầu.
      </p>
      <ListState loading={list.loading} error={list.error} empty={list.items.length === 0} emptyText="Chưa có người dùng.">
        <div className="rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Dung lượng</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead className="text-right">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((user) => {
                const busy = busyId === user.id;
                const isMe = me?.id === user.id;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-foreground">
                      {user.name}
                      {isMe && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(bạn)</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <select
                        value={user.role}
                        disabled={busy}
                        onChange={(e) => {
                          const role = e.target.value as UserRole;
                          if (role !== user.role) void update(user, { role }, `Đã đổi vai trò của ${user.name}.`);
                        }}
                        className="rounded-md border border-border bg-field text-foreground px-2 py-1 text-sm disabled:opacity-60"
                      >
                        {(Object.keys(ROLE_LABEL) as UserRole[]).map((role) => (
                          <option key={role} value={role} className="bg-field text-foreground">
                            {ROLE_LABEL[role]}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="text-foreground">{formatBytes(user.storage_used)}</TableCell>
                    <TableCell>
                      <input
                        key={`${user.id}-${user.credits}`}
                        type="number"
                        min={0}
                        step={1}
                        defaultValue={user.credits}
                        disabled={busy}
                        aria-label={`Credits của ${user.name}`}
                        onBlur={(e) => changeCredits(user, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                        className="w-24 rounded-md border border-border bg-field text-foreground px-2 py-1 text-sm outline-none focus:border-brand-bright"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <select
                        value={user.state}
                        disabled={busy}
                        onChange={(e) => {
                          const state = e.target.value as UserState;
                          if (state !== user.state)
                            void update(user, { state }, `${user.name}: ${STATE_LABEL[state]}.`);
                        }}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer disabled:opacity-60 ${STATE_STYLE[user.state]}`}
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
    </section>
  );
}
