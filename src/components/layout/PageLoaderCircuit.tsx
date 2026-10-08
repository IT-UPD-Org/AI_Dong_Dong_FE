import { memo, useId, type CSSProperties } from "react";

// These routes align with the static circuit artwork at the same viewBox size.
const SIGNAL_ROUTES = [
  {
    path: "M88 298H534Q538 298 542 302L584 342Q588 346 594 346H840L870 312Q902 195 1038 195Q1086 195 1088 140Q1088 67 1176 62Q1254 62 1254 0",
    duration: 2200,
    delay: 0,
  },
  {
    path: "M88 418H330Q338 418 344 412L370 390Q374 388 384 388H840Q877 388 892 353Q944 226 1040 227Q1130 234 1132 147Q1132 101 1196 92Q1276 82 1274 0",
    duration: 1900,
    delay: -700,
  },
  {
    path: "M88 484H279Q284 484 288 480L324 442Q328 439 334 439H620Q625 439 629 443L666 481Q670 486 678 486H918",
    duration: 1800,
    delay: -350,
  },
  {
    path: "M88 535H530Q535 535 539 540L554 554Q558 559 566 559H837Q870 559 889 590L980 731Q1014 780 1080 780H1210Q1240 780 1240 820V941",
    duration: 2400,
    delay: -1200,
  },
  {
    path: "M88 600H830Q850 600 863 615L958 754Q997 811 1066 811H1175Q1205 811 1205 850V941",
    duration: 2100,
    delay: -900,
  },
] as const;

const SIGNAL_NODES = [
  { x: 461, y: 381, delay: 0 },
  { x: 659, y: 339, delay: -400 },
  { x: 844, y: 479, delay: -800 },
  { x: 636, y: 552, delay: -1200 },
  { x: 416, y: 593, delay: -600 },
] as const;

// The circuit is static React markup; CSS drives its animation independently of progress.
export const PageLoaderCircuit = memo(function PageLoaderCircuit() {
  const glowId = `loader-signal-${useId().replace(/:/g, "")}`;

  return (
    <div className="page-loader__circuit" aria-hidden="true">
      <svg
        className="page-loader__signals"
        viewBox="0 0 1672 941"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter={`url(#${glowId})`}>
          {SIGNAL_ROUTES.map(({ path, duration, delay }) => (
            <path
              key={path}
              className="page-loader__signal"
              d={path}
              pathLength={100}
              style={{
                "--signal-duration": `${duration}ms`,
                "--signal-delay": `${delay}ms`,
              } as CSSProperties}
            />
          ))}
          {SIGNAL_NODES.map(({ x, y, delay }) => (
            <rect
              key={`${x}-${y}`}
              className="page-loader__node"
              x={x}
              y={y}
              width={14}
              height={14}
              style={{ "--signal-delay": `${delay}ms` } as CSSProperties}
            />
          ))}
        </g>
      </svg>
    </div>
  );
});
