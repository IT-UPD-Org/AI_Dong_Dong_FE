/**
 * Phép chiếu 2.5D Isometric và 2D Mặt bằng phẳng (Top-down) có xoay góc nhìn.
 *
 * Hệ "world" = hệ tọa độ campus (đơn vị tương đối). Mỗi tòa có hệ mặt bằng cục bộ
 * được đặt vào campus qua placement (tịnh tiến + xoay).
 *
 *   1) xoay world quanh tâm cảnh (cx, cy) một góc phi
 *   2) iso:  sx = (rx − ry)·cos30°,  sy = (rx + ry)·sin30° − z
 *      top:  sx = (rx − ry)/√2,      sy = (rx + ry)/√2   (cùng hướng Bắc-Nam với 2.5D)
 */
import type { Vec2 } from '../types/campus';

const C30 = Math.cos(Math.PI / 6);
const S30 = 0.5;
const INV_SQRT2 = Math.SQRT1_2;

export type ProjectionMode = 'iso' | 'top';

export interface Camera {
  phi: number; // độ
  cx: number;
  cy: number;
  mode?: ProjectionMode;
}

export interface Placement {
  x: number;
  y: number;
  rotation_deg: number;
}

export type Pt = [number, number];

/** Tâm chuẩn và góc chuẩn (phi=71° + 45° = 116°) khớp sơ đồ tổng mặt bằng 2D/2.5D. */
const REF_CX = 77.45;
const REF_CY = 61.39;
const REF_ANG = (116 * Math.PI) / 180;
const COS_REF = Math.cos(REF_ANG);
const SIN_REF = Math.sin(REF_ANG);

/** Đổi tọa độ mặt bằng chuẩn (u: Đông/phải, v: Nam/xuống) sang tọa độ world của campus. */
export function uvToWorld(u: number, v: number): Vec2 {
  return [REF_CX + u * COS_REF + v * SIN_REF, REF_CY - u * SIN_REF + v * COS_REF];
}

export function localToWorld(p: Vec2, pl: Placement): Vec2 {
  const a = (pl.rotation_deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [pl.x + p[0] * c - p[1] * s, pl.y + p[0] * s + p[1] * c];
}

export function rotateWorld(p: Vec2, cam: Camera): Vec2 {
  const a = (cam.phi * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const x = p[0] - cam.cx;
  const y = p[1] - cam.cy;
  return [x * c - y * s, x * s + y * c];
}

/** Chiếu một điểm world (x, y, z) ra màn hình. */
export function project(p: Vec2, z: number, cam: Camera): Pt {
  const [rx, ry] = rotateWorld(p, cam);
  if (cam.mode === 'top') {
    return [(rx - ry) * INV_SQRT2, (rx + ry) * INV_SQRT2];
  }
  return [(rx - ry) * C30, (rx + ry) * S30 - z];
}

export function depthOf(p: Vec2, cam: Camera): number {
  const [rx, ry] = rotateWorld(p, cam);
  return rx + ry;
}

/** Ma trận SVG đưa ảnh (pixel) nằm phẳng trên mặt đất: world = pixel / scale. */
export function groundImageMatrix(scale: number, cam: Camera): string {
  const o = project([0, 0], 0, cam);
  const ex = project([1 / scale, 0], 0, cam);
  const ey = project([0, 1 / scale], 0, cam);
  return `matrix(${ex[0] - o[0]} ${ex[1] - o[1]} ${ey[0] - o[0]} ${ey[1] - o[1]} ${o[0]} ${o[1]})`;
}

/** Bán kính lớn nhất từ tâm — dùng tính khung nhìn ổn định khi xoay. */
export function sceneRadius(points: Vec2[], cx: number, cy: number): number {
  let r = 0;
  for (const p of points) r = Math.max(r, Math.hypot(p[0] - cx, p[1] - cy));
  return r;
}

/** viewBox không đổi theo góc xoay (bao mọi góc) → mô hình không bị "nhảy" khi xoay. */
export function stableViewBox(
  radius: number,
  zMax: number,
  pad = 6,
  mode: ProjectionMode = 'iso',
): [number, number, number, number] {
  if (mode === 'top') {
    const hw = radius + pad;
    const hh = radius * 0.85 + pad;
    return [-hw, -hh, hw * 2, hh * 2];
  }
  const hw = Math.SQRT2 * radius * C30 + pad;
  const top = (Math.SQRT2 * radius) / 2 + zMax + pad;
  const bottom = (Math.SQRT2 * radius) / 2 + pad;
  return [-hw, -top, hw * 2, top + bottom];
}

export const toPath = (pts: Pt[]): string =>
  pts.length ? `M${pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('L')}Z` : '';

export const toOpenPath = (pts: Pt[]): string =>
  pts.length ? `M${pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('L')}` : '';
