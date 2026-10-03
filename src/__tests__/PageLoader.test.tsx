import { StrictMode, type ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PageLoader } from "../components/layout/PageLoader";
import PageLoaderPreview from "../components/layout/PageLoaderPreview";
import { PAGE_LOADER_TIMING } from "../hooks/usePageLoader";
import App from "../App";

const auth = vi.hoisted(() => ({ isLoading: true }));
vi.mock("../contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => auth,
}));
vi.mock("../router/AppRouter", () => ({ default: () => <main data-testid="application">Trang ứng dụng</main> }));

let reducedMotion = false;
const transitionDuration = Object.values(PAGE_LOADER_TIMING).reduce((total, duration) => total + duration, 64);
beforeEach(() => {
  auth.isLoading = true;
  reducedMotion = false;
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 16));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
  vi.stubGlobal("matchMedia", () => ({ matches: reducedMotion, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

async function advance(milliseconds: number) {
  await act(async () => { await vi.advanceTimersByTimeAsync(milliseconds); });
}
function loader() { return screen.getByRole("dialog"); }

describe("Figma PageLoader", () => {
  it("provides a replayable development preview of the real loader", async () => {
    render(<PageLoaderPreview />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "76");
    fireEvent.click(screen.getByRole("button", { name: "Chạy lại" }));
    await advance(2400);
    await advance(transitionDuration);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Hiệu ứng đã hoàn tất");
    fireEvent.click(screen.getByRole("button", { name: "Trước khi quét (76%)" }));
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "76");
  });

  it("shows only the counter and keeps the artwork hidden until the sweep", () => {
    render(<PageLoader progress={76} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "76");
    expect(loader().style.getPropertyValue("--loader-progress")).toBe("0.76");
    expect(screen.getByText("76")).toBeInTheDocument();
    expect(loader().querySelectorAll(".page-loader__counter")).toHaveLength(1);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.queryByText("100")).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "IT UPD" })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "IT UPD", hidden: true })).toHaveAttribute("src", "/assets/it-upd-loader-logo.svg");
    expect(loader().querySelector(".page-loader__reveal")).toHaveAttribute("aria-hidden", "true");
    expect(loader().querySelector(".page-loader__circuit")).toBeInTheDocument();
  });

  it("renders staggered circuit currents and glowing nodes as decorative artwork", () => {
    render(<PageLoader progress={76} />);
    const circuit = loader().querySelector(".page-loader__circuit");
    expect(circuit).toHaveAttribute("aria-hidden", "true");
    expect(circuit?.querySelectorAll(".page-loader__signal")).toHaveLength(5);
    expect(circuit?.querySelectorAll(".page-loader__node")).toHaveLength(5);
    expect(circuit?.querySelector(".page-loader__signal")).toHaveAttribute("pathLength", "100");
    expect(loader().style.getPropertyValue("--loader-exit-duration")).toBe(`${PAGE_LOADER_TIMING.exit}ms`);
  });

  it("never claims 100% while the app is waiting", async () => {
    const complete = vi.fn();
    render(<PageLoader onComplete={complete} />);
    await advance(15000);
    expect(Number(screen.getByRole("progressbar").getAttribute("aria-valuenow"))).toBeLessThan(100);
    expect(loader()).toHaveAttribute("data-phase", "loading");
    expect(complete).not.toHaveBeenCalled();
  });

  it("moves the counter using the same progress as the bar and clamps bad input", () => {
    const view = render(<PageLoader progress={20} />);
    expect(loader().style.getPropertyValue("--loader-progress")).toBe("0.2");
    view.rerender(<PageLoader progress={76} />);
    expect(loader().style.getPropertyValue("--loader-progress")).toBe("0.76");
    view.rerender(<PageLoader progress={120} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "99");
    view.rerender(<PageLoader progress={NaN} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("reveals the circuit and logo together only after the vertical bar completes", async () => {
    const complete = vi.fn();
    const view = render(<PageLoader progress={76} onComplete={complete} />);
    view.rerender(<PageLoader loading={false} onComplete={complete} />);
    await advance(PAGE_LOADER_TIMING.complete + 16);
    expect(loader()).toHaveAttribute("data-phase", "sweeping");
    expect(loader().querySelector(".page-loader__reveal")).toHaveAttribute("aria-hidden", "false");
    expect(screen.getByRole("img", { name: "IT UPD" })).toBeInTheDocument();
    expect(loader().querySelector(".page-loader__scene .page-loader__circuit")).toBeInTheDocument();
    expect(loader().querySelector(".page-loader__wipe")).not.toBeInTheDocument();
    expect(loader().querySelector(".page-loader__wordmark")).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    await advance(PAGE_LOADER_TIMING.sweep);
    expect(loader()).toHaveAttribute("data-phase", "holding");
    await advance(PAGE_LOADER_TIMING.hold);
    expect(loader()).toHaveAttribute("data-phase", "exiting");
    await advance(PAGE_LOADER_TIMING.exit);
    expect(loader()).toHaveAttribute("data-phase", "done");
    expect(complete).toHaveBeenCalledOnce();
  });

  it("cancels the transition if loading starts again", async () => {
    const complete = vi.fn();
    const view = render(<PageLoader loading={false} onComplete={complete} />);
    await advance(650);
    expect(loader()).toHaveAttribute("data-phase", "sweeping");
    view.rerender(<PageLoader loading onComplete={complete} />);
    await advance(3000);
    expect(loader()).toHaveAttribute("data-phase", "loading");
    expect(loader().querySelector(".page-loader__reveal")).toHaveAttribute("aria-hidden", "true");
    expect(complete).not.toHaveBeenCalled();
  });

  it("cleans up animation timers and restores body scrolling", async () => {
    document.body.style.overflow = "auto";
    const complete = vi.fn();
    const view = render(<PageLoader loading={false} onComplete={complete} />);
    expect(document.body.style.overflow).toBe("hidden");
    await advance(650);
    view.unmount();
    await advance(4000);
    expect(document.body.style.overflow).toBe("auto");
    expect(complete).not.toHaveBeenCalled();
    document.body.style.overflow = "";
  });

  it("skips the sweep when reduced motion is enabled", async () => {
    reducedMotion = true;
    const complete = vi.fn();
    render(<PageLoader loading={false} onComplete={complete} />);
    await advance(1);
    expect(loader()).toHaveAttribute("data-phase", "done");
    expect(complete).toHaveBeenCalledOnce();
  });

  it("prevents interacting with the app until the complete transition ends", async () => {
    const view = render(<StrictMode><App /></StrictMode>);
    expect(screen.getByTestId("application").parentElement).toHaveAttribute("inert");
    auth.isLoading = false;
    view.rerender(<StrictMode><App /></StrictMode>);
    await advance(transitionDuration);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("application").parentElement).not.toHaveAttribute("inert");
  });
});
