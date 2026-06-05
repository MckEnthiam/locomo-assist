from dataclasses import dataclass
from typing import Optional


@dataclass
class Exercise:
    id: str
    name: str
    body_part: str
    sets: int
    reps: int
    target_angles: dict
    ref_video_path: Optional[str]
    description: str


EXERCISES = [
    Exercise(
        id="elev-lat",
        name="Élévation latérale du bras",
        body_part="epaule",
        sets=3,
        reps=10,
        target_angles={"shoulder_left": 90, "shoulder_right": 90, "spine": 10},
        ref_video_path="resources/exercises/elevation-laterale.mp4",
        description="Levez le bras tendu sur le côté jusqu'à l'horizontale.",
    ),
    Exercise(
        id="abd-bras",
        name="Abduction du bras",
        body_part="epaule",
        sets=3,
        reps=10,
        target_angles={"shoulder_left": 120, "shoulder_right": 120, "spine": 10},
        ref_video_path="resources/exercises/abduction-bras.mp4",
        description="Levez le bras vers l'avant jusqu'à 120 degrés.",
    ),
    Exercise(
        id="flex-coude",
        name="Flexion du coude",
        body_part="coude",
        sets=3,
        reps=12,
        target_angles={"elbow_left": 45, "elbow_right": 45, "spine": 10},
        ref_video_path="resources/exercises/flexion-coude.mp4",
        description="Pliez le coude en ramenant la main vers l'épaule.",
    ),
]
