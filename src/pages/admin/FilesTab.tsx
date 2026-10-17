import { useCallback } from "react";
import { adminApi } from "../../api/admin.api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { ListState, Pager, formatBytes, usePagedList } from "./shared";

const FILES_PAGE_SIZE = 50;

export function FilesTab() {
  const load = useCallback((page: number) => adminApi.getFiles(page, FILES_PAGE_SIZE), []);
  const list = usePagedList(load, FILES_PAGE_SIZE);

  return (
    <section>
      <p className="mb-4 text-sm text-black/55">Toàn bộ tệp của mọi người dùng.</p>
      <ListState loading={list.loading} error={list.error} empty={list.items.length === 0} emptyText="Chưa có tệp nào.">
        <div className="rounded-2xl border border-black/10 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Tên tệp</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Kích thước</TableHead>
                <TableHead>Chủ sở hữu</TableHead>
                <TableHead>Object key</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="max-w-56 truncate font-medium">
                    {file.file_url ? (
                      <a href={file.file_url} target="_blank" rel="noreferrer" className="hover:text-[#04714a] hover:underline">
                        {file.title}
                      </a>
                    ) : (
                      file.title
                    )}
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-black/60">{file.filename}</TableCell>
                  <TableCell>{file.file_type === "image" ? "Hình ảnh" : "Tài liệu"}</TableCell>
                  <TableCell>{formatBytes(file.size)}</TableCell>
                  <TableCell className="font-mono text-xs text-black/60">{file.user_id}</TableCell>
                  <TableCell className="max-w-64 truncate font-mono text-xs text-black/50" title={file.object_key}>
                    {file.object_key}
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
