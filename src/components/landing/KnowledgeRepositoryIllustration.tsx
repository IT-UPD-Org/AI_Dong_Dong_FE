// \dong-dong_FE\src\components\landing\KnowledgeRepositoryIllustration.tsx

import { useEffect, useMemo, useState } from "react";

interface KnowledgeRepositoryIllustrationProps {
  className?: string;
}

/* ============================================================
   DATA CODES
============================================================ */

const DATA_CODES = [
  "192",
  "512",
  "028",
  "341",
  "0x415",
  "768",
  "204",
  "091",
  "A17",
  "RAG",
  "DOC",
  "PDF",
  "IDX",
  "VECTOR",
  "LINK",
  "META",
  "BOOK",
  "TXT",
  "EMB",
  "REF",
  "384",
  "768",
  "1024",
  "256",
  "0xA21",
  "0xF04",
  "DB",
  "NLP",
];

const randomCode = () =>
  DATA_CODES[Math.floor(Math.random() * DATA_CODES.length)];

/* ============================================================
   DOCUMENT DATA
============================================================ */

interface DocumentData {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  label: string;
  codeIndex: number;
  delay: string;
  scale?: number;
}

/*
 * 20 blocks.
 *
 * Tọa độ được thiết kế trực tiếp trên canvas 1100x720,
 * không dùng các translate lồng nhau nên tránh hiện tượng
 * block bị đẩy ra góc.
 */
const DOCUMENTS: DocumentData[] = [
  // ----------------------------------------------------------
  // BACK / UPPER LAYER
  // ----------------------------------------------------------
  {
    x: 205,
    y: 205,
    width: 104,
    height: 125,
    depth: 50,
    label: "BOOK",
    codeIndex: 0,
    delay: "0s",
  },
  {
    x: 325,
    y: 170,
    width: 104,
    height: 175,
    depth: 56,
    label: "PDF",
    codeIndex: 1,
    delay: "0.6s",
  },
  {
    x: 445,
    y: 135,
    width: 120,
    height: 205,
    depth: 60,
    label: "DOC",
    codeIndex: 2,
    delay: "1.1s",
  },
  {
    x: 565,
    y: 155,
    width: 110,
    height: 165,
    depth: 54,
    label: "IDX",
    codeIndex: 3,
    delay: "1.7s",
  },
  {
    x: 685,
    y: 185,
    width: 110,
    height: 180,
    depth: 56,
    label: "LINK",
    codeIndex: 4,
    delay: "2.3s",
  },
  {
    x: 805,
    y: 215,
    width: 110,
    height: 150,
    depth: 50,
    label: "REF",
    codeIndex: 5,
    delay: "2.8s",
  },

  // ----------------------------------------------------------
  // CENTER LAYER
  // ----------------------------------------------------------
  {
    x: 270,
    y: 300,
    width: 110,
    height: 160,
    depth: 56,
    label: "META",
    codeIndex: 6,
    delay: "0.3s",
  },
  {
    x: 390,
    y: 280,
    width: 122,
    height: 205,
    depth: 66,
    label: "RAG",
    codeIndex: 7,
    delay: "1.3s",
  },
  {
    x: 520,
    y: 220,
    width: 120,
    height: 280,
    depth: 70,
    label: "VECTOR",
    codeIndex: 8,
    delay: "0.8s",
  },
  {
    x: 655,
    y: 285,
    width: 112,
    height: 200,
    depth: 66,
    label: "EMB",
    codeIndex: 9,
    delay: "1.9s",
  },
  {
    x: 790,
    y: 315,
    width: 98,
    height: 170,
    depth: 56,
    label: "PDF",
    codeIndex: 10,
    delay: "2.6s",
  },

  // ----------------------------------------------------------
  // FRONT LAYER
  // ----------------------------------------------------------
  {
    x: 210,
    y: 410,
    width: 98,
    height: 110,
    depth: 48,
    label: "TXT",
    codeIndex: 11,
    delay: "1.5s",
  },
  {
    x: 325,
    y: 430,
    width: 108,
    height: 135,
    depth: 54,
    label: "DOC",
    codeIndex: 12,
    delay: "2.1s",
  },
  {
    x: 450,
    y: 455,
    width: 124,
    height: 150,
    depth: 62,
    label: "BOOK",
    codeIndex: 13,
    delay: "0.9s",
  },
  {
    x: 585,
    y: 450,
    width: 124,
    height: 155,
    depth: 64,
    label: "RAG",
    codeIndex: 14,
    delay: "2.4s",
  },
  {
    x: 720,
    y: 445,
    width: 116,
    height: 130,
    depth: 58,
    label: "IDX",
    codeIndex: 15,
    delay: "1.8s",
  },
  {
    x: 840,
    y: 420,
    width: 104,
    height: 110,
    depth: 52,
    label: "LINK",
    codeIndex: 16,
    delay: "3s",
  },

  // ----------------------------------------------------------
  // SMALL FLOATING BLOCKS
  // ----------------------------------------------------------
  {
    x: 365,
    y: 220,
    width: 72,
    height: 105,
    depth: 40,
    label: "DB",
    codeIndex: 17,
    delay: "3.2s",
  },
  {
    x: 460,
    y: 200,
    width: 72,
    height: 105,
    depth: 40,
    label: "DB",
    codeIndex: 17,
    delay: "3.2s",
  },
  {
    x: 610,
    y: 205,
    width: 72,
    height: 105,
    depth: 40,
    label: "NLP",
    codeIndex: 18,
    delay: "1.2s",
  },
  {
    x: 745,
    y: 250,
    width: 72,
    height: 120,
    depth: 42,
    label: "REF",
    codeIndex: 19,
    delay: "2.7s",
  },
];

