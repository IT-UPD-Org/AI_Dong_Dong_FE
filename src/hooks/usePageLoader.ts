import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

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

const ESTIMATED_PROGRESS_LIMIT = 90;
const ESTIMATED_PROGRESS_TIME = 1600;

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
  const reducedMotion = useReducedMotion();
  // A late progress report must not restart a transition that is already ready.
  const waitingProgress = loading ? progress : undefined;

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let cancelled = false;
    let frame = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const started = performance.now();
    const initial = loading ? clampProgress(waitingProgress ?? 0) : percentageRef.current;

    function update(percentage: number, phase: LoaderPhase = "loading") {
      if (cancelled) return;
      percentageRef.current = percentage;
      setState((current) =>
        current.percentage === percentage && current.phase === phase
          ? current
          : { percentage, phase },
      );
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
      const { sweep, hold, exit } = PAGE_LOADER_TIMING;
      schedule(() => update(100, "holding"), sweep);
      schedule(() => update(100, "exiting"), sweep + hold);
      schedule(finish, sweep + hold + exit);
    }

    function estimateProgress(now: number) {
      const elapsed = Math.max(0, now - started);
      const percentage = ESTIMATED_PROGRESS_LIMIT *
        (1 - Math.exp(-elapsed / ESTIMATED_PROGRESS_TIME));
      update(percentage);
      // Once the estimate stops changing, wait for readiness without idle frames.
      if (percentage < ESTIMATED_PROGRESS_LIMIT) {
        frame = requestAnimationFrame(estimateProgress);
      }
    }

    function completeProgress(now: number) {
      const elapsed = Math.max(0, now - started);
      const fraction = Math.min(1, elapsed / PAGE_LOADER_TIMING.complete);
      const eased = 1 - (1 - fraction) ** 2;
      update(initial + (100 - initial) * eased);
      if (fraction < 1) frame = requestAnimationFrame(completeProgress);
      else reveal();
    }

    update(initial);
    if (loading) {
      if (waitingProgress === undefined) frame = requestAnimationFrame(estimateProgress);
    } else if (reducedMotion) {
      reveal();
    } else {
      frame = requestAnimationFrame(completeProgress);
    }
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
    };
  }, [loading, waitingProgress, reducedMotion]);

  return state;
}
