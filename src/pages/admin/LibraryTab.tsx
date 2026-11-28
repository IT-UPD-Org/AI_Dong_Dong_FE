import { LibraryManager } from "../../components/library/LibraryManager";

export function LibraryTab() {
  return (
    <section className="min-w-0">
      <p className="mb-4 text-sm text-muted-foreground">
        Quản lý và tải lên tài liệu học tập, giáo trình dùng chung cho toàn trường.
      </p>
      <LibraryManager hideHeader={true} />
    </section>
  );
}
