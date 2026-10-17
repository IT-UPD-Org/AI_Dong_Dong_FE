import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ADMIN_PAGE_SIZE, adminApi } from "../../api/admin.api";
import type { User } from "../../api/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { ListState, Pager, formatBytes, usePagedList } from "./shared";

export function UsersTab() {
  const load = useCallback((page: number) => adminApi.getUsers(page), []);
  const list = usePagedList(load, ADMIN_PAGE_SIZE);
  const [busyId, setBusyId] = useState<string | null>(null);

  const replace = (updated: User) =>
    list.setItems((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

  async function changeRole(user: User, role: "student" | "teacher") {
    if (role === user.role) return;
    setBusyId(user.id);
    try {
      replace(await adminApi.setUserRole(user.id, role));
      toast.success(`Đã đổi vai trò của ${user.name}.`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleDisabled(user: User) {
    setBusyId(user.id);
    try {
      replace(await adminApi.setUserDisabled(user.id, !user.disable));
      toast.success(user.disable ? `Đã mở khoá ${user.name}.` : `Đã khoá ${user.name}.`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <p className="mb-4 text-sm text-black/55">
        Quản lý sinh viên và giảng viên. Tài khoản quản trị không hiển thị ở đây.
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
              {list.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-black/60">{user.email}</TableCell>
                  <TableCell>
                    <select
                      value={user.role}
                      disabled={busyId === user.id}
                      onChange={(e) => changeRole(user, e.target.value as "student" | "teacher")}
                      className="rounded-md border border-black/15 bg-white px-2 py-1 text-sm"
                    >
                      <option value="student">Sinh viên</option>
                      <option value="teacher">Giảng viên</option>
                    </select>
                  </TableCell>
                  <TableCell>{formatBytes(user.storage_used)}</TableCell>
                  <TableCell>{user.credits}</TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      disabled={busyId === user.id}
                      onClick={() => toggleDisabled(user)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold cursor-pointer disabled:opacity-50 ${
                        user.disable
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {user.disable ? "Đã khoá" : "Hoạt động"}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ListState>
      <Pager page={list.page} hasNext={list.hasNext} onChange={list.setPage} />
    </section>
  );
}
