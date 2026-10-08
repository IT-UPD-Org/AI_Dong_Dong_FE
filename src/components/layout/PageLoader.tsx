import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { PAGE_LOADER_TIMING, usePageLoader } from "../../hooks/usePageLoader";
import { PageLoaderCircuit } from "./PageLoaderCircuit";
import "./PageLoader.css";

type PageLoaderProps = {
  loading?: boolean;
  progress?: number;
  label?: string;
  content?: boolean;
  onComplete?: () => void;
};

export function PageLoader({
  loading = true,
  progress,
  label = "Updating...",
  content = false,
  onComplete,
}: PageLoaderProps) {
  const { percentage, phase } = usePageLoader({ loading, progress, onComplete });
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const [counterHeight, setCounterHeight] = useState(112);
  const displayedPercentage = Math.round(percentage);
  const style = {
    "--loader-progress": percentage / 100,
    "--loader-counter-height": `${counterHeight}px`,
    "--loader-sweep-duration": `${PAGE_LOADER_TIMING.sweep}ms`,
    "--loader-exit-duration": `${PAGE_LOADER_TIMING.exit}ms`,
  } as CSSProperties;

  useLayoutEffect(() => {
    const counter = counterRef.current;
    if (!counter) return;

    function measureCounter() {
      const height = counter?.offsetHeight ?? 0;
      if (height > 0) setCounterHeight(height);
    }

    measureCounter();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measureCounter);
    observer.observe(counter);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (content) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    containerRef.current?.focus({ preventScroll: true });

    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [content]);

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className={`page-loader${content ? " page-loader--content" : ""}`}
      data-phase={phase}
      style={style}
      role="dialog"
      aria-modal={!content}
      aria-label="Đang tải IT UPD GenAI"
    >
      <div
        className="page-loader__reveal"
        aria-hidden={phase === "loading" || phase === "done"}
      >
        <div className="page-loader__scene">
          <PageLoaderCircuit />
          <img
            className="page-loader__logo"
            src="/assets/it-upd-loader-logo.svg"
            alt="IT UPD"
            draggable={false}
          />
        </div>
      </div>
      <div className="page-loader__sweep-edge" aria-hidden="true" />
      <div
        className="page-loader__rail"
        role="progressbar"
        aria-label="Tiến độ tải ứng dụng"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={displayedPercentage}
      >
        <div className="page-loader__fill" />
        <div ref={counterRef} className="page-loader__counter" aria-hidden="true">
          <div className="page-loader__value">
            <span>{displayedPercentage}</span>
            <span className="page-loader__percent">%</span>
          </div>
          <p className="page-loader__label">{label}</p>
          <span className="page-loader__tick" />
        </div>
      </div>
      <p className="page-loader__announcement" role="status" aria-live="polite">
        {phase === "loading" ? "Đang tải ứng dụng. Vui lòng đợi." : "Ứng dụng đã sẵn sàng."}
      </p>
    </div>
  );
}
