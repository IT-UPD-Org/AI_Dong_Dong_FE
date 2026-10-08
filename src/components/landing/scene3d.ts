export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Rotation3D {
  pitch: number;
  yaw: number;
}

export interface ProjectedPoint {
  x: number;
  y: number;
  depth: number;
}

/** Calculate trigonometry once per angle, then reuse it for the entire scene. */
export function createRotation(rotation: Rotation3D) {
  const cosYaw = Math.cos(rotation.yaw);
  const sinYaw = Math.sin(rotation.yaw);
  const cosPitch = Math.cos(rotation.pitch);
  const sinPitch = Math.sin(rotation.pitch);
  return (point: Point3D): Point3D => {
    const x = point.x * cosYaw + point.z * sinYaw;
    const z = -point.x * sinYaw + point.z * cosYaw;
    return {
      x,
      y: point.y * cosPitch - z * sinPitch,
      z: point.y * sinPitch + z * cosPitch,
    };
  };
}

/** Rotate geometry rather than the flat SVG, preserving changing faces and depth. */
export function rotatePoint(point: Point3D, rotation: Rotation3D): Point3D {
  return createRotation(rotation)(point);
}

export function createProjector(
  rotation: Rotation3D,
  center: { x: number; y: number },
  perspective?: number,
) {
  const rotate = createRotation(rotation);
  return (point: Point3D): ProjectedPoint => {
    const rotated = rotate(point);
    const scale = perspective ? perspective / (perspective - rotated.z) : 1;
    return {
      x: center.x + rotated.x * scale,
      y: center.y - rotated.y * scale,
      depth: rotated.z,
    };
  };
}

export function projectPoint(
  point: Point3D,
  rotation: Rotation3D,
  center: { x: number; y: number },
  perspective?: number,
): ProjectedPoint {
  return createProjector(rotation, center, perspective)(point);
}

export function spherePoint(latitude: number, longitude: number, radius = 150): Point3D {
  return {
    x: radius * Math.cos(latitude) * Math.cos(longitude),
    y: radius * Math.sin(latitude),
    z: radius * Math.cos(latitude) * Math.sin(longitude),
  };
}

export function polygonPoints(points: ProjectedPoint[]): string {
  return points.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}

export function polylinePath(points: ProjectedPoint[]): string {
  return points.map(({ x, y }, index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
}
