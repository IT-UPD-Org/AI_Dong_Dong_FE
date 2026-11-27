import { useEffect, useState } from "react";
import { FileX2, RefreshCw } from "lucide-react";
import { ApiError, buildApiUrl } from "../../api/client";
import { documentApi } from "../../api/document.api";
import { libraryApi } from "../../api/library.api";
import { useLanguage } from "../../contexts/LanguageContext";
import { PreviewFile, getFileExtension } from "../../lib/filePreviewUtils";
import type { LinkKind } from "../../lib/linkTags";
import { FileCard } from "./FileCard";

type Loaded = { status: "ready"; file: PreviewFile } | { status: "unavailable" };

/** Only http(s) links are used; anything else (javascript:, data:, relative) is ignored. */
function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}

/** Show "Quy chế" + docx as "Quy chế.docx", so the card and the download keep their extension. */
function displayName(title: string, filename: string, ext: string): string {
  const base = (title || filename || "").trim();
  if (!base) return filename;
  return ext && !base.toLowerCase().endsWith(`.${ext}`) ? `${base}.${ext}` : base;
}

async function fetchLinked(kind: LinkKind, id: string): Promise<Loaded> {
  try {
    if (kind === "file") {
      const doc = await documentApi.getDocument(id);
      const ext = getFileExtension(doc.filename);
      return {
        status: "ready",
        file: {
          id: doc.document_id,
          name: displayName(doc.title, doc.filename, ext),
          url: safeUrl(doc.file_url) ?? buildApiUrl(`/api/files/${encodeURIComponent(doc.document_id)}`),
          extension: ext,
          size: doc.size_bytes,
          source: "attachment",
        },
      };
    }
    const doc = await libraryApi.getDocument(id);
    const url = safeUrl(doc.file_url);
    if (!url) return { status: "unavailable" };
    const ext = getFileExtension(doc.filename);
    return {
      status: "ready",
      file: { id: doc.id, name: displayName(doc.title, doc.filename, ext), url, extension: ext, size: doc.size, source: "link" },
    };
  } catch (err) {
    // The document is gone or not this user's to see.
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) return { status: "unavailable" };
    throw err;
  }
}

// One request per document, shared by every card (and message) that mentions it.
const cache = new Map<string, Promise<Loaded>>();

function loadLinked(kind: LinkKind, id: string): Promise<Loaded> {
  const key = `${kind}:${id}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = fetchLinked(kind, id);
    cache.set(key, pending);
    // A temporary failure (network, server) must not be remembered.
    pending.catch(() => cache.get(key) === pending && cache.delete(key));
  }
  return pending;
}

/** For tests. */
export function clearLinkedDocCache() {
  cache.clear();
}

type State = { phase: "loading" } | { phase: "error" } | { phase: "done"; result: Loaded };

export function LinkedDocCard({
  kind,
  id,
  onPreview,
}: {
  kind: LinkKind;
  id: string;
  onPreview?: (file: PreviewFile) => void;
}) {
  const { lang } = useLanguage();
  const isEn = lang === "en";
  const [state, setState] = useState<State>({ phase: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setState({ phase: "loading" });
    loadLinked(kind, id).then(
      (result) => current && setState({ phase: "done", result }),
      () => current && setState({ phase: "error" }),
    );
    return () => {
      current = false;
    };
  }, [kind, id, attempt]);

  const wrapper = "my-1.5 block w-full max-w-md not-prose";

  if (state.phase === "loading") {
    return (
      <div className={wrapper} role="status" aria-label={isEn ? "Loading document" : "Đang tải tài liệu"}>
        <span className="my-2 flex animate-pulse items-center gap-3 rounded-xl border border-border bg-card p-3">
          <span className="size-10 shrink-0 rounded-lg bg-muted" />
          <span className="flex-1 space-y-2">
            <span className="block h-3 w-2/3 rounded bg-muted" />
            <span className="block h-2.5 w-1/3 rounded bg-muted" />
          </span>
        </span>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className={wrapper}>
        <span className="my-2 flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <span>{isEn ? "Could not load this document." : "Không tải được tài liệu."}</span>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 font-medium text-fg-secondary hover:bg-hover"
          >
            <RefreshCw size={12} aria-hidden="true" />
            {isEn ? "Retry" : "Thử lại"}
          </button>
        </span>
      </div>
    );
  }

  if (state.result.status === "unavailable") {
    return (
      <div className={wrapper}>
        <span className="my-2 flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <FileX2 size={18} aria-hidden="true" />
          </span>
          <span>{isEn ? "Document unavailable" : "Tài liệu không khả dụng"}</span>
        </span>
      </div>
    );
  }

  return (
    <div className={wrapper}>
      <FileCard file={state.result.file} onPreview={onPreview} />
    </div>
  );
}
