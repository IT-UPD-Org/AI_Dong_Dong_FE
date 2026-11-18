import type { Building, Vec2 } from '../types/campus';
import { localToWorld, project, toPath, type Camera } from '../maps/projection';

interface OfficeBlockProps {
  building: Building;
  cam: Camera;
  /** cao độ mặt sàn tầng đang vẽ */
  z: number;
  level: number;
  /** tầng có khối văn phòng hay không (tầng 6: không) */
  present: boolean;
}

const OFFICE_PART = 'A-OFFICE';

/**
 * Khối văn phòng nhô ra: viền nhấn trên mặt sàn tầng, và ở tầng 1 thêm
 * ký hiệu mái che + lối vào chính phía trước khối.
 */
export function OfficeBlock({ building, cam, z, level, present }: OfficeBlockProps) {
  const part = building.footprint.parts.find((p) => p.part_id === OFFICE_PART);
  if (!part || !present) return null;
  const world = part.polygon.map((p) => localToWorld(p, building.placement));
  const outline = toPath(world.map((p) => project(p, z + 0.05, cam)));
  return (
    <g className="office-block" pointerEvents="none">
      <path d={outline} className="office-outline" />
      {level === 1 && <EntranceMarker building={building} cam={cam} z={0} />}
    </g>
  );
}

/** Mũi tên lối vào chính trên mặt đất (dùng ở cả Campus và chế độ chi tiết). */
export function EntranceMarker({ building, cam, z }: { building: Building; cam: Camera; z: number }) {
  return (
    <>
      {building.entrances.map((en) => {
        const tip = en.point;
        const dir = en.direction;
        const back: Vec2 = [tip[0] + dir[0] * 7, tip[1] + dir[1] * 7];
        const side: Vec2 = [-dir[1], dir[0]];
        const head = (s: number): Vec2 => [tip[0] + dir[0] * 2.6 + side[0] * s, tip[1] + dir[1] * 2.6 + side[1] * s];
        const w = (p: Vec2) => project(localToWorld(p, building.placement), z + 0.05, cam);
        const shaft = `M${w(back).join(',')}L${w([tip[0] + dir[0] * 1.2, tip[1] + dir[1] * 1.2]).join(',')}`;
        const arrow = toPath([w([tip[0] + dir[0] * 0.6, tip[1] + dir[1] * 0.6]), w(head(1.6)), w(head(-1.6))]);
        return (
          <g key={en.entrance_id} className="entrance" pointerEvents="none">
            <path d={shaft} className="entrance-shaft" />
            <path d={arrow} className="entrance-head" />
          </g>
        );
      })}
    </>
  );
}

export function entranceLabelPoint(building: Building, cam: Camera): { x: number; y: number; name: string } | null {
  const en = building.entrances[0];
  if (!en) return null;
  const p: Vec2 = [en.point[0] + en.direction[0] * 9, en.point[1] + en.direction[1] * 9];
  const s = project(localToWorld(p, building.placement), 0, cam);
  return { x: s[0], y: s[1], name: en.name };
}

