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
      <p className="mb-4 text-sm text-muted-foreground">Toàn bộ tệp của mọi người dùng.</p>
      <ListState loading={list.loading} error={list.error} empty={list.items.length === 0} emptyText="Chưa có tệp nào.">
        <div className="rounded-2xl border border-border bg-card">
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
                  <TableCell className="max-w-56 truncate font-medium text-foreground">
                    {file.file_url ? (
                      <a href={file.file_url} target="_blank" rel="noreferrer" className="hover:text-brand-text hover:underline">
                        {file.title}
                      </a>
                    ) : (
                      file.title
                    )}
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-muted-foreground">{file.filename}</TableCell>
                  <TableCell className="text-foreground">{file.file_type === "image" ? "Hình ảnh" : "Tài liệu"}</TableCell>
                  <TableCell className="text-foreground">{formatBytes(file.size)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{file.user_id}</TableCell>
                  <TableCell className="max-w-64 truncate font-mono text-xs text-muted-foreground" title={file.object_key}>
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
