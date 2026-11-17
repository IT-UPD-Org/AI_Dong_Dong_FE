import type { Campus as CampusData, Vec2 } from '../types/campus';
import { exposedSegments, topFace, wallFaces } from '../maps/geometry';
import {
  depthOf,
  groundImageMatrix,
  localToWorld,
  project,
  toPath,
  type Camera,
} from '../maps/projection';
import { Building, buildingCenter, buildingHeight } from './Building';
import { EntranceMarker } from './OfficeBlock';
import { Pill } from './Labels';

interface CampusProps {
  campus: CampusData;
  cam: Camera;
  selectedBuildingId: string | null;
  showReference: boolean;
  onBuildingClick: (id: string) => void;
}

/** Bản đồ tổng quan khuôn viên: chỉ hiển thị tấm nền và các khối nhà (Tòa A, Tòa B, Tòa D, Nhà để xe). */
export function Campus({ campus, cam, selectedBuildingId, showReference, onBuildingClick }: CampusProps) {
  const ref = campus.coordinate_system.reference_image;
  const buildings = [...campus.buildings].sort(
    (a, b) => depthOf(buildingCenter(a), cam) - depthOf(buildingCenter(b), cam),
  );

  return (
    <g className="campus">
      <GroundPlate polygon={campus.ground.polygon} cam={cam} />
      {cam.mode !== 'top' &&
        campus.buildings.map((b) => (
          <Shadow
            key={b.building_id}
            polys={b.footprint.parts.map((p) => p.polygon.map((q) => localToWorld(q, b.placement)))}
            cam={cam}
          />
        ))}
      {showReference && (
        <image
          href={ref.src}
          width={ref.width}
          height={ref.height}
          transform={groundImageMatrix(ref.scale, cam)}
          className="reference-image"
          preserveAspectRatio="none"
        />
      )}
      {campus.buildings.map((b) => (
        <EntranceMarker key={b.building_id} building={b} cam={cam} z={0} />
      ))}
      {buildings.map((b) => (
        <Building
          key={b.building_id}
          building={b}
          cam={cam}
          onClick={onBuildingClick}
          selected={selectedBuildingId === b.building_id}
          xray={showReference}
        />
      ))}
      <g className="building-labels">
        {buildings.map((b) => {
          const zLabel = cam.mode === 'top' ? 0 : buildingHeight(b) + 4;
          const top = project(buildingCenter(b), zLabel, cam);
          const sub =
            b.status === 'under_construction'
              ? 'đang hoàn thiện'
              : b.detail_available
                ? 'Bấm xem 6 tầng'
                : undefined;
          const tone =
            b.status === 'under_construction'
              ? 'warn'
              : b.building_id === 'A'
                ? 'accent'
                : b.building_id === 'B'
                  ? 'blue'
                  : 'default';
          return (
            <Pill
              key={b.building_id}
              x={top[0]}
              y={top[1]}
              text={b.name}
              sub={sub}
              size={b.detail_available ? 2.5 : 2.15}
              tone={tone}
            />
          );
        })}
      </g>
    </g>
  );
}

/** Mặt nền khuôn viên dạng tấm kiến trúc có độ dày. */
export function GroundPlate({ polygon, cam, thickness = 2.2 }: { polygon: Vec2[]; cam: Camera; thickness?: number }) {
  const walls = wallFaces(exposedSegments([polygon]), -thickness, 0, cam, '#d5dde6', 'ground');
  return (
    <g className="ground" pointerEvents="none">
      {walls.map((w) => (
        <path key={w.key} d={w.d} fill={w.fill} />
      ))}
      <path d={topFace(polygon, 0, cam)} className="ground-top" />
    </g>
  );
}

export function Shadow({ polys, cam }: { polys: Vec2[][]; cam: Camera }) {
  const d = polys
    .map((p) => toPath(p.map((q) => project(q, 0, cam)).map(([x, y]) => [x + 2.4, y + 1.2] as [number, number])))
    .join('');
  return <path d={d} className="shadow" filter="url(#soft-shadow)" pointerEvents="none" />;
}
