import raw from './minh-khai.campus.json';
import type { Building, Campus, Floor, Room, RoomType } from '../types/campus';

/** Dữ liệu được tách riêng khỏi phần render. Thay file JSON (hoặc nạp từ API/MongoDB) là đủ. */
export const campus = raw as unknown as Campus;

export const ROOM_TYPE_META: Record<RoomType, { label: string; color: string }> = {
  unspecified: { label: 'Chưa xác định công năng', color: '#e2e8f1' },
  computer_lab: { label: 'Phòng máy', color: '#cde2fa' },
  staircase: { label: 'Cầu thang', color: '#d6dae2' },
  restroom: { label: 'Nhà vệ sinh', color: '#cfeee7' },
  hall: { label: 'Hội trường', color: '#e2d9f6' },
  studio: { label: 'Studio', color: '#f9d8e4' },
  library: { label: 'Thư viện', color: '#d4efcf' },
  storage: { label: 'Kho', color: '#efe3cb' },
  office: { label: 'Văn phòng', color: '#fde6c2' },
  faculty_lounge: { label: 'Văn phòng nghỉ giảng viên', color: '#fbe0cf' },
  lobby: { label: 'Sảnh', color: '#d8ecf8' },
  it_center: { label: 'Phòng CNTT (Trung tâm)', color: '#d3d9fb' },
};

export interface RoomRef {
  room: Room;
  floor: Floor;
  building: Building;
}

export function getBuilding(id: string): Building | undefined {
  return campus.buildings.find((b) => b.building_id === id);
}

const roomIndex = new Map<string, RoomRef>();
for (const building of campus.buildings) {
  for (const floor of building.floors) {
    for (const room of floor.rooms) roomIndex.set(room.room_id, { room, floor, building });
  }
}

export function getRoomRef(roomId: string): RoomRef | undefined {
  return roomIndex.get(roomId);
}

export function allRooms(): RoomRef[] {
  return [...roomIndex.values()];
}

export function roomDisplayCode(room: Room): string {
  return room.code ?? room.name;
}

