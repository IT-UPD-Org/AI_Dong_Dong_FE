import { useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { adminApi } from "../../api/admin.api";
import { formatSnowflakeDate } from "../../lib/snowflake";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { ListState, Pager, usePagedList } from "./shared";

// Matches the fixed page size of GET /chats on the backend.
const CHATS_PAGE_SIZE = 10;

const STATUS_LABEL = { none: "Nhàn rỗi", pending: "Đang chờ", in_progress: "Đang chạy" } as const;

export function ChatsTab() {
  const load = useCallback((page: number) => adminApi.getAllChats(page), []);
  const list = usePagedList(load, CHATS_PAGE_SIZE);

  return (
    <section>
      <p className="mb-4 text-sm text-black/55">Cuộc trò chuyện của mọi người dùng.</p>
      <ListState
        loading={list.loading}
        error={list.error}
        empty={list.items.length === 0}
        emptyText="Chưa có cuộc trò chuyện nào."
      >
        <div className="rounded-2xl border border-black/10 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Tạo lúc</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((chat) => (
                <TableRow key={chat.id}>
                  <TableCell className="max-w-80 truncate font-medium">{chat.title}</TableCell>
                  <TableCell className="text-black/60">{formatSnowflakeDate(chat.id) ?? "—"}</TableCell>
                  <TableCell>{STATUS_LABEL[chat.asyncStatus ?? "none"]}</TableCell>
                  <TableCell>
                    {chat.disabled ? (
                      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">Bị khoá</span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">Bình thường</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to={`/c/${chat.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#04714a] hover:underline"
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
