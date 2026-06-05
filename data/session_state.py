from dataclasses import dataclass, field
from typing import List
from datetime import datetime


@dataclass
class AngleData:
    shoulder_left: float = 0.0
    shoulder_right: float = 0.0
    elbow_left: float = 0.0
    elbow_right: float = 0.0
    spine: float = 0.0
    hip: float = 0.0


@dataclass
class CoachMessage:
    text: str
    msg_type: str
    timestamp: float = field(default_factory=lambda: datetime.now().timestamp())


@dataclass
class ExerciseResult:
    exercise_id: str
    exercise_name: str
    status: str
    sets_completed: int = 0
    reps_completed: int = 0
    avg_amplitude: float = 0.0
    peak_amplitude: float = 0.0
    compensations: dict = field(default_factory=dict)
    signal_samples: List[float] = field(default_factory=list)
    coach_messages: List[CoachMessage] = field(default_factory=list)


@dataclass
class SessionState:
    started_at: datetime = field(default_factory=datetime.now)
    current_exercise_idx: int = 0
    exercise_results: List[ExerciseResult] = field(default_factory=list)
    current_angles: AngleData = field(default_factory=AngleData)
    signal_history: List[dict] = field(default_factory=list)
    coach_messages: List[CoachMessage] = field(default_factory=list)
    compensations: dict = field(default_factory=lambda: {"lumbar": 0, "shoulder": 0})
    is_recording: bool = False
    session_timer: int = 0
