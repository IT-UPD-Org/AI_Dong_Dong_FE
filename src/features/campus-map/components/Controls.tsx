import { useEffect, useRef, useState } from 'react';
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const floors = [...building.floors].sort((a, b) => b.level - a.level);
  const currentFloor = building.floors.find((f) => f.level === activeLevel);

  const mobileSummary =
    mode === 'whole'
      ? `${building.name} · Toàn tòa`
      : mode === 'exploded'
        ? `${building.name} · ${currentFloor?.name ?? `T${activeLevel}`} (Tách)`
        : `${building.name} · ${currentFloor?.name ?? `Tầng ${activeLevel}`}`;

  useEffect(() => {
    setMobileOpen(false);
  }, [building.building_id]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [mobileOpen]);

  return (
    <nav
      ref={navRef}
      className="absolute left-2 top-2 z-20 flex flex-col items-start md:left-4 md:top-4 md:w-56"
      aria-label="Chọn tầng"
    >
      {/* Mobile (< md): sleek 1-line floating pill that expands on tap */}
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        aria-controls="floorbar-panel"
        aria-label={mobileOpen ? 'Thu gọn chọn tầng' : 'Mở chọn tầng'}
        className="inline-flex h-9 max-w-[calc(100vw-5.5rem)] items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/95 px-3 text-xs font-semibold text-slate-800 shadow-md backdrop-blur transition hover:bg-slate-50 md:hidden cursor-pointer"
      >
        <Layers className="h-3.5 w-3.5 shrink-0 text-[#04714a]" />
        <span className="truncate">{mobileSummary}</span>
        {mobileOpen ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
        )}
      </button>

      {/* Panel: dropdown popover on mobile when open, persistent floating card on desktop (>= md) */}
      <div
        id="floorbar-panel"
        data-mobile-open={mobileOpen ? 'true' : 'false'}
        className={`${
          mobileOpen ? 'mt-1.5 flex w-56 max-w-[calc(100vw-4.5rem)]' : 'hidden'
        } flex-col gap-1.5 rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-xl backdrop-blur md:mt-0 md:flex md:w-full md:max-w-none md:gap-2 md:p-3 md:shadow-lg`}
      >
        {/* Desktop header with building title + 2D/2.5D toggle (hidden on mobile to avoid duplicate toggle with ViewControls) */}
        <div className="hidden items-center justify-between gap-2 px-1 md:flex">
          <span className="truncate text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {building.name}
          </span>
          <button
            type="button"
            onClick={onToggleProjection}
            className={`inline-flex min-h-7 items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
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

        <div className="grid grid-cols-2 gap-1.5 md:flex md:flex-col">
          {floors.map((f) => {
            const active = mode !== 'whole' && f.level === activeLevel;
            return (
              <button
                key={f.floor_id}
                type="button"
                className={`flex min-h-9 items-center justify-between gap-1.5 rounded-xl px-2.5 text-xs font-medium transition md:h-9 md:w-full md:rounded-lg md:text-sm cursor-pointer ${
                  active
                    ? 'bg-[#04714a] font-semibold text-white shadow-sm'
                    : 'bg-slate-100/80 text-slate-700 hover:bg-[#e8f7ef] hover:text-[#04714a]'
                }`}
                aria-pressed={active}
                onClick={() => {
                  onLevel(f.level);
                  setMobileOpen(false);
                }}
                title={f.plan_status === 'no_data' ? `${f.name}: chưa có dữ liệu mặt bằng khối chính` : f.name}
              >
                <span className="truncate">{f.name}</span>
                {f.plan_status === 'no_data' && (
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${active ? 'bg-amber-300' : 'bg-amber-500'}`}
                    aria-label="thiếu dữ liệu"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-1.5 border-t border-slate-200/80 pt-1.5 md:pt-2">
          <button
            type="button"
            className={`flex min-h-9 items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition md:rounded-lg md:py-2 cursor-pointer ${
              mode === 'whole'
                ? 'border-[#04714a]/40 bg-[#e8f7ef] text-[#013422]'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            aria-pressed={mode === 'whole'}
            onClick={() => {
              onWhole();
              setMobileOpen(false);
            }}
          >
            <Box className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Toàn bộ tòa nhà</span>
          </button>
          <button
            type="button"
            className={`flex min-h-9 items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition md:rounded-lg md:py-2 cursor-pointer ${
              mode === 'exploded'
                ? 'border-[#04714a]/40 bg-[#e8f7ef] text-[#013422]'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            aria-pressed={mode === 'exploded'}
            onClick={() => {
              onToggleExplode();
              setMobileOpen(false);
            }}
          >
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Tách tầng</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

interface ViewControlsProps {
  projection: ProjectionMode;
  phi: number;
  hiddenOnMobile?: boolean;
  onToggleProjection: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: (deg: number) => void;
  onReset: () => void;
}

export function ViewControls({
  projection,
  phi,
  hiddenOnMobile = false,
  onToggleProjection,
  onZoomIn,
  onZoomOut,
  onRotate,
  onReset,
}: ViewControlsProps) {
  return (
    <div
      data-hidden-mobile={hiddenOnMobile ? 'true' : 'false'}
      className={`${
        hiddenOnMobile ? 'hidden md:flex' : 'flex'
      } absolute right-2 top-2 z-10 flex-col items-center gap-0.5 rounded-2xl border border-slate-200/90 bg-white/95 p-1 shadow-lg backdrop-blur md:bottom-4 md:right-4 md:top-auto md:flex-row md:gap-1 md:p-1.5`}
      role="toolbar"
      aria-label="Điều khiển góc nhìn"
    >
      <button
        type="button"
        onClick={onToggleProjection}
        className={`flex h-9 min-w-9 items-center justify-center gap-1 rounded-xl px-1.5 text-[10px] font-semibold transition md:h-8 md:min-w-0 md:px-2.5 md:text-xs cursor-pointer ${
          projection === 'top'
            ? 'bg-[#04714a] text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
        }`}
        title="Đổi chế độ 2.5D / 2D phẳng"
      >
        {projection === 'top' ? <MapIcon className="h-3.5 w-3.5 shrink-0" /> : <Box className="h-3.5 w-3.5 shrink-0" />}
        <span>{projection === 'top' ? '2D' : '2.5D'}</span>
      </button>

      <span className="h-px w-6 bg-slate-200 md:mx-0.5 md:h-5 md:w-px" />

      <button
        type="button"
        className="flex size-9 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 md:size-8 cursor-pointer"
        onClick={onZoomIn}
        aria-label="Phóng to"
        title="Phóng to"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="flex size-9 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 md:size-8 cursor-pointer"
        onClick={onZoomOut}
        aria-label="Thu nhỏ"
        title="Thu nhỏ"
      >
        <Minus className="h-4 w-4" />
      </button>

      <span className="h-px w-6 bg-slate-200 md:mx-0.5 md:h-5 md:w-px" />

      <button
        type="button"
        className="flex size-9 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 md:size-8 cursor-pointer"
        onClick={() => onRotate(-45)}
        aria-label="Xoay trái 45°"
        title="Xoay trái 45°"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="flex size-9 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 md:size-8 cursor-pointer"
        onClick={() => onRotate(45)}
        aria-label="Xoay phải 45°"
        title="Xoay phải 45°"
      >
        <RotateCw className="h-4 w-4" />
      </button>

      <div
        className="hidden h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-[10px] font-bold text-slate-600 md:flex"
        title={`Hướng Bắc (góc xoay: ${Math.round(phi)}°)`}
      >
        <span
          className="inline-block transition-transform duration-300"
          style={{ transform: `rotate(${phi - 71}deg)` }}
        >
          ↑N
        </span>
      </div>

      <span className="h-px w-6 bg-slate-200 md:mx-0.5 md:h-5 md:w-px" />

      <button
        type="button"
        className="flex h-9 min-w-9 items-center justify-center rounded-xl px-1.5 text-[10px] font-medium text-slate-700 hover:bg-slate-100 md:h-8 md:min-w-0 md:px-2.5 md:text-xs cursor-pointer"
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
      className="absolute bottom-4 left-4 z-10 hidden max-w-[calc(100%-22rem)] flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur md:flex"
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
      className="absolute bottom-4 left-4 z-10 hidden max-w-[calc(100%-22rem)] flex-col gap-1.5 rounded-2xl border border-slate-200/90 bg-white/95 px-3 py-2 shadow-lg backdrop-blur md:flex"
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
