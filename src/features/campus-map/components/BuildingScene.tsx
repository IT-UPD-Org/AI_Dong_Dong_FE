import type { Building as BuildingData, Vec2 } from '../types/campus';
import { centroid, exposedSegments } from '../maps/geometry';
import { localToWorld, project, toOpenPath, type Camera } from '../maps/projection';
import type { RoomRoute } from '../maps/wayfinding';
import { Building } from './Building';
import { Floor, floorLabels, ROOM_WALL, SLAB, type LabelItem } from './Floor';
import { GroundPlate, Shadow } from './Campus';
import { EntranceMarker, entranceLabelPoint } from './OfficeBlock';
import { Labels, Pill, Pin } from './Labels';

export type FloorMode = 'whole' | 'floor' | 'exploded';
export const EXPLODE_GAP = 24;

/** Cao độ đáy của một tầng theo chế độ hiển thị (explode ∈ [0..1]). */
export function floorBaseZ(level: number, h: number, explode: number): number {
  return (level - 1) * (h + EXPLODE_GAP * explode);
}

export function buildingPlate(b: BuildingData, margin = 18): Vec2[] {
  const pts = b.footprint.parts.flatMap((p) => p.polygon);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs) - margin;
  const x1 = Math.max(...xs) + margin;
  const y0 = Math.min(...ys) - margin;
  const y1 = Math.max(...ys) + margin;
  return (
    [
      [x0, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
    ] as Vec2[]
  ).map((p) => localToWorld(p, b.placement));
}

interface Props {
  building: BuildingData;
  cam: Camera;
  mode: FloorMode;
  activeLevel: number;
  /** giá trị nội suy 0..1 của độ tách tầng */
  explode: number;
  selectedRoomId: string | null;
  route: RoomRoute | null;
  onSelectRoom: (id: string) => void;
  onPickLevel: (level: number) => void;
}

