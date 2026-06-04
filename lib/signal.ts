export function normalizeSignal(angle: number, restAngle: number, maxAmplitude: number): number {
  if (maxAmplitude <= 0) return 0;
  const raw = ((angle - restAngle) / maxAmplitude) * 1000;
  return Math.max(-1000, Math.min(1000, Math.round(raw)));
}

export function getRestAngle(targetAngle: number): number {
  return Math.max(0, targetAngle * 0.3);
}

export function getMaxAmplitude(targetAngle: number): number {
  return Math.max(30, targetAngle - getRestAngle(targetAngle));
}

export function buildSignalPoint(
  angle: number,
  targetAngle: number,
  timestamp: number,
  key: 'shoulderLeft' | 'spine',
): { timestamp: number; shoulderLeft?: number; spine?: number } {
  const rest = getRestAngle(targetAngle);
  const max = getMaxAmplitude(targetAngle);
  const value = normalizeSignal(angle, rest, max);
  if (key === 'shoulderLeft') {
    return { timestamp, shoulderLeft: value };
  }
  return { timestamp, spine: value };
}
