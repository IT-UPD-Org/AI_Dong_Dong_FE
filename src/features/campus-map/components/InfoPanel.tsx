import { useState } from 'react';
import { ArrowRight, Check, CheckCircle2, Copy, MapPin, Navigation, X } from 'lucide-react';
import type { Building, Campus } from '../types/campus';
import { ROOM_TYPE_META, type RoomRef } from '../data';
import type { RoomRoute } from '../maps/wayfinding';

interface Props {
  campus: Campus;
  view: 'campus' | 'building';
  roomRef: RoomRef | null;
  building: Building | null;
  route: RoomRoute | null;
  showRoute: boolean;
  onToggleRoute: () => void;
  onCloseRoom: () => void;
  onCloseBuilding: () => void;
  onOpenBuilding: (id: string) => void;
  onPickQuickRoom: (roomId: string) => void;
}

const ZONE_LABEL: Record<string, string> = {
  wing_long: 'Cánh dài (khối chính)',
  wing_short: 'Cánh ngắn (khối chính)',
  joint: 'Khu nối hai cánh',
  office_block: 'Khối văn phòng nhô ra',
  placeholder: 'Khu vực tổng mặt bằng',
};

const QUICK_SPOTS = [
  { id: 'A-F1-VP-SANH', label: 'Sảnh Tòa A' },
  { id: 'A101', label: 'Phòng A101' },
  { id: 'A201', label: 'Phòng máy 201' },
  { id: 'A-F5-VP-CNTT', label: 'Trung tâm CNTT (T5)' },
  { id: 'A-F6-THU-VIEN', label: 'Thư viện (T6)' },
];

const BUILDING_DESCRIPTIONS: Record<string, { badge: string; badgeClass: string; desc: string }> = {
  B: {
    badge: 'Sẽ bổ sung chi tiết phòng sau',
    badgeClass: 'bg-blue-100 text-blue-800',
    desc: 'Khối giảng đường Tòa B (3 tầng, mái xanh) nằm dọc phía Đông Nam sân khuôn viên, nối từ khu vực Cổng chính xuống phía Nam. Danh sách các phòng của Tòa B sẽ được cập nhật ở giai đoạn tiếp theo.',
  },
  D: {
    badge: 'Đang hoàn thiện',
    badgeClass: 'bg-amber-100 text-amber-800',
    desc: 'Khối công trình Tòa D nằm ở cạnh Tây Nam sân khuôn viên, hiện đang trong quá trình thi công hoàn thiện nên chưa mở truy cập chi tiết.',
  },
  PARKING: {
    badge: 'Khu phụ trợ',
    badgeClass: 'bg-indigo-100 text-indigo-800',
    desc: 'Khu vực Nhà để xe nằm sát mặt ngoài cánh Tây Bắc của Tòa A, tiếp giáp tuyến đường bao quanh trường.',
  },
};

