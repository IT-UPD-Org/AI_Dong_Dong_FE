import { useEffect, useImperativeHandle, useRef, type ReactNode, type Ref } from 'react';
import { select } from 'd3-selection';
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import 'd3-transition';

export interface MapCanvasHandle {
  reset: (animate?: boolean) => void;
  zoomBy: (k: number) => void;
  /** Đưa điểm (tọa độ viewBox) vào giữa khung nhìn với mức zoom k */
  focus: (x: number, y: number, k: number) => void;
}

interface Props {
  viewBox: [number, number, number, number];
  children: ReactNode;
  onBackgroundClick?: () => void;
  ref?: Ref<MapCanvasHandle>;
}

/** Khung SVG chứa mô hình 2.5D / 2D, zoom/pan mượt bằng d3-zoom. */
export function MapCanvas({ viewBox, children, onBackgroundClick, ref }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const vbRef = useRef(viewBox);
  vbRef.current = viewBox;

  useEffect(() => {
    const svg = select(svgRef.current!);
    const z = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.45, 8])
      .on('zoom', (ev) => {
        gRef.current?.setAttribute('transform', ev.transform.toString());
      });
    svg.call(z).on('dblclick.zoom', null);
    zoomRef.current = z;
    return () => {
      svg.on('.zoom', null);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    reset(animate = true) {
      const svg = select(svgRef.current!);
      const z = zoomRef.current!;
      if (animate) svg.transition().duration(550).call(z.transform, zoomIdentity);
      else svg.call(z.transform, zoomIdentity);
    },
    zoomBy(k: number) {
      select(svgRef.current!).transition().duration(300).call(zoomRef.current!.scaleBy, k);
    },
    focus(x: number, y: number, k: number) {
      const [vx, vy, vw, vh] = vbRef.current;
      const cx = vx + vw / 2;
      const cy = vy + vh / 2;
      const t = zoomIdentity.translate(cx, cy).scale(k).translate(-x, -y);
      select(svgRef.current!).transition().duration(700).call(zoomRef.current!.transform, t);
    },
  }));

  return (
    <svg
      ref={svgRef}
      className="map-svg"
      viewBox={viewBox.join(' ')}
      preserveAspectRatio="xMidYMid meet"
      onClick={onBackgroundClick}
      role="application"
      aria-label="Bản đồ campus 2.5D. Kéo để di chuyển, cuộn để phóng to."
    >
      <defs>
        <pattern id="hatch" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="1.6" height="1.6" fill="#f4f1ea" />
          <line x1="0" y1="0" x2="0" y2="1.6" stroke="#cdbf9f" strokeWidth="0.45" />
        </pattern>
        <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M8 0H0V8" fill="none" stroke="#e2e8f0" strokeWidth="0.16" />
        </pattern>
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.9" result="b" />
          <feFlood floodColor="#ff9a1f" floodOpacity="0.95" />
          <feComposite in2="b" operator="in" result="g" />
          <feMerge>
            <feMergeNode in="g" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>
      <g ref={gRef}>{children}</g>
    </svg>
  );
}