/** Mô hình chi tiết một tòa: toàn bộ / một tầng / tách tầng + tuyến đường đi bộ. */
export function BuildingScene({
  building,
  cam,
  mode,
  activeLevel,
  explode,
  selectedRoomId,
  route,
  onSelectRoom,
  onPickLevel,
}: Props) {
  const h = building.floor_height;
  const floors = [...building.floors].sort((a, b) => a.level - b.level);
  const showExploded = mode === 'exploded' || explode > 0.002;
  const partPolys = building.footprint.parts.map((p) => p.polygon.map((q) => localToWorld(q, building.placement)));

  let content: React.ReactNode = null;
  let labels: LabelItem[] = [];
  let pin: Vec2 | null = null;
  const floorTags: { level: number; x: number; y: number; active: boolean; noData: boolean }[] = [];

  const pinFor = (level: number, z: number) => {
    const f = floors.find((fl) => fl.level === level);
    const r = f?.rooms.find((rm) => rm.room_id === selectedRoomId);
    if (!r) return;
    const zPin = cam.mode === 'top' ? z : z + SLAB + ROOM_WALL;
    const p = project(localToWorld(centroid(r.geometry.points), building.placement), zPin, cam);
    pin = [p[0], p[1]];
  };

  if (showExploded) {
    content = floors.map((f) => {
      const z = floorBaseZ(f.level, h, explode);
      const pts = exposedSegments(
        building.footprint.parts
          .filter((p) => f.parts.includes(p.part_id))
          .map((p) => p.polygon.map((q) => localToWorld(q, building.placement))),
      ).map((s) => project(s.a, cam.mode === 'top' ? 0 : z, cam));
      const left = pts.reduce((m, p) => (p[0] < m[0] ? p : m), pts[0]);
      floorTags.push({
        level: f.level,
        x: left[0] - 3,
        y: left[1],
        active: f.level === activeLevel,
        noData: f.plan_status === 'no_data',
      });
      // Chỉ hiển thị nhãn phòng của tầng đang chọn khi tách tầng để tránh chữ các tầng chồng lên nhau
      if (f.level === activeLevel) {
        labels = floorLabels(building, f, cam, z, selectedRoomId, 0.92).map((l) => ({
          ...l,
          key: `${f.level}-${l.key}`,
        }));
      }
      pinFor(f.level, z);
      return (
        <Floor
          key={f.floor_id}
          building={building}
          floor={f}
          cam={cam}
          z={z}
          selectedRoomId={selectedRoomId}
          onSelectRoom={onSelectRoom}
          muted={f.level !== activeLevel}
          onPickFloor={onPickLevel}
        />
      );
    });
  } else if (mode === 'floor') {
    const f = floors.find((fl) => fl.level === activeLevel) ?? floors[0];
    const z = floorBaseZ(f.level, h, 0);
    labels = floorLabels(building, f, cam, z, selectedRoomId);
    pinFor(f.level, z);
    content = (
      <>
        {f.level > 1 && cam.mode !== 'top' && <Building building={building} cam={cam} maxLevel={f.level - 1} faded />}
        <Floor building={building} floor={f} cam={cam} z={z} selectedRoomId={selectedRoomId} onSelectRoom={onSelectRoom} />
        {f.level < floors.length && cam.mode !== 'top' && <GhostAbove polys={partPolys} zTop={floors.length * h} cam={cam} />}
      </>
    );
  } else {
    content = <Building building={building} cam={cam} onPickLevel={onPickLevel} />;
  }

  const entrance = entranceLabelPoint(building, cam);

  // Lọc đoạn đường cần vẽ theo chế độ hiện tại
  const visibleRouteSegments =
    route && mode !== 'whole'
      ? route.segments.filter((seg) => showExploded || seg.level === activeLevel)
      : [];

  return (
    <g className={`building-scene mode-${showExploded ? 'exploded' : mode}`}>
      <GroundPlate polygon={buildingPlate(building)} cam={cam} thickness={1.6} />
      {cam.mode !== 'top' && <Shadow polys={partPolys} cam={cam} />}
      <EntranceMarker building={building} cam={cam} z={0} />
      {content}
      {visibleRouteSegments.map((seg, idx) => {
        const zFloor = floorBaseZ(seg.level, h, showExploded ? explode : 0);
        const zPath = cam.mode === 'top' ? zFloor + 0.08 : zFloor + SLAB + ROOM_WALL + 0.12;
        const d = toOpenPath(seg.points.map((pt) => project(localToWorld(pt, building.placement), zPath, cam)));
        const isMuted = showExploded && seg.level !== activeLevel;
        return (
          <g key={`${seg.level}-${idx}`} pointerEvents="none">
            <path d={d} className="route-halo" />
            <path d={d} className={`route-line${isMuted ? ' is-muted' : ''}`} />
          </g>
        );
      })}
      <Labels items={labels} />
      {floorTags.map((t) => (
        <Pill
          key={t.level}
          x={t.x}
          y={t.y}
          text={`Tầng ${t.level}`}
          sub={t.noData ? 'thiếu dữ liệu' : undefined}
          size={1.9}
          tone={t.active ? 'accent' : 'muted'}
        />
      ))}
      {entrance && !showExploded && (
        <text x={entrance.x} y={entrance.y + 2.6} className="ground-note" textAnchor="middle" fontSize={1.6}>
          {entrance.name}
        </text>
      )}
      {pin && <Pin x={pin[0]} y={pin[1]} size={1.6} />}
    </g>
  );
}

/** Đường viền mờ thể hiện phần tòa nhà phía trên tầng đang xem. */
function GhostAbove({ polys, zTop, cam }: { polys: Vec2[][]; zTop: number; cam: Camera }) {
  const segs = exposedSegments(polys);
  const d = segs
    .map((s) => {
      const a = project(s.a, zTop, cam);
      const b = project(s.b, zTop, cam);
      return `M${a[0].toFixed(2)},${a[1].toFixed(2)}L${b[0].toFixed(2)},${b[1].toFixed(2)}`;
    })
    .join('');
  return <path d={d} className="ghost-above" pointerEvents="none" />;
}

export function sceneCenter(b: BuildingData): Vec2 {
  const pts = b.footprint.parts.flatMap((p) => p.polygon.map((q) => localToWorld(q, b.placement)));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
}
