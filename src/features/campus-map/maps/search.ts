import { allRooms, type RoomRef } from '../data';

/** Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export interface SearchHit {
  ref: RoomRef;
  score: number;
}

export function searchRooms(query: string, limit = 12): SearchHit[] {
  const q = normalize(query);
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const hits: SearchHit[] = [];

  for (const ref of allRooms()) {
    const r = ref.room;
    const fields = [
      r.code ?? '',
      ...r.aliases,
      r.name,
      r.unit ?? '',
      r.short_name ?? '',
      ref.floor.name,
      ref.building.name,
    ].map(normalize);

    const joined = fields.join(' ');
    if (!terms.every((t) => joined.includes(t))) continue;

    let score = 10;
    const code = normalize(r.code ?? '');
    if (code === q) score = 100;
    else if (r.aliases.some((a) => normalize(a) === q)) score = 95;
    else if (code.startsWith(q) || r.aliases.some((a) => normalize(a).startsWith(q))) score = 80;
    else if (fields.some((f) => f.includes(q))) score = 50;

    hits.push({ ref, score });
  }

  hits.sort(
    (a, b) =>
      b.score - a.score ||
      a.ref.floor.level - b.ref.floor.level ||
      a.ref.room.room_id.localeCompare(b.ref.room.room_id),
  );
  return hits.slice(0, limit);
}

