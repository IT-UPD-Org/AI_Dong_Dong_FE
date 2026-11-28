import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Box, Eye, EyeOff, Map as MapIcon } from 'lucide-react';
import { campus, getBuilding, getRoomRef } from '../features/campus-map/data';
import type { RoomType } from '../features/campus-map/types/campus';
import { MapCanvas, type MapCanvasHandle } from '../features/campus-map/components/MapCanvas';
import { Campus } from '../features/campus-map/components/Campus';
import {
  BuildingScene,
  EXPLODE_GAP,
  floorBaseZ,
  sceneCenter,
  type FloorMode,
} from '../features/campus-map/components/BuildingScene';
import { buildingHeight, buildingWorldPoints } from '../features/campus-map/components/Building';
import { ROOM_WALL, SLAB } from '../features/campus-map/components/Floor';
import { CampusLegend, FloorBar, Legend, ViewControls } from '../features/campus-map/components/Controls';
import { InfoPanel } from '../features/campus-map/components/InfoPanel';
import { SearchBox } from '../features/campus-map/components/SearchBox';
import { useTween } from '../features/campus-map/hooks/useTween';
import { centroid } from '../features/campus-map/maps/geometry';
import {
  localToWorld,
  project,
  sceneRadius,
  stableViewBox,
  uvToWorld,
  type Camera,
  type ProjectionMode,
} from '../features/campus-map/maps/projection';
import { buildRouteToRoom } from '../features/campus-map/maps/wayfinding';
import '../features/campus-map/campus-map.css';

/** Góc nhìn mặc định: khớp với Sơ đồ tổng mặt bằng (2D) & Phối cảnh tổng thể (2.5D). */
const DEFAULT_PHI = 71;

type View = 'campus' | 'building';

