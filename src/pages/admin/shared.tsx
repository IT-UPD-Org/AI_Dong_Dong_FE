import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

/**
 * Load one page of an admin list. The backend has no total count, so a page
 * shorter than `pageSize` is treated as the last page.
 */
export function usePagedList<T>(load: (page: number) => Promise<T[]>, pageSize: number) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await load(page));
      setError("");
    } catch (err) {
      setError((err as Error).message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [load, page]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    page,
    setPage,
    items,
    setItems,
    loading,
    error,
    reload,
    hasNext: items.length >= pageSize,
  };
}

export function Pager({
  page,
  hasNext,
  onChange,
}: {
  page: number;
  hasNext: boolean;
  onChange: (page: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-sm">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-foreground hover:bg-hover disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
      >
        <ChevronLeft size={15} /> Trước
      </button>
      <span className="px-2 text-muted-foreground">Trang {page}</span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={!hasNext}
        className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-foreground hover:bg-hover disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
      >
        Sau <ChevronRight size={15} />
      </button>
    </div>
  );
}

export function ListState({
  loading,
  error,
  empty,
  emptyText,
  children,
}: {
  loading: boolean;
  error: string;
  empty: boolean;
  emptyText: string;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-brand-text" size={26} />
      </div>
    );
  }
  if (error) {
    return <p className="rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40 p-4 text-sm text-rose-700 dark:text-rose-300">{error}</p>;
  }
  if (empty) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{emptyText}</p>;
  }
  return <>{children}</>;
}

export const inputClass =
  "w-full rounded-lg border border-border bg-field px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand-bright focus:ring-1 focus:ring-brand-bright";

export const primaryButtonClass =
  "inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-brand hover:text-brand-foreground disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed";

export const secondaryButtonClass =
  "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-hover cursor-pointer";

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${parseFloat((bytes / 1024 ** i).toFixed(1))} ${units[i]}`;
}
