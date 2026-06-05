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
from data.session_state import ExerciseResult


class DashboardPage(QWidget):
    def __init__(self, main_window):
        super().__init__()
        self.main_window = main_window
        self._stat_values: list[QLabel] = []
        self._exercise_list_layout: QVBoxLayout | None = None
        self._setup_ui()
        self.refresh()

    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(20)

        stats_row = QHBoxLayout()
        stats_row.setSpacing(16)

        stat_defs = [
            ("Exercices complétés", "0"),
            ("Amplitude moyenne", "0"),
            ("Durée session", "00:00"),
            ("Score de forme", "0%"),
        ]
        for label_text, value_text in stat_defs:
            card = QFrame()
            card.setObjectName("card")
            card_layout = QVBoxLayout(card)
            card_layout.setContentsMargins(16, 14, 16, 14)

            value_lbl = QLabel(value_text)
            value_lbl.setObjectName("stat_value")
            label_lbl = QLabel(label_text)
            label_lbl.setObjectName("stat_label")

            card_layout.addWidget(value_lbl)
            card_layout.addWidget(label_lbl)
            stats_row.addWidget(card)
            self._stat_values.append(value_lbl)

        layout.addLayout(stats_row)

        exercises_card = QFrame()
        exercises_card.setObjectName("card")
        exercises_layout = QVBoxLayout(exercises_card)
        exercises_layout.setContentsMargins(16, 14, 16, 14)

        title = QLabel("Exercices du jour")
        title.setObjectName("panel_title")
        exercises_layout.addWidget(title)

        self._exercise_list_layout = QVBoxLayout()
        self._exercise_list_layout.setSpacing(8)
        exercises_layout.addLayout(self._exercise_list_layout)
        layout.addWidget(exercises_card)

        start_btn = QPushButton("Démarrer la session")
        start_btn.setObjectName("btn_primary")
        start_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        start_btn.clicked.connect(lambda: self.main_window.init_session(0))
        layout.addWidget(start_btn, alignment=Qt.AlignmentFlag.AlignLeft)
        layout.addStretch()

    def refresh(self):
        state = self.main_window.session_state

        completed = sum(1 for r in state.exercise_results if r.status == "done")
        self._stat_values[0].setText(str(completed))

        done_results = [r for r in state.exercise_results if r.status == "done"]
        if done_results:
            avg_amp = sum(r.avg_amplitude for r in done_results) / len(done_results)
            self._stat_values[1].setText(f"{avg_amp:.0f}")
        else:
            self._stat_values[1].setText("0")

        minutes, secs = divmod(state.session_timer, 60)
        self._stat_values[2].setText(f"{minutes:02d}:{secs:02d}")

        total_reps_done = sum(r.reps_completed for r in state.exercise_results)
        total_reps_target = sum(ex.reps for ex in EXERCISES)
        score = (total_reps_done / total_reps_target * 100) if total_reps_target else 0
        self._stat_values[3].setText(f"{score:.0f}%")

        while self._exercise_list_layout.count():
            item = self._exercise_list_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

        if state.exercise_results:
            results = state.exercise_results
        else:
            results = [
                ExerciseResult(
                    exercise_id=ex.id,
                    exercise_name=ex.name,
                    status="pending",
                )
                for ex in EXERCISES
            ]

        status_map = {
            "done": ("●", "status_green"),
            "active": ("●", "status_amber"),
            "pending": ("●", "status_gray"),
            "skipped": ("●", "status_gray"),
        }

        for result in results:
            row = QHBoxLayout()
            dot = QLabel(status_map.get(result.status, ("●", "status_gray"))[0])
            dot.setObjectName(status_map.get(result.status, ("●", "status_gray"))[1])
            name = QLabel(result.exercise_name)
            name.setStyleSheet("color: #1A1A1A; font-size: 12px;")
            status_lbl = QLabel(result.status.capitalize())
            status_lbl.setStyleSheet("color: #9CA3AF; font-size: 11px;")

            row_widget = QWidget()
            row_widget.setLayout(row)
            row.addWidget(dot)
            row.addWidget(name)
            row.addStretch()
            row.addWidget(status_lbl)
            self._exercise_list_layout.addWidget(row_widget)
