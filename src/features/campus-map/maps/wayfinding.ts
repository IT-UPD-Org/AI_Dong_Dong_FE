import type { Building, Floor, Room, Vec2 } from '../types/campus';
import { centroid } from './geometry';

export interface RouteSegment {
  /** Danh sách điểm cục bộ theo tòa nhà */
  points: Vec2[];
  /** Tầng áp dụng đoạn đường này */
  level: number;
}

export interface RoomRoute {
  segments: RouteSegment[];
  steps: string[];
}

const JOINT_ANG_RAD = (136 * Math.PI) / 180;
const DW: Vec2 = [Math.cos(JOINT_ANG_RAD), -Math.sin(JOINT_ANG_RAD)];
const NW: Vec2 = [-DW[1], DW[0]];
const PO: Vec2 = [0, 20];

/** Chiếu điểm cục bộ trên cánh ngắn xuống dải hành lang sát mép trong (r = 17.8). */
function projectShortCorridor(p: Vec2): Vec2 {
  const dx = p[0] - PO[0];
  const dy = p[1] - PO[1];
  const s = Math.max(10, Math.min(58, dx * DW[0] + dy * DW[1]));
  const r = 17.8;
  return [PO[0] + s * DW[0] + r * NW[0], PO[1] + s * DW[1] + r * NW[1]];
}

/**
 * Tạo lộ trình đi bộ minh họa từ Lối vào chính Tòa A → phòng đang chọn.
 * Giúp sinh viên dễ hình dung đường đi qua sảnh, cầu thang và hành lang.
 */
export function buildRouteToRoom(building: Building, floor: Floor, room: Room): RoomRoute | null {
  if (building.building_id !== 'A') return null;

  const target = centroid(room.geometry.points);
  const entrance = building.entrances[0]?.point ?? ([48.75, -13.5] as Vec2);
  const lobbyEntry: Vec2 = [48.75, -2.5];
  const mainStairCorridor: Vec2 = [49, 2.2];
  const mainStairCenter: Vec2 = [49, 10];
  const jointCorner: Vec2 = [10, 2.2];
  const jointHub: Vec2 = [4.5, 4.5];

  const steps: string[] = [];
  const segments: RouteSegment[] = [];

  // Bước 1: Đi từ lối vào chính vào sảnh tầng 1
  if (floor.level === 1 && room.zone === 'office_block') {
    segments.push({ level: 1, points: [entrance, [entrance[0], target[1]], target] });
    steps.push('Đi thẳng qua Lối vào chính vào khu Sảnh tầng 1.');
    steps.push(`Đến ${room.code ? `${room.code} – ` : ''}${room.name}.`);
    return { segments, steps };
  }

  if (floor.level === 1) {
    steps.push('Đi vào Lối vào chính qua Sảnh Tòa A (Tầng 1).');
    const path: Vec2[] = [entrance, lobbyEntry, mainStairCorridor];
    appendFloorCorridor(path, room, target, mainStairCorridor, jointCorner, jointHub, steps);
    segments.push({ level: 1, points: path });
    return { segments, steps };
  }

  // Tầng >= 2: đi từ tầng 1 qua cầu thang chính lên tầng đích
  steps.push('Vào Lối vào chính Tòa A → đi qua Sảnh tới Cầu thang chính.');
  segments.push({
    level: 1,
    points: [entrance, lobbyEntry, mainStairCorridor, mainStairCenter],
  });

  steps.push(`Lên Cầu thang chính tới ${floor.name}.`);
  const upperPath: Vec2[] = [mainStairCenter, mainStairCorridor];
  appendFloorCorridor(upperPath, room, target, mainStairCorridor, jointCorner, jointHub, steps);
  segments.push({ level: floor.level, points: upperPath });

  return { segments, steps };
}

function appendFloorCorridor(
  path: Vec2[],
  room: Room,
  target: Vec2,
  mainStairCorridor: Vec2,
  jointCorner: Vec2,
  jointHub: Vec2,
  steps: string[],
) {
  if (room.zone === 'office_block') {
    const officeHall: Vec2 = [mainStairCorridor[0], -2.2];
    path.push(officeHall, [target[0], -2.2], target);
    steps.push(`Từ cầu thang rẽ vào hành lang khối văn phòng → ${room.name}.`);
    return;
  }

  if (room.zone === 'wing_long') {
    if (room.room_type !== 'staircase') {
      const dir = target[0] > mainStairCorridor[0] ? 'rẽ phải' : target[0] < mainStairCorridor[0] ? 'rẽ trái' : 'đi thẳng';
      path.push([target[0], 2.2], target);
      steps.push(`Từ sảnh cầu thang ${dir} dọc hành lang Cánh dài → ${room.code ?? room.name}.`);
    } else {
      path.push(target);
      steps.push(`Đến ${room.name}.`);
    }
    return;
  }

  if (room.zone === 'joint') {
    path.push(jointCorner, target);
    steps.push(`Đi hết hành lang Cánh dài tới khu nối hai cánh → ${room.name}.`);
    return;
  }

  if (room.zone === 'wing_short') {
    const shortPt = projectShortCorridor(target);
    path.push(jointCorner, jointHub, shortPt, target);
    steps.push(`Đi dọc hành lang Cánh dài qua góc nối sang Cánh ngắn → ${room.code ?? room.name}.`);
    return;
  }

  path.push(target);
}

