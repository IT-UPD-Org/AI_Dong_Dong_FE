/**
 * Tiện ích hình học 2D & tạo mặt khối 2.5D (tường, mái, cửa sổ, cầu thang).
 */
import type { Vec2 } from '../types/campus';
import { depthOf, project, toPath, type Camera, type Pt } from './projection';

export interface Segment {
  a: Vec2;
  b: Vec2;
  /** pháp tuyến ngoài (đơn vị) */
  n: Vec2;
}

export function signedArea(poly: Vec2[]): number {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    s += x1 * y2 - x2 * y1;
  }
  return s / 2;
}

export function ensureCCW(poly: Vec2[]): Vec2[] {
  return signedArea(poly) < 0 ? [...poly].reverse() : poly;
}

export function centroid(poly: Vec2[]): Vec2 {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    const cr = x1 * y2 - x2 * y1;
    a += cr;
    cx += (x1 + x2) * cr;
    cy += (y1 + y2) * cr;
  }
  a *= 3;
  if (Math.abs(a) < 1e-6) {
    const n = poly.length || 1;
    return [poly.reduce((s, p) => s + p[0], 0) / n, poly.reduce((s, p) => s + p[1], 0) / n];
  }
  return [cx / a, cy / a];
}

/** Cạnh của đa giác kèm pháp tuyến ngoài (trong hệ tọa độ world: CCW → ngoài nằm bên phải cạnh). */
export function edges(poly: Vec2[]): Segment[] {
  const ccw = ensureCCW(poly);
  const out: Segment[] = [];
  for (let i = 0; i < ccw.length; i++) {
    const a = ccw[i];
    const b = ccw[(i + 1) % ccw.length];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) continue;
    out.push({ a, b, n: [dy / len, -dx / len] });
  }
  return out;
}

/** Thu nhỏ đa giác lồi vào trong khoảng `d` để tạo khe tường giữa các phòng. */
export function insetConvex(poly: Vec2[], d: number): Vec2[] {
  const ccw = ensureCCW(poly);
  const n = ccw.length;
  const lines = ccw.map((p, i) => {
    const q = ccw[(i + 1) % n];
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    return { p: [p[0] + nx * d, p[1] + ny * d] as Vec2, d: [dx, dy] as Vec2 };
  });
  return lines.map((l1, i) => {
    const l0 = lines[(i - 1 + n) % n];
    const den = l0.d[0] * l1.d[1] - l0.d[1] * l1.d[0];
    if (Math.abs(den) < 1e-6) return l1.p;
    const dx = l1.p[0] - l0.p[0];
    const dy = l1.p[1] - l0.p[1];
    const t = (dx * l1.d[1] - dy * l1.d[0]) / den;
    return [l0.p[0] + l0.d[0] * t, l0.p[1] + l0.d[1] * t];
  });
}

// ---------------- Loại bỏ cạnh trùng giữa các phần ghép nhau ----------------

const pointInPoly = (pt: Vec2, poly: Vec2[]): boolean => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

const distToSeg = (p: Vec2, a: Vec2, b: Vec2): number => {
  const vx = b[0] - a[0];
  const vy = b[1] - a[1];
  const l2 = vx * vx + vy * vy;
  if (l2 < 1e-9) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / l2));
  return Math.hypot(p[0] - (a[0] + t * vx), p[1] - (a[1] + t * vy));
};

const onBoundary = (pt: Vec2, poly: Vec2[], eps = 0.08): boolean =>
  poly.some((a, i) => distToSeg(pt, a, poly[(i + 1) % poly.length]) < eps);

/**
 * Tách các cạnh của tập hợp đa giác và bỏ đi những đoạn nằm bên trong/trên biên đa giác khác,
 * tránh tường nội bộ hiện ra ở chỗ nối giữa các phần tòa nhà.
 */
