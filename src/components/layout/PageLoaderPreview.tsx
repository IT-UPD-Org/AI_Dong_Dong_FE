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
        <main className="grid min-h-svh place-items-center bg-white text-center">
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
        className="fixed bottom-3 right-3 z-[2147483647] flex flex-wrap gap-2 rounded-xl border border-emerald-100 bg-white/95 p-2 text-xs shadow-sm"
      >
        <button type="button" onClick={() => restart("reference")} className="rounded-lg px-3 py-2 hover:bg-emerald-50">
          Trước khi quét (76%)
        </button>
        <button type="button" onClick={() => restart("playing")} className="rounded-lg bg-emerald-700 px-3 py-2 text-white hover:bg-emerald-800">
          Chạy lại
        </button>
        <a href="/" className="rounded-lg px-3 py-2 hover:bg-emerald-50">Về trang chủ</a>
      </nav>
    </>
  );
}