/* ============================================================
   DATA PIPELINES
============================================================ */

const DATA_PATHS = [
  "M70 610 L250 500 L430 570 L610 470 L820 560 L1030 450",
  "M45 665 L235 550 L405 625 L590 515 L780 610 L1045 475",
  "M120 585 L305 475 L470 535 L650 435 L850 510 L1000 425",
  "M145 690 L330 575 L500 650 L690 540 L870 620 L1020 525",
  "M185 625 L350 525 L520 590 L700 485 L900 570 L1045 490",
  "M95 545 L275 440 L455 505 L635 400 L825 480 L980 395",
];

/* ============================================================
   FLOATING PARTICLES
============================================================ */

const PARTICLES = [
  { x: 185, y: 500, r: 3, delay: "0s" },
  { x: 270, y: 455, r: 4, delay: "0.7s" },
  { x: 350, y: 515, r: 3, delay: "1.4s" },
  { x: 430, y: 465, r: 4, delay: "2.1s" },
  { x: 505, y: 525, r: 3, delay: "0.4s" },
  { x: 585, y: 450, r: 4, delay: "1.1s" },
  { x: 670, y: 520, r: 3, delay: "1.8s" },
  { x: 750, y: 470, r: 4, delay: "2.5s" },
  { x: 835, y: 535, r: 3, delay: "0.9s" },
  { x: 925, y: 455, r: 4, delay: "1.6s" },
];

/* ============================================================
   COMPONENT
============================================================ */

