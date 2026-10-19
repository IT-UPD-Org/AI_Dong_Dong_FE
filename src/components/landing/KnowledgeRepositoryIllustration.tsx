import { useEffect, useId, useMemo, useState } from "react";
import { InteractiveIllustration } from "./InteractiveIllustration";
import {
  createProjector,
  createRotation,
  polygonPoints,
  polylinePath,
  type Point3D,
  type ProjectedPoint,
  type Rotation3D,
} from "./scene3d";

export interface KnowledgeRepositoryIllustrationProps {
  className?: string;
  autoRotate?: boolean;
}

interface DocumentData {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

const INITIAL_ROTATION = { pitch: Math.PI / 6, yaw: Math.PI / 4 };
const CENTER = { x: 550, y: 440 };
const FIT_CENTER = { x: CENTER.x, y: 360 };
const READOUT_INTERVAL = 650;
const CODE_REFRESH_CHANCE = 0.28;
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
  "1024",
  "256",
  "0xA21",
  "DB",
  "NLP",
];
const randomCode = () =>
  DATA_CODES[Math.floor(Math.random() * DATA_CODES.length)];

// Retain all original block positions and dimensions at the default angle.
const DOCUMENTS: DocumentData[] = [
  { x: 205, y: 205, width: 104, height: 125, label: "BOOK" },
  { x: 325, y: 170, width: 104, height: 175, label: "PDF" },
  { x: 445, y: 135, width: 120, height: 205, label: "DOC" },
  { x: 565, y: 155, width: 110, height: 165, label: "IDX" },
  { x: 685, y: 185, width: 110, height: 180, label: "LINK" },
  { x: 805, y: 215, width: 110, height: 150, label: "REF" },
  { x: 270, y: 300, width: 110, height: 160, label: "META" },
  { x: 390, y: 280, width: 122, height: 205, label: "RAG" },
  { x: 520, y: 220, width: 120, height: 280, label: "VECTOR" },
  { x: 655, y: 285, width: 112, height: 200, label: "EMB" },
  { x: 790, y: 315, width: 98, height: 170, label: "PDF" },
  { x: 210, y: 410, width: 98, height: 110, label: "TXT" },
  { x: 325, y: 430, width: 108, height: 135, label: "DOC" },
  { x: 450, y: 455, width: 124, height: 150, label: "BOOK" },
  { x: 585, y: 450, width: 124, height: 155, label: "RAG" },
  { x: 720, y: 445, width: 116, height: 130, label: "IDX" },
  { x: 840, y: 420, width: 104, height: 110, label: "LINK" },
  { x: 365, y: 220, width: 72, height: 105, label: "DB" },
  { x: 460, y: 200, width: 72, height: 105, label: "DB" },
  { x: 610, y: 205, width: 72, height: 105, label: "NLP" },
  { x: 745, y: 250, width: 72, height: 120, label: "REF" },
];

/** Lift the original isometric positions onto a real 3D ground plane. */
function groundPoint(x: number, screenY: number): Point3D {
  const horizontal = x - CENTER.x;
  const depth = (screenY - CENTER.y) / Math.sin(INITIAL_ROTATION.pitch);
  const cos = Math.cos(INITIAL_ROTATION.yaw);
  const sin = Math.sin(INITIAL_ROTATION.yaw);
  return {
    x: horizontal * cos - depth * sin,
    y: 0,
    z: horizontal * sin + depth * cos,
  };
}

const MODELS = DOCUMENTS.map((document) => {
  const base = groundPoint(document.x, document.y + document.height);
  const halfSide = document.width / (2 * Math.SQRT2);
  const height = document.height / Math.cos(INITIAL_ROTATION.pitch);
  const corners = [0, height].flatMap((y) => [
    { x: base.x - halfSide, y, z: base.z - halfSide },
    { x: base.x + halfSide, y, z: base.z - halfSide },
    { x: base.x + halfSide, y, z: base.z + halfSide },
    { x: base.x - halfSide, y, z: base.z + halfSide },
  ]);
  return {
    ...document,
    corners,
    rim: corners.slice(4).map((corner) => ({ ...corner, y: corner.y + 9 })),
    labelPoint: { ...base, y: height - 28 },
  };
});
const FACES = [
  { corners: [4, 5, 6, 7], normal: { x: 0, y: 1, z: 0 }, shade: "top" },
  { corners: [0, 3, 2, 1], normal: { x: 0, y: -1, z: 0 }, shade: "side" },
  { corners: [0, 1, 5, 4], normal: { x: 0, y: 0, z: -1 }, shade: "side" },
  { corners: [1, 2, 6, 5], normal: { x: 1, y: 0, z: 0 }, shade: "side" },
  { corners: [2, 3, 7, 6], normal: { x: 0, y: 0, z: 1 }, shade: "side" },
  { corners: [3, 0, 4, 7], normal: { x: -1, y: 0, z: 0 }, shade: "side" },
] as const;

