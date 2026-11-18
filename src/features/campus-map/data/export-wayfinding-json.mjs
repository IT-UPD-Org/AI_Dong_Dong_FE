import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ZONE_LABELS = {
  wing_long: 'Cánh dài',
  wing_short: 'Cánh ngắn',
  joint: 'Khu nối hai cánh',
  office_block: 'Khối văn phòng',
  placeholder: 'Khu vực chưa khảo sát chi tiết',
};

const BUILDING_ALIASES = {
  A: ['Toa A', 'Nha A', 'Khu A'],
  B: ['Toa B', 'Nha B', 'Khu B'],
  D: ['Toa D', 'Nha D', 'Khu D'],
  PARKING: ['Nha de xe', 'Bai xe', 'Giu xe'],
};

function inferStairGroup(stairRoom) {
  const id = stairRoom.room_id || '';
  if (id.includes('CT-CHINH')) return 'CT-CHINH';
  if (id.includes('CT-PHU')) return 'CT-PHU';
  if (id.includes('VP-CT')) return 'VP-CT';
  return id;
}

function buildPositionDescription(zone, floorName, areaName, note) {
  const zoneLabel = ZONE_LABELS[zone] ?? zone;
  const base = `${zoneLabel}, ${floorName}, ${areaName}`;
  const cleanedNote = (note ?? '').trim();
  const isUsefulSpatialNote =
    cleanedNote &&
    !cleanedNote.startsWith('Chưa có thông tin') &&
    !cleanedNote.startsWith('Phòng lớn. Chưa có') &&
    !cleanedNote.startsWith('Đơn vị đào tạo') &&
    !cleanedNote.startsWith('Thuộc Trung tâm CNTT');
  return isUsefulSpatialNote ? `${base} (${cleanedNote.replace(/\.$/, '')})` : base;
}

/**
 * Chuẩn hoá dữ liệu từ minh-khai.campus.json thành 2 cấu trúc JSON phân cấp Khu > Tầng:
 * - rooms.json: Khu > Tầng > Phòng
 * - stairs.json: Khu > Tầng > Cầu thang
 * Không tự bịa thêm tầng/phòng/cầu thang cho những khu vực chưa có dữ liệu (Tầng 5, Tòa B, Tòa D, Nhà để xe).
 */
export function buildWayfindingDatasets(campus) {
  const isSimulatedCampus = true;

  const roomsAreas = [];
  const stairsAreas = [];

  for (const building of campus.buildings ?? []) {
    const areaId = building.building_id;
    const areaName = building.name;
    const areaAliases = BUILDING_ALIASES[areaId] ?? [];
    const isSample = building.data_quality !== 'surveyed' && isSimulatedCampus;

    const stairGroupFloors = new Map();
    for (const floor of building.floors ?? []) {
      for (const room of floor.rooms ?? []) {
        if (room.room_type !== 'staircase') continue;
        const group = inferStairGroup(room);
        if (!stairGroupFloors.has(group)) stairGroupFloors.set(group, new Set());
        stairGroupFloors.get(group).add(floor.level);
      }
    }

    const roomFloors = [];
    const stairFloors = [];

    for (const floor of building.floors ?? []) {
      const floorRooms = [];
      const floorStairs = [];

      for (const room of floor.rooms ?? []) {
        const positionDescription = buildPositionDescription(room.zone, floor.name, areaName, room.note);

        if (room.room_type === 'staircase') {
          const group = inferStairGroup(room);
          const connectedLevels = [...(stairGroupFloors.get(group) ?? [])].sort((a, b) => a - b);
          floorStairs.push({
            id: room.room_id,
            stair_group: group,
            name: room.name,
            aliases: room.aliases ?? [],
            zone: room.zone,
            connects_to_floors: connectedLevels,
            position_description: positionDescription,
            is_sample: isSample,
          });
        } else {
          const aliases = [...(room.aliases ?? [])];
          if (room.room_type === 'lobby' && floor.level === 1) {
            for (const entrance of building.entrances ?? []) {
              if (entrance.name && !aliases.includes(entrance.name)) {
                aliases.push(entrance.name);
              }
            }
          }
          floorRooms.push({
            id: room.room_id,
            code: room.code ?? null,
            name: room.name,
            aliases,
            room_type: room.room_type,
            zone: room.zone,
            unit: room.unit ?? null,
            position_description: positionDescription,
            is_sample: isSample,
          });
        }
      }

      roomFloors.push({
        floor_level: floor.level,
        floor_id: floor.floor_id,
        name: floor.name,
        rooms: floorRooms,
      });

      stairFloors.push({
        floor_level: floor.level,
        floor_id: floor.floor_id,
        name: floor.name,
        stairs: floorStairs,
      });
    }

    roomsAreas.push({
      area_id: areaId,
      name: areaName,
      aliases: areaAliases,
      detail_available: Boolean(building.detail_available),
      is_sample: isSample,
      inter_area_links: [],
      floors: roomFloors,
    });

    stairsAreas.push({
      area_id: areaId,
      name: areaName,
      floors: stairFloors,
    });
  }

  return {
    rooms: {
      schema_version: 1,
      campus_id: campus.campus_id,
      campus_name: campus.name,
      default_start_room_id: 'A-F1-VP-SANH',
      areas: roomsAreas,
    },
    stairs: {
      schema_version: 1,
      campus_id: campus.campus_id,
      campus_name: campus.name,
      areas: stairsAreas,
    },
  };
}

function main() {
  const inputPath = path.resolve(__dirname, 'minh-khai.campus.json');
  const raw = fs.readFileSync(inputPath, 'utf-8');
  const campus = JSON.parse(raw);
  const { rooms, stairs } = buildWayfindingDatasets(campus);

  const targetDir = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(__dirname, '../../../../../AI_Dong_Dong_BE/src/data/campus');

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'rooms.json'), `${JSON.stringify(rooms, null, 2)}\n`, 'utf-8');
  fs.writeFileSync(path.join(targetDir, 'stairs.json'), `${JSON.stringify(stairs, null, 2)}\n`, 'utf-8');

  const roomCount = rooms.areas.reduce(
    (sum, a) => sum + a.floors.reduce((s, f) => s + f.rooms.length, 0),
    0,
  );
  const stairCount = stairs.areas.reduce(
    (sum, a) => sum + a.floors.reduce((s, f) => s + f.stairs.length, 0),
    0,
  );
  console.log(`Exported ${roomCount} rooms and ${stairCount} stair nodes to ${targetDir}`);
}

const isEntrypoint = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isEntrypoint) {
  main();
}
