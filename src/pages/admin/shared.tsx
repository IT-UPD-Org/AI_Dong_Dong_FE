import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

/**
 * Load one page of an admin list. The backend has no total count, so a page
 * shorter than `pageSize` is treated as the last page.
 */
export function usePagedList<T>(load: (page: number) => Promise<T[]>, pageSize: number, resetKey?: string | null) {
  const [page, setPage] = useState(1);
  // A new filter starts again from page 1 (adjusted while rendering, so no request is made for the old page).
  const [seenKey, setSeenKey] = useState(resetKey);
  if (seenKey !== resetKey) {
    setSeenKey(resetKey);
    setPage(1);
  }
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Only the newest request may write results, so a slow older response can't overwrite a newer one.
  const latest = useRef(0);

  const reload = useCallback(async () => {
    const request = ++latest.current;
    setLoading(true);
    try {
      const result = await load(page);
      if (request !== latest.current) return;
      setItems(result);
      setError("");
    } catch (err) {
      if (request !== latest.current) return;
      setError((err as Error).message);
      setItems([]);
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [load, page]);

  useEffect(() => {
    reload();
    return () => {
      latest.current++;
    };
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

/** Link to an admin tab, optionally about one user (`user_id` means "this user" on the users and chats tabs). */
export function adminTabUrl(tab: string, userId?: string | null): string {
  const query = new URLSearchParams({ tab });
  if (userId) query.set("user_id", userId);
  return `/admin?${query}`;
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
    <div className="mt-4 flex flex-wrap items-center justify-end gap-2 text-sm">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="flex min-h-10 items-center gap-1 rounded-lg border border-border px-3.5 py-1.5 text-foreground hover:bg-hover disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
      >
        <ChevronLeft size={15} /> Trước
      </button>
      <span className="px-2 text-muted-foreground">Trang {page}</span>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={!hasNext}
        className="flex min-h-10 items-center gap-1 rounded-lg border border-border px-3.5 py-1.5 text-foreground hover:bg-hover disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
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
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background hover:bg-brand hover:text-brand-foreground disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed";

export const secondaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-hover cursor-pointer";

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${parseFloat((bytes / 1024 ** i).toFixed(1))} ${units[i]}`;
}
