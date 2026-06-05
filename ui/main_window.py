from datetime import datetime

from PyQt6.QtCore import Qt, QSize
from PyQt6.QtGui import QIcon
from PyQt6.QtWidgets import (
    QFrame,
    QHBoxLayout,
    QLabel,
    QMainWindow,
    QPushButton,
    QStackedWidget,
    QVBoxLayout,
    QWidget,
)

from data.exercises import EXERCISES
from data.session_state import AngleData, ExerciseResult, SessionState
from ui.dashboard import DashboardPage
from ui.planning import PlanningPage
from ui.rapports import RapportsPage
from ui.session_live import SessionLivePage
from ui.styles import get_logo_icon, get_nav_icon


class PlaceholderPage(QWidget):
    def __init__(self, title: str):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(12)

        title_label = QLabel(title)
        title_label.setStyleSheet(
            "font-size: 18px; font-weight: 600; color: #1A1A1A;"
        )
        description = QLabel(
            "Cette page est en construction. Retournez au tableau de bord ou lancez une session."
        )
        description.setWordWrap(True)
        description.setStyleSheet("font-size: 12px; color: #6B7280;")

        layout.addWidget(title_label)
        layout.addWidget(description)
        layout.addStretch()


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.session_state = SessionState()
        self._nav_buttons: dict[str, QPushButton] = {}
        self._breadcrumb_label: QLabel | None = None
        self._session_timer_label: QLabel | None = None
        self.stack = QStackedWidget()

        self.dashboard_page = DashboardPage(self)
        self.session_live_page = SessionLivePage(self)
        self.planning_page = PlanningPage(self)
        self.rapports_page = RapportsPage(self)
        self.progression_page = PlaceholderPage("Progression")
        self.medecin_page = PlaceholderPage("Médecin")
        self.parametres_page = PlaceholderPage("Paramètres")

        self._build_ui()
        self.switch_page("dashboard")

    def _build_ui(self) -> None:
        root_widget = QWidget()
        root_layout = QHBoxLayout(root_widget)
        root_layout.setContentsMargins(0, 0, 0, 0)
        root_layout.setSpacing(0)

        sidebar = self._build_sidebar()
        root_layout.addWidget(sidebar)

        content_widget = QWidget()
        content_layout = QVBoxLayout(content_widget)
        content_layout.setContentsMargins(0, 0, 0, 0)
        content_layout.setSpacing(0)

        topbar = QFrame()
        topbar.setObjectName("topbar")
        topbar_layout = QHBoxLayout(topbar)
        topbar_layout.setContentsMargins(16, 0, 16, 0)
        topbar_layout.setSpacing(8)

        self._breadcrumb_label = QLabel("Tableau de bord")
        self._breadcrumb_label.setObjectName("breadcrumb_current")
        topbar_layout.addWidget(self._breadcrumb_label)
        topbar_layout.addStretch()

        self._session_timer_label = QLabel("00:00")
        self._session_timer_label.setObjectName("session_timer")
        topbar_layout.addWidget(self._session_timer_label)

        content_layout.addWidget(topbar)

        self.stack.addWidget(self.dashboard_page)
        self.stack.addWidget(self.session_live_page)
        self.stack.addWidget(self.planning_page)
        self.stack.addWidget(self.progression_page)
        self.stack.addWidget(self.rapports_page)
        self.stack.addWidget(self.medecin_page)
        self.stack.addWidget(self.parametres_page)

        content_layout.addWidget(self.stack)
        root_layout.addWidget(content_widget, 1)

        self.setCentralWidget(root_widget)

    def _build_sidebar(self) -> QFrame:
        sidebar = QFrame()
        sidebar.setObjectName("sidebar")
        sidebar.setFixedWidth(172)
        layout = QVBoxLayout(sidebar)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        logo_container = QFrame()
        logo_container.setObjectName("logo_container")
        logo_container.setFixedHeight(46)
        logo_layout = QHBoxLayout(logo_container)
        logo_layout.setContentsMargins(14, 0, 14, 0)
        logo_layout.setSpacing(8)

        logo_mark = QLabel()
        logo_mark.setObjectName("logo_mark_box")
        logo_mark.setFixedSize(22, 22)
        logo_mark.setPixmap(get_logo_icon())
        logo_mark.setAlignment(Qt.AlignmentFlag.AlignCenter)

        logo_text = QLabel("LocomoAssist")
        logo_text.setObjectName("logo_text")

        logo_layout.addWidget(logo_mark)
        logo_layout.addWidget(logo_text)
        logo_layout.addStretch()
        layout.addWidget(logo_container)

        nav_area = QWidget()
        nav_area.setObjectName("nav_area")
        nav_layout = QVBoxLayout(nav_area)
        nav_layout.setContentsMargins(8, 8, 8, 8)
        nav_layout.setSpacing(2)

        nav_items = [
            ("dashboard",   "Tableau de bord", 0),
            ("session",     "Session live",    1),
            ("planning",    "Planning",        2),
            ("progression", "Progression",     3),
            ("rapports",    "Rapports",        4),
            ("medecin",     "Médecin",         5),
            ("parametres",  "Paramètres",      6),
        ]

        for key, label, page_idx in nav_items:
            btn = QPushButton(label)
            btn.setObjectName("nav_btn")
            btn.setCursor(Qt.CursorShape.PointingHandCursor)
            btn.setIcon(QIcon(get_nav_icon(key, active=False)))
            btn.setIconSize(QSize(16, 16))
            btn.setProperty("active", False)
            btn.setMinimumHeight(30)
            btn.clicked.connect(lambda checked, k=key: self.switch_page(k))

            self._nav_buttons[key] = btn
            nav_layout.addWidget(btn)

        nav_layout.addStretch()
        layout.addWidget(nav_area)

        return sidebar

    def switch_page(self, key: str) -> None:
        if key not in self._nav_buttons:
            return

        for k, btn in self._nav_buttons.items():
            is_active = k == key
            btn.setProperty("active", is_active)
            btn.setIcon(QIcon(get_nav_icon(k, active=is_active)))
            btn.style().unpolish(btn)
            btn.style().polish(btn)
            btn.update()

        self.stack.setCurrentIndex(self._page_index(key))
        self._update_breadcrumb(key)
        self._refresh_page(key)

    def _page_index(self, key: str) -> int:
        page_order = {
            "dashboard": 0,
            "session": 1,
            "planning": 2,
            "progression": 3,
            "rapports": 4,
            "medecin": 5,
            "parametres": 6,
        }
        return page_order.get(key, 0)

    def _update_breadcrumb(self, key: str) -> None:
        labels = {
            "dashboard":   "Tableau de bord",
            "session":     "Session live",
            "planning":    "Planning",
            "progression": "Progression",
            "rapports":    "Rapports",
            "medecin":     "Médecin",
            "parametres":  "Paramètres",
        }
        if self._breadcrumb_label is not None:
            self._breadcrumb_label.setText(labels.get(key, ""))

    def _refresh_page(self, key: str) -> None:
        page = self.stack.widget(self._page_index(key))
        if hasattr(page, "refresh"):
            page.refresh()

    def init_session(self, start_idx: int = 0) -> None:
        self.session_state.exercise_results = [
            ExerciseResult(
                exercise_id=exercise.id,
                exercise_name=exercise.name,
                status="pending",
            )
            for exercise in EXERCISES
        ]
        self.session_state.current_exercise_idx = start_idx
        self.session_state.current_angles = AngleData()
        self.session_state.signal_history = []
        self.session_state.coach_messages = []
        self.session_state.compensations = {"lumbar": 0, "shoulder": 0}
        self.session_state.session_timer = 0
        self.session_state.is_recording = True
        self.update_session_timer_display(0)
        self.switch_page("session")

    def update_session_timer_display(self, seconds: int) -> None:
        if self._session_timer_label is None:
            return
        minutes, secs = divmod(seconds, 60)
        self._session_timer_label.setText(f"{minutes:02d}:{secs:02d}")