/** Bảng thông tin chi tiết phòng / tòa nhà / tổng quan khuôn viên. */
export function InfoPanel({
  campus,
  view,
  roomRef,
  building,
  route,
  showRoute,
  onToggleRoute,
  onCloseRoom,
  onCloseBuilding,
  onOpenBuilding,
  onPickQuickRoom,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (roomId: string) => {
    const url = `${window.location.origin}/map?room=${encodeURIComponent(roomId)}`;
    void navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (roomRef) {
    const { room, floor, building: b } = roomRef;
    const meta = ROOM_TYPE_META[room.room_type];
    return (
      <aside
        className="z-20 flex max-h-[55vh] flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur md:absolute md:right-4 md:top-4 md:max-h-[calc(100%-5.5rem)] md:w-80"
        aria-label="Thông tin phòng"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ background: meta.color }} />
            {meta.label}
          </span>
          <button
            type="button"
            onClick={onCloseRoom}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng thông tin phòng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="mt-2.5 text-lg font-bold tracking-tight text-slate-900">
          {room.code ? `${room.code} – ${room.name}` : room.name}
        </h2>

        <dl className="mt-3 grid grid-cols-[90px_1fr] gap-x-3 gap-y-2 border-y border-slate-100 py-3 text-xs">
          <dt className="text-slate-400">Tòa nhà</dt>
          <dd className="font-medium text-slate-800">{b.name}</dd>
          <dt className="text-slate-400">Tầng</dt>
          <dd className="font-medium text-slate-800">{floor.name}</dd>
          <dt className="text-slate-400">Khu vực</dt>
          <dd className="font-medium text-slate-800">{ZONE_LABEL[room.zone] ?? room.zone}</dd>
          {room.unit && (
            <>
              <dt className="text-slate-400">Đơn vị</dt>
              <dd className="font-medium text-slate-800">{room.unit}</dd>
            </>
          )}
          {room.aliases.length > 0 && (
            <>
              <dt className="text-slate-400">Mã tra cứu</dt>
              <dd className="font-mono text-slate-700">{room.aliases.join(', ')}</dd>
            </>
          )}
        </dl>

        {route && (
          <div className="mt-3 rounded-xl border border-[#04714a]/20 bg-[#e8f7ef]/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#04714a]">
                <Navigation className="h-3.5 w-3.5" />
                Lộ trình nội bộ (từ sảnh Tòa A)
              </span>
              <button
                type="button"
                onClick={onToggleRoute}
                className="text-[11px] font-semibold text-[#04714a] underline-offset-2 hover:underline"
              >
                {showRoute ? 'Ẩn đường' : 'Hiện đường'}
              </button>
            </div>
            <ol className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-700">
              {route.steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#04714a] text-[10px] font-bold text-white">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {room.note && (
          <p className="mt-3 rounded-xl bg-amber-50/90 px-3 py-2 text-xs leading-relaxed text-amber-900">
            {room.note}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleCopyLink(room.room_id)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[#04714a]" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Đã sao chép link' : 'Sao chép link phòng'}
          </button>
          <span className="text-[11px] text-slate-400">Vị trí phòng mô phỏng</span>
        </div>
      </aside>
    );
  }

  if (building && view === 'campus') {
    const info = BUILDING_DESCRIPTIONS[building.building_id] ?? {
      badge: 'Đang hoạt động',
      badgeClass: 'bg-emerald-100 text-emerald-800',
      desc: 'Khối giảng đường chính 6 tầng của cơ sở.',
    };
    return (
      <aside
        className="z-20 flex flex-col rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur md:absolute md:right-4 md:top-4 md:w-80"
        aria-label="Thông tin tòa nhà"
      >
        <div className="flex items-start justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${info.badgeClass}`}>
            {info.badge}
          </span>
          <button
            type="button"
            onClick={onCloseBuilding}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng thông tin tòa nhà"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="mt-2.5 text-lg font-bold text-slate-900">{building.name}</h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">{info.desc}</p>

        {building.detail_available && (
          <button
            type="button"
            className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#04714a] px-3 py-2 text-xs font-semibold text-white hover:bg-[#035e3f]"
            onClick={() => onOpenBuilding(building.building_id)}
          >
            Xem chi tiết 6 tầng & phòng
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </aside>
    );
  }

  return (
    <aside
      className="z-20 hidden max-h-[calc(100%-5.5rem)] flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur md:absolute md:right-4 md:top-4 md:flex md:w-80"
      aria-label="Hướng dẫn sử dụng"
    >
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#04714a]">
        <MapPin className="h-3.5 w-3.5" />
        {campus.name}
      </div>
      <h2 className="mt-1 text-base font-bold text-slate-900">{campus.university}</h2>

      {campus.address && (
        <div className="mt-2 rounded-xl border border-[#04714a]/20 bg-[#e8f7ef]/60 p-2.5 text-xs text-slate-800">
          <div className="flex items-center gap-1.5 font-semibold text-[#04714a]">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            Địa chỉ cơ sở
          </div>
          <p className="mt-1 leading-relaxed text-slate-700">{campus.address}</p>
        </div>
      )}

      {view === 'campus' ? (
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Các khu vực trên sơ đồ</p>
          <ul className="mt-1.5 space-y-1.5">
            {campus.buildings.map((b) => (
              <li key={b.building_id}>
                <button
                  type="button"
                  onClick={() => onOpenBuilding(b.building_id)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2 text-left text-xs transition hover:border-[#04714a]/40 hover:bg-[#e8f7ef]/50"
                >
                  <span className="flex items-center gap-2 font-semibold text-slate-800">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.style.roof }} />
                    {b.name}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {b.status === 'under_construction'
                      ? 'Đang hoàn thiện'
                      : b.detail_available
                        ? `${b.floors.length} tầng →`
                        : b.building_id === 'B'
                          ? '3 tầng (chờ bổ sung)'
                          : 'Khu phụ trợ'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-3 border-t border-slate-100 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Điểm hay tìm (Tòa A)</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK_SPOTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onPickQuickRoom(s.id)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition hover:border-[#04714a]/50 hover:bg-[#e8f7ef] hover:text-[#04714a]"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
