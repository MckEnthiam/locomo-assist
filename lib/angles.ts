export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export function angleBetween(A: Landmark, B: Landmark, C: Landmark): number {
  const radians =
    Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
  let degrees = Math.abs((radians * 180) / Math.PI);
  if (degrees > 180) degrees = 360 - degrees;
  return degrees;
}

export const ANGLE_MAP = {
  shoulderLeft: [11, 13, 15],
  shoulderRight: [12, 14, 16],
  elbowLeft: [13, 11, 23],
  spine: [11, 23, 25],
  hip: [23, 25, 27],
} as const;

export type AngleKey = keyof typeof ANGLE_MAP;

export function computeAnglesFromLandmarks(
  landmarks: Landmark[],
): Record<AngleKey, number> {
  const result = {} as Record<AngleKey, number>;
  (Object.keys(ANGLE_MAP) as AngleKey[]).forEach((key) => {
    const [a, b, c] = ANGLE_MAP[key];
    const A = landmarks[a];
    const B = landmarks[b];
    const C = landmarks[c];
    if (A && B && C && (A.visibility ?? 1) > 0.5 && (B.visibility ?? 1) > 0.5) {
      result[key] = Math.round(angleBetween(A, B, C));
    } else {
      result[key] = 0;
    }
  });
  return result;
}

export function isAngleInTarget(
  value: number,
  target: number | undefined,
  tolerance = 10,
): boolean {
  if (target === undefined || target === 0) return true;
  return Math.abs(value - target) <= tolerance;
}

export function hasAnglesOutOfTarget(
  angles: { shoulderLeft: number; shoulderRight: number; elbowLeft: number; spine: number; hip: number },
  targets: Record<string, number | undefined>,
  tolerance = 10,
): boolean {
  const keys = ['shoulderLeft', 'shoulderRight', 'elbowLeft', 'spine', 'hip'] as const;
  return keys.some((key) => {
    const target = targets[key];
    if (target === undefined) return false;
    return Math.abs(angles[key] - target) > tolerance;
  });
}