export function KnowledgeRepositoryIllustration({
  className = "",
}: KnowledgeRepositoryIllustrationProps) {
  const [codes, setCodes] = useState(() =>
    Array.from({ length: 30 }, randomCode),
  );

  /* ----------------------------------------------------------
     Random data stream
  ---------------------------------------------------------- */

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCodes((current) =>
        current.map((code) => {
          if (Math.random() > 0.28) {
            return code;
          }

          return randomCode();
        }),
      );
    }, 650);

    return () => window.clearInterval(timer);
  }, []);

  /* ----------------------------------------------------------
     Generate random-ish floating code positions
     cố định sau mount để không nhảy layout.
  ---------------------------------------------------------- */

  const floatingCodes = useMemo(
    () => [
      { x: 300, y: 145, index: 20 },
      { x: 430, y: 115, index: 21 },
      { x: 565, y: 105, index: 22 },
      { x: 700, y: 135, index: 23 },
      { x: 850, y: 175, index: 24 },

      { x: 240, y: 390, index: 25 },
      { x: 350, y: 360, index: 26 },
      { x: 470, y: 400, index: 27 },
      { x: 615, y: 375, index: 28 },
      { x: 760, y: 400, index: 29 },
    ],
    [],
  );

  return (
    <svg
      viewBox="0 0 1100 720"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Kho Tri Thức Số"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* ====================================================
            GLOW
        ==================================================== */}

        <filter
          id="knowledgeGlow"
          x="-200%"
          y="-200%"
          width="400%"
          height="400%"
        >
          <feGaussianBlur stdDeviation="4" result="blur" />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="dataGlow" x="-300%" y="-300%" width="600%" height="600%">
          <feGaussianBlur stdDeviation="7" result="blur" />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* ====================================================
            DOCUMENT GRADIENTS
        ==================================================== */}

        <linearGradient id="documentTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7de6bd" stopOpacity=".52" />

          <stop offset="100%" stopColor="#4bd6a4" stopOpacity=".12" />
        </linearGradient>

        <linearGradient id="documentLeft" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d9f7ec" stopOpacity=".68" />

          <stop offset="100%" stopColor="#a7ead3" stopOpacity=".16" />
        </linearGradient>

        <linearGradient id="documentRight" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b9efdd" stopOpacity=".34" />

          <stop offset="100%" stopColor="#65dcae" stopOpacity=".08" />
        </linearGradient>

        {/* ====================================================
            DATA LINE GRADIENT
        ==================================================== */}

        <linearGradient id="dataLineGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00a86b" stopOpacity="0" />

          <stop offset="25%" stopColor="#00a86b" stopOpacity=".18" />

          <stop offset="50%" stopColor="#00a86b" stopOpacity=".30" />

          <stop offset="75%" stopColor="#00a86b" stopOpacity=".18" />

          <stop offset="100%" stopColor="#00a86b" stopOpacity="0" />
        </linearGradient>

        {/* ====================================================
            MASK
        ==================================================== */}

        <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity=".95" />

          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        <mask id="bottomFadeMask">
          <rect x="0" y="0" width="1100" height="720" fill="url(#bottomFade)" />
        </mask>
      </defs>

      {/* ==========================================================
          BACKGROUND ISOMETRIC GRID
      ========================================================== */}

      <g fill="none" stroke="#00a86b" strokeWidth="1">
        {/* Outer diamonds */}

        <path d="M550 55 L950 295 L550 535 L150 295 Z" strokeOpacity=".12" />

        <path d="M550 115 L875 310 L550 505 L225 310 Z" strokeOpacity=".09" />

        <path d="M550 180 L800 330 L550 480 L300 330 Z" strokeOpacity=".075" />

        <path d="M550 235 L735 346 L550 457 L365 346 Z" strokeOpacity=".06" />

        {/* horizontal iso lines */}

        <path d="M150 295 L550 535 L950 295" strokeOpacity=".07" />

        <path d="M195 270 L550 483 L905 270" strokeOpacity=".07" />

        <path d="M245 240 L550 423 L855 240" strokeOpacity=".065" />

        <path d="M300 205 L550 355 L800 205" strokeOpacity=".055" />

        <path d="M355 170 L550 287 L745 170" strokeOpacity=".05" />

        {/* long diagonal infrastructure */}

        <path
          d="M25 430 L550 115 L1075 430"
          strokeDasharray="3 13"
          strokeOpacity=".08"
        />

        <path
          d="M45 520 L550 215 L1055 520"
          strokeDasharray="3 14"
          strokeOpacity=".07"
        />

        <path
          d="M35 620 L550 310 L1065 620"
          strokeDasharray="2 16"
          strokeOpacity=".055"
        />
      </g>

      {/* ==========================================================
          CENTRAL DATA PLANE
      ========================================================== */}

      <g>
        <path
          d="M170 450 L550 220 L930 450 L550 680 Z"
          fill="#00a86b"
          fillOpacity=".012"
          stroke="#00a86b"
          strokeOpacity=".07"
        />

        <path
          d="M230 450 L550 255 L870 450 L550 645 Z"
          fill="none"
          stroke="#00a86b"
          strokeOpacity=".07"
          strokeDasharray="2 9"
        />

        <path
          d="M295 450 L550 295 L805 450 L550 605 Z"
          fill="none"
          stroke="#00a86b"
          strokeOpacity=".06"
        />
      </g>

      {/* ==========================================================
          DATA PIPELINES UNDER THE DOCUMENTS
      ========================================================== */}

      <g fill="none" strokeLinecap="round" mask="url(#bottomFadeMask)">
        {DATA_PATHS.map((path, index) => (
          <path
            key={index}
            d={path}
            stroke="url(#dataLineGradient)"
            strokeWidth={index % 2 === 0 ? 2 : 1}
            strokeDasharray={index % 2 === 0 ? "2 11" : "5 14"}
            opacity={0.55 - index * 0.035}
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-180"
              dur={`${5 + index * 0.7}s`}
              repeatCount="indefinite"
            />
          </path>
        ))}

        {/* Extra thin continuous lines */}

        <path
          d="M20 650 L270 500 L470 610 L680 490 L900 600 L1080 490"
          stroke="#00a86b"
          strokeOpacity=".08"
          strokeWidth="1"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-250"
            dur="8s"
            repeatCount="indefinite"
          />
        </path>

        <path
          d="M0 585 L220 455 L410 560 L625 435 L850 545 L1100 400"
          stroke="#00a86b"
          strokeOpacity=".055"
          strokeWidth="1"
          strokeDasharray="1 17"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-220"
            dur="7s"
            repeatCount="indefinite"
          />
        </path>
      </g>

      {/* ==========================================================
          MOVING DATA DOTS
      ========================================================== */}

      {DATA_PATHS.map((path, index) => (
        <g key={`moving-dot-${index}`}>
          {/* glow */}
          <circle r="8" fill="#5ee6b3" opacity=".09" filter="url(#dataGlow)">
            <animateMotion
              dur={`${5.5 + index * 0.65}s`}
              begin={`${index * 0.7}s`}
              repeatCount="indefinite"
              path={path}
            />
          </circle>

          {/* core */}
          <circle
            r={index % 2 === 0 ? 3.5 : 2.5}
            fill="#5ee6b3"
            opacity=".9"
            filter="url(#knowledgeGlow)"
          >
            <animateMotion
              dur={`${5.5 + index * 0.65}s`}
              begin={`${index * 0.7}s`}
              repeatCount="indefinite"
              path={path}
            />
          </circle>
        </g>
      ))}

      {/* ==========================================================
          STATIC / FLOATING PARTICLES
      ========================================================== */}

      <g>
        {PARTICLES.map((particle, index) => (
          <g key={index}>
            <circle
              cx={particle.x}
              cy={particle.y}
              r={particle.r * 4}
              fill="#00a86b"
              opacity=".06"
              filter="url(#dataGlow)"
            />

            <circle
              cx={particle.x}
              cy={particle.y}
              r={particle.r}
              fill="#5ee6b3"
              opacity=".7"
              filter="url(#knowledgeGlow)"
            >
              <animate
                attributeName="cy"
                values={`${particle.y};${particle.y - 14};${particle.y}`}
                dur={`${4 + index * 0.35}s`}
                begin={particle.delay}
                repeatCount="indefinite"
              />

              <animate
                attributeName="opacity"
                values=".2;.85;.2"
                dur={`${3 + index * 0.25}s`}
                begin={particle.delay}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}
      </g>

      {/* ==========================================================
          20 DOCUMENT BLOCKS
      ========================================================== */}

      <g>
        {DOCUMENTS.map((document, index) => (
          <DocumentBlock
            key={index}
            {...document}
            code={codes[document.codeIndex]}
          />
        ))}
      </g>

      {/* ==========================================================
          FLOATING DATA CODES
      ========================================================== */}

      <g fontFamily="monospace" fontSize="9" fill="#00a86b" opacity=".72">
        {floatingCodes.map((item, index) => (
          <text key={index} x={item.x} y={item.y}>
            {codes[item.index]}
          </text>
        ))}
      </g>

      {/* ==========================================================
          TOP LEFT DESCRIPTION
      ========================================================== */}

      <g>
        <text
          x="72"
          y="105"
          fontFamily="monospace"
          fontSize="15"
          fill="#04714a"
        >
          Kết nối trực tiếp với hệ thống
        </text>

        <text
          x="72"
          y="127"
          fontFamily="monospace"
          fontSize="15"
          fill="#04714a"
        >
          thư viện và giáo trình của nhà trường.
        </text>

        <path
          d="M325 137 L390 195"
          fill="none"
          stroke="#00a86b"
          strokeOpacity=".2"
          strokeDasharray="3 8"
        />

        <circle cx="390" cy="195" r="3" fill="#5ee6b3" />
      </g>

      {/* ==========================================================
          BOTTOM LEFT DESCRIPTION
      ========================================================== */}

      <g>
        <text
          x="72"
          y="610"
          fontFamily="monospace"
          fontSize="14"
          fill="#04714a"
        >
          Trích xuất chính xác tài liệu,
        </text>

        <text
          x="72"
          y="631"
          fontFamily="monospace"
          fontSize="14"
          fill="#04714a"
        >
          bài giảng và link sách tham khảo chuẩn xác.
        </text>

        <path
          d="M370 600 L440 550"
          fill="none"
          stroke="#00a86b"
          strokeOpacity=".2"
          strokeDasharray="3 8"
        />

        <circle cx="440" cy="550" r="3" fill="#5ee6b3" />
      </g>

      {/* ==========================================================
          BOTTOM RIGHT DESCRIPTION
      ========================================================== */}

      <g>
        <text
          x="755"
          y="610"
          fontFamily="monospace"
          fontSize="14"
          fill="#04714a"
        >
          Gợi ý lộ trình đọc và tự học phù hợp
        </text>

        <text
          x="755"
          y="631"
          fontFamily="monospace"
          fontSize="14"
          fill="#04714a"
        >
          theo từng môn chuyên ngành.
        </text>

        <path
          d="M755 585 L690 535"
          fill="none"
          stroke="#00a86b"
          strokeOpacity=".2"
          strokeDasharray="3 8"
        />

        <circle cx="690" cy="535" r="3" fill="#5ee6b3" />
      </g>
    </svg>
  );
}

