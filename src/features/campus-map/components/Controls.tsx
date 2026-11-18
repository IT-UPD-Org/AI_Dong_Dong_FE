import { useState } from 'react';
import { Box, ChevronDown, ChevronUp, Layers, Map as MapIcon, Minus, Plus, RotateCcw, RotateCw } from 'lucide-react';
import type { Building, RoomType } from '../types/campus';
import type { ProjectionMode } from '../maps/projection';
import { ROOM_TYPE_META } from '../data';
import type { FloorMode } from './BuildingScene';

interface FloorBarProps {
  building: Building;
  mode: FloorMode;
  activeLevel: number;
  projection: ProjectionMode;
  onLevel: (level: number) => void;
  onWhole: () => void;
  onToggleExplode: () => void;
  onToggleProjection: () => void;
}

/** Thanh chọn tầng nổi + chế độ xem (Toàn tòa / Tách tầng / 2D-2.5D). */
export function FloorBar({
  building,
  mode,
  activeLevel,
  projection,
  onLevel,
  onWhole,
  onToggleExplode,
  onToggleProjection,
}: FloorBarProps) {
  const floors = [...building.floors].sort((a, b) => b.level - a.level);
  return (
    <nav
      className="z-10 flex flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white/95 p-3 shadow-lg backdrop-blur md:absolute md:left-4 md:top-4 md:w-56"
      aria-label="Chọn tầng"
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{building.name}</span>
        <button
          type="button"
          onClick={onToggleProjection}
          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition ${
            projection === 'top'
              ? 'border-[#04714a]/30 bg-[#e8f7ef] text-[#04714a]'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
          title="Chuyển nhanh giữa mô hình 2.5D và mặt bằng 2D phẳng"
        >
          {projection === 'top' ? <MapIcon className="h-3 w-3" /> : <Box className="h-3 w-3" />}
          {projection === 'top' ? '2D Phẳng' : '2.5D'}
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
        {floors.map((f) => {
          const active = mode !== 'whole' && f.level === activeLevel;
          return (
            <button
              key={f.floor_id}
              type="button"
              className={`flex h-8 shrink-0 items-center justify-between gap-2 rounded-lg px-2.5 text-xs font-medium transition md:h-9 md:w-full md:text-sm ${
                active
                  ? 'bg-[#04714a] font-semibold text-white shadow-sm'
                  : 'bg-slate-100/80 text-slate-700 hover:bg-[#e8f7ef] hover:text-[#04714a]'
              }`}
              aria-pressed={active}
              onClick={() => onLevel(f.level)}
              title={f.plan_status === 'no_data' ? `${f.name}: chưa có dữ liệu mặt bằng khối chính` : f.name}
            >
              <span>{f.name}</span>
              {f.plan_status === 'no_data' && (
                <span
                  className={`h-2 w-2 rounded-full ${active ? 'bg-amber-300' : 'bg-amber-500'}`}
                  aria-label="thiếu dữ liệu"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-1.5 border-t border-slate-200/80 pt-2 md:grid-cols-1">
        <button
          type="button"
          className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium transition ${
            mode === 'whole'
              ? 'border-[#04714a]/40 bg-[#e8f7ef] text-[#013422]'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
          aria-pressed={mode === 'whole'}
          onClick={onWhole}
        >
          <Box className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Toàn bộ tòa nhà</span>
        </button>
        <button
          type="button"
          className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium transition ${
            mode === 'exploded'
              ? 'border-[#04714a]/40 bg-[#e8f7ef] text-[#013422]'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
          aria-pressed={mode === 'exploded'}
          onClick={onToggleExplode}
        >
          <Layers className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Tách tầng</span>
        </button>
      </div>
    </nav>
  );
}

interface ViewControlsProps {
  projection: ProjectionMode;
  phi: number;
  onToggleProjection: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: (deg: number) => void;
  onReset: () => void;
}

export function ViewControls({
  projection,
  phi,
  onToggleProjection,
  onZoomIn,
  onZoomOut,
  onRotate,
  onReset,
}: ViewControlsProps) {
  return (
    <div
      className="absolute bottom-4 right-4 z-10 flex items-center gap-1 rounded-2xl border border-slate-200/90 bg-white/95 p-1.5 shadow-lg backdrop-blur"
      role="toolbar"
      aria-label="Điều khiển góc nhìn"
    >
      <button
        type="button"
        onClick={onToggleProjection}
        className={`flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition ${
          projection === 'top'
            ? 'bg-[#04714a] text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
        }`}
        title="Đổi chế độ 2.5D / 2D phẳng"
      >
        {projection === 'top' ? <MapIcon className="h-3.5 w-3.5" /> : <Box className="h-3.5 w-3.5" />}
        <span>{projection === 'top' ? '2D' : '2.5D'}</span>
      </button>

      <span className="mx-0.5 h-5 w-px bg-slate-200" />

      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100"
        onClick={onZoomIn}
        aria-label="Phóng to"
        title="Phóng to"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100"
        onClick={onZoomOut}
        aria-label="Thu nhỏ"
        title="Thu nhỏ"
      >
        <Minus className="h-4 w-4" />
      </button>

      <span className="mx-0.5 h-5 w-px bg-slate-200" />

      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100"
        onClick={() => onRotate(-45)}
        aria-label="Xoay trái 45°"
        title="Xoay trái 45°"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100"
        onClick={() => onRotate(45)}
        aria-label="Xoay phải 45°"
        title="Xoay phải 45°"
      >
        <RotateCw className="h-4 w-4" />
      </button>

      <div
        className="hidden h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-[10px] font-bold text-slate-600 sm:flex"
        title={`Hướng Bắc (góc xoay: ${Math.round(phi)}°)`}
      >
        <span
          className="inline-block transition-transform duration-300"
          style={{ transform: `rotate(${phi - 71}deg)` }}
        >
          ↑N
        </span>
      </div>

      <span className="mx-0.5 h-5 w-px bg-slate-200" />

      <button
        type="button"
        className="h-8 rounded-xl px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
        onClick={onReset}
        title="Đặt lại góc nhìn và mức zoom"
      >
        Đặt lại
      </button>
    </div>
  );
}

/** Chú giải tổng mặt bằng khuôn viên (khớp bảng chú giải sơ đồ 2D / 2.5D). */
export function CampusLegend() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="absolute bottom-4 left-4 z-10 hidden max-w-[calc(100%-22rem)] flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur sm:flex"
      aria-label="Chú giải tổng mặt bằng"
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900"
      >
        <span>Chú giải khuôn viên</span>
        {collapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {!collapsed && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-700">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <i className="h-3 w-4 rounded-[3px] border border-[#b84632] bg-[#f3c6bc]" />
            Tòa A
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <i className="h-3 w-4 rounded-[3px] border border-[#4c74a3] bg-[#c5daf2]" />
            Tòa B
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <i className="h-3 w-4 rounded-[3px] border border-dashed border-amber-600 bg-amber-200/80" />
            Tòa D (đang hoàn thiện)
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <i className="h-3 w-4 rounded-[3px] border border-[#365ca3] bg-[#6e96de]" />
            Nhà để xe
          </span>
        </div>
      )}
    </div>
  );
}

export function Legend({ types }: { types: RoomType[] }) {
  const [collapsed, setCollapsed] = useState(false);
  if (!types.length) return null;

  return (
    <div
      className="absolute bottom-4 left-4 z-10 hidden max-w-[calc(100%-22rem)] flex-col gap-1.5 rounded-2xl border border-slate-200/90 bg-white/95 px-3 py-2 shadow-lg backdrop-blur sm:flex"
      aria-label="Chú giải loại phòng"
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
      >
        <span>Chú giải màu phòng ({types.length})</span>
        {collapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
      {!collapsed && (
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {types.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 text-xs text-slate-700">
              <i
                className="h-2.5 w-2.5 rounded-[3px] border border-black/10"
                style={{ background: ROOM_TYPE_META[t].color }}
              />
              {ROOM_TYPE_META[t].label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
