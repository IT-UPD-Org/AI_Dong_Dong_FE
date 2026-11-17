import type { LabelItem } from './Floor';

/** Lớp nhãn chữ (luôn vẽ sau cùng). Chữ có viền trắng để đọc rõ trên nền màu. */
export function Labels({ items, dim }: { items: LabelItem[]; dim?: boolean }) {
  return (
    <g className={`labels${dim ? ' is-dim' : ''}`} pointerEvents="none">
      {items.map((it) => (
        <text
          key={it.key}
          x={it.x}
          y={it.y}
          className={`label label-${it.kind}${it.selected ? ' is-selected' : ''}`}
          fontSize={it.size}
          textAnchor="middle"
        >
          {it.lines.map((line, i) => (
            <tspan
              key={i}
              x={it.x}
              dy={i === 0 ? (it.lines.length > 1 ? -it.size * 0.15 : it.size * 0.35) : it.size * 1.05}
              className={i > 0 ? 'label-sub' : undefined}
              fontSize={i > 0 ? it.size * 0.7 : undefined}
            >
              {line}
            </tspan>
          ))}
        </text>
      ))}
    </g>
  );
}

/** Nhãn dạng "viên thuốc" cho tên tòa nhà / tầng / cổng chính. */
export function Pill({
  x,
  y,
  text,
  sub,
  tone = 'default',
  size = 2.2,
}: {
  x: number;
  y: number;
  text: string;
  sub?: string;
  tone?: 'default' | 'warn' | 'accent' | 'muted' | 'gate' | 'blue';
  size?: number;
}) {
  const content = sub ? `${text} · ${sub}` : text;
  const w = content.length * size * 0.56 + size * 1.6;
  const h = size * 1.7;
  return (
    <g className={`pill pill-${tone}`} pointerEvents="none" transform={`translate(${x} ${y})`}>
      <path d={`M0,0 L${-size * 0.45},${-size * 0.6} L${size * 0.45},${-size * 0.6} Z`} className="pill-tail" />
      <rect x={-w / 2} y={-h - size * 0.55} width={w} height={h} rx={h / 2} />
      <text x={0} y={-size * 0.55 - h / 2 + size * 0.36} fontSize={size} textAnchor="middle">
        <tspan className="pill-main">{text}</tspan>
        {sub && <tspan className="pill-sub">{` · ${sub}`}</tspan>}
      </text>
    </g>
  );
}

/** Ghim vị trí phòng đang chọn (có hiệu ứng nảy). */
export function Pin({ x, y, size = 3 }: { x: number; y: number; size?: number }) {
  const s = size;
  return (
    <g className="pin" transform={`translate(${x} ${y})`} pointerEvents="none">
      <ellipse cx={0} cy={0} rx={s * 0.55} ry={s * 0.22} className="pin-shadow" />
      <g className="pin-body">
        <path
          d={`M0,0 C${-s * 0.25},${-s * 0.9} ${-s * 0.9},${-s * 1.3} ${-s * 0.9},${-s * 2} A${s * 0.9},${s * 0.9} 0 1 1 ${s * 0.9},${-s * 2} C${s * 0.9},${-s * 1.3} ${s * 0.25},${-s * 0.9} 0,0 Z`}
        />
        <circle cx={0} cy={-s * 2} r={s * 0.36} className="pin-dot" />
      </g>
    </g>
  );
}
