import { useEffect, useMemo, useState } from "react";

interface AiSphereIllustrationProps {
  className?: string;
}

const randomBinary = (length = 5) =>
  Array.from({ length }, () => (Math.random() > 0.5 ? "1" : "0")).join("");

const randomHex = () =>
  `0x${Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0")}`;

const randomPercent = () => `${(94 + Math.random() * 5.8).toFixed(1)}%`;

const randomPair = () =>
  `${Math.floor(Math.random() * 90)
    .toString()
    .padStart(2, "0")}_${Math.floor(Math.random() * 99)
    .toString()
    .padStart(2, "0")}`;

const randomAI = () =>
  `AI::${Math.floor(Math.random() * 99)
    .toString()
    .padStart(2, "0")}`;

const randomSys = () => (Math.random() > 0.5 ? "SYS_ON" : "SYS_RDY");

export function AiSphereIllustration({
  className = "",
}: AiSphereIllustrationProps) {
  const [data, setData] = useState(() => ({
    b1: randomBinary(5),
    b2: randomBinary(4),
    b3: randomBinary(6),
    b4: randomBinary(5),
    b5: randomBinary(4),
    b6: randomBinary(6),
    b7: randomBinary(5),
    b8: randomBinary(4),
    hex1: randomHex(),
    hex2: randomHex(),
    hex3: randomHex(),
    ai1: randomAI(),
    ai2: randomAI(),
    sys1: randomSys(),
    sys2: randomSys(),
    pair1: randomPair(),
    pair2: randomPair(),
    pair3: randomPair(),
    percent1: randomPercent(),
    percent2: randomPercent(),
    percent3: randomPercent(),
  }));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setData({
        b1: randomBinary(5),
        b2: randomBinary(4),
        b3: randomBinary(6),
        b4: randomBinary(5),
        b5: randomBinary(4),
        b6: randomBinary(6),
        b7: randomBinary(5),
        b8: randomBinary(4),
        hex1: randomHex(),
        hex2: randomHex(),
        hex3: randomHex(),
        ai1: randomAI(),
        ai2: randomAI(),
        sys1: randomSys(),
        sys2: randomSys(),
        pair1: randomPair(),
        pair2: randomPair(),
        pair3: randomPair(),
        percent1: randomPercent(),
        percent2: randomPercent(),
        percent3: randomPercent(),
      });
    }, 850);

    return () => window.clearInterval(timer);
  }, []);

  const particles = useMemo(
    () =>
      Array.from({ length: 150 }, (_, i) => {
        const angle = Math.random() * Math.PI * 2;

        // Phân bố dày hơn ở vùng quanh quả cầu
        const radius = 92 + Math.random() * 78;

        return {
          id: i,
          x: 200 + Math.cos(angle) * radius,
          y: 200 + Math.sin(angle) * radius,
          r: 0.45 + Math.random() * 1.5,
          opacity: 0.2 + Math.random() * 0.75,
          delay: Math.random() * 4,
        };
      }),
    [],
  );

  const nodes = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const radius = 65 + Math.random() * 78;

        return {
          id: i,
          x: 200 + Math.cos(angle) * radius,
          y: 200 + Math.sin(angle) * radius,
        };
      }),
    [],
  );

  return (
    <svg
      viewBox="0 0 400 400"
      xmlns="http://www.w3.org/2000/svg"
      className={`overflow-visible ${className}`}
      aria-label="Đông Đông AI animated intelligence sphere"
      role="img"
    >
      <defs>
        <radialGradient id="sphereGradient" cx="42%" cy="36%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="38%" stopColor="#00a86b" stopOpacity="0.12" />
          <stop offset="72%" stopColor="#003d2b" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.04" />
        </radialGradient>

        <radialGradient id="coreGradient">
          <stop offset="0%" stopColor="#00a86b" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#00a86b" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#00a86b" stopOpacity="0" />
        </radialGradient>

        <filter id="softGlow">
          <feGaussianBlur stdDeviation="5" />
        </filter>

        <filter id="smallGlow">
          <feGaussianBlur stdDeviation="1.5" />
        </filter>

        <clipPath id="sphereClip">
          <circle cx="200" cy="200" r="154" />
        </clipPath>

        <style>
          {`
            .dongdong-orbit {
              transform-origin: 200px 200px;
              animation: dongdong-orbit-rotation 180s linear infinite;
            }

            .dongdong-particles {
              animation: dongdong-particle-pulse 2.8s ease-in-out infinite;
            }

            .dongdong-core {
              animation: dongdong-core-pulse 4s ease-in-out infinite;
              transform-origin: 200px 200px;
            }

            @keyframes dongdong-orbit-rotation {
              from {
                transform: rotate(0deg);
              }

              to {
                transform: rotate(360deg);
              }
            }

            @keyframes dongdong-particle-pulse {
              0%, 100% {
                opacity: .55;
              }

              50% {
                opacity: 1;
              }
            }

            @keyframes dongdong-core-pulse {
              0%, 100% {
                opacity: .7;
                transform: scale(1);
              }

              50% {
                opacity: 1;
                transform: scale(1.035);
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .dongdong-orbit,
              .dongdong-particles,
              .dongdong-core {
                animation: none;
              }
            }
          `}
        </style>
      </defs>

      {/* =========================================================
          STATIC BACKGROUND
          Không xoay
      ========================================================= */}

      <circle
        cx="200"
        cy="200"
        r="156"
        fill="none"
        stroke="#00a86b"
        strokeOpacity="0.06"
        strokeWidth="1"
      />

      <circle
        cx="200"
        cy="200"
        r="168"
        fill="none"
        stroke="#00a86b"
        strokeOpacity="0.035"
        strokeWidth="1"
      />

      {/* =========================================================
          ROTATING SPHERE
          Chỉ phần quả cầu kỹ thuật xoay
      ========================================================= */}

      <g className="dongdong-orbit">
        {/* Main sphere */}
        <circle
          cx="200"
          cy="200"
          r="154"
          fill="url(#sphereGradient)"
          stroke="#00a86b"
          strokeOpacity="0.2"
          strokeWidth="1"
        />

        {/* Core */}
        <circle
          className="dongdong-core"
          cx="200"
          cy="200"
          r="95"
          fill="url(#coreGradient)"
          filter="url(#softGlow)"
        />

        {/* =====================================================
            HUD LATITUDE / LONGITUDE
        ===================================================== */}

        <ellipse
          cx="200"
          cy="200"
          rx="150"
          ry="48"
          fill="none"
          stroke="#00a86b"
          strokeOpacity="0.22"
          strokeWidth="0.8"
        />

        <ellipse
          cx="200"
          cy="200"
          rx="150"
          ry="82"
          fill="none"
          stroke="#00a86b"
          strokeOpacity="0.13"
          strokeWidth="0.7"
        />

        <ellipse
          cx="200"
          cy="200"
          rx="150"
          ry="116"
          fill="none"
          stroke="#00a86b"
          strokeOpacity="0.1"
          strokeWidth="0.7"
        />

        <ellipse
          cx="200"
          cy="200"
          rx="48"
          ry="150"
          fill="none"
          stroke="#00a86b"
          strokeOpacity="0.2"
          strokeWidth="0.8"
        />

        <ellipse
          cx="200"
          cy="200"
          rx="82"
          ry="150"
          fill="none"
          stroke="#00a86b"
          strokeOpacity="0.13"
          strokeWidth="0.7"
        />

        <ellipse
          cx="200"
          cy="200"
          rx="116"
          ry="150"
          fill="none"
          stroke="#00a86b"
          strokeOpacity="0.1"
          strokeWidth="0.7"
        />

        {/* =====================================================
            CENTRAL AXIS
        ===================================================== */}

        <line
          x1="45"
          y1="200"
          x2="355"
          y2="200"
          stroke="#00a86b"
          strokeOpacity="0.1"
          strokeWidth="0.7"
        />

        <line
          x1="200"
          y1="45"
          x2="200"
          y2="355"
          stroke="#00a86b"
          strokeOpacity="0.08"
          strokeWidth="0.7"
        />

        {/* =====================================================
            NETWORK CONNECTIONS
        ===================================================== */}

        {nodes.slice(0, 24).map((node, index) => {
          const target = nodes[(index * 3 + 7) % nodes.length];

          return (
            <line
              key={`connection-${node.id}`}
              x1={node.x}
              y1={node.y}
              x2={target.x}
              y2={target.y}
              stroke="#00a86b"
              strokeOpacity="0.11"
              strokeWidth="0.65"
            />
          );
        })}

        {/* =====================================================
            NODES
        ===================================================== */}

        {nodes.map((node) => (
          <circle
            key={`node-${node.id}`}
            cx={node.x}
            cy={node.y}
            r="1.35"
            fill="#ffffff"
            fillOpacity="0.7"
          />
        ))}

        {/* =====================================================
            MANY PARTICLES
        ===================================================== */}

        <g className="dongdong-particles">
          {particles.map((particle) => (
            <circle
              key={`particle-${particle.id}`}
              cx={particle.x}
              cy={particle.y}
              r={particle.r}
              fill="#00a86b"
              fillOpacity={particle.opacity}
            />
          ))}
        </g>

        {/* Extra inner particles */}
        {Array.from({ length: 70 }, (_, i) => {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 125;

          return (
            <circle
              key={`inner-${i}`}
              cx={200 + Math.cos(angle) * radius}
              cy={200 + Math.sin(angle) * radius}
              r={0.4 + Math.random() * 1}
              fill="#ffffff"
              fillOpacity={0.12 + Math.random() * 0.45}
            />
          );
        })}

        {/* =====================================================
            ORBITAL MARKERS
        ===================================================== */}

        <circle
          cx="200"
          cy="48"
          r="2"
          fill="#00a86b"
          filter="url(#smallGlow)"
        />

        <circle
          cx="352"
          cy="200"
          r="2"
          fill="#00a86b"
          filter="url(#smallGlow)"
        />

        <circle
          cx="200"
          cy="352"
          r="2"
          fill="#00a86b"
          filter="url(#smallGlow)"
        />

        <circle
          cx="48"
          cy="200"
          r="2"
          fill="#00a86b"
          filter="url(#smallGlow)"
        />

        {/* Corner brackets */}
        <path
          d="M72 110 L72 90 L92 90"
          fill="none"
          stroke="#00a86b"
          strokeOpacity="0.35"
        />

        <path
          d="M308 90 L328 90 L328 110"
          fill="none"
          stroke="#00a86b"
          strokeOpacity="0.35"
        />

        <path
          d="M72 290 L72 310 L92 310"
          fill="none"
          stroke="#00a86b"
          strokeOpacity="0.35"
        />

        <path
          d="M308 310 L328 310 L328 290"
          fill="none"
          stroke="#00a86b"
          strokeOpacity="0.35"
        />
      </g>

      {/* =========================================================
          STATIC DATA LAYER
          Quan trọng: KHÔNG nằm trong dongdong-orbit
          nên chữ không xoay.
      ========================================================= */}

      <g
        fontFamily="monospace"
        fontSize="8"
        fill="#00a86b"
        fillOpacity="0.78"
        pointerEvents="none"
      >
        {/* Top */}
        <text x="151" y="74">
          {data.b1}
        </text>

        <text x="226" y="82">
          {data.ai1}
        </text>

        <text x="276" y="101">
          {data.hex1}
        </text>

        {/* Upper-left */}
        <text x="76" y="133">
          {data.b2}
        </text>

        <text x="103" y="156">
          {data.pair1}
        </text>

        <text x="128" y="112">
          {data.sys1}
        </text>

        {/* Upper-right */}
        <text x="291" y="135">
          {data.b3}
        </text>

        <text x="306" y="160">
          {data.percent1}
        </text>

        <text x="250" y="119">
          {data.b4}
        </text>

        {/* Middle-left */}
        <text x="65" y="196">
          {data.hex2}
        </text>

        <text x="91" y="217">
          {data.b5}
        </text>

        <text x="117" y="238">
          {data.ai2}
        </text>

        {/* Center */}
        <text
          x="200"
          y="204"
          textAnchor="middle"
          fontSize="11"
          fill="#ffffff"
          fillOpacity="0.72"
        >
          {data.percent2}
        </text>

        {/* Middle-right */}
        <text x="285" y="211">
          {data.b6}
        </text>

        <text x="305" y="232">
          {data.pair2}
        </text>

        <text x="275" y="257">
          {data.sys2}
        </text>

        {/* Bottom-left */}
        <text x="91" y="275">
          {data.b7}
        </text>

        <text x="117" y="299">
          {data.percent3}
        </text>

        <text x="145" y="322">
          {data.hex3}
        </text>

        {/* Bottom-right */}
        <text x="258" y="300">
          {data.b8}
        </text>

        <text x="286" y="282">
          {data.pair3}
        </text>

        <text x="231" y="327">
          {data.b1}
        </text>

        {/* Additional tiny data */}
        <text x="178" y="98">
          {data.b2}
        </text>

        <text x="204" y="112">
          {data.b3}
        </text>

        <text x="183" y="292">
          {data.b4}
        </text>

        <text x="207" y="278">
          {data.b5}
        </text>

        <text x="145" y="188">
          {data.b6}
        </text>

        <text x="244" y="188">
          {data.b7}
        </text>
      </g>

      {/* =========================================================
          STATIC MICRO LABELS
      ========================================================= */}

      <g
        fontFamily="monospace"
        fontSize="5.5"
        fill="#ffffff"
        fillOpacity="0.3"
        pointerEvents="none"
      >
        <text x="116" y="83">
          NODE_01
        </text>

        <text x="250" y="91">
          VECTOR
        </text>

        <text x="64" y="248">
          RAG
        </text>

        <text x="314" y="190">
          LLM
        </text>

        <text x="103" y="328">
          EMBED
        </text>

        <text x="274" y="326">
          TRUST
        </text>

        <text x="178" y="350">
          AI_CORE
        </text>
      </g>
    </svg>
  );
}
