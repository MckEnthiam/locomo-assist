import os
from datetime import datetime

from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import (
    QFrame,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QVBoxLayout,
    QWidget,
)

from core.pdf_generator import generate_report


class RapportsPage(QWidget):
    def __init__(self, main_window):
        super().__init__()
        self.main_window = main_window
        self._generated_pdfs: list[str] = []
        self._pdf_list_layout: QVBoxLayout | None = None
        self._setup_ui()

    def _setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(16)

        title = QLabel("Rapports de session")
        title.setStyleSheet("font-size: 15px; font-weight: 600; color: #1A1A1A;")
        layout.addWidget(title)

        generate_btn = QPushButton("Générer le rapport de la session")
        generate_btn.setObjectName("btn_primary")
        generate_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        generate_btn.clicked.connect(self._generate_report)
        layout.addWidget(generate_btn, alignment=Qt.AlignmentFlag.AlignLeft)

        list_card = QFrame()
        list_card.setObjectName("card")
        list_layout = QVBoxLayout(list_card)
        list_layout.setContentsMargins(16, 14, 16, 14)

        list_title = QLabel("PDF générés cette session")
        list_title.setObjectName("panel_title")
        list_layout.addWidget(list_title)

        self._pdf_list_layout = QVBoxLayout()
        self._pdf_list_layout.setSpacing(6)
        list_layout.addLayout(self._pdf_list_layout)
        layout.addWidget(list_card)
        layout.addStretch()

    def _generate_report(self):
        reports_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "reports",
        )
        os.makedirs(reports_dir, exist_ok=True)
        filename = f"rapport_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        output_path = os.path.join(reports_dir, filename)

        generate_report(self.main_window.session_state, output_path)
        self._generated_pdfs.append(output_path)
        self.refresh()

        if os.name == "nt":
            os.startfile(output_path)

    def refresh(self):
        while self._pdf_list_layout.count():
            item = self._pdf_list_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

        if not self._generated_pdfs:
            empty = QLabel("Aucun rapport généré pour l'instant.")
            empty.setStyleSheet("color: #9CA3AF; font-size: 11px;")
            self._pdf_list_layout.addWidget(empty)
            return

        for path in reversed(self._generated_pdfs):
            row = QHBoxLayout()
            name = QLabel(os.path.basename(path))
            name.setStyleSheet("color: #1A1A1A; font-size: 12px;")
            open_btn = QPushButton("Ouvrir")
            open_btn.setObjectName("btn_secondary")
            open_btn.setCursor(Qt.CursorShape.PointingHandCursor)
            open_btn.clicked.connect(lambda checked, p=path: self._open_pdf(p))

            row_widget = QWidget()
            row_widget.setLayout(row)
            row.addWidget(name)
            row.addStretch()
            row.addWidget(open_btn)
            self._pdf_list_layout.addWidget(row_widget)

    def _open_pdf(self, path: str):
        if os.name == "nt" and os.path.exists(path):
            os.startfile(path)
