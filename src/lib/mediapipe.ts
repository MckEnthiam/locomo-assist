import { Pose, POSE_CONNECTIONS } from '@mediapipe/pose';
import type { Results } from '@mediapipe/pose';

export type PoseResultsCallback = (results: Results) => void;

let poseInstance: Pose | null = null;

export function createPose(onResults: PoseResultsCallback): Pose {
  if (!poseInstance) {
    poseInstance = new Pose({
      locateFile: (file) => `mediapipe/${file}`,
    });
    poseInstance.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });
  }
  poseInstance.onResults(onResults);
  return poseInstance;
}

export function getPoseInstance(): Pose {
  if (!poseInstance) {
    throw new Error('Pose non initialisé — appelez createPose d’abord');
  }
  return poseInstance;
}

export { POSE_CONNECTIONS, Results };
