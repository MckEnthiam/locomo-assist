'use client';

import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import type { Results } from '@mediapipe/pose';

export type PoseResultsCallback = (results: Results) => void;

let poseInstance: Pose | null = null;

export function getPoseInstance(): Pose {
  if (!poseInstance) {
    poseInstance = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });
    poseInstance.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });
  }
  return poseInstance;
}

export function initPose(onResults: PoseResultsCallback): Pose {
  const pose = getPoseInstance();
  pose.onResults(onResults);
  return pose;
}

export { POSE_CONNECTIONS };
export type { Results };
