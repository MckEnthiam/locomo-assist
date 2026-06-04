export function normalizeAngle(angle: number, restAngle: number, maxAmplitude: number): number {
  if (maxAmplitude <= 0) return 0;
  const normalized = ((angle - restAngle) / maxAmplitude) * 1000;
  return Math.max(-1000, Math.min(1000, Math.round(normalized)));
}

export function normalizeSignal(angle: number, restAngle: number, maxAmplitude: number): number {
  return normalizeAngle(angle, restAngle, maxAmplitude);
}

export function getRestAngle(targetAngle: number): number {
  return Math.max(0, targetAngle * 0.3);
}

export function getMaxAmplitude(targetAngle: number): number {
  return Math.max(30, targetAngle - getRestAngle(targetAngle));
}
