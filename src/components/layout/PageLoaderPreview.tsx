import { useEffect, useState } from "react";
import { PageLoader } from "./PageLoader";

type PreviewMode = "reference" | "playing" | "complete";

/** Development-only review screen using the actual application loader. */
export default function PageLoaderPreview() {
  const [mode, setMode] = useState<PreviewMode>("reference");
  const [run, setRun] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mode !== "playing") return;
    const timer = setTimeout(() => setLoading(false), 2400);
    return () => clearTimeout(timer);
  }, [mode, run]);

  function restart(nextMode: PreviewMode) {
    setLoading(true);
    setRun((value) => value + 1);
    setMode(nextMode);
  }

  return (
    <>
      {mode === "complete" ? (
        <main className="grid min-h-svh place-items-center bg-background text-foreground text-center">
          <p>Hiệu ứng đã hoàn tất. Bấm “Chạy lại” để xem chuyển động.</p>
        </main>
      ) : (
        <PageLoader
          key={run}
          loading={loading}
          progress={mode === "reference" ? 76 : undefined}
          onComplete={() => setMode("complete")}
        />
      )}
      <nav
        aria-label="Điều khiển bản xem thử loader"
        className="fixed bottom-3 right-3 z-[2147483647] flex flex-wrap gap-2 rounded-xl border border-border bg-elevated/95 text-foreground p-2 text-xs shadow-md backdrop-blur-md"
      >
        <button
          type="button"
          onClick={() => restart("reference")}
          className="rounded-lg px-3 py-2 hover:bg-hover transition-colors"
        >
          Trước khi quét (76%)
        </button>
        <button
          type="button"
          onClick={() => restart("playing")}
          className="rounded-lg bg-brand px-3 py-2 text-brand-foreground hover:bg-brand-hover transition-colors"
        >
          Chạy lại
        </button>
        <a
          href="/"
          className="rounded-lg px-3 py-2 hover:bg-hover transition-colors"
        >
          Về trang chủ
        </a>
      </nav>
    </>
  );
}
