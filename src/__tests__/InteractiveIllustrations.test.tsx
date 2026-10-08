import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AiSphereIllustration } from "../components/landing/AiSphereIllustration";
import { KnowledgeRepositoryIllustration } from "../components/landing/KnowledgeRepositoryIllustration";
import { InteractiveIllustration } from "../components/landing/InteractiveIllustration";
import { projectPoint, rotatePoint } from "../components/landing/scene3d";
import * as scene3d from "../components/landing/scene3d";

const initialRotation = { pitch: 0.2, yaw: 0.3 };
let reducedMotion = false;
const capture = new Set<number>();
const captureMethods = ["setPointerCapture", "hasPointerCapture", "releasePointerCapture"] as const;
const originalCaptureMethods = captureMethods.map((key) => Object.getOwnPropertyDescriptor(HTMLElement.prototype, key));

beforeEach(() => {
  capture.clear();
  reducedMotion = false;
  vi.useFakeTimers();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 16));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
  vi.stubGlobal("matchMedia", () => ({ matches: reducedMotion, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.stubGlobal("PointerEvent", class extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;
    constructor(type: string, options: PointerEventInit = {}) {
      super(type, options);
      this.pointerId = options.pointerId ?? 1;
      this.pointerType = options.pointerType ?? "mouse";
      this.isPrimary = options.isPrimary ?? true;
    }
  });
  Object.defineProperties(HTMLElement.prototype, {
    setPointerCapture: { configurable: true, value: (id: number) => capture.add(id) },
    hasPointerCapture: { configurable: true, value: (id: number) => capture.has(id) },
    releasePointerCapture: { configurable: true, value: (id: number) => capture.delete(id) },
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  captureMethods.forEach((key, index) => {
    const descriptor = originalCaptureMethods[index];
    if (descriptor) Object.defineProperty(HTMLElement.prototype, key, descriptor);
    else Reflect.deleteProperty(HTMLElement.prototype, key);
  });
});

async function advance(milliseconds = 16) {
  await act(async () => { await vi.advanceTimersByTimeAsync(milliseconds); });
}

function renderControls() {
  return render(
    <InteractiveIllustration label="hình thử" initialRotation={initialRotation}>
      {() => <svg aria-label="Hình thử" />}
    </InteractiveIllustration>,
  );
}

function drag(viewport: HTMLElement, pointerType = "mouse", pointerId = 1) {
  fireEvent.pointerDown(viewport, { pointerType, pointerId, clientX: 50, clientY: 50 });
  fireEvent.pointerMove(viewport, { pointerType, pointerId, clientX: 110, clientY: 80 });
}

describe("interactive illustration controls", () => {
  it("batches rapid pointer moves into one render per animation frame", async () => {
    const draw = vi.fn(() => <svg />);
    render(<InteractiveIllustration label="hình thử" initialRotation={initialRotation}>{draw}</InteractiveIllustration>);
    const viewport = screen.getByRole("group");
    fireEvent.pointerDown(viewport, { clientX: 50, clientY: 50 });
    const drawsBeforeMoving = draw.mock.calls.length;
    for (let index = 0; index < 10; index++) {
      fireEvent.pointerMove(viewport, { clientX: 60 + index, clientY: 60 + index });
    }
    expect(draw).toHaveBeenCalledTimes(drawsBeforeMoving);
    await advance();
    expect(draw).toHaveBeenCalledTimes(drawsBeforeMoving + 1);
  });

  it("rotates both axes with mouse dragging and captures the pointer", async () => {
    renderControls();
    const viewport = screen.getByRole("group");
    drag(viewport);
    await advance();
    expect(Number(viewport.dataset.yaw)).toBeGreaterThan(initialRotation.yaw);
    expect(Number(viewport.dataset.pitch)).toBeGreaterThan(initialRotation.pitch);
    expect(viewport).toHaveAttribute("data-dragging", "true");
    expect(capture.has(1)).toBe(true);
    fireEvent.pointerCancel(viewport, { pointerId: 1 });
    expect(capture.has(1)).toBe(false);
    expect(viewport).toHaveAttribute("data-dragging", "false");
  });

  it("allows touch rotation directly without an activation button", async () => {
    renderControls();
    const viewport = screen.getByRole("group");
    expect(viewport.style.touchAction).toBe("none");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    drag(viewport, "touch");
    await advance();
    expect(Number(viewport.dataset.yaw)).toBeGreaterThan(initialRotation.yaw);
    fireEvent.pointerUp(viewport, { pointerType: "touch", pointerId: 1 });
    expect(capture.size).toBe(0);
  });

  it("ignores secondary pointers and right mouse clicks", async () => {
    renderControls();
    const viewport = screen.getByRole("group");
    fireEvent.pointerDown(viewport, { pointerId: 2, button: 2 });
    fireEvent.pointerMove(viewport, { pointerId: 2, clientX: 100 });
    fireEvent.pointerDown(viewport, { pointerId: 3, isPrimary: false });
    fireEvent.pointerMove(viewport, { pointerId: 3, clientX: 100 });
    await advance();
    expect(Number(viewport.dataset.yaw)).toBe(initialRotation.yaw);
  });

  it("supports keyboard rotation, Home and double click", async () => {
    renderControls();
    const viewport = screen.getByRole("group");
    fireEvent.keyDown(viewport, { key: "ArrowRight" });
    fireEvent.keyDown(viewport, { key: "ArrowUp" });
    await advance();
    expect(Number(viewport.dataset.yaw)).toBeGreaterThan(initialRotation.yaw);
    expect(Number(viewport.dataset.pitch)).toBeLessThan(initialRotation.pitch);
    fireEvent.keyDown(viewport, { key: "Home" });
    expect(Number(viewport.dataset.yaw)).toBe(initialRotation.yaw);
    fireEvent.keyDown(viewport, { key: "ArrowLeft" });
    await advance();
    fireEvent.keyDown(viewport, { key: "Home" });
    expect(Number(viewport.dataset.yaw)).toBe(initialRotation.yaw);
    drag(viewport);
    await advance();
    fireEvent.pointerCancel(viewport, { pointerId: 1 });
    fireEvent.doubleClick(viewport);
    expect(Number(viewport.dataset.pitch)).toBe(initialRotation.pitch);
  });

  it("keeps large drags finite and clamps the vertical angle", async () => {
    renderControls();
    const viewport = screen.getByRole("group");
    fireEvent.pointerDown(viewport, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(viewport, { clientX: 100000, clientY: 100000 });
    await advance();
    expect(Math.abs(Number(viewport.dataset.yaw))).toBeLessThanOrEqual(Math.PI);
    expect(Math.abs(Number(viewport.dataset.pitch))).toBeLessThan(Math.PI / 2);
  });

  it("glides briefly after release and cancels animation on unmount", async () => {
    const view = renderControls();
    const viewport = screen.getByRole("group");
    drag(viewport);
    await advance();
    fireEvent.pointerUp(viewport, { pointerId: 1 });
    const yaw = Number(viewport.dataset.yaw);
    await advance(32);
    expect(Number(viewport.dataset.yaw)).not.toBe(yaw);
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not apply inertia for reduced-motion users", async () => {
    reducedMotion = true;
    renderControls();
    const viewport = screen.getByRole("group");
    drag(viewport);
    await advance();
    fireEvent.pointerUp(viewport, { pointerId: 1 });
    const yaw = viewport.dataset.yaw;
    await advance(100);
    expect(viewport.dataset.yaw).toBe(yaw);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("3D SVG scenes", () => {
  it.each([
    ["sphere", AiSphereIllustration],
    ["repository", KnowledgeRepositoryIllustration],
  ] as const)("removes visible instructions and controls from the %s", (_, Illustration) => {
    const { container } = render(<Illustration />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText(/Kéo để xoay|Vuốt trên quả cầu|Phím mũi tên/)).not.toBeInTheDocument();
    expect(container.querySelector(".interactive-illustration__controls")).not.toBeInTheDocument();
  });

  it.each([
    ["sphere", AiSphereIllustration],
    ["repository", KnowledgeRepositoryIllustration],
  ] as const)("auto-rotates the %s when idle and motion is allowed", async (_, Illustration) => {
    render(<Illustration />);
    const viewport = screen.getByRole("group");
    const initialYaw = Number(viewport.dataset.yaw);
    await advance(100);
    expect(Number(viewport.dataset.yaw)).not.toBe(initialYaw);
  });

  it.each([
    ["sphere", AiSphereIllustration],
    ["repository", KnowledgeRepositoryIllustration],
  ] as const)("reuses %s geometry when only data labels refresh without rotation", async (_, Illustration) => {
    const projector = vi.spyOn(scene3d, "createProjector");
    render(<Illustration autoRotate={false} />);
    const projectionsBeforeRefresh = projector.mock.calls.length;
    expect(projectionsBeforeRefresh).toBeGreaterThan(0);
    await advance(900);
    expect(projector).toHaveBeenCalledTimes(projectionsBeforeRefresh);
    drag(screen.getByRole("group"));
    await advance();
    expect(projector.mock.calls.length).toBeGreaterThan(projectionsBeforeRefresh);
  });

  it("renders the sphere without a gray rim or decorative boundary stroke", () => {
    render(<AiSphereIllustration />);
    const svg = screen.getByRole("img");
    const surface = svg.querySelector('circle[r="154"]');
    expect(surface).not.toHaveAttribute("stroke");
    expect(svg.querySelector('circle[r="168"]')).not.toBeInTheDocument();
    const colors = Array.from(svg.querySelectorAll('radialGradient[id$="-surface"] stop'))
      .map((stop) => stop.getAttribute("stop-color"));
    expect(colors).not.toContain("#000");
    expect(colors).not.toContain("#003d2b");
  });

  it("allows touching the sphere immediately without an activation button", async () => {
    render(<AiSphereIllustration />);
    const viewport = screen.getByRole("group", { name: "Xoay quả cầu AI" });
    expect(viewport.style.touchAction).toBe("none");
    expect(screen.queryByRole("button", { name: "Bật xoay cảm ứng" })).not.toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("viewBox", "30 30 340 340");
    const yaw = Number(viewport.dataset.yaw);
    drag(viewport, "touch");
    await advance();
    expect(Number(viewport.dataset.yaw)).not.toBe(yaw);
    expect(viewport).toHaveAttribute("data-keyboard-focus", "false");
  });

  it("does not start rotating from an empty corner outside the sphere", async () => {
    render(<AiSphereIllustration autoRotate={false} />);
    const viewport = screen.getByRole("group", { name: "Xoay quả cầu AI" });
    vi.spyOn(viewport, "getBoundingClientRect").mockReturnValue({
      left: 0, top: 0, right: 200, bottom: 200, width: 200, height: 200, x: 0, y: 0, toJSON: () => ({}),
    });
    const yaw = viewport.dataset.yaw;
    fireEvent.pointerDown(viewport, { pointerType: "touch", clientX: 5, clientY: 5 });
    fireEvent.pointerMove(viewport, { pointerType: "touch", clientX: 100, clientY: 100 });
    await advance();
    expect(viewport.dataset.yaw).toBe(yaw);
    expect(capture.size).toBe(0);
  });

  it("changes sphere geometry instead of rotating a flat SVG plane", async () => {
    render(<AiSphereIllustration />);
    const viewport = screen.getByRole("group", { name: "Xoay quả cầu AI" });
    const path = viewport.querySelector("path")!;
    const original = path.getAttribute("d");
    drag(viewport);
    await advance();
    expect(path.getAttribute("d")).not.toBe(original);
    fireEvent.pointerCancel(viewport, { pointerId: 1 });
    fireEvent.doubleClick(viewport);
    expect(path.getAttribute("d")).toBe(original);
  });

  it("keeps particle positions stable when the data labels refresh without rotation", async () => {
    render(<AiSphereIllustration autoRotate={false} />);
    const particle = document.querySelector(".interactive-sphere__pulse circle")!;
    const original = [particle.getAttribute("cx"), particle.getAttribute("cy")];
    await advance(900);
    expect([particle.getAttribute("cx"), particle.getAttribute("cy")]).toEqual(original);
  });

  it("follows drag and smoothly returns to initial state after release, then resumes rotation", async () => {
    render(<AiSphereIllustration />);
    const viewport = screen.getByRole("group", { name: "Xoay quả cầu AI" });
    drag(viewport);
    await advance();
    expect(viewport).toHaveAttribute("data-dragging", "true");
    const draggedPitch = Number(viewport.dataset.pitch);
    expect(draggedPitch).toBeGreaterThan(0.22);

    // Hold pointer for 500ms
    await advance(500);
    expect(Number(viewport.dataset.pitch)).toBe(draggedPitch);

    // Release pointer after holding
    fireEvent.pointerUp(viewport, { pointerId: 1 });
    expect(viewport).toHaveAttribute("data-dragging", "false");

    // Return animation finishes and resumes rotation
    await advance(750);
    expect(Number(viewport.dataset.pitch)).toBeCloseTo(0.22, 1);
  });

  it("changes repository face coordinates and restores the initial layout", async () => {
    render(<KnowledgeRepositoryIllustration />);
    const viewport = screen.getByRole("group", { name: "Xoay kho tri thức số" });
    const original = Array.from(viewport.querySelectorAll("[data-document-face]")).map((face) => face.getAttribute("points"));
    drag(viewport);
    await advance();
    const rotated = Array.from(viewport.querySelectorAll("[data-document-face]")).map((face) => face.getAttribute("points"));
    expect(rotated).not.toEqual(original);
    expect(rotated.join(" ")).not.toMatch(/NaN|Infinity/);
    fireEvent.pointerCancel(viewport, { pointerId: 1 });
    fireEvent.doubleClick(viewport);
    expect(Array.from(viewport.querySelectorAll("[data-document-face]")).map((face) => face.getAttribute("points"))).toEqual(original);
    expect(screen.getByText("thư viện và giáo trình của nhà trường.")).toBeInTheDocument();
  });

  it("disables automatic data motion when reduced motion is enabled", () => {
    reducedMotion = true;
    render(<KnowledgeRepositoryIllustration />);
    expect(document.querySelector("animateMotion")).not.toBeInTheDocument();
  });
});

describe("3D projection", () => {
  it("calculates trigonometry once for an entire batch of projected points", () => {
    const sin = vi.spyOn(Math, "sin");
    const cos = vi.spyOn(Math, "cos");
    const project = scene3d.createProjector(initialRotation, { x: 200, y: 200 }, 1200);
    for (let index = 0; index < 100; index++) {
      const point = project({ x: index, y: index / 2, z: index / 3 });
      expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true);
    }
    expect(sin).toHaveBeenCalledTimes(2);
    expect(cos).toHaveBeenCalledTimes(2);
  });

  it("preserves point distances and projects the origin to the scene center", () => {
    const point = { x: 12, y: 34, z: 56 };
    const rotated = rotatePoint(point, { pitch: 0.7, yaw: 2.1 });
    expect(Math.hypot(rotated.x, rotated.y, rotated.z)).toBeCloseTo(Math.hypot(point.x, point.y, point.z));
    expect(projectPoint({ x: 0, y: 0, z: 0 }, initialRotation, { x: 200, y: 200 })).toEqual({ x: 200, y: 200, depth: 0 });
  });
});
