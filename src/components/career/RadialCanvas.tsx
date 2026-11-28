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
import { useLanguage } from "../../contexts/LanguageContext";

interface RadialCanvasProps {
  nodes: CareerNode[];
  edges: CareerEdge[];
  selectedState: SelectedCareerState;
  selectedNodeId: string | null;
  onSelectNode: (node: CareerNode) => void;
  onNodeCenteredAndOpenModal: (node: CareerNode) => void;
  onReset?: () => void;
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

function getNodeBounds(node: CareerNode): { halfW: number; halfH: number } {
  if (node.type === "bachelor") return { halfW: 78, halfH: 78 };
  if (node.type === "domain") return { halfW: 66, halfH: 66 };
  if (node.type === "occupation") return { halfW: 96, halfH: 38 };
  return { halfW: 84, halfH: 32 };
}

export function RadialCanvas({
  nodes,
  edges,
  selectedState,
  selectedNodeId,
  onSelectNode,
  onNodeCenteredAndOpenModal,
  onReset,
  isSkeleton = false,
}: RadialCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { language } = useLanguage();
  const getNodeName = (node: CareerNode): string =>
    language === "vi" && node.vietnameseName ? node.vietnameseName : node.name;

  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, scale: 0.95 });
  const cameraRef = useRef<Camera>(camera);
  cameraRef.current = camera;

  const nodesRef = useRef<CareerNode[]>(nodes);
  nodesRef.current = nodes;

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const cameraStartRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const hasUserInteractedRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const animFrameIdRef = useRef<number | null>(null);
  const prevSelectedNodeIdRef = useRef<string | null>(null);

  // Multi-touch pinch zoom state
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartRef = useRef<{
    distance: number;
    scale: number;
    cameraX: number;
    cameraY: number;
    midX: number;
    midY: number;
  } | null>(null);

  const cancelCameraAnimation = useCallback(() => {
    if (animFrameIdRef.current !== null) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    isAnimatingRef.current = false;
  }, []);

  const computeFittedCamera = useCallback(
    (targetNodes: CareerNode[], skeletonMode: boolean, maxScale?: number): Camera => {
      const container = containerRef.current;
      const clientWidth = container?.clientWidth ?? 0;
      const clientHeight = container?.clientHeight ?? 0;

      // Deterministic fallback when container is not yet measured (e.g. jsdom / pre-layout)
      if (clientWidth <= 0 || clientHeight <= 0) {
        return {
          x: 0,
          y: skeletonMode ? 0 : 40,
          scale: skeletonMode ? 0.95 : 0.85,
        };
      }

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      if (targetNodes.length > 0) {
        for (const n of targetNodes) {
          const { halfW, halfH } = getNodeBounds(n);
          minX = Math.min(minX, n.x - halfW);
          maxX = Math.max(maxX, n.x + halfW);
          minY = Math.min(minY, n.y - halfH);
          maxY = Math.max(maxY, n.y + halfH);
        }
      } else {
        minX = -340;
        maxX = 340;
        minY = -340;
        maxY = 340;
      }

      const isCompact = clientWidth < 640;
      const topClearance = isCompact ? 68 : 64;
      const bottomClearance = skeletonMode ? (isCompact ? 72 : 68) : 28;
      const sidePad = isCompact ? 18 : 44;

      const availW = Math.max(clientWidth - sidePad * 2, 160);
      const availH = Math.max(clientHeight - topClearance - bottomClearance, 160);
      const graphW = Math.max(maxX - minX, 200);
      const graphH = Math.max(maxY - minY, 200);

      const upperScale = maxScale ?? (skeletonMode ? 0.98 : 0.92);
      const newScale = Math.max(0.32, Math.min(upperScale, Math.min(availW / graphW, availH / graphH)));

      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;
      const centerX = clientWidth / 2;
      const centerY = topClearance + (clientHeight - topClearance - bottomClearance) / 2;

      return {
        x: Math.round((centerX - midX * newScale) * 10) / 10,
        y: Math.round((centerY - midY * newScale) * 10) / 10,
        scale: Math.round(newScale * 1000) / 1000,
      };
    },
    []
  );

  // Initialize / refit camera cleanly when switching between skeleton & active domain
  useEffect(() => {
    cancelCameraAnimation();
    hasUserInteractedRef.current = false;
    const fitted = computeFittedCamera(nodesRef.current, isSkeleton);
    cameraRef.current = fitted;
    setCamera(fitted);
  }, [isSkeleton, selectedState.domainId, computeFittedCamera, cancelCameraAnimation]);

  // Refit on container resize before user manually pans/zooms
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (hasUserInteractedRef.current || isAnimatingRef.current) return;
      const fitted = computeFittedCamera(nodesRef.current, isSkeleton);
      cameraRef.current = fitted;
      setCamera(fitted);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isSkeleton, computeFittedCamera]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      cancelCameraAnimation();
    };
  }, [cancelCameraAnimation]);

  // Smooth camera centering animation
  const animateCameraToNode = useCallback(
    (targetNode: CareerNode, onComplete?: () => void) => {
      if (!containerRef.current) return;
      cancelCameraAnimation();

      isAnimatingRef.current = true;
      const { clientWidth, clientHeight } = containerRef.current;
      const isCompact = clientWidth > 0 && clientWidth < 640;

      let targetScale = isCompact ? 0.85 : 1.0;
      if (targetNode.layer === 1) targetScale = isCompact ? 0.85 : 0.95;
      else if (targetNode.layer === 2) targetScale = isCompact ? 0.9 : 1.0;
      else if (targetNode.layer === 3) targetScale = isCompact ? 0.95 : 1.15;
      else if (targetNode.layer === 4) targetScale = isCompact ? 1.0 : 1.25;

      const targetX = clientWidth / 2 - targetNode.x * targetScale;
      const targetY = clientHeight / 2 - targetNode.y * targetScale;

      const startX = cameraRef.current.x;
      const startY = cameraRef.current.y;
      const startScale = cameraRef.current.scale;

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
    [cancelCameraAnimation]
  );

  // Trigger camera focus ONLY when selected node ID changes from outside
  useEffect(() => {
    if (!selectedNodeId) {
      prevSelectedNodeIdRef.current = null;
      return;
    }
    // Only animate if selectedNodeId has changed to a NEW value
    if (prevSelectedNodeIdRef.current === selectedNodeId) {
      return;
    }
    prevSelectedNodeIdRef.current = selectedNodeId;

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

  // Pan / Drag + 2-finger pinch zoom handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('[data-canvas-control="true"]')) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    cancelCameraAnimation();
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 2 && containerRef.current) {
      // Begin 2-finger pinch zoom
      isDraggingRef.current = false;
      hasMovedRef.current = true;
      hasUserInteractedRef.current = true;
      const pts = Array.from(activePointersRef.current.values());
      const rect = containerRef.current.getBoundingClientRect();
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchStartRef.current = {
        distance: Math.max(dist, 1),
        scale: cameraRef.current.scale,
        cameraX: cameraRef.current.x,
        cameraY: cameraRef.current.y,
        midX: (pts[0].x + pts[1].x) / 2 - rect.left,
        midY: (pts[0].y + pts[1].y) / 2 - rect.top,
      };
      return;
    }

    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    cameraStartRef.current = { x: cameraRef.current.x, y: cameraRef.current.y };
    if (containerRef.current) {
      containerRef.current.style.cursor = "grabbing";
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (activePointersRef.current.size === 2 && pinchStartRef.current && containerRef.current) {
      const pts = Array.from(activePointersRef.current.values());
      const rect = containerRef.current.getBoundingClientRect();
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const midX = (pts[0].x + pts[1].x) / 2 - rect.left;
      const midY = (pts[0].y + pts[1].y) / 2 - rect.top;

      const start = pinchStartRef.current;
      const newScale = Math.max(0.3, Math.min(2.5, start.scale * (dist / start.distance)));
      const ratio = newScale / start.scale;
      const newX = midX - (start.midX - start.cameraX) * ratio;
      const newY = midY - (start.midY - start.cameraY) * ratio;

      setCamera({ x: newX, y: newY, scale: newScale });
      return;
    }

    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const moveThreshold = e.pointerType === "touch" ? 8 : 4;

    if (Math.hypot(dx, dy) > moveThreshold) {
      hasMovedRef.current = true;
      hasUserInteractedRef.current = true;
    }

    setCamera((prev) => ({
      ...prev,
      x: cameraStartRef.current.x + dx,
      y: cameraStartRef.current.y + dy,
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      pinchStartRef.current = null;
    }
    if (activePointersRef.current.size === 0) {
      isDraggingRef.current = false;
      if (containerRef.current) {
        containerRef.current.style.cursor = "grab";
      }
    }
  };

  // Native non-passive wheel zoom centered on mouse pointer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-canvas-control="true"]')) return;
      e.preventDefault();
      cancelCameraAnimation();
      hasUserInteractedRef.current = true;

      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      const currentScale = cameraRef.current.scale;
      const currentX = cameraRef.current.x;
      const currentY = cameraRef.current.y;
      const newScale = Math.max(0.3, Math.min(2.5, currentScale * zoomFactor));

      const newX = mouseX - (mouseX - currentX) * (newScale / currentScale);
      const newY = mouseY - (mouseY - currentY) * (newScale / currentScale);

      setCamera({ x: newX, y: newY, scale: newScale });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [cancelCameraAnimation]);

  // Zoom & view controls
  const zoomIn = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      cancelCameraAnimation();
      hasUserInteractedRef.current = true;
      const clientWidth = containerRef.current?.clientWidth ?? 0;
      const clientHeight = containerRef.current?.clientHeight ?? 0;
      setCamera((prev) => {
        const newScale = Math.min(2.5, prev.scale * 1.25);
        const cx = clientWidth / 2;
        const cy = clientHeight / 2;
        return {
          x: cx - (cx - prev.x) * (newScale / prev.scale),
          y: cy - (cy - prev.y) * (newScale / prev.scale),
          scale: newScale,
        };
      });
    },
    [cancelCameraAnimation]
  );

  const zoomOut = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      cancelCameraAnimation();
      hasUserInteractedRef.current = true;
      const clientWidth = containerRef.current?.clientWidth ?? 0;
      const clientHeight = containerRef.current?.clientHeight ?? 0;
      setCamera((prev) => {
        const newScale = Math.max(0.3, prev.scale / 1.25);
        const cx = clientWidth / 2;
        const cy = clientHeight / 2;
        return {
          x: cx - (cx - prev.x) * (newScale / prev.scale),
          y: cy - (cy - prev.y) * (newScale / prev.scale),
          scale: newScale,
        };
      });
    },
    [cancelCameraAnimation]
  );

  const fitNetwork = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      cancelCameraAnimation();
      hasUserInteractedRef.current = false;
      const fitted = computeFittedCamera(nodesRef.current, isSkeleton, 1.35);
      cameraRef.current = fitted;
      setCamera(fitted);
    },
    [cancelCameraAnimation, computeFittedCamera, isSkeleton]
  );

  const resetView = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      cancelCameraAnimation();
      isDraggingRef.current = false;
      activePointersRef.current.clear();
      pinchStartRef.current = null;
      hasMovedRef.current = false;
      hasUserInteractedRef.current = false;
      prevSelectedNodeIdRef.current = null;
      if (containerRef.current) {
        containerRef.current.style.cursor = "grab";
      }

      const nextSkeleton = onReset ? true : isSkeleton;
      const targetNodes = nextSkeleton && !isSkeleton ? [] : nodesRef.current;
      const resetCam = computeFittedCamera(targetNodes, nextSkeleton);
      cameraRef.current = resetCam;
      setCamera(resetCam);

      onReset?.();
    },
    [cancelCameraAnimation, computeFittedCamera, isSkeleton, onReset]
  );

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
      onPointerCancel={handlePointerUp}
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

        <g
          data-testid="career-canvas-viewport"
          transform={`translate(${camera.x}, ${camera.y}) scale(${camera.scale})`}
        >
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
                          {getNodeName(node)}
                        </span>
                        <div className="mt-1 flex items-center gap-1">
                          <span className="font-mono text-[10px] font-semibold text-brand-text bg-brand-soft px-1.5 py-0.5 rounded-full">
                            {Math.round((node.academicFitScore ?? 0) * 52 / 100)}/52 • {(node.academicFitScore ?? 0).toFixed(1)}%
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
                          {getNodeName(node)}
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
                            {getNodeName(node)}
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
                            {getNodeName(node)}
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

      {/* Canvas Controls: Top-Left Corner (Reset prominent + Zoom / Fit) */}
      <div
        data-canvas-control="true"
        data-testid="career-canvas-controls"
        role="toolbar"
        aria-label={language === "vi" ? "Điều khiển cây nghề nghiệp" : "Career tree controls"}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center gap-1 rounded-2xl border border-border bg-surface/95 p-1 shadow-sm backdrop-blur-md transition-colors max-w-[calc(100%-4.75rem)] sm:max-w-none"
      >
        <button
          type="button"
          data-testid="career-reset-btn"
          onClick={resetView}
          aria-label={language === "vi" ? "Đặt lại cây và góc nhìn" : "Reset tree and view"}
          title={language === "vi" ? "Đặt lại cây và góc nhìn (Reset)" : "Reset tree and view"}
          className="flex min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 items-center justify-center gap-1.5 rounded-xl bg-brand-soft/80 px-2.5 sm:px-3 text-xs font-semibold text-brand-text hover:bg-brand-soft transition-colors cursor-pointer shrink-0"
        >
          <RotateCcw className="size-4 shrink-0" />
          <span>{language === "vi" ? "Đặt lại" : "Reset"}</span>
        </button>

        <div className="h-5 w-px bg-border mx-0.5 shrink-0" />

        <button
          type="button"
          onClick={zoomIn}
          aria-label={language === "vi" ? "Phóng to" : "Zoom In"}
          title="Phóng to (Zoom In)"
          className="flex size-11 sm:size-9 items-center justify-center rounded-xl text-fg-secondary hover:bg-hover hover:text-foreground transition-colors cursor-pointer shrink-0"
        >
          <ZoomIn className="size-4" />
        </button>

        <button
          type="button"
          onClick={zoomOut}
          aria-label={language === "vi" ? "Thu nhỏ" : "Zoom Out"}
          title="Thu nhỏ (Zoom Out)"
          className="flex size-11 sm:size-9 items-center justify-center rounded-xl text-fg-secondary hover:bg-hover hover:text-foreground transition-colors cursor-pointer shrink-0"
        >
          <ZoomOut className="size-4" />
        </button>

        <button
          type="button"
          onClick={fitNetwork}
          aria-label={language === "vi" ? "Căn vừa màn hình" : "Fit Network"}
          title="Căn vừa màn hình (Fit Network)"
          className="flex size-11 sm:size-9 items-center justify-center rounded-xl text-fg-secondary hover:bg-hover hover:text-foreground transition-colors cursor-pointer shrink-0"
        >
          <Maximize2 className="size-4" />
        </button>

        <div className="hidden sm:block h-5 w-px bg-border mx-0.5 shrink-0" />

        <span
          data-testid="career-zoom-percent"
          className="hidden sm:inline-block px-2 font-mono text-[11px] font-semibold text-muted-foreground select-none"
        >
          {Math.round(camera.scale * 100)}%
        </span>
      </div>

      {/* Instructional Banner for Skeleton State (Bottom-center so top HUD stays unobstructed) */}
      {isSkeleton && (
        <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-max max-w-[calc(100%-1.5rem)] pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center gap-2 rounded-2xl sm:rounded-full border border-border bg-surface/95 px-3.5 py-2 text-[11px] sm:text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm text-center">
            <Sparkles className="size-4 shrink-0 text-brand-bright animate-pulse" />
            <span className="leading-snug">Chọn nhóm nghề nghiệp để khám phá mạng lưới nghề nghiệp của bạn.</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes careerFlow {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -24; }
        }
      `}</style>
    </div>
  );
}
