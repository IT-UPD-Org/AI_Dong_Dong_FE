import type { Building, Floor as FloorData, Room as RoomData, Vec2 } from '../types/campus';
import { centroid, exposedSegments, signedArea, topFace, wallFaces } from '../maps/geometry';
import { depthOf, localToWorld, project, type Camera } from '../maps/projection';
import { Room } from './Room';
import { Staircase } from './Staircase';
import { OfficeBlock } from './OfficeBlock';

export const SLAB = 0.6;
export const ROOM_WALL = 1.5;

interface FloorProps {
  building: Building;
  floor: FloorData;
  cam: Camera;
  /** cao độ đáy sàn */
  z: number;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  /** tầng không phải tầng đang chọn (trong chế độ tách tầng) */
  muted?: boolean;
  /** cho phép click vào mặt sàn để chọn tầng (chế độ tách tầng) */
  onPickFloor?: (level: number) => void;
}

function partPolys(building: Building, floor: FloorData): Vec2[][] {
  return building.footprint.parts
    .filter((p) => floor.parts.includes(p.part_id))
    .map((p) => p.polygon.map((q) => localToWorld(q, building.placement)));
}

/** Một tầng: sàn (slab) + các phòng dạng khối tường cắt thấp + vùng chưa có dữ liệu. */
export function Floor({ building, floor, cam, z, selectedRoomId, onSelectRoom, muted, onPickFloor }: FloorProps) {
  const polys = partPolys(building, floor);
  const zTop = cam.mode === 'top' ? z : z + SLAB;
  const slabWalls = wallFaces(exposedSegments(polys), z, zTop, cam, '#dfe4eb', `${floor.floor_id}-slab`);
  const sortedRooms = [...floor.rooms].sort(
    (a, b) =>
      depthOf(localToWorld(centroid(a.geometry.points), building.placement), cam) -
      depthOf(localToWorld(centroid(b.geometry.points), building.placement), cam),
  );
  const hasOffice = floor.parts.includes('A-OFFICE');

  return (
    <g
      className={`floor${muted ? ' is-muted' : ''}${onPickFloor ? ' is-pickable' : ''}`}
      data-floor={floor.level}
      onClick={onPickFloor ? () => onPickFloor(floor.level) : undefined}
    >
      {slabWalls.map((w) => (
        <path key={w.key} d={w.d} fill={w.fill} className="slab-edge" />
      ))}
      {polys.map((p, i) => (
        <path key={i} d={topFace(p, zTop, cam)} className="slab-top" />
      ))}
      {floor.unmapped_areas.map((a) => (
        <path
          key={a.area_id}
          d={topFace(a.geometry.points.map((q) => localToWorld(q, building.placement)), zTop + 0.02, cam)}
          className="unmapped"
        >
          <title>{a.note}</title>
        </path>
      ))}
      <OfficeBlock building={building} cam={cam} z={zTop} level={floor.level} present={hasOffice} />
      {sortedRooms.map((room) => {
        const Comp = room.room_type === 'staircase' ? Staircase : Room;
        return (
          <Comp
            key={room.room_id}
            room={room}
            placement={building.placement}
            cam={cam}
            z={zTop}
            height={ROOM_WALL}
            selected={room.room_id === selectedRoomId}
            onSelect={onSelectRoom}
          />
        );
      })}
    </g>
  );
}

// ---------------- Nhãn (vẽ ở lớp trên cùng để không bị che) ----------------

export interface LabelItem {
  key: string;
  x: number;
  y: number;
  lines: string[];
  size: number;
  kind: 'room' | 'room-code' | 'nodata' | 'floor';
  selected?: boolean;
}

function roomLabelLines(room: RoomData): string[] {
  if (room.code) {
    const sub = room.room_type === 'computer_lab' ? 'Phòng máy' : room.short_name ?? '';
    return sub ? [room.code, sub] : [room.code];
  }
  return [room.short_name ?? room.name];
}

export function floorLabels(
  building: Building,
  floor: FloorData,
  cam: Camera,
  z: number,
  selectedRoomId: string | null,
  scale = 1,
): LabelItem[] {
  const zTop = cam.mode === 'top' ? z : z + SLAB + ROOM_WALL;
  const out: LabelItem[] = floor.rooms.map((room) => {
    const c = localToWorld(centroid(room.geometry.points), building.placement);
    const s = project(c, zTop, cam);
    const area = Math.abs(signedArea(room.geometry.points));
    const size = (area < 150 ? 1.5 : area < 320 ? 1.95 : 2.35) * scale;
    return {
      key: room.room_id,
      x: s[0],
      y: room.room_id === selectedRoomId ? s[1] + size * 1.3 : s[1],
      lines: scale < 0.95 ? roomLabelLines(room).slice(0, 1) : roomLabelLines(room),
      size,
      kind: room.code ? 'room-code' : 'room',
      selected: room.room_id === selectedRoomId,
    };
  });
  const biggest = [...floor.unmapped_areas].sort(
    (a, b) => Math.abs(signedArea(b.geometry.points)) - Math.abs(signedArea(a.geometry.points)),
  )[0];
  if (biggest) {
    const c = localToWorld(centroid(biggest.geometry.points), building.placement);
    const s = project(c, cam.mode === 'top' ? z : z + SLAB, cam);
    out.push({ key: biggest.area_id, x: s[0], y: s[1], lines: [biggest.note], size: 2.4 * scale, kind: 'nodata' });
  }
  return out;
}