export function MapPage({ embedded = false }: { embedded?: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<View>('campus');
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [mode, setMode] = useState<FloorMode>('floor');
  const [level, setLevel] = useState(1);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [phiTarget, setPhiTarget] = useState(DEFAULT_PHI);
  const [projection, setProjection] = useState<ProjectionMode>('iso');
  const [showReference, setShowReference] = useState(false);
  const [showRoute, setShowRoute] = useState(true);
  const [mobileSheetExpanded, setMobileSheetExpanded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [focusReq, setFocusReq] = useState(0);
  const canvas = useRef<MapCanvasHandle>(null);

  const phi = useTween(phiTarget, 700);
  const explode = useTween(view === 'building' && mode === 'exploded' ? 1 : 0, 650);

  const building = buildingId ? getBuilding(buildingId) ?? null : null;
  const detailBuilding = view === 'building' && building?.detail_available ? building : null;
  const roomRef = selectedRoomId ? getRoomRef(selectedRoomId) ?? null : null;

  // ---- camera & khung nhìn ----
  const { cam, viewBox } = useMemo(() => {
    if (detailBuilding) {
      const [cx, cy] = sceneCenter(detailBuilding);
      const r = sceneRadius(buildingWorldPoints(detailBuilding), cx, cy) + 3;
      const n = detailBuilding.floors.length;
      const zMax = n * detailBuilding.floor_height + (n - 1) * EXPLODE_GAP * explode + 4;
      return {
        cam: { phi, cx, cy, mode: projection } as Camera,
        viewBox: stableViewBox(r, zMax, 4, projection),
      };
    }
    // Tâm toàn khu đất (giữa Tòa A, B, D, Nhà để xe)
    const [cx, cy] = uvToWorld(6, 25);
    const zMax = Math.max(...campus.buildings.map(buildingHeight)) + 12;
    return {
      cam: { phi, cx, cy, mode: projection } as Camera,
      viewBox: stableViewBox(132, zMax, 8, projection),
    };
  }, [detailBuilding, phi, explode, projection]);

  const route = useMemo(() => {
    if (!roomRef || !showRoute) return null;
    return buildRouteToRoom(roomRef.building, roomRef.floor, roomRef.room);
  }, [roomRef, showRoute]);

  // ---- toast ----
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  // ---- đồng bộ URL ?room=... ----
  const selectRoom = useCallback(
    (roomId: string | null) => {
      setSelectedRoomId(roomId);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (roomId) next.set('room', roomId);
          else next.delete('room');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // ---- hành động ----
  const goCampus = useCallback(() => {
    setView('campus');
    selectRoom(null);
    setBuildingId(null);
    canvas.current?.reset(false);
  }, [selectRoom]);

  const openBuilding = useCallback(
    (id: string) => {
      const b = getBuilding(id);
      if (!b) return;
      if (b.status === 'under_construction') {
        setBuildingId(id);
        setView('campus');
        setToast(`${b.name} đang hoàn thiện – chưa mở xem chi tiết.`);
        return;
      }
      if (!b.detail_available) {
        setBuildingId(id);
        setView('campus');
        setToast(
          b.building_id === 'B'
            ? 'Tòa B: Thông tin chi tiết các phòng sẽ được bổ sung sau.'
            : `${b.name}: Khu vực trên sơ đồ tổng mặt bằng.`,
        );
        return;
      }
      setToast(null);
      setBuildingId(id);
      setView('building');
      setMode('floor');
      setLevel(1);
      selectRoom(null);
      canvas.current?.reset(false);
    },
    [selectRoom],
  );

  const onCampusBuildingClick = useCallback(
    (id: string) => {
      openBuilding(id);
    },
    [openBuilding],
  );

  const pickLevel = useCallback((l: number) => {
    setLevel(l);
    setMode((m) => (m === 'exploded' ? 'exploded' : 'floor'));
    setSelectedRoomId((id) => {
      const r = id ? getRoomRef(id) : undefined;
      if (r && r.floor.level === l) return id;
      return null;
    });
  }, []);

  const pickSearch = useCallback(
    (roomId: string) => {
      const ref = getRoomRef(roomId);
      if (!ref) return;
      setToast(null);
      setBuildingId(ref.building.building_id);
      setView('building');
      setMode('floor');
      setLevel(ref.floor.level);
      selectRoom(roomId);
      setShowRoute(true);
      setFocusReq((n) => n + 1);
    },
    [selectRoom],
  );

  // Mở thẳng phòng nếu có ?room=... trên URL
  const initialRoomParam = searchParams.get('room');
  const handledRoomParamRef = useRef<string | null>(null);
  useEffect(() => {
    if (!initialRoomParam || handledRoomParamRef.current === initialRoomParam) return;
    const ref = getRoomRef(initialRoomParam);
    if (ref) {
      handledRoomParamRef.current = initialRoomParam;
      pickSearch(ref.room.room_id);
    }
  }, [initialRoomParam, pickSearch]);

  // Zoom tới phòng sau khi chọn từ ô tìm kiếm hoặc URL
  useEffect(() => {
    if (!focusReq || !roomRef || !detailBuilding) return;
    const t = setTimeout(() => {
      const c = localToWorld(centroid(roomRef.room.geometry.points), detailBuilding.placement);
      const z =
        floorBaseZ(roomRef.floor.level, detailBuilding.floor_height, mode === 'exploded' ? 1 : 0) +
        SLAB +
        ROOM_WALL;
      const [sx, sy] = project(c, projection === 'top' ? 0 : z, cam);
      canvas.current?.focus(sx, sy, 2.3);
    }, 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusReq]);

  // Esc bỏ chọn
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        selectRoom(null);
        if (view === 'campus') setBuildingId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectRoom, view]);

  // Chú giải loại phòng đang hiển thị
  const legendTypes = useMemo<RoomType[]>(() => {
    if (!detailBuilding || mode === 'whole') return [];
    const seen = new Set<RoomType>();
    const list =
      mode === 'exploded'
        ? detailBuilding.floors
        : detailBuilding.floors.filter((f) => f.level === level);
    for (const f of list) for (const r of f.rooms) seen.add(r.room_type);
    return [...seen];
  }, [detailBuilding, mode, level]);

  const activeFloor = detailBuilding?.floors.find((f) => f.level === level);

  return (
    <div
      className={`flex w-full min-w-0 flex-col overflow-hidden bg-white ${
        embedded
          ? 'h-full min-h-0 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm'
          : 'h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] min-h-0'
      }`}
    >
      {/* Thanh công cụ trên cùng */}
      <header className="relative z-20 flex shrink-0 flex-nowrap items-center gap-1.5 border-b border-slate-200 bg-white px-2 py-1.5 md:flex-wrap md:gap-2.5 md:px-4 md:py-2.5">
        {view === 'building' && (
          <button
            type="button"
            onClick={goCampus}
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl bg-slate-900 px-2.5 text-xs font-semibold text-white transition hover:bg-[#04714a] md:h-8 md:gap-1.5 md:px-3 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">Tổng mặt bằng</span>
          </button>
        )}

        <nav className="hidden min-w-0 flex-wrap items-center gap-1.5 text-xs text-slate-500 md:flex md:text-sm" aria-label="Vị trí hiện tại">
          <span className={`truncate ${view === 'campus' ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
            {campus.name}
          </span>
          {detailBuilding && (
            <>
              <span className="text-slate-300">/</span>
              <span className={`truncate ${mode === 'whole' ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
                {detailBuilding.name}
              </span>
            </>
          )}
          {detailBuilding && mode !== 'whole' && activeFloor && (
            <>
              <span className="text-slate-300">/</span>
              <span className="truncate font-semibold text-[#04714a]">{activeFloor.name}</span>
            </>
          )}
        </nav>

        <div className="hidden flex-1 md:block" />

        {/* Chuyển nhanh Sơ đồ tổng mặt bằng (2D) <-> Phối cảnh tổng thể (2.5D) */}
        <div className="hidden items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 md:inline-flex">
          <button
            type="button"
            onClick={() => setProjection('top')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              projection === 'top' ? 'bg-white text-[#04714a] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            Sơ đồ 2D
          </button>
          <button
            type="button"
            onClick={() => setProjection('iso')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              projection === 'iso' ? 'bg-white text-[#04714a] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Box className="h-3.5 w-3.5" />
            Phối cảnh 2.5D
          </button>
        </div>

        {view === 'campus' && (
          <button
            type="button"
            className={`hidden items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition lg:inline-flex ${
              showReference
                ? 'border-[#04714a]/40 bg-[#e8f7ef] text-[#04714a]'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            aria-pressed={showReference}
            onClick={() => setShowReference((v) => !v)}
            title="Phủ ảnh footprint tham chiếu của Tòa A lên mặt đất"
          >
            {showReference ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            Ảnh tham chiếu Tòa A
          </button>
        )}

        <SearchBox onPick={pickSearch} />
      </header>

      {/* Khung bản đồ chính */}
      <div className="campus-map-stage relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        <MapCanvas
          ref={canvas}
          viewBox={viewBox}
          onBackgroundClick={() => {
            if (view === 'campus') setBuildingId(null);
            else selectRoom(null);
          }}
        >
          {detailBuilding ? (
            <BuildingScene
              building={detailBuilding}
              cam={cam}
              mode={mode}
              activeLevel={level}
              explode={explode}
              selectedRoomId={selectedRoomId}
              route={route}
              onSelectRoom={(id) => {
                selectRoom(id);
                setShowRoute(true);
              }}
              onPickLevel={pickLevel}
            />
          ) : (
            <Campus
              campus={campus}
              cam={cam}
              selectedBuildingId={buildingId}
              showReference={showReference}
              onBuildingClick={onCampusBuildingClick}
            />
          )}
        </MapCanvas>

        {/* Thanh tầng khi xem chi tiết tòa */}
        {detailBuilding && (
          <FloorBar
            building={detailBuilding}
            mode={mode}
            activeLevel={level}
            projection={projection}
            onLevel={pickLevel}
            onWhole={() => {
              setMode('whole');
              selectRoom(null);
            }}
            onToggleExplode={() => setMode((m) => (m === 'exploded' ? 'floor' : 'exploded'))}
            onToggleProjection={() => setProjection((p) => (p === 'iso' ? 'top' : 'iso'))}
          />
        )}

        <InfoPanel
          campus={campus}
          view={view}
          roomRef={roomRef}
          building={building}
          route={route}
          showRoute={showRoute}
          onToggleRoute={() => setShowRoute((v) => !v)}
          onCloseRoom={() => selectRoom(null)}
          onCloseBuilding={() => setBuildingId(null)}
          onOpenBuilding={openBuilding}
          onPickQuickRoom={pickSearch}
          onMobileExpandedChange={setMobileSheetExpanded}
        />

        {view === 'campus' ? <CampusLegend /> : <Legend types={legendTypes} />}

        <ViewControls
          projection={projection}
          phi={phiTarget}
          hiddenOnMobile={mobileSheetExpanded}
          onToggleProjection={() => setProjection((p) => (p === 'iso' ? 'top' : 'iso'))}
          onZoomIn={() => canvas.current?.zoomBy(1.35)}
          onZoomOut={() => canvas.current?.zoomBy(1 / 1.35)}
          onRotate={(d) => setPhiTarget((p) => p + d)}
          onReset={() => {
            setPhiTarget(DEFAULT_PHI);
            setProjection('iso');
            canvas.current?.reset();
          }}
        />

        {toast && (
          <div
            className={`pointer-events-none absolute left-1/2 z-20 max-w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-full bg-slate-900/90 px-4 py-2 text-center text-xs font-medium text-white shadow-lg ${
              detailBuilding ? 'top-14 md:top-4' : 'top-3 md:top-4'
            }`}
            role="status"
          >
            {toast}
          </div>
        )}
      </div>

      {/* Ghi chú mô phỏng */}
      <footer className="flex shrink-0 items-center gap-1.5 border-t border-amber-200/80 bg-amber-50/90 px-2.5 py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] text-[10px] leading-tight text-amber-900 md:gap-2 md:px-4 md:py-1.5 md:text-xs">
        <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600 md:h-3.5 md:w-3.5" />
        <span className="truncate">{campus.disclaimer}</span>
      </footer>
    </div>
  );
}
