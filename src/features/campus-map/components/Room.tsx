import { memo } from 'react';
import type { Room as RoomData, Vec2 } from '../types/campus';
import { ROOM_TYPE_META } from '../data';
import { edges, insetConvex, shade, topFace, wallFaces } from '../maps/geometry';
import { localToWorld, type Camera, type Placement } from '../maps/projection';

export interface RoomRenderProps {
  room: RoomData;
  placement: Placement;
  cam: Camera;
  /** cao độ mặt sàn */
  z: number;
  /** chiều cao tường cắt (cutaway) */
  height: number;
  selected: boolean;
  dimmed?: boolean;
  onSelect: (roomId: string) => void;
  /** nét vẽ thêm trên mặt trên (vd. bậc thang) */
  overlay?: (worldPoly: Vec2[], zTop: number) => React.ReactNode;
}

export function roomWorldPolygon(room: RoomData, placement: Placement, gap = 0.35): Vec2[] {
  return insetConvex(room.geometry.points, gap).map((p) => localToWorld(p, placement));
}

/** Một phòng: khối tường thấp (cắt ngang) + mặt sàn màu theo loại phòng. */
function RoomImpl({ room, placement, cam, z, height, selected, dimmed, onSelect, overlay }: RoomRenderProps) {
  const poly = roomWorldPolygon(room, placement);
  const base = ROOM_TYPE_META[room.room_type].color;
  const zTop = cam.mode === 'top' ? z : z + height;
  const walls = wallFaces(edges(poly), z, zTop, cam, '#f7f8fa', room.room_id);
  const top = topFace(poly, zTop, cam);
  const floorFill = selected ? '#ffe2b8' : base;
  return (
    <g
      className={`room${selected ? ' is-selected' : ''}${dimmed ? ' is-dimmed' : ''}`}
      data-room-id={room.room_id}
      role="button"
      tabIndex={-1}
      aria-label={room.name}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(room.room_id);
      }}
    >
      <title>{room.code ? `${room.code} – ${room.name}` : room.name}</title>
      {walls.map((w) => (
        <path key={w.key} d={w.d} fill={w.fill} stroke={shade('#c3cad6', w.light ?? 1)} strokeWidth={0.08} />
      ))}
      <path className="room-top" d={top} fill={floorFill} />
      {overlay?.(poly, zTop)}
      {selected && <path className="room-glow" d={top} />}
    </g>
  );
}

export const Room = memo(RoomImpl);

