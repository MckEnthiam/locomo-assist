import os
import time

import cv2
import pyqtgraph as pg
from PyQt6.QtCore import Qt, QThread, QTimer, pyqtSignal
from PyQt6.QtGui import QColor, QFont, QImage, QPainter, QPixmap
from PyQt6.QtMultimedia import QMediaPlayer
from PyQt6.QtMultimediaWidgets import QVideoWidget
from PyQt6.QtWidgets import (
    QFrame,
    QHBoxLayout,
    QLabel,
    QProgressBar,
    QScrollArea,
    QVBoxLayout,
    QWidget,
)

from core.coach import CoachAI
from core.pose_detector import PoseDetector
from core.signal_processor import normalize_angle
from core.tts import TTSEngine
from data.exercises import EXERCISES, Exercise
from data.session_state import CoachMessage, SessionState


PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPINE_THRESHOLD = 15
DURATION_THRESHOLD = 2.0
GRAPH_WINDOW_SECONDS = 10.0
PIP_WIDTH = 130
PIP_HEIGHT = 90


class CoachWorker(QThread):
    message_ready = pyqtSignal(str, str)

    def __init__(self, coach, angles, exercise, compensations, history):
        super().__init__()
        self.coach = coach
        self.angles = angles
        self.exercise = exercise
        self.compensations = compensations
        self.history = history
        self._running = True

    def run(self):
        if not self._running:
            return
        msg = self.coach.get_message(
            self.angles,
            self.exercise,
            self.compensations,
            self.history,
        )
        if msg and self._running:
            self.message_ready.emit(msg.text, msg.msg_type)

    def stop(self):
        self._running = False
        self.wait(2000)


class ExerciseCircle(QWidget):
    def __init__(self, number: int, status: str, parent=None):
        super().__init__(parent)
        self.number = number
        self.status = status
        self.setFixedSize(28, 28)

    def set_status(self, status: str):
        self.status = status
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        if self.status == "done":
            painter.setBrush(QColor("#1D9E75"))
            painter.setPen(QColor("#1D9E75"))
            painter.drawEllipse(2, 2, 24, 24)
            painter.setPen(QColor("#FFFFFF"))
            font = QFont("Segoe UI", 10, QFont.Weight.Bold)
            painter.setFont(font)
            painter.drawText(self.rect(), Qt.AlignmentFlag.AlignCenter, "✓")
        elif self.status == "active":
            painter.setBrush(QColor("#085041"))
            painter.setPen(QColor("#085041"))
            painter.drawEllipse(2, 2, 24, 24)
            painter.setPen(QColor("#FFFFFF"))
            font = QFont("Segoe UI", 10, QFont.Weight.Bold)
            painter.setFont(font)
            painter.drawText(self.rect(), Qt.AlignmentFlag.AlignCenter, str(self.number))
        else:
            painter.setBrush(QColor("#E5E7EB"))
            painter.setPen(QColor("#E5E7EB"))
            painter.drawEllipse(2, 2, 24, 24)
            painter.setPen(QColor("#9CA3AF"))
            font = QFont("Segoe UI", 10)
            painter.setFont(font)
            painter.drawText(self.rect(), Qt.AlignmentFlag.AlignCenter, str(self.number))


class GraphAreaWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px;")

        self.plot_widget = pg.PlotWidget()
        self.plot_widget.setBackground("#FFFFFF")
        self.plot_widget.setYRange(-1000, 1000, padding=0)
        self.plot_widget.getAxis("left").setTickFont(QFont("Segoe UI", 8))
        self.plot_widget.getAxis("bottom").setTickFont(QFont("Segoe UI", 8))
        self.plot_widget.showGrid(x=False, y=True, alpha=0.3)
        self.plot_widget.setMenuEnabled(False)

        self.curve_shoulder = self.plot_widget.plot(pen=pg.mkPen("#1D9E75", width=2))
        self.curve_spine = self.plot_widget.plot(pen=pg.mkPen("#EF9F27", width=2))
        self.plot_widget.addLine(y=0, pen=pg.mkPen("#E5E7EB", width=1))

        self.pip_label = QLabel(self)
        self.pip_label.setObjectName("pip_camera")
        self.pip_label.setFixedSize(PIP_WIDTH, PIP_HEIGHT)
        self.pip_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.pip_label.setText("Caméra…")
        self.pip_label.setScaledContents(True)

        self.alert_label = QLabel(self)
        self.alert_label.setObjectName("floating_alert")
        self.alert_label.hide()

        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.addWidget(self.plot_widget)

    def resizeEvent(self, event):
        super().resizeEvent(event)
        margin = 8
        self.pip_label.move(margin, self.height() - PIP_HEIGHT - margin)
        self.alert_label.adjustSize()
        self.alert_label.move(
            self.width() - self.alert_label.width() - margin,
            margin,
        )

    def show_alert(self, text: str, duration_ms: int = 3000):
        self.alert_label.setText(text)
        self.alert_label.adjustSize()
        self.alert_label.move(
            self.width() - self.alert_label.width() - 8,
            8,
        )
        self.alert_label.show()
        QTimer.singleShot(duration_ms, self.alert_label.hide)


