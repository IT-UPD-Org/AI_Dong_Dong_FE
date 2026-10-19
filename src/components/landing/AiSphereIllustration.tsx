import { useEffect, useId, useMemo, useState } from "react";
import { InteractiveIllustration } from "./InteractiveIllustration";
import {
  createProjector,
  polylinePath,
  spherePoint,
  type Rotation3D,
} from "./scene3d";

export interface AiSphereIllustrationProps {
  className?: string;
  autoRotate?: boolean;
}

const INITIAL_ROTATION = { pitch: 0.22, yaw: -0.35 };
const CENTER = { x: 200, y: 200 };
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const READOUT_INTERVAL = 850;
const PARTICLE_COUNT = 170;
const LABEL_COUNT = 22;
const ORBIT_STEPS = 72;

// Fixed geometry prevents particles jumping whenever the readouts update.
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
  point: spherePoint(
    Math.asin(1 - (2 * (index + 0.5)) / PARTICLE_COUNT),
    index * GOLDEN_ANGLE,
  ),
  size: 0.65 + (index % 5) * 0.3,
}));
const NODES = PARTICLES.filter((_, index) => index % 4 === 0);
const CONNECTIONS = NODES.slice(0, 28).map((node, index) => [
  node.point,
  NODES[(index * 3 + 7) % NODES.length].point,
]);

const ORBITS = [
  ...[-1.05, -0.55, 0, 0.55, 1.05].map((latitude) =>
    Array.from({ length: ORBIT_STEPS + 1 }, (_, step) =>
      spherePoint(latitude, (step * 2 * Math.PI) / ORBIT_STEPS),
    ),
  ),
  ...Array.from({ length: 6 }, (_, index) =>
    Array.from({ length: ORBIT_STEPS + 1 }, (_, step) => {
      const angle = (step * 2 * Math.PI) / ORBIT_STEPS;
      const longitude = (index * Math.PI) / 6;
      return {
        x: 150 * Math.cos(angle) * Math.cos(longitude),
        y: 150 * Math.sin(angle),
        z: 150 * Math.cos(angle) * Math.sin(longitude),
      };
    }),
  ),
];
const LABELS = Array.from({ length: LABEL_COUNT }, (_, index) =>
  spherePoint(
    Math.asin(1 - (2 * (index + 0.5)) / LABEL_COUNT),
    index * GOLDEN_ANGLE,
    145,
  ),
);

function createReadouts() {
  return LABELS.map((_, index) => {
    if (index % 6 === 0) return `AI::${Math.floor(Math.random() * 99)}`;
    if (index % 6 === 1)
      return `0x${Math.floor(Math.random() * 65535)
        .toString(16)
        .toUpperCase()}`;
    if (index % 6 === 2) return Math.random() > 0.5 ? "SYS_RDY" : "SYS_ON";
    if (index % 6 === 3) return `${(94 + Math.random() * 5.8).toFixed(1)}%`;
    return Math.floor(Math.random() * 32)
      .toString(2)
      .padStart(5, "0");
  });
}

interface SphereSceneProps {
  rotation: Rotation3D;
  readouts: string[];
  id: string;
}

function SphereScene({ rotation, readouts, id }: SphereSceneProps) {
  // Label refreshes reuse the geometry; only a change of angle needs projection.
  const geometry = useMemo(() => {
    const project = createProjector(rotation, CENTER, 1200);
    return {
      particles: PARTICLES.map((particle, index) => ({
        ...project(particle.point),
        size: particle.size,
        index,
      })).sort((a, b) => a.depth - b.depth),
      orbits: ORBITS.map((orbit) => polylinePath(orbit.map(project))),
      connections: CONNECTIONS.map(([start, end]) => ({
        from: project(start),
        to: project(end),
      })),
      labels: LABELS.map(project),
    };
  }, [rotation]);

  return (
    <svg
      viewBox="30 30 340 340"
      role="img"
      aria-label="Quả cầu trí tuệ nhân tạo IT UPD"
      className="interactive-sphere"
    >
      <defs>
        <radialGradient id={`${id}-surface`} cx="42%" cy="36%">
          <stop offset="0%" stopColor="#fff" stopOpacity=".15" />
          <stop offset="38%" stopColor="#00a86b" stopOpacity=".12" />
          <stop offset="72%" stopColor="#5ee6b3" stopOpacity=".16" />
          <stop offset="100%" stopColor="#5ee6b3" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-core`}>
          <stop offset="0%" stopColor="#5ee6b3" stopOpacity=".55" />
          <stop offset="100%" stopColor="#00a86b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="154" fill={`url(#${id}-surface)`} />
      <circle cx="200" cy="200" r="110" fill={`url(#${id}-core)`} />
      <g fill="none" stroke="#00a86b" strokeWidth=".7" strokeOpacity=".18">
        {geometry.orbits.map((path, index) => (
          <path key={index} d={path} />
        ))}
      </g>
      <g stroke="#00a86b" strokeWidth=".65" strokeOpacity=".12">
        {geometry.connections.map(({ from, to }, index) => (
          <line key={index} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
        ))}
      </g>
      <g className="interactive-sphere__pulse">
        {geometry.particles.map((particle) => (
          <circle
            key={particle.index}
            cx={particle.x}
            cy={particle.y}
            r={particle.size * (1 + particle.depth / 700)}
            fill={particle.index % 3 === 0 ? "#fff" : "#00a86b"}
            opacity={0.18 + (particle.depth + 150) / 410}
          />
        ))}
      </g>
      <g
        fontFamily="monospace"
        fontSize="7.5"
        fill="#00a86b"
        textAnchor="middle"
        pointerEvents="none"
      >
        {geometry.labels.map((label, index) => (
          <text
            key={index}
            x={label.x}
            y={label.y}
            opacity={label.depth < 0 ? 0.18 : 0.85}
          >
            {readouts[index]}
          </text>
        ))}
      </g>
      <text
        x="200"
        y="204"
        fontFamily="monospace"
        fontSize="11"
        textAnchor="middle"
        fill="#fff"
        opacity=".75"
      >
        {readouts[3]}
      </text>
      <g
        fontFamily="monospace"
        fontSize="5.5"
        fill="#04714a"
        opacity=".3"
        pointerEvents="none"
      >
        <text x="85" y="90">
          NODE_01
        </text>
        <text x="282" y="122">
          VECTOR
        </text>
        <text x="85" y="310">
          RAG
        </text>
        <text x="274" y="310">
          LLM
        </text>
      </g>
    </svg>
  );
}

export function AiSphereIllustration({
  className = "",
  autoRotate = true,
}: AiSphereIllustrationProps) {
  const [readouts, setReadouts] = useState(createReadouts);
  const id = `ai-sphere-${useId().replace(/:/g, "")}`;
  useEffect(() => {
    const timer = window.setInterval(
      () => setReadouts(createReadouts()),
      READOUT_INTERVAL,
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    <InteractiveIllustration
      label="quả cầu AI"
      className={className}
      initialRotation={INITIAL_ROTATION}
      shape="circle"
      autoRotate={autoRotate}
      autoRotateSpeed={0.18}
      returnOnRelease={true}
    >
      {(rotation) => (
        <SphereScene rotation={rotation} readouts={readouts} id={id} />
      )}
    </InteractiveIllustration>
  );
}