export function exposedSegments(polys: Vec2[][]): Segment[] {
  const out: Segment[] = [];
  for (let pi = 0; pi < polys.length; pi++) {
    for (const seg of edges(polys[pi])) {
      const dx = seg.b[0] - seg.a[0];
      const dy = seg.b[1] - seg.a[1];
      const len = Math.hypot(dx, dy);
      const ts = new Set<number>([0, 1]);
      for (let oi = 0; oi < polys.length; oi++) {
        if (oi === pi) continue;
        const o = polys[oi];
        for (let k = 0; k < o.length; k++) {
          const p = o[k];
          const q = o[(k + 1) % o.length];
          const rx = q[0] - p[0];
          const ry = q[1] - p[1];
          const den = dx * ry - dy * rx;
          if (Math.abs(den) > 1e-6) {
            const t = ((p[0] - seg.a[0]) * ry - (p[1] - seg.a[1]) * rx) / den;
            const u = ((p[0] - seg.a[0]) * dy - (p[1] - seg.a[1]) * dx) / den;
            if (t > 1e-3 && t < 1 - 1e-3 && u >= -1e-3 && u <= 1 + 1e-3) ts.add(t);
          } else {
            for (const v of [p, q]) {
              const proj = ((v[0] - seg.a[0]) * dx + (v[1] - seg.a[1]) * dy) / (len * len);
              if (proj > 1e-3 && proj < 1 - 1e-3) ts.add(proj);
            }
          }
        }
      }
      const sorted = [...ts].sort((a, b) => a - b);
      for (let i = 0; i < sorted.length - 1; i++) {
        const t0 = sorted[i];
        const t1 = sorted[i + 1];
        if (t1 - t0 < 1e-4) continue;
        const tm = (t0 + t1) / 2;
        const mid: Vec2 = [seg.a[0] + dx * tm, seg.a[1] + dy * tm];
        const probe: Vec2 = [mid[0] + seg.n[0] * 0.15, mid[1] + seg.n[1] * 0.15];
        const hidden = polys.some((o, oi) => oi !== pi && (pointInPoly(probe, o) || (onBoundary(mid, o) && pointInPoly(mid, o))));
        if (!hidden) {
          out.push({
            a: [seg.a[0] + dx * t0, seg.a[1] + dy * t0],
            b: [seg.a[0] + dx * t1, seg.a[1] + dy * t1],
            n: seg.n,
          });
        }
      }
    }
  }
  return out;
}

// ---------------- Màu & ánh sáng ----------------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export function shade(hex: string, f: number): string {
  const [r, g, b] = hexToRgb(hex);
  const c = (x: number) => Math.max(0, Math.min(255, Math.round(x * f)));
  return `rgb(${c(r)},${c(g)},${c(b)})`;
}

export function mix(hexA: string, hexB: string, t: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const c = (i: number) => Math.round(a[i] + (b[i] - a[i]) * t);
  return `rgb(${c(0)},${c(1)},${c(2)})`;
}

const LIGHT: Vec2 = [-0.42, 0.91];

function rotateVec(v: Vec2, phi: number): Vec2 {
  const a = (phi * Math.PI) / 180;
  return [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
}

// ---------------- mặt khối đã chiếu ----------------

export interface Face {
  key: string;
  d: string;
  fill: string;
  depth: number;
  /** chỉ dùng cho tường: độ sáng theo hướng */
  light?: number;
}

export interface WallFace extends Face {
  seg: Segment;
  z0: number;
  z1: number;
  len: number;
}

/** Mặt tường nhìn thấy được (đã loại mặt quay lưng), sắp từ xa → gần. Ẩn khi xem 2D phẳng. */
export function wallFaces(
  segs: Segment[],
  z0: number,
  z1: number,
  cam: Camera,
  color: string,
  keyPrefix: string,
): WallFace[] {
  if (cam.mode === 'top') return [];
  const out: WallFace[] = [];
  segs.forEach((s, i) => {
    const nr = rotateVec(s.n, cam.phi);
    if (nr[0] + nr[1] <= 1e-6) return; // quay lưng về người xem
    const light = 0.8 + 0.17 * (nr[0] * LIGHT[0] + nr[1] * LIGHT[1]);
    const pts: Pt[] = [project(s.a, z0, cam), project(s.b, z0, cam), project(s.b, z1, cam), project(s.a, z1, cam)];
    const mid: Vec2 = [(s.a[0] + s.b[0]) / 2, (s.a[1] + s.b[1]) / 2];
    out.push({
      key: `${keyPrefix}-w${i}`,
      d: toPath(pts),
      fill: shade(color, light),
      depth: depthOf(mid, cam),
      light,
      seg: s,
      z0,
      z1,
      len: Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]),
    });
  });
  return out.sort((a, b) => a.depth - b.depth);
}

