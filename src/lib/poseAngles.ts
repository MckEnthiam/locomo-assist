/**
 * Locomo-assist — Angle calculation utilities from MediaPipe Pose landmarks
 *
 * MediaPipe Pose landmarks (33 points):
 *   0  = nose
 *   11 = left_shoulder,  12 = right_shoulder
 *   13 = left_elbow,     14 = right_elbow
 *   15 = left_wrist,     16 = right_wrist
 *   23 = left_hip,       24 = right_hip
 *   25 = left_knee,      26 = right_knee
 *   27 = left_ankle,     28 = right_ankle
 */

export interface Point3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface JointAngles {
  shoulderLeft: number;   // flexion avant épaule G
  shoulderRight: number;  // flexion avant épaule D
  elbowLeft: number;      // flexion coude G
  elbowRight: number;     // flexion coude D
  spine: number;           // inclinaison du tronc
  hip: number;             // flexion hanche
}

/** Calculate angle (in degrees) between three points: angle at point B */
function calculateAngle(a: Point3D, b: Point3D, c: Point3D): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * (180 / Math.PI));
  if (angle > 180) angle = 360 - angle;
  return Math.round(angle * 10) / 10;
}

/** Midpoint between two 3D points */
function midpoint(a: Point3D, b: Point3D): Point3D {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
  };
}

/**
 * Calculate all relevant joint angles from MediaPipe Pose landmarks.
 * Returns angles in degrees.
 */
export function computeJointAngles(landmarks: Point3D[]): JointAngles {
  const defaults: JointAngles = {
    shoulderLeft: 0,
    shoulderRight: 0,
    elbowLeft: 0,
    elbowRight: 0,
    spine: 0,
    hip: 0,
  };

  if (!landmarks || landmarks.length < 28) return defaults;

  try {
    const lShoulder = landmarks[11];
    const rShoulder = landmarks[12];
    const lElbow = landmarks[13];
    const rElbow = landmarks[14];
    const lWrist = landmarks[15];
    const rWrist = landmarks[16];
    const lHip = landmarks[23];
    const rHip = landmarks[24];
    const lKnee = landmarks[25];
    const rKnee = landmarks[26];

    // Shoulder flexion: angle between (hip, shoulder, elbow)
    const shoulderLeft = calculateAngle(lHip, lShoulder, lElbow);
    const shoulderRight = calculateAngle(rHip, rShoulder, rElbow);

    // Elbow flexion: angle between (shoulder, elbow, wrist)
    const elbowLeft = calculateAngle(lShoulder, lElbow, lWrist);
    const elbowRight = calculateAngle(rShoulder, rElbow, rWrist);

    // Spine inclination: angle between vertical and (hip_midpoint, shoulder_midpoint)
    const shoulderMid = midpoint(lShoulder, rShoulder);
    const hipMid = midpoint(lHip, rHip);
    const verticalRef: Point3D = { x: hipMid.x, y: hipMid.y - 1, z: hipMid.z };
    const spine = Math.abs(calculateAngle(verticalRef, hipMid, shoulderMid));

    // Hip flexion: angle between (shoulder_midpoint, hip, knee)
    const hip = calculateAngle(shoulderMid, hipMid, midpoint(lKnee, rKnee));

    return {
      shoulderLeft,
      shoulderRight,
      elbowLeft,
      elbowRight,
      spine,
      hip,
    };
  } catch {
    return defaults;
  }
}

/**
 * Detect compensations from current angles vs target angles.
 * Returns compensation counts for lumbar and shoulder.
 */
export function detectCompensations(
  current: JointAngles,
  targets: Partial<JointAngles>
): { lumbar: boolean; shoulder: boolean } {
  const lumbarThreshold = (targets.spine ?? 15) + 10;
  const lumbar = current.spine > lumbarThreshold;

  // Shoulder compensation: if one side is significantly different from the other
  const shoulderDiff = Math.abs(current.shoulderLeft - current.shoulderRight);
  const shoulder = shoulderDiff > 20;

  return { lumbar, shoulder };
}
