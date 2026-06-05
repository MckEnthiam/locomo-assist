import os
import urllib.request

import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from mediapipe.tasks.python.vision import PoseLandmarksConnections, drawing_utils

from data.session_state import AngleData

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(PROJECT_ROOT, "resources", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "pose_landmarker_lite.task")
MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
    "pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
)

SKELETON_COLOR = (29, 158, 117)


def _ensure_model() -> str:
    if os.path.exists(MODEL_PATH):
        return MODEL_PATH
    os.makedirs(MODEL_DIR, exist_ok=True)
    urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
    return MODEL_PATH


class PoseDetector:
    def __init__(self):
        model_path = _ensure_model()
        options = vision.PoseLandmarkerOptions(
            base_options=python.BaseOptions(model_asset_path=model_path),
            running_mode=vision.RunningMode.VIDEO,
            num_poses=1,
            min_pose_detection_confidence=0.6,
            min_pose_presence_confidence=0.6,
            min_tracking_confidence=0.6,
        )
        self.landmarker = vision.PoseLandmarker.create_from_options(options)
        self._frame_timestamp_ms = 0
        self._landmark_spec = drawing_utils.DrawingSpec(
            color=SKELETON_COLOR, thickness=2, circle_radius=3
        )
        self._connection_spec = drawing_utils.DrawingSpec(color=SKELETON_COLOR, thickness=2)

    def process_frame(self, frame: np.ndarray) -> tuple[np.ndarray, AngleData | None]:
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = self.landmarker.detect_for_video(mp_image, self._frame_timestamp_ms)
        self._frame_timestamp_ms += 33

        if not result.pose_landmarks:
            return frame, None

        landmarks = result.pose_landmarks[0]
        drawing_utils.draw_landmarks(
            frame,
            landmarks,
            PoseLandmarksConnections.POSE_LANDMARKS,
            self._landmark_spec,
            self._connection_spec,
        )

        angles = self._compute_angles(landmarks)
        return frame, angles

    def _compute_angles(self, landmarks) -> AngleData:
        def angle(a, b, c) -> float:
            a = np.array([a.x, a.y])
            b = np.array([b.x, b.y])
            c = np.array([c.x, c.y])
            ba = a - b
            bc = c - b
            cosine = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
            return float(np.degrees(np.arccos(np.clip(cosine, -1.0, 1.0))))

        lm = landmarks
        return AngleData(
            shoulder_left=angle(lm[13], lm[11], lm[23]),
            shoulder_right=angle(lm[14], lm[12], lm[24]),
            elbow_left=angle(lm[11], lm[13], lm[15]),
            elbow_right=angle(lm[12], lm[14], lm[16]),
            spine=angle(lm[11], lm[23], lm[25]),
            hip=angle(lm[23], lm[25], lm[27]),
        )

    def release(self):
        self.landmarker.close()
