const TAU = Math.PI * 2;
const SEGMENT_COUNT = 480;
const NODE_POSITIONS = [0.025, 0.18, 0.36, 0.535, 0.725, 0.94];

type Point = { x: number; y: number; z: number };

/** Draw only when scroll progress or canvas size changes. */
export function createHeroHelix(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  let width = 0;
  let height = 0;

  function project(position: number, rotation: number): Point {
    const angle = position * TAU * 4.8 + rotation - 0.8;
    const radius = Math.min(width * 0.365, 210) *
      (1 - 0.1 * position + 0.035 * Math.sin(position * Math.PI));
    const depth = Math.sin(angle);

    return {
      x: width * 0.5 + Math.cos(angle) * radius * (1 + depth * 0.055),
      y: height * 0.49 + (position - 0.5) * height * 0.64 + depth * radius * 0.205,
      z: depth,
    };
  }

  function drawNode(point: Point) {
    if (!context) return;
    const radius = 3.7 + (point.z + 1) * 0.85;
    const glow = context.createRadialGradient(
      point.x, point.y, radius * 0.5, point.x, point.y, radius * 3.4,
    );
    glow.addColorStop(0, "rgba(0,168,107,.14)");
    glow.addColorStop(1, "rgba(0,168,107,0)");
    context.fillStyle = glow;
    context.beginPath();
    context.arc(point.x, point.y, radius * 3.4, 0, TAU);
    context.fill();

    const fill = context.createRadialGradient(
      point.x - radius * 0.35, point.y - radius * 0.35, 0,
      point.x, point.y, radius,
    );
    fill.addColorStop(0, `rgba(118,228,176,${0.62 + (point.z + 1) * 0.17})`);
    fill.addColorStop(0.45, `rgba(0,168,107,${0.5 + (point.z + 1) * 0.2})`);
    fill.addColorStop(1, `rgba(4,113,74,${0.5 + (point.z + 1) * 0.22})`);
    context.fillStyle = fill;
    context.beginPath();
    context.arc(point.x, point.y, radius, 0, TAU);
    context.fill();
  }

  function draw(progress: number) {
    if (!context || !width || !height) return;
    context.clearRect(0, 0, width, height);
    const rotation = progress * 0.85 * TAU;
    const points = Array.from({ length: SEGMENT_COUNT + 1 }, (_, index) =>
      project(index / SEGMENT_COUNT, rotation),
    );
    const segments = points.slice(0, -1).map((start, index) => ({
      start,
      end: points[index + 1],
      depth: (start.z + points[index + 1].z) / 2,
    })).sort((a, b) => a.depth - b.depth);

    context.lineCap = "round";
    for (const { start, end, depth } of segments) {
      context.strokeStyle = `rgba(4,113,74,${0.13 + (depth + 1) * 0.17})`;
      context.lineWidth = 0.9 + (depth + 1) * 0.3;
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }

    NODE_POSITIONS.map(position => project(position, rotation))
      .sort((a, b) => a.z - b.z)
      .forEach(drawNode);
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  return { draw, resize };
}
