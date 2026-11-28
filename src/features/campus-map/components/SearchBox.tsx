import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { searchRooms } from '../maps/search';
import { ROOM_TYPE_META } from '../data';

interface Props {
  onPick: (roomId: string) => void;
}

/** Ô tìm phòng: gõ mã (A103, X01, 601) hoặc tên / đơn vị. Enter chọn kết quả đầu. */
export function SearchBox({ onPick }: Props) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const hits = useMemo(() => searchRooms(q), [q]);

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement !== inputRef.current &&
        !(document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pick = (i: number) => {
    const h = hits[i];
    if (!h) return;
    onPick(h.ref.room.room_id);
    setQ(h.ref.room.code ?? h.ref.room.name);
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div
      className="relative min-w-0 flex-1 md:w-80 md:flex-none lg:w-96"
      role="combobox"
      aria-expanded={open && q.length > 0}
      aria-haspopup="listbox"
    >
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 md:left-3 md:h-4 md:w-4" />
      <input
        ref={inputRef}
        value={q}
        placeholder="Tìm phòng: A103, X01, 601, thư viện… (/)"
        aria-label="Tìm phòng"
        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-8 text-xs text-slate-900 outline-none transition focus:border-[#04714a] focus:bg-white focus:ring-2 focus:ring-[#04714a]/20 md:pl-9 md:text-sm"
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 140)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, hits.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === 'Enter') {
            pick(active);
          } else if (e.key === 'Escape') {
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
      />
      {q && (
        <button
          type="button"
          className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 md:right-1.5 md:h-6 md:w-6 md:rounded-md cursor-pointer"
          aria-label="Xoá tìm kiếm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setQ('')}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {open && q.trim().length > 0 && (
        <ul
          className="absolute right-0 top-10 z-30 max-h-[50dvh] w-[min(22rem,calc(100vw-2rem))] overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl md:left-0 md:top-11 md:max-h-80 md:w-auto"
          role="listbox"
        >
          {hits.length === 0 && (
            <li className="px-3 py-2.5 text-sm text-slate-500">Không tìm thấy phòng “{q}”.</li>
          )}
          {hits.map((h, i) => (
            <li
              key={h.ref.room.room_id}
              role="option"
              aria-selected={i === active}
              className={`flex min-h-11 sm:min-h-0 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                i === active ? 'bg-[#e8f7ef] text-[#013422]' : 'hover:bg-slate-50'
              }`}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(i)}
            >
              <span
                className="h-3 w-3 shrink-0 rounded-sm border border-black/10"
                style={{ background: ROOM_TYPE_META[h.ref.room.room_type].color }}
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold text-slate-900">
                  {h.ref.room.code ?? h.ref.room.name}
                </span>
                {h.ref.room.code && (
                  <span className="truncate text-xs text-slate-500">{h.ref.room.name}</span>
                )}
              </span>
              <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                {h.ref.building.name} · {h.ref.floor.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

