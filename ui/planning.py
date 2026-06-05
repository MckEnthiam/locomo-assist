from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import (
    QFrame,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QVBoxLayout,
    QWidget,
)

from data.exercises import EXERCISES


class PlanningPage(QWidget):
    def __init__(self, main_window):
        super().__init__()
        self.main_window = main_window
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(16)

        title = QLabel("Planning des exercices")
        title.setStyleSheet("font-size: 15px; font-weight: 600; color: #1A1A1A;")
        layout.addWidget(title)

        for idx, exercise in enumerate(EXERCISES):
            card = QFrame()
            card.setObjectName("card")
            card_layout = QHBoxLayout(card)
            card_layout.setContentsMargins(16, 14, 16, 14)

            info_layout = QVBoxLayout()
            name = QLabel(exercise.name)
            name.setStyleSheet("font-size: 13px; font-weight: 500; color: #1A1A1A;")
            meta = QLabel(
                f"{exercise.body_part.capitalize()} · {exercise.sets} séries × {exercise.reps} reps"
            )
            meta.setStyleSheet("font-size: 11px; color: #6B7280;")
            desc = QLabel(exercise.description)
            desc.setStyleSheet("font-size: 11px; color: #9CA3AF;")
            desc.setWordWrap(True)

            info_layout.addWidget(name)
            info_layout.addWidget(meta)
            info_layout.addWidget(desc)
            card_layout.addLayout(info_layout, 1)

            start_btn = QPushButton("Démarrer")
            start_btn.setObjectName("btn_primary")
            start_btn.setCursor(Qt.CursorShape.PointingHandCursor)
            start_btn.clicked.connect(lambda checked, i=idx: self.main_window.init_session(i))
            card_layout.addWidget(start_btn, alignment=Qt.AlignmentFlag.AlignTop)

            layout.addWidget(card)

        layout.addStretch()