class SessionLivePage(QWidget):
    def __init__(self, main_window):
        super().__init__()
        self.main_window = main_window
        self.pose_detector: PoseDetector | None = None
        self.coach = CoachAI()
        self.tts = TTSEngine()
        self.cap: cv2.VideoCapture | None = None
        self._coach_worker: CoachWorker | None = None
        self._compensation_counter = 0.0
        self._session_start_time = time.time()
        self._angle_bars: dict[str, QProgressBar] = {}
        self._angle_values: dict[str, QLabel] = {}
        self._exercise_cells: list[tuple[ExerciseCircle, QLabel]] = []
        self._coach_messages_layout: QVBoxLayout | None = None
        self._ref_player: QMediaPlayer | None = None
        self._ref_video_widget: QVideoWidget | None = None
        self._ref_placeholder: QLabel | None = None
        self._camera_available = False

        self._frame_timer = QTimer(self)
        self._frame_timer.setInterval(30)
        self._frame_timer.timeout.connect(self.update_frame)

        self._session_timer = QTimer(self)
        self._session_timer.setInterval(1000)
        self._session_timer.timeout.connect(self._tick_session_timer)

        self._coach_poll_timer = QTimer(self)
        self._coach_poll_timer.setInterval(2000)
        self._coach_poll_timer.timeout.connect(self._request_coach_message)

        self._setup_ui()

    @property
    def session_state(self) -> SessionState:
        return self.main_window.session_state

    def _current_exercise(self) -> Exercise:
        idx = self.session_state.current_exercise_idx
        return EXERCISES[idx]

    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(12)

        main_row = QHBoxLayout()
        main_row.setSpacing(12)

        self.ref_frame = QFrame()
        self.ref_frame.setFixedWidth(200)
        self.ref_frame.setStyleSheet(
            "background-color: #F4F6F5; border: 1px solid #E5E7EB; border-radius: 8px;"
        )
        ref_layout = QVBoxLayout(self.ref_frame)
        ref_layout.setContentsMargins(0, 0, 0, 0)

        self._ref_video_widget = QVideoWidget()
        self._ref_video_widget.setStyleSheet("background-color: #F4F6F5;")
        self._ref_placeholder = QLabel()
        self._ref_placeholder.setObjectName("ref_video_placeholder")
        self._ref_placeholder.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self._ref_placeholder.setWordWrap(True)
        ref_layout.addWidget(self._ref_video_widget)
        ref_layout.addWidget(self._ref_placeholder)
        self._ref_placeholder.hide()

        self._ref_player = QMediaPlayer()
        self._ref_player.setLoops(QMediaPlayer.Loops.Infinite)
        self._ref_player.setVideoOutput(self._ref_video_widget)

        main_row.addWidget(self.ref_frame)

        self.graph_area = GraphAreaWidget()
        main_row.addWidget(self.graph_area, 1)

        right_panel = QVBoxLayout()
        right_panel.setSpacing(12)

        angles_card = QFrame()
        angles_card.setObjectName("card")
        angles_layout = QVBoxLayout(angles_card)
        angles_layout.setContentsMargins(12, 10, 12, 10)
        angles_title = QLabel("Angles articulaires")
        angles_title.setObjectName("panel_title")
        angles_layout.addWidget(angles_title)

        angle_defs = [
            ("shoulder_left", "Épaule G.", 180),
            ("shoulder_right", "Épaule D.", 180),
            ("elbow_left", "Coude G.", 180),
            ("spine", "Colonne", 45),
            ("hip", "Hanche", 180),
        ]
        for key, label, max_val in angle_defs:
            row = QVBoxLayout()
            row.setSpacing(2)
            header = QHBoxLayout()
            name_lbl = QLabel(label)
            name_lbl.setStyleSheet("font-size: 11px; color: #6B7280;")
            value_lbl = QLabel("0°")
            value_lbl.setStyleSheet("font-size: 11px; color: #1A1A1A;")
            header.addWidget(name_lbl)
            header.addStretch()
            header.addWidget(value_lbl)
            row.addLayout(header)

            bar = QProgressBar()
            bar.setObjectName("angle_bar")
            bar.setRange(0, max_val)
            bar.setValue(0)
            bar.setFixedHeight(2)
            row.addWidget(bar)

            angles_layout.addLayout(row)
            self._angle_bars[key] = bar
            self._angle_values[key] = value_lbl

        right_panel.addWidget(angles_card)

        coach_card = QFrame()
        coach_card.setObjectName("card")
        coach_card_layout = QVBoxLayout(coach_card)
        coach_card_layout.setContentsMargins(12, 10, 12, 10)
        coach_title = QLabel("Coach IA")
        coach_title.setObjectName("panel_title")
        coach_card_layout.addWidget(coach_title)

        coach_scroll = QScrollArea()
        coach_scroll.setObjectName("coach_scroll")
        coach_scroll.setWidgetResizable(True)
        coach_scroll.setFixedHeight(120)
        coach_content = QWidget()
        self._coach_messages_layout = QVBoxLayout(coach_content)
        self._coach_messages_layout.setAlignment(Qt.AlignmentFlag.AlignTop)
        self._coach_messages_layout.setSpacing(6)
        coach_scroll.setWidget(coach_content)
        coach_card_layout.addWidget(coach_scroll)
        right_panel.addWidget(coach_card)

        hist_card = QFrame()
        hist_card.setObjectName("card")
        hist_layout = QVBoxLayout(hist_card)
        hist_layout.setContentsMargins(12, 10, 12, 10)
        hist_title = QLabel("Historique signal")
        hist_title.setObjectName("panel_title")
        hist_layout.addWidget(hist_title)
        self.hist_label = QLabel("0 échantillons")
        self.hist_label.setStyleSheet("font-size: 11px; color: #9CA3AF;")
        hist_layout.addWidget(self.hist_label)
        comp_label = QLabel("Compensations")
        comp_label.setObjectName("panel_title")
        hist_layout.addWidget(comp_label)
        self.comp_hist_label = QLabel("Lombaire: 0 · Épaule: 0")
        self.comp_hist_label.setStyleSheet("font-size: 11px; color: #6B7280;")
        hist_layout.addWidget(self.comp_hist_label)
        right_panel.addWidget(hist_card)

        right_widget = QWidget()
        right_widget.setFixedWidth(220)
        right_widget.setLayout(right_panel)
        main_row.addWidget(right_widget)

        layout.addLayout(main_row, 1)

        exercise_bar = QFrame()
        exercise_bar.setObjectName("card")
        bar_layout = QHBoxLayout(exercise_bar)
        bar_layout.setContentsMargins(16, 12, 16, 12)
        bar_layout.setSpacing(0)

        for i, exercise in enumerate(EXERCISES):
            if i > 0:
                sep = QFrame()
                sep.setObjectName("exercise_separator")
                sep.setFixedWidth(1)
                bar_layout.addWidget(sep)

            cell = QHBoxLayout()
            cell.setSpacing(8)
            circle = ExerciseCircle(i + 1, "pending")
            name_lbl = QLabel(exercise.name)
            name_lbl.setStyleSheet("font-size: 11px; color: #6B7280;")
            cell_widget = QWidget()
            cell_widget.setLayout(cell)
            cell.addWidget(circle)
            cell.addWidget(name_lbl)
            cell.addStretch()
            bar_layout.addWidget(cell_widget, 1)
            self._exercise_cells.append((circle, name_lbl))

        layout.addWidget(exercise_bar)

    def reset_session(self):
        self._session_start_time = time.time()
        self._compensation_counter = 0.0
        self._update_exercise_bar()
        self._load_ref_video()
        self._update_angle_panel(self.session_state.current_angles, self._current_exercise())

    def on_page_enter(self):
        if not self.session_state.exercise_results:
            self.main_window.init_session(0)
            return

        self._session_start_time = time.time()
        self._start_camera()
        self._load_ref_video()
        self._update_exercise_bar()
        self._frame_timer.start()
        self._session_timer.start()
        self._coach_poll_timer.start()

    def on_page_leave(self):
        self._frame_timer.stop()
        self._session_timer.stop()
        self._coach_poll_timer.stop()
        self._stop_coach_worker()
        self._stop_camera()
        if self._ref_player:
            self._ref_player.stop()

    def _start_camera(self):
        self._stop_camera()
        try:
            self.pose_detector = PoseDetector()
            self.cap = cv2.VideoCapture(0)
            self._camera_available = self.cap.isOpened()
        except Exception:
            self._camera_available = False
            self.cap = None

        if not self._camera_available:
            self.graph_area.pip_label.setText("Caméra non disponible")
            self.graph_area.pip_label.setPixmap(QPixmap())

    def _stop_camera(self):
        if self.cap is not None:
            self.cap.release()
            self.cap = None
        if self.pose_detector is not None:
            self.pose_detector.release()
            self.pose_detector = None

    def _stop_coach_worker(self):
        if self._coach_worker is not None:
            self._coach_worker.stop()
            self._coach_worker = None

    def _load_ref_video(self):
        exercise = self._current_exercise()
        video_path = os.path.join(PROJECT_ROOT, exercise.ref_video_path or "")

        if os.path.exists(video_path):
            self._ref_placeholder.hide()
            self._ref_video_widget.show()
            from PyQt6.QtCore import QUrl

            self._ref_player.setSource(QUrl.fromLocalFile(video_path))
            self._ref_player.play()
        else:
            self._ref_player.stop()
            self._ref_video_widget.hide()
            self._ref_placeholder.show()
            self._ref_placeholder.setText(f"▶\n{exercise.name}")

    def _tick_session_timer(self):
        if self.session_state.is_recording:
            self.session_state.session_timer += 1
            self.main_window.update_session_timer_display(self.session_state.session_timer)

    def _update_exercise_bar(self):
        for i, (circle, name_lbl) in enumerate(self._exercise_cells):
            if i < len(self.session_state.exercise_results):
                status = self.session_state.exercise_results[i].status
            else:
                status = "pending"
            circle.set_status(status)
            if status == "active":
                name_lbl.setStyleSheet("font-size: 11px; color: #085041; font-weight: 500;")
            elif status == "done":
                name_lbl.setStyleSheet("font-size: 11px; color: #1D9E75;")
            else:
                name_lbl.setStyleSheet("font-size: 11px; color: #6B7280;")

    def _request_coach_message(self):
        if self._coach_worker is not None and self._coach_worker.isRunning():
            return

        exercise = self._current_exercise()
        if not self.coach.should_call():
            return

        self._coach_worker = CoachWorker(
            self.coach,
            self.session_state.current_angles,
            exercise,
            dict(self.session_state.compensations),
            list(self.session_state.coach_messages),
        )
        self._coach_worker.message_ready.connect(self._on_coach_message)
        self._coach_worker.finished.connect(self._on_coach_worker_finished)
        self._coach_worker.start()

    def _on_coach_worker_finished(self):
        self._coach_worker = None

    def _on_coach_message(self, text: str, msg_type: str):
        msg = CoachMessage(text=text, msg_type=msg_type)
        self.session_state.coach_messages.append(msg)

        idx = self.session_state.current_exercise_idx
        if idx < len(self.session_state.exercise_results):
            self.session_state.exercise_results[idx].coach_messages.append(msg)

        object_name = "coach_info"
        if msg_type == "warn":
            object_name = "coach_warn"
        elif msg_type == "success":
            object_name = "coach_success"

        lbl = QLabel(text)
        lbl.setObjectName(object_name)
        lbl.setWordWrap(True)
        self._coach_messages_layout.addWidget(lbl)

        while self._coach_messages_layout.count() > 5:
            item = self._coach_messages_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

        self.tts.speak(text)

    def _update_angle_panel(self, angles, exercise: Exercise):
        targets = exercise.target_angles
        values = {
            "shoulder_left": angles.shoulder_left,
            "shoulder_right": angles.shoulder_right,
            "elbow_left": angles.elbow_left,
            "spine": angles.spine,
            "hip": angles.hip,
        }
        max_vals = {
            "shoulder_left": 180,
            "shoulder_right": 180,
            "elbow_left": 180,
            "spine": 45,
            "hip": 180,
        }

        for key, value in values.items():
            self._angle_values[key].setText(f"{value:.0f}°")
            bar = self._angle_bars[key]
            bar.setValue(int(min(value, max_vals[key])))

            target = targets.get(key)
            if target is not None and abs(value - target) <= 15:
                bar.setObjectName("angle_bar")
            else:
                bar.setObjectName("angle_bar_warn")
            bar.style().unpolish(bar)
            bar.style().polish(bar)

    def _show_alert(self, text: str):
        self.graph_area.show_alert(text)

    def update_frame(self):
        exercise = self._current_exercise()
        now = time.time()
        elapsed = now - self._session_start_time

        if self._camera_available and self.cap is not None and self.pose_detector is not None:
            ret, frame = self.cap.read()
            if ret:
                frame = cv2.flip(frame, 1)
                frame, angles = self.pose_detector.process_frame(frame)

                if angles is not None:
                    self.session_state.current_angles = angles
                    self._process_angles(angles, exercise, elapsed)
                    self._update_angle_panel(angles, exercise)

                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                h, w, ch = rgb.shape
                qimg = QImage(rgb.data, w, h, ch * w, QImage.Format.Format_RGB888)
                pixmap = QPixmap.fromImage(qimg).scaled(
                    PIP_WIDTH,
                    PIP_HEIGHT,
                    Qt.AspectRatioMode.KeepAspectRatio,
                    Qt.TransformationMode.SmoothTransformation,
                )
                self.graph_area.pip_label.setPixmap(pixmap)
            else:
                self.graph_area.pip_label.setText("Caméra non disponible")

        self._update_graph(elapsed)
        self.hist_label.setText(f"{len(self.session_state.signal_history)} échantillons")
        self.comp_hist_label.setText(
            f"Lombaire: {self.session_state.compensations.get('lumbar', 0)} · "
            f"Épaule: {self.session_state.compensations.get('shoulder', 0)}"
        )

    def _process_angles(self, angles, exercise: Exercise, elapsed: float):
        target_spine = exercise.target_angles.get("spine", 10)
        shoulder_target = exercise.target_angles.get(
            "shoulder_left", exercise.target_angles.get("shoulder_right", 90)
        )
        rest_shoulder = 20.0
        rest_spine = target_spine

        shoulder_signal = normalize_angle(
            max(angles.shoulder_left, angles.shoulder_right),
            rest_shoulder,
            shoulder_target - rest_shoulder,
        )
        spine_signal = normalize_angle(angles.spine, rest_spine, 30.0)

        self.session_state.signal_history.append(
            {
                "t": elapsed,
                "shoulder": shoulder_signal,
                "spine": spine_signal,
            }
        )

        idx = self.session_state.current_exercise_idx
        if idx < len(self.session_state.exercise_results):
            result = self.session_state.exercise_results[idx]
            result.signal_samples.append(shoulder_signal)
            if result.signal_samples:
                result.avg_amplitude = sum(result.signal_samples) / len(result.signal_samples)
                result.peak_amplitude = max(
                    result.peak_amplitude,
                    max(abs(s) for s in result.signal_samples),
                )

        if angles.spine > target_spine + SPINE_THRESHOLD:
            self._compensation_counter += 1 / 30
            if self._compensation_counter >= DURATION_THRESHOLD:
                self.session_state.compensations["lumbar"] += 1
                if idx < len(self.session_state.exercise_results):
                    result = self.session_state.exercise_results[idx]
                    result.compensations["lumbar"] = self.session_state.compensations["lumbar"]
                self._show_alert("Compensation lombaire détectée")
                self._compensation_counter = 0
        else:
            self._compensation_counter = max(0, self._compensation_counter - 1 / 30)

    def _update_graph(self, elapsed: float):
        history = self.session_state.signal_history
        window_start = max(0, elapsed - GRAPH_WINDOW_SECONDS)
        filtered = [s for s in history if s["t"] >= window_start]

        if not filtered:
            return

        x_data = [s["t"] - window_start for s in filtered]
        y_shoulder = [s["shoulder"] for s in filtered]
        y_spine = [s["spine"] for s in filtered]

        self.graph_area.curve_shoulder.setData(x_data, y_shoulder)
        self.graph_area.curve_spine.setData(x_data, y_spine)
        self.graph_area.plot_widget.setXRange(0, GRAPH_WINDOW_SECONDS, padding=0)
