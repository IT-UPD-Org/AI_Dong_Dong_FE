import type { Building as BuildingData, Vec2 } from '../types/campus';
import { centroid, exposedSegments, mix, shade, topFace, wallFaces, windowBand } from '../maps/geometry';
import { localToWorld, project, toPath, type Camera } from '../maps/projection';

export interface MassingLevel {
  level: number;
  parts: string[];
}

/** Danh sách tầng dùng để dựng khối. Tòa chưa có dữ liệu tầng → dùng placeholder_levels. */
export function massingLevels(b: BuildingData): MassingLevel[] {
  if (b.floors.length) return b.floors.map((f) => ({ level: f.level, parts: f.parts }));
  const all = b.footprint.parts.map((p) => p.part_id);
  return Array.from({ length: b.placeholder_levels ?? 1 }, (_, i) => ({ level: i + 1, parts: all }));
}

export function buildingHeight(b: BuildingData): number {
  return massingLevels(b).length * b.floor_height;
}

export function buildingWorldPoints(b: BuildingData): Vec2[] {
  return b.footprint.parts.flatMap((p) => p.polygon.map((q) => localToWorld(q, b.placement)));
}

export function buildingCenter(b: BuildingData): Vec2 {
  const main = b.footprint.parts[0];
  return localToWorld(centroid(main.polygon), b.placement);
}

interface BuildingProps {
  building: BuildingData;
  cam: Camera;
  /** chỉ dựng đến tầng này (dùng khi xem 1 tầng: các tầng dưới vẽ đặc) */
  maxLevel?: number;
  /** click cả tòa (chế độ Campus) */
  onClick?: (id: string) => void;
  /** click từng tầng (chế độ "toàn bộ tòa nhà") */
  onPickLevel?: (level: number) => void;
  /** làm mờ các tầng (khi là nền cho tầng đang xem) */
  faded?: boolean;
  selected?: boolean;
  /** làm trong suốt để đối chiếu với ảnh tham chiếu */
  xray?: boolean;
}

/** Khối kiến trúc của một tòa nhà: tường, dải cửa sổ, mái màu riêng. */
export function Building({ building, cam, maxLevel, onClick, onPickLevel, faded, selected, xray }: BuildingProps) {
  const levels = massingLevels(building).filter((l) => maxLevel === undefined || l.level <= maxLevel);
  const h = building.floor_height;
  const isParking = building.building_id === 'PARKING';
  const partWorld = new Map(
    building.footprint.parts.map((p) => [p.part_id, p.polygon.map((q) => localToWorld(q, building.placement))]),
  );
  const wallColor = building.style.wall;

  const levelNodes = levels.map((lv, idx) => {
    const z0 = (lv.level - 1) * h;
    const z1 = lv.level * h;
    const polys = lv.parts.map((p) => partWorld.get(p)!).filter(Boolean);
    const walls = wallFaces(exposedSegments(polys), z0, z1, cam, wallColor, `${building.building_id}-L${lv.level}`);
    const next = levels[idx + 1];
    const isTopVisible = maxLevel === undefined || lv.level === maxLevel;
    return (
      <g
        key={lv.level}
        className={`massing-level${onPickLevel ? ' is-pickable' : ''}`}
        data-level={lv.level}
        onClick={
          onPickLevel
            ? (e) => {
                e.stopPropagation();
                onPickLevel(lv.level);
              }
            : undefined
        }
      >
        {onPickLevel && <title>{`Tầng ${lv.level} – bấm để xem mặt bằng`}</title>}
        {walls.map((w) => {
          const win = isParking ? null : windowBand(w, cam);
          return (
            <g key={w.key}>
              <path d={w.d} fill={w.fill} stroke={shade('#c7ced8', w.light ?? 1)} strokeWidth={0.1} />
              {win && (
                <>
                  <path d={win.band} fill={shade('#9fb6cc', w.light ?? 1)} />
                  <path d={win.mullions} className="mullions" />
                </>
              )}
            </g>
          );
        })}
        {lv.parts.map((pid) => {
          const roofExposed = !next || !next.parts.includes(pid);
          if (!roofExposed && !isTopVisible) return null;
          const poly = partWorld.get(pid)!;
          const fill = roofExposed && maxLevel === undefined ? building.style.roof : mix(wallColor, '#ffffff', 0.4);
          return (
            <path
              key={pid}
              d={topFace(poly, cam.mode === 'top' ? 0 : z1, cam)}
              fill={fill}
              className="roof"
            />
          );
        })}
        {lv.parts.length > 1 && (!next || maxLevel === lv.level) && maxLevel === undefined && (
          <RoofSeams polys={polys} z={cam.mode === 'top' ? 0 : z1} cam={cam} color={shade(building.style.roof, 0.86)} />
        )}
      </g>
    );
  });

  return (
    <g
      className={`building status-${building.status}${onClick ? ' is-clickable' : ''}${faded ? ' is-faded' : ''}${selected ? ' is-selected' : ''}${xray ? ' is-xray' : ''}`}
      data-building={building.building_id}
      onClick={
        onClick
          ? (e) => {
              e.stopPropagation();
              onClick(building.building_id);
            }
          : undefined
      }
    >
      {onClick && <title>{building.name}</title>}
      {levelNodes}
    </g>
  );
}

/** Đường nối giữa các khối mái (để thấy rõ hai cánh và góc nối). */
function RoofSeams({ polys, z, cam, color }: { polys: Vec2[][]; z: number; cam: Camera; color: string }) {
  const d = polys.map((p) => toPath(p.map((q) => project(q, z, cam)))).join('');
  return <path d={d} fill="none" stroke={color} strokeWidth={0.18} pointerEvents="none" />;
}
