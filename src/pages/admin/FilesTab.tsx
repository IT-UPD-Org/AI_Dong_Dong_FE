import { useCallback } from "react";
import { adminApi } from "../../api/admin.api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { ListState, Pager, formatBytes, usePagedList } from "./shared";

const FILES_PAGE_SIZE = 50;

export function FilesTab() {
  const load = useCallback((page: number) => adminApi.getFiles(page, FILES_PAGE_SIZE), []);
  const list = usePagedList(load, FILES_PAGE_SIZE);

  return (
    <section className="min-w-0">
      <p className="mb-4 text-sm text-muted-foreground">Toàn bộ tệp của mọi người dùng.</p>
      <ListState loading={list.loading} error={list.error} empty={list.items.length === 0} emptyText="Chưa có tệp nào.">
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <Table className="min-w-[780px]">
            <TableHeader>
              <TableRow>
                <TableHead className="px-3 sm:px-4">Tiêu đề</TableHead>
                <TableHead className="px-3">Tên tệp</TableHead>
                <TableHead className="px-3">Loại</TableHead>
                <TableHead className="px-3">Kích thước</TableHead>
                <TableHead className="px-3">Chủ sở hữu</TableHead>
                <TableHead className="px-3 sm:px-4">Object key</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.items.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="max-w-56 truncate px-3 sm:px-4 font-medium text-foreground">
                    {file.file_url ? (
                      <a href={file.file_url} target="_blank" rel="noreferrer" className="hover:text-brand-text hover:underline">
                        {file.title}
                      </a>
                    ) : (
                      file.title
                    )}
                  </TableCell>
                  <TableCell className="max-w-48 truncate px-3 text-muted-foreground">{file.filename}</TableCell>
                  <TableCell className="px-3 text-foreground">{file.file_type === "image" ? "Hình ảnh" : "Tài liệu"}</TableCell>
                  <TableCell className="px-3 text-foreground">{formatBytes(file.size)}</TableCell>
                  <TableCell className="px-3 font-mono text-xs text-muted-foreground">{file.user_id}</TableCell>
                  <TableCell className="max-w-64 truncate px-3 sm:px-4 font-mono text-xs text-muted-foreground" title={file.object_key}>
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
