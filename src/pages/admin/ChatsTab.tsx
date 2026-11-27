import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import { adminApi } from "../../api/admin.api";
import { formatSnowflakeDate } from "../../lib/snowflake";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { ListState, Pager, adminTabUrl, usePagedList } from "./shared";

// Matches the fixed page size of GET /admin/chats on the backend.
const CHATS_PAGE_SIZE = 10;

const STATUS_LABEL = { none: "Nhàn rỗi", pending: "Đang chờ", in_progress: "Đang chạy" } as const;

export function ChatsTab() {
  // `user_id` in the URL filters the list to one user, so the view can be linked from the Users tab.
  const [params, setParams] = useSearchParams();
  const userId = params.get("user_id");
  const load = useCallback((page: number) => adminApi.getAllChats(page, userId), [userId]);
  const list = usePagedList(load, CHATS_PAGE_SIZE, userId);
  // Look the filtered user up directly so the name is right even when they have no chats.
  const [filterUser, setFilterUser] = useState<{ id: string; name: string | null } | null>(null);
  useEffect(() => {
    if (!userId) return;
    let current = true;
    adminApi
      .getUsers(1, userId)
      .then((found) => current && setFilterUser({ id: userId, name: found[0]?.display_name ?? null }))
      .catch(() => current && setFilterUser({ id: userId, name: null }));
    return () => {
      current = false;
    };
  }, [userId]);
  const loaded = filterUser?.id === userId;
  const filterName = !loaded ? "…" : (filterUser.name ?? "Người dùng đã xoá");

  return (
    <section>
      <p className="mb-4 text-sm text-muted-foreground">Cuộc trò chuyện của mọi người dùng.</p>
      {userId && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-brand-soft py-1 pl-3 pr-1.5 text-brand-text">
            Đang lọc theo người dùng: <strong className="font-semibold">{filterName}</strong>
            <button
              type="button"
              aria-label="Xoá bộ lọc người dùng"
              onClick={() => setParams({ tab: "chats" }, { replace: true })}
              className="flex size-5 cursor-pointer items-center justify-center rounded-full hover:bg-hover"
            >
              <X size={13} />
            </button>
          </span>
        </div>
      )}
      <ListState
        loading={list.loading}
        error={list.error}
        empty={list.items.length === 0}
        emptyText={userId ? "Người dùng này chưa có cuộc trò chuyện nào." : "Chưa có cuộc trò chuyện nào."}
      >
        <div className="rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Người dùng</TableHead>
                <TableHead>Tạo lúc</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((chat) => (
                <TableRow key={chat.id}>
                  <TableCell className="max-w-80 truncate font-medium text-foreground">{chat.title}</TableCell>
                  <TableCell>
                    {chat.userName ? (
                      <Link
                        to={adminTabUrl("users", chat.userId)}
                        className="text-foreground underline-offset-2 hover:text-brand-text hover:underline"
                      >
                        {chat.userName}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Người dùng đã xoá</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatSnowflakeDate(chat.id) ?? "—"}</TableCell>
                  <TableCell className="text-foreground">{STATUS_LABEL[chat.asyncStatus ?? "none"]}</TableCell>
                  <TableCell>
                    {chat.disabled ? (
                      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">Bị khoá</span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Bình thường</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to={`/c/${chat.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-text hover:underline"
                    >
                      Xem <ArrowRight size={13} />
                    </Link>
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