const DATA_ROUTES = [
  [
    [70, 610],
    [250, 500],
    [430, 570],
    [610, 470],
    [820, 560],
    [1030, 450],
  ],
  [
    [45, 665],
    [235, 550],
    [405, 625],
    [590, 515],
    [780, 610],
    [1045, 475],
  ],
  [
    [120, 585],
    [305, 475],
    [470, 535],
    [650, 435],
    [850, 510],
    [1000, 425],
  ],
  [
    [95, 545],
    [275, 440],
    [455, 505],
    [635, 400],
    [825, 480],
    [980, 395],
  ],
].map((route) => route.map(([x, y]) => groundPoint(x, y)));
const GRID = Array.from({ length: 9 }, (_, index) => (index - 4) * 130).flatMap(
  (position) => [
    [
      { x: -520, y: 0, z: position },
      { x: 520, y: 0, z: position },
    ],
    [
      { x: position, y: 0, z: -520 },
      { x: position, y: 0, z: 520 },
    ],
  ],
);

interface RepositorySceneProps {
  rotation: Rotation3D;
  codes: string[];
  id: string;
  animate: boolean;
}

function projectRepository(rotation: Rotation3D) {
  const rawProject = createProjector(rotation, CENTER);
  const rotate = createRotation(rotation);
  const modelCorners = MODELS.map((model) => model.corners.map(rawProject));
  const allCorners = modelCorners.flat();
  const extentX = Math.max(
    ...allCorners.map((point) => Math.abs(point.x - FIT_CENTER.x)),
  );
  const extentY = Math.max(
    ...allCorners.map((point) => Math.abs(point.y - FIT_CENTER.y)),
  );
  // Keep the whole cluster visible even when turned to its widest side.
  const scale = Math.min(
    1,
    450 / Math.max(1, extentX),
    290 / Math.max(1, extentY),
  );
  const fit = (point: ProjectedPoint): ProjectedPoint => ({
    x: FIT_CENTER.x + (point.x - FIT_CENTER.x) * scale,
    y: FIT_CENTER.y + (point.y - FIT_CENTER.y) * scale,
    depth: point.depth,
  });
  const project = (point: Point3D) => fit(rawProject(point));
  const visibleFaces = FACES.map((face, index) => ({ ...face, index })).filter(
    (face) => rotate(face.normal).z > 0.001,
  );
  const faces = modelCorners
    .flatMap((corners, modelIndex) => {
      // Share the eight projected corners between all faces of the same block.
      const fittedCorners = corners.map(fit);
      return visibleFaces.map((face) => {
        const points = face.corners.map((corner) => fittedCorners[corner]);
        return {
          key: `${modelIndex}-${face.index}`,
          points: polygonPoints(points),
          shade: face.shade,
          depth:
            points.reduce((total, point) => total + point.depth, 0) /
            points.length,
        };
      });
    })
    .sort((a, b) => a.depth - b.depth);

  return {
    faces,
    grid: GRID.map((line) => polylinePath(line.map(project))),
    rims: MODELS.map((model) => polygonPoints(model.rim.map(project))),
    labels: MODELS.map((model) => project(model.labelPoint)),
    routes: DATA_ROUTES.map((route) => ({
      path: polylinePath(route.map(project)),
      start: project(route[0]),
    })),
  };
}