export function topFace(poly: Vec2[], z: number, cam: Camera): string {
  return toPath(poly.map((p) => project(p, z, cam)));
}

/** Dải cửa sổ (ribbon window) + đố cửa trên một mặt tường. */
export function windowBand(w: WallFace, cam: Camera, spacing = 3.2): { band: string; mullions: string } | null {
  if (w.len < 2.5 || cam.mode === 'top') return null;
  const h = w.z1 - w.z0;
  const za = w.z0 + h * 0.36;
  const zb = w.z0 + h * 0.78;
  const inset = Math.min(0.9, w.len * 0.15) / w.len;
  const at = (t: number): Vec2 => [w.seg.a[0] + (w.seg.b[0] - w.seg.a[0]) * t, w.seg.a[1] + (w.seg.b[1] - w.seg.a[1]) * t];
  const p0 = at(inset);
  const p1 = at(1 - inset);
  const band = toPath([project(p0, za, cam), project(p1, za, cam), project(p1, zb, cam), project(p0, zb, cam)]);
  const count = Math.max(1, Math.round((w.len * (1 - 2 * inset)) / spacing));
  let mullions = '';
  for (let i = 1; i < count; i++) {
    const t = inset + ((1 - 2 * inset) * i) / count;
    const pa = project(at(t), za, cam);
    const pb = project(at(t), zb, cam);
    mullions += `M${pa[0].toFixed(2)},${pa[1].toFixed(2)}L${pb[0].toFixed(2)},${pb[1].toFixed(2)}`;
  }
  return { band, mullions };
}

/** Các đường bậc thang song song cạnh dài nhất, cắt theo đa giác lồi. */
export function stairLines(poly: Vec2[], count: number): [Vec2, Vec2][] {
  const es = edges(poly);
  let best = es[0];
  let bestLen = Infinity;
  for (const e of es) {
    const l = Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]);
    if (l > 1.5 && l < bestLen) {
      bestLen = l;
      best = e;
    }
  }
  const dir: Vec2 = [(best.b[0] - best.a[0]) / bestLen, (best.b[1] - best.a[1]) / bestLen];
  const nrm: Vec2 = [-best.n[0], -best.n[1]];
  const proj = (p: Vec2) => (p[0] - best.a[0]) * nrm[0] + (p[1] - best.a[1]) * nrm[1];
  const maxD = Math.max(...poly.map(proj));
  const lines: [Vec2, Vec2][] = [];
  for (let i = 1; i < count; i++) {
    const d = (maxD * i) / count;
    const hits: Vec2[] = [];
    for (let k = 0; k < poly.length; k++) {
      const p = poly[k];
      const q = poly[(k + 1) % poly.length];
      const dp = proj(p) - d;
      const dq = proj(q) - d;
      if ((dp <= 0 && dq > 0) || (dp > 0 && dq <= 0)) {
        const t = dp / (dp - dq);
        hits.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
      }
    }
    if (hits.length >= 2) {
      hits.sort((u, v) => u[0] * dir[0] + u[1] * dir[1] - (v[0] * dir[0] + v[1] * dir[1]));
      lines.push([hits[0], hits[hits.length - 1]]);
    }
  }
  return lines;
}

