/**
 * Kiểu dữ liệu Campus. Cấu trúc khớp 1-1 với file JSON trong data/,
 * thiết kế để có thể lưu thẳng thành document MongoDB (campus → buildings → floors → rooms).
 */

export type Vec2 = [number, number];

export interface PolygonGeometry {
  type: 'polygon';
  /** Tọa độ vector tương đối với mặt bằng tầng của tòa nhà (không phải GPS). */
  points: Vec2[];
  note?: string;
}

export type RoomType =
  | 'unspecified'
  | 'computer_lab'
  | 'staircase'
  | 'restroom'
  | 'hall'
  | 'studio'
  | 'library'
  | 'storage'
  | 'office'
  | 'faculty_lounge'
  | 'lobby'
  | 'it_center';

export type Zone = 'wing_long' | 'wing_short' | 'joint' | 'office_block' | 'placeholder';

export interface Room {
  room_id: string;
  /** Mã phòng chính thức (vd. A103). null nếu chưa có mã. */
  code: string | null;
  name: string;
  building_id: string;
  floor_id: string;
  room_type: RoomType;
  zone: Zone;
  /** Đơn vị quản lý (Khoa / Trung tâm), nếu có. */
  unit: string | null;
  note: string | null;
  /** Tên ngắn để hiển thị nhãn trên bản đồ. */
  short_name: string | null;
  /** Từ khoá tìm kiếm phụ, vd. "X01", "601". */
  aliases: string[];
  geometry: PolygonGeometry;
}

export interface UnmappedArea {
  area_id: string;
  zone: Zone;
  note: string;
  geometry: PolygonGeometry;
}

export interface Floor {
  floor_id: string;
  level: number;
  name: string;
  plan_status: 'simulated' | 'no_data' | 'surveyed';
  plan_note?: string;
  /** Các khối (part_id) của footprint có mặt ở tầng này. */
  parts: string[];
  rooms: Room[];
  unmapped_areas: UnmappedArea[];
}

export interface FootprintPart {
  part_id: string;
  zone: Zone;
  label: string;
  polygon: Vec2[];
}

export interface Entrance {
  entrance_id: string;
  name: string;
  point: Vec2;
  direction: Vec2;
}

export type BuildingStatus = 'active' | 'under_construction';

export interface Building {
  building_id: string;
  name: string;
  status: BuildingStatus;
  detail_available: boolean;
  data_quality: 'simulated' | 'placeholder' | 'surveyed';
  /** Đặt mặt bằng cục bộ vào campus: campus = (x, y) + R(rotation) · local */
  placement: { x: number; y: number; rotation_deg: number };
  floor_height: number;
  /** Chỉ dùng cho khối placeholder chưa có dữ liệu tầng. */
  placeholder_levels?: number;
  style: { roof: string; wall: string };
  footprint: { parts: FootprintPart[] };
  entrances: Entrance[];
  floors: Floor[];
}

export interface Campus {
  campus_id: string;
  name: string;
  university: string;
  address?: string;
  schema_version: number;
  coordinate_system: {
    campus: string;
    floor_plan: string;
    reference_image: { src: string; width: number; height: number; scale: number };
  };
  disclaimer: string;
  missing_items?: string[];
  ground: { polygon: Vec2[] };
  buildings: Building[];
}

