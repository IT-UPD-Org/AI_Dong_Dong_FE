import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import {
  GraduationCap,
  Code2,
  BrainCircuit,
  Briefcase,
  ShieldCheck,
  Cloud,
  Palette,
  CheckCircle2,
  Headphones,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { CareerEdge, CareerNode, SelectedCareerState } from "../../types/careerUniverse";

interface RadialCanvasProps {
  nodes: CareerNode[];
  edges: CareerEdge[];
  selectedState: SelectedCareerState;
  selectedNodeId: string | null;
  onSelectNode: (node: CareerNode) => void;
  onNodeCenteredAndOpenModal: (node: CareerNode) => void;
  isSkeleton?: boolean;
}

interface Camera {
  x: number;
  y: number;
  scale: number;
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function RadialCanvas({
  nodes,
  edges,
  selectedState,
  selectedNodeId,
  onSelectNode,
  onNodeCenteredAndOpenModal,
  isSkeleton = false,
}: RadialCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, scale: 0.9 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const cameraStartRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const animFrameIdRef = useRef<number | null>(null);

  // Initialize camera centered in container
  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setCamera({
        x: clientWidth / 2,
        y: clientHeight / 2 + (isSkeleton ? 0 : 40),
        scale: isSkeleton ? 0.95 : 0.85,
      });
    }
  }, [isSkeleton]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  // Smooth camera centering animation
  const animateCameraToNode = useCallback(
    (targetNode: CareerNode, onComplete?: () => void) => {
      if (!containerRef.current) return;
      if (isAnimatingRef.current && animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }

      isAnimatingRef.current = true;
      const { clientWidth, clientHeight } = containerRef.current;

      let targetScale = 1.0;
      if (targetNode.layer === 1) targetScale = 0.95;
      else if (targetNode.layer === 2) targetScale = 1.0;
      else if (targetNode.layer === 3) targetScale = 1.15;
      else if (targetNode.layer === 4) targetScale = 1.25;

      const targetX = clientWidth / 2 - targetNode.x * targetScale;
      const targetY = clientHeight / 2 - targetNode.y * targetScale;

      const startX = camera.x;
      const startY = camera.y;
      const startScale = camera.scale;

      const startTime = performance.now();
      const duration = 520; // 520ms transition

      const step = (now: number) => {
        const elapsed = now - startTime;
        const rawProgress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(rawProgress);

        const currentX = startX + (targetX - startX) * eased;
        const currentY = startY + (targetY - startY) * eased;
        const currentScale = startScale + (targetScale - startScale) * eased;

        setCamera({ x: currentX, y: currentY, scale: currentScale });

        if (rawProgress < 1) {
          animFrameIdRef.current = requestAnimationFrame(step);
        } else {
          isAnimatingRef.current = false;
          animFrameIdRef.current = null;
          if (onComplete) onComplete();
        }
      };

      animFrameIdRef.current = requestAnimationFrame(step);
    },
    [camera]
  );

  // Trigger camera focus when selected node changes programmatically from outside (e.g. dropdowns)
  useEffect(() => {
    if (!selectedNodeId || isAnimatingRef.current) return;
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (node) {
      animateCameraToNode(node);
    }
  }, [selectedNodeId, nodes, animateCameraToNode]);

  // Handle clicking a node: Center canvas, then open modal
  const handleNodeClick = useCallback(
    (e: React.MouseEvent, node: CareerNode) => {
      e.stopPropagation();
      if (hasMovedRef.current) return;

      onSelectNode(node);
      animateCameraToNode(node, () => {
        onNodeCenteredAndOpenModal(node);
      });
    },
    [onSelectNode, animateCameraToNode, onNodeCenteredAndOpenModal]
  );

  // Pan / Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // only left click
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    cameraStartRef.current = { x: camera.x, y: camera.y };
    if (containerRef.current) {
      containerRef.current.style.cursor = "grabbing";
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (Math.hypot(dx, dy) > 4) {
      hasMovedRef.current = true;
    }

    setCamera((prev) => ({
      ...prev,
      x: cameraStartRef.current.x + dx,
      y: cameraStartRef.current.y + dy,
    }));
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    if (containerRef.current) {
      containerRef.current.style.cursor = "grab";
    }
  };

  // Wheel zoom centered on mouse pointer
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const newScale = Math.max(0.3, Math.min(2.5, camera.scale * zoomFactor));

    const newX = mouseX - (mouseX - camera.x) * (newScale / camera.scale);
    const newY = mouseY - (mouseY - camera.y) * (newScale / camera.scale);

    setCamera({ x: newX, y: newY, scale: newScale });
  };

  // Zoom controls
  const zoomIn = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const newScale = Math.min(2.5, camera.scale * 1.25);
    const newX = clientWidth / 2 - (clientWidth / 2 - camera.x) * (newScale / camera.scale);
    const newY = clientHeight / 2 - (clientHeight / 2 - camera.y) * (newScale / camera.scale);
    setCamera({ x: newX, y: newY, scale: newScale });
  };

  const zoomOut = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const newScale = Math.max(0.3, camera.scale / 1.25);
    const newX = clientWidth / 2 - (clientWidth / 2 - camera.x) * (newScale / camera.scale);
    const newY = clientHeight / 2 - (clientHeight / 2 - camera.y) * (newScale / camera.scale);
    setCamera({ x: newX, y: newY, scale: newScale });
  };

  const resetView = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    setCamera({
      x: clientWidth / 2,
      y: clientHeight / 2 + (isSkeleton ? 0 : 40),
      scale: isSkeleton ? 0.95 : 0.85,
    });
  };

  const fitNetwork = () => {
    if (!containerRef.current || nodes.length === 0) return;
    const { clientWidth, clientHeight } = containerRef.current;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach((n) => {
      minX = Math.min(minX, n.x - 80);
      maxX = Math.max(maxX, n.x + 80);
      minY = Math.min(minY, n.y - 60);
      maxY = Math.max(maxY, n.y + 60);
    });

    const graphW = Math.max(maxX - minX, 200);
    const graphH = Math.max(maxY - minY, 200);

    const pad = 90;
    const scaleX = (clientWidth - pad * 2) / graphW;
    const scaleY = (clientHeight - pad * 2) / graphH;
    const newScale = Math.max(0.35, Math.min(1.4, Math.min(scaleX, scaleY)));

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    setCamera({
      x: clientWidth / 2 - midX * newScale,
      y: clientHeight / 2 - midY * newScale,
      scale: newScale,
    });
  };

  // Node Map for edge connections
  const nodeMap = useMemo(() => {
    const map = new Map<string, CareerNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Icon selector
  const renderIcon = (iconName?: string, className = "size-5") => {
    switch (iconName) {
      case "Code2": return <Code2 className={className} />;
      case "BrainCircuit": return <BrainCircuit className={className} />;
      case "Briefcase": return <Briefcase className={className} />;
      case "ShieldCheck": return <ShieldCheck className={className} />;
      case "Cloud": return <Cloud className={className} />;
      case "Palette": return <Palette className={className} />;
      case "CheckCircle2": return <CheckCircle2 className={className} />;
      case "Headphones": return <Headphones className={className} />;
      default: return <GraduationCap className={className} />;
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      className="relative w-full h-full overflow-hidden bg-background select-none cursor-grab active:cursor-grabbing transition-colors"
      style={{ touchAction: "none" }}
    >
      {/* Background radial grid lines & dots */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
        style={{
          backgroundImage: "radial-gradient(#e4e5e2 1.2px, transparent 1.2px)",
          backgroundSize: "28px 28px",
          backgroundPosition: `${camera.x}px ${camera.y}px`,
        }}
      />

      {/* SVG Canvas for connecting lines and nodes */}
      <svg className="w-full h-full absolute inset-0 overflow-visible pointer-events-none">
        <defs>
          <filter id="subtle-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#11130f" floodOpacity="0.06" />
          </filter>
          <filter id="active-halo" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#04714a" floodOpacity="0.25" />
          </filter>
          {/* Green Flow animation gradient */}
          <linearGradient id="brand-green-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#04714a" />
            <stop offset="100%" stopColor="#00a86b" />
          </linearGradient>
        </defs>

        <g transform={`translate(${camera.x}, ${camera.y}) scale(${camera.scale})`}>
          {/* 1. EDGES */}
          {edges.map((edge) => {
            const source = nodeMap.get(edge.source);
            const target = nodeMap.get(edge.target);
            if (!source || !target) return null;

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            // Smooth Bézier curve
            const cx1 = source.x + dx * 0.25;
            const cy1 = source.y + dy * 0.65;
            const cx2 = source.x + dx * 0.75;
            const cy2 = source.y + dy * 0.35;
            const pathD = `M ${source.x} ${source.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${target.x} ${target.y}`;

            const isSelected = edge.isSelected;
            // Partial progress: achieved portion stops slightly before destination node (e.g. 5-90%)
            const progress = edge.progressPercent ?? 0;
            const displayProgress = Math.max(6, Math.min(88, progress));

            return (
              <g key={edge.id}>
                {/* Static base line (neutral gray) */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isSkeleton ? "#efefed" : "#e4e5e2"}
                  strokeWidth={isSelected ? 2 : 1.5}
                  strokeLinecap="round"
                  className="transition-colors duration-300 dark:stroke-[#333333]"
                />

                {/* Flowing animated green line for selected path */}
                {isSelected && (
                  <>
                    {/* Achieved competency line (stopping with gap) */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="url(#brand-green-gradient)"
                      strokeWidth={3}
                      strokeLinecap="round"
                      pathLength={100}
                      strokeDasharray={`${displayProgress} ${100 - displayProgress}`}
                      strokeDashoffset={0}
                      className="transition-all duration-500"
                    />

                    {/* Flowing dash energy stream */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#00a86b"
                      strokeWidth={3}
                      strokeLinecap="round"
                      pathLength={100}
                      strokeDasharray="4 8"
                      className="animate-[flow_1.5s_linear_infinite]"
                      style={{
                        strokeDashoffset: 0,
                        animation: "careerFlow 1.6s linear infinite",
                      }}
                    />
                  </>
                )}
              </g>
            );
          })}

          {/* 2. NODES */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isRootBachelor = node.type === "bachelor";
            const isDomain = node.type === "domain";
            const isOccupation = node.type === "occupation";
            const isSpecialization = node.type === "specialization";

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(e) => handleNodeClick(e, node)}
                className="cursor-pointer pointer-events-auto transition-transform duration-200 hover:scale-105"
                filter={isSelected ? "url(#active-halo)" : "url(#subtle-shadow)"}
              >
                {/* A. Bachelor Node (Layer 1 - Large Circular) */}
                {isRootBachelor && (
                  <g className="group">
                    {/* Outer ring */}
                    <circle
                      r={68}
                      fill="#ffffff"
                      stroke={isSelected ? "#04714a" : "#04714a"}
                      strokeWidth={isSelected ? 3.5 : 2.5}
                      className="transition-all dark:fill-[#1e1e1e]"
                    />
                    {/* Academic progress indicator ring */}
                    <circle
                      r={74}
                      fill="none"
                      stroke="#e8f7ef"
                      strokeWidth={3}
                      className="dark:stroke-emerald-950"
                    />
                    <circle
                      r={74}
                      fill="none"
                      stroke="#00a86b"
                      strokeWidth={3}
                      strokeDasharray={`${(node.academicFitScore ?? 11.54) * 4.65} 465`}
                      strokeLinecap="round"
                      transform="rotate(-90)"
                      className="transition-all duration-700"
                    />
                    {/* Icon & Details */}
                    <foreignObject x={-64} y={-64} width={128} height={128}>
                      <div className="flex h-full w-full flex-col items-center justify-center p-1 text-center select-none">
                        <div className="flex size-9 items-center justify-center rounded-full bg-brand-soft text-brand-text mb-1">
                          <GraduationCap className="size-5" />
                        </div>
                        <span className="text-[11px] font-extrabold text-foreground leading-tight px-1">
                          Bachelor of IT
                        </span>
                        <div className="mt-1 flex items-center gap-1">
                          <span className="font-mono text-[10px] font-semibold text-brand-text bg-brand-soft px-1.5 py-0.5 rounded-full">
                            6/52 • 11.5%
                          </span>
                        </div>
                      </div>
                    </foreignObject>
                  </g>
                )}

                {/* B. Career Domain Node (Layer 2 - Large Circular) */}
                {isDomain && (
                  <g className="group">
                    <circle
                      r={isSkeleton ? 52 : 62}
                      fill="#ffffff"
                      stroke={isSelected ? "#04714a" : isSkeleton ? "#d1d5db" : "#04714a"}
                      strokeWidth={isSelected ? 3.5 : isSkeleton ? 1.5 : 2.5}
                      strokeDasharray={isSkeleton ? "4 3" : undefined}
                      className="transition-all dark:fill-[#1e1e1e]"
                    />
                    <foreignObject
                      x={isSkeleton ? -50 : -60}
                      y={isSkeleton ? -50 : -60}
                      width={isSkeleton ? 100 : 120}
                      height={isSkeleton ? 100 : 120}
                    >
                      <div className="flex h-full w-full flex-col items-center justify-center p-1.5 text-center select-none">
                        <div
                          className={`flex items-center justify-center rounded-full mb-1 ${
                            isSkeleton
                              ? "size-8 bg-muted text-muted-foreground"
                              : "size-9 bg-brand-soft text-brand-text"
                          }`}
                        >
                          {renderIcon(node.icon, isSkeleton ? "size-4" : "size-5")}
                        </div>
                        <span
                          className={`font-bold leading-tight line-clamp-2 px-1 ${
                            isSkeleton
                              ? "text-[10px] text-muted-foreground font-medium"
                              : "text-[11px] text-foreground font-extrabold"
                          }`}
                        >
                          {node.name}
                        </span>
                        {!isSkeleton && node.feasibilityScore !== null && (
                          <span className="mt-1 font-mono text-[9px] font-semibold text-brand-text bg-brand-soft px-1.5 py-0.5 rounded-full">
                            Fit: {node.feasibilityScore}%
                          </span>
                        )}
                      </div>
                    </foreignObject>
                  </g>
                )}

                {/* C. Occupation Node (Layer 3 - Rounded Rectangle) */}
                {isOccupation && (
                  <g className="group">
                    <rect
                      x={-90}
                      y={-34}
                      width={180}
                      height={68}
                      rx={14}
                      fill="#ffffff"
                      stroke={isSelected ? "#04714a" : "#e4e5e2"}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      className="transition-all dark:fill-[#1e1e1e] dark:stroke-[#333333]"
                    />
                    <foreignObject x={-90} y={-34} width={180} height={68}>
                      <div className="flex h-full w-full flex-col justify-center px-3 py-1.5 select-none text-left">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold text-foreground truncate">
                            {node.name}
                          </span>
                          {node.feasibilityScore !== null && (
                            <span className="font-mono text-[9px] font-semibold text-brand-text bg-brand-soft px-1.5 py-0.2 rounded-full shrink-0">
                              {node.feasibilityScore}%
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[9px] text-muted-foreground line-clamp-1">
                          <span>Layer 3</span>
                          <span>•</span>
                          <span className="truncate">{node.skills?.core?.slice(0, 2).join(", ")}</span>
                        </div>
                      </div>
                    </foreignObject>
                  </g>
                )}

                {/* D. Specialization Node (Layer 4 - Smaller Rounded Rectangle) */}
                {isSpecialization && (
                  <g className="group">
                    <rect
                      x={-80}
                      y={-28}
                      width={160}
                      height={56}
                      rx={10}
                      fill="#ffffff"
                      stroke={isSelected ? "#04714a" : "#efefed"}
                      strokeWidth={isSelected ? 2.5 : 1.2}
                      className="transition-all dark:fill-[#1e1e1e] dark:stroke-[#333333]"
                    />
                    <foreignObject x={-80} y={-28} width={160} height={56}>
                      <div className="flex h-full w-full flex-col justify-center px-2.5 py-1 select-none text-left">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-foreground truncate">
                            {node.name}
                          </span>
                          {node.feasibilityScore !== null && (
                            <span className="font-mono text-[8px] font-semibold text-brand-text bg-brand-soft px-1 py-0.2 rounded shrink-0">
                              {node.feasibilityScore}%
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-muted-foreground truncate mt-0.5">
                          {node.technologies?.slice(0, 2).join(", ") || "Specialization"}
                        </span>
                      </div>
                    </foreignObject>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Instructional Banner for Skeleton State */}
      {isSkeleton && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="flex items-center gap-2.5 rounded-full border border-border bg-surface/95 px-4 py-2 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm">
            <Sparkles className="size-4 text-brand-bright animate-pulse" />
            <span>Chọn nhóm nghề nghiệp để khám phá mạng lưới nghề nghiệp của bạn.</span>
          </div>
        </div>
      )}

      {/* Canvas Controls: Top-left or Bottom-left */}
      <div className="absolute bottom-5 left-5 z-20 flex items-center gap-1.5 rounded-2xl border border-border bg-surface/95 p-1.5 shadow-sm backdrop-blur-md transition-colors">
        <button
          type="button"
          onClick={zoomIn}
          title="Phóng to (Zoom In)"
          className="flex size-8 items-center justify-center rounded-xl text-fg-secondary hover:bg-hover hover:text-foreground transition-colors cursor-pointer"
        >
          <ZoomIn className="size-4" />
        </button>

        <button
          type="button"
          onClick={zoomOut}
          title="Thu nhỏ (Zoom Out)"
          className="flex size-8 items-center justify-center rounded-xl text-fg-secondary hover:bg-hover hover:text-foreground transition-colors cursor-pointer"
        >
          <ZoomOut className="size-4" />
        </button>

        <div className="h-4 w-px bg-border mx-0.5" />

        <button
          type="button"
          onClick={fitNetwork}
          title="Căn vừa màn hình (Fit Network)"
          className="flex size-8 items-center justify-center rounded-xl text-fg-secondary hover:bg-hover hover:text-foreground transition-colors cursor-pointer"
        >
          <Maximize2 className="size-4" />
        </button>

        <button
          type="button"
          onClick={resetView}
          title="Đặt lại góc nhìn (Reset View)"
          className="flex size-8 items-center justify-center rounded-xl text-fg-secondary hover:bg-hover hover:text-foreground transition-colors cursor-pointer"
        >
          <RotateCcw className="size-4" />
        </button>

        <div className="h-4 w-px bg-border mx-0.5" />

        <span className="px-2 font-mono text-[11px] font-semibold text-muted-foreground select-none">
          {Math.round(camera.scale * 100)}%
        </span>
      </div>

      <style>{`
        @keyframes careerFlow {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -24; }
        }
      `}</style>
    </div>
  );
}