function RepositoryScene({
  rotation,
  codes,
  id,
  animate,
}: RepositorySceneProps) {
  const geometry = useMemo(() => projectRepository(rotation), [rotation]);

  return (
    <svg viewBox="0 0 1100 720" role="img" aria-label="Kho Tri Thức Số">
      <defs>
        <linearGradient id={`${id}-top`} x2="0" y2="1">
          <stop stopColor="#5ee6b3" stopOpacity=".25" />
          <stop offset="1" stopColor="#00a86b" stopOpacity=".08" />
        </linearGradient>
        <linearGradient id={`${id}-side`}>
          <stop stopColor="#00a86b" stopOpacity=".13" />
          <stop offset="1" stopColor="#5ee6b3" stopOpacity=".025" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="#00a86b" strokeWidth="1" strokeOpacity=".08">
        {geometry.grid.map((path, index) => (
          <path key={index} d={path} />
        ))}
      </g>
      <g
        fill="none"
        stroke="#00a86b"
        strokeOpacity=".22"
        strokeWidth="1.5"
        strokeDasharray="3 12"
      >
        {geometry.routes.map(({ path }, index) => (
          <path key={index} d={path} />
        ))}
      </g>
      {geometry.faces.map((face) => (
        <polygon
          key={face.key}
          data-document-face={face.key}
          points={face.points}
          fill={`url(#${id}-${face.shade})`}
          stroke="#00a86b"
          strokeOpacity={face.shade === "top" ? 0.5 : 0.3}
          strokeWidth="1"
        />
      ))}
      <g fill="none" stroke="#00a86b" strokeOpacity=".28">
        {geometry.rims.map((points, index) => (
          <polygon key={index} points={points} />
        ))}
      </g>
      <g
        fontFamily="monospace"
        fontSize="9"
        fill="#00a86b"
        pointerEvents="none"
      >
        {geometry.labels.map((label, index) => (
          <g
            key={index}
            transform={`translate(${label.x} ${label.y})`}
            opacity={label.depth < 0 ? 0.45 : 0.8}
          >
            <text x="-22">{MODELS[index].label}</text>
            <text x="-22" y="15" fill="#04714a">
              {codes[index]}
            </text>
            <path
              d="M-22 27H14 M-22 35H6 M-22 43H-2"
              fill="none"
              stroke="#00a86b"
              strokeOpacity=".35"
            />
          </g>
        ))}
      </g>
      <g fill="#5ee6b3" className="interactive-sphere__pulse">
        {geometry.routes.map(({ path, start }, index) => (
          <circle
            key={index}
            r="3.5"
            opacity=".8"
            cx={animate ? 0 : start.x}
            cy={animate ? 0 : start.y}
          >
            {animate && (
              <animateMotion
                path={path}
                dur={`${5.5 + index * 0.65}s`}
                begin={`${index * -0.7}s`}
                repeatCount="indefinite"
              />
            )}
          </circle>
        ))}
      </g>
      <g
        fontFamily="monospace"
        fontSize="14"
        fill="#04714a"
        pointerEvents="none"
        stroke="#fff"
        strokeWidth="4"
        paintOrder="stroke"
      >
        <text x="72" y="80">
          Kết nối trực tiếp với hệ thống
        </text>
        <text x="72" y="102">
          thư viện và giáo trình của nhà trường.
        </text>
        <text x="72" y="620">
          Trích xuất chính xác tài liệu,
        </text>
        <text x="72" y="641">
          bài giảng và link sách tham khảo chuẩn xác.
        </text>
        <text x="720" y="620">
          Gợi ý lộ trình đọc và tự học phù hợp
        </text>
        <text x="720" y="641">
          theo từng môn chuyên ngành.
        </text>
      </g>
    </svg>
  );
}

export function KnowledgeRepositoryIllustration({
  className = "",
  autoRotate = true,
}: KnowledgeRepositoryIllustrationProps) {
  const [codes, setCodes] = useState(() => DOCUMENTS.map(randomCode));
  const id = `knowledge-scene-${useId().replace(/:/g, "")}`;
  useEffect(() => {
    const timer = window.setInterval(() => {
      setCodes((current) =>
        current.map((code) =>
          Math.random() < CODE_REFRESH_CHANCE ? randomCode() : code,
        ),
      );
    }, READOUT_INTERVAL);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <InteractiveIllustration
      label="kho tri thức số"
      className={className}
      initialRotation={INITIAL_ROTATION}
      autoRotate={autoRotate}
      autoRotateSpeed={0.10}
      returnOnRelease={true}
    >
      {(rotation, reducedMotion) => (
        <RepositoryScene
          rotation={rotation}
          codes={codes}
          id={id}
          animate={!reducedMotion}
        />
      )}
    </InteractiveIllustration>
  );
}
