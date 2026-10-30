import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ADMIN_PAGE_SIZE, adminApi } from "../../api/admin.api";
import type { AdminUserUpdate, User, UserRole, UserState } from "../../api/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { useAuth } from "../../contexts/AuthContext";
import { ListState, Pager, formatBytes, usePagedList } from "./shared";

const ROLE_LABEL: Record<UserRole, string> = { student: "Sinh viên", teacher: "Giảng viên", admin: "Quản trị" };
const STATE_LABEL: Record<UserState, string> = { active: "Hoạt động", pending: "Chờ duyệt", disable: "Đã khoá" };
const STATE_STYLE: Record<UserState, string> = {
  active: "border-green-200 bg-green-50 text-green-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  disable: "border-red-200 bg-red-50 text-red-700",
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
      <p className="mb-4 text-sm text-black/55">
        Quản lý mọi tài khoản: vai trò, trạng thái và credits. Bạn không thể đổi vai trò hay trạng thái của chính mình.
      </p>
      <ListState loading={list.loading} error={list.error} empty={list.items.length === 0} emptyText="Chưa có người dùng.">
        <div className="rounded-2xl border border-black/10 bg-white">
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
                    <TableCell className="font-medium">
                      {user.name}
                      {isMe && <span className="ml-1.5 text-xs font-normal text-black/40">(bạn)</span>}
                    </TableCell>
                    <TableCell className="text-black/60">{user.email}</TableCell>
                    <TableCell>
                      <select
                        value={user.role}
                        disabled={busy || isMe}
                        title={isMe ? "Không thể đổi vai trò của chính bạn" : undefined}
                        onChange={(e) => {
                          const role = e.target.value as UserRole;
                          if (role !== user.role) void update(user, { role }, `Đã đổi vai trò của ${user.name}.`);
                        }}
                        className="rounded-md border border-black/15 bg-white px-2 py-1 text-sm disabled:opacity-60"
                      >
                        {(Object.keys(ROLE_LABEL) as UserRole[]).map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABEL[role]}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>{formatBytes(user.storage_used)}</TableCell>
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
                        className="w-24 rounded-md border border-black/15 bg-white px-2 py-1 text-sm"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <select
                        value={user.state}
                        disabled={busy || isMe}
                        title={isMe ? "Không thể đổi trạng thái của chính bạn" : undefined}
                        onChange={(e) => {
                          const state = e.target.value as UserState;
                          if (state !== user.state)
                            void update(user, { state }, `${user.name}: ${STATE_LABEL[state]}.`);
                        }}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer disabled:opacity-60 ${STATE_STYLE[user.state]}`}
                      >
                        {(Object.keys(STATE_LABEL) as UserState[]).map((state) => (
                          <option key={state} value={state}>
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