/* ================================================================
   DOCUMENT BLOCK
================================================================ */

interface DocumentBlockProps {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  label: string;
  code: string;
  delay: string;
}

function DocumentBlock({
  x,
  y,
  width,
  height,
  depth,
  label,
  code,
  delay,
}: DocumentBlockProps) {
  const halfW = width / 2;
  const halfD = depth / 2;

  const topY = 0;
  const bottomY = height;

  return (
    <g transform={`translate(${x} ${y})`} opacity=".9">
      {/* ======================================================
          FLOATING MOTION
      ====================================================== */}

      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 8; 0 -6; 0 0"
          dur={`${5.5 + (x % 4) * 0.7}s`}
          begin={delay}
          repeatCount="indefinite"
        />

        {/* ====================================================
            TOP
        ==================================================== */}

        <polygon
          points={`
            0,${topY - halfD}
            ${halfW},${topY}
            0,${topY + halfD}
            ${-halfW},${topY}
          `}
          fill="url(#documentTop)"
          stroke="#00a86b"
          strokeOpacity=".48"
          strokeWidth="1"
        />

        {/* ====================================================
            LEFT SIDE
        ==================================================== */}

        <polygon
          points={`
            ${-halfW},${topY}
            0,${topY + halfD}
            0,${bottomY + halfD}
            ${-halfW},${bottomY}
          `}
          fill="url(#documentLeft)"
          stroke="#00a86b"
          strokeOpacity=".34"
          strokeWidth="1"
        />

        {/* ====================================================
            RIGHT SIDE
        ==================================================== */}

        <polygon
          points={`
            0,${topY + halfD}
            ${halfW},${topY}
            ${halfW},${bottomY}
            0,${bottomY + halfD}
          `}
          fill="url(#documentRight)"
          stroke="#00a86b"
          strokeOpacity=".28"
          strokeWidth="1"
        />

        {/* ====================================================
            TOP WIRES
        ==================================================== */}

        <polygon
          points={`
            0,${topY - halfD - 6}
            ${halfW + 6},${topY - 6}
            0,${topY + halfD - 6}
            ${-halfW - 6},${topY - 6}
          `}
          fill="none"
          stroke="#00a86b"
          strokeOpacity=".18"
        />

        <polygon
          points={`
            0,${topY - halfD - 11}
            ${halfW + 11},${topY - 11}
            0,${topY + halfD - 11}
            ${-halfW - 11},${topY - 11}
          `}
          fill="none"
          stroke="#00a86b"
          strokeOpacity=".09"
        />

        <polygon
          points={`
            0,${topY - halfD - 12}
            ${halfW + 12},${topY - 12}
            0,${topY + halfD - 10}
            ${-halfW - 12},${topY - 12}
          `}
          fill="none"
          stroke="#00a86b"
          strokeOpacity=".6"
        />
        {/* ====================================================
            LABEL
        ==================================================== */}

        <text
          x={-halfW + 10}
          y={topY + 25}
          fontFamily="monospace"
          fontSize={Math.max(6, Math.min(9, width / 11))}
          fill="#00a86b"
          opacity=".82"
        >
          {label}
        </text>

        <text
          x={-halfW + 10}
          y={topY + 39}
          fontFamily="monospace"
          fontSize={Math.max(6, Math.min(9, width / 11))}
          fill="#04714a"
          opacity=".65"
        >
          {code}
        </text>

        {/* ====================================================
            DOCUMENT DATA LINES
        ==================================================== */}

        <line
          x1={-halfW + 10}
          y1={topY + 52}
          x2={-8}
          y2={topY + 52}
          stroke="#00a86b"
          strokeOpacity=".24"
        />

        <line
          x1={-halfW + 10}
          y1={topY + 60}
          x2={-15}
          y2={topY + 60}
          stroke="#00a86b"
          strokeOpacity=".16"
        />

        <line
          x1={-halfW + 10}
          y1={topY + 68}
          x2={-22}
          y2={topY + 68}
          stroke="#00a86b"
          strokeOpacity=".10"
        />
        <line
          x1={-halfW + 10}
          y1={topY + 68}
          x2={-22}
          y2={topY + 68}
          stroke="#00a86b"
          strokeOpacity=".70"
        />

        {/* ====================================================
            LITTLE ACTIVE DATA NODE
        ==================================================== */}

        <circle
          cx={halfW - 9}
          cy={bottomY - 12}
          r="2"
          fill="#5ee6b3"
          opacity=".7"
        >
          <animate
            attributeName="opacity"
            values=".15;.9;.15"
            dur={`${2.5 + (x % 3)}s`}
            repeatCount="indefinite"
          />

          <animate
            attributeName="r"
            values="1.5;3;1.5"
            dur={`${2.5 + (x % 3)}s`}
            repeatCount="indefinite"
          />
        </circle>
      </g>
    </g>
  );
}
