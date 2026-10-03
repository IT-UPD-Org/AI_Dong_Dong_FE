import { useEffect, useRef, useState } from "react";

type LoaderPhase = "loading" | "sweeping" | "holding" | "exiting" | "done";
type LoaderState = {
  percentage: number;
  phase: LoaderPhase;
};

interface PageLoaderOptions {
  loading: boolean;
  progress?: number;
  onComplete?: () => void;
}

export const PAGE_LOADER_TIMING = {
  complete: 600,
  sweep: 1250,
  hold: 650,
  exit: 650,
} as const;

function clampProgress(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(99, value)) : 0;
}

/** Estimate progress unless supplied by the caller. Completion always waits for readiness. */
export function usePageLoader({ loading, progress, onComplete }: PageLoaderOptions) {
  const [state, setState] = useState<LoaderState>({
    percentage: progress === undefined ? 0 : clampProgress(progress),
    phase: "loading",
  });
  const percentageRef = useRef(state.percentage);
  const completeRef = useRef(onComplete);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let frame = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const started = performance.now();
    const initial = loading
      ? progress === undefined ? 0 : clampProgress(progress)
      : percentageRef.current;

    function update(percentage: number, phase: LoaderPhase = "loading") {
      if (cancelled) return;
      percentageRef.current = percentage;
      setState({ percentage, phase });
    }

    function schedule(callback: () => void, delay: number) {
      timers.push(setTimeout(() => {
        if (!cancelled) callback();
      }, delay));
    }

    function finish() {
      update(100, "done");
      completeRef.current?.();
    }

    function reveal() {
      if (reducedMotion) {
        update(100, "exiting");
        schedule(finish, 0);
        return;
      }

      update(100, "sweeping");
      schedule(() => {
        update(100, "holding");
        schedule(() => {
          update(100, "exiting");
          schedule(finish, PAGE_LOADER_TIMING.exit);
        }, PAGE_LOADER_TIMING.hold);
      }, PAGE_LOADER_TIMING.sweep);
    }

    update(initial);
    if (!loading && reducedMotion) {
      reveal();
    } else if (!(loading && progress !== undefined)) {
      function tick(now: number) {
        const elapsed = Math.max(0, now - started);
        if (loading) {
          update(Math.min(90, 90 * (1 - Math.exp(-elapsed / 1600))));
          frame = requestAnimationFrame(tick);
        } else {
          const fraction = Math.min(1, elapsed / PAGE_LOADER_TIMING.complete);
          update(initial + (100 - initial) * (1 - Math.pow(1 - fraction, 2)));
          if (fraction < 1) {
            frame = requestAnimationFrame(tick);
          } else {
            reveal();
          }
        }
      }
      frame = requestAnimationFrame(tick);
    }
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
    };
  }, [loading, progress, reducedMotion]);

  return state;
}
