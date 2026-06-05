import os
import sys
import urllib.request

from dotenv import load_dotenv
from PyQt6.QtGui import QFont, QFontDatabase
from PyQt6.QtWidgets import QApplication

from ui.main_window import MainWindow
from ui.styles import STYLESHEET


def load_google_font():
    """Télécharge et charge IBM Plex Mono depuis Google Fonts si pas déjà présent."""
    font_path = os.path.join(os.path.dirname(__file__), "resources", "IBMPlexMono-Regular.ttf")
    font_path_medium = os.path.join(os.path.dirname(__file__), "resources", "IBMPlexMono-Medium.ttf")

    os.makedirs(os.path.dirname(font_path), exist_ok=True)

    if not os.path.exists(font_path):
        try:
            urllib.request.urlretrieve(
                "https://github.com/google/fonts/raw/main/ofl/ibmplexmono/IBMPlexMono-Regular.ttf",
                font_path,
            )
        except Exception:
            pass
    if not os.path.exists(font_path_medium):
        try:
            urllib.request.urlretrieve(
                "https://github.com/google/fonts/raw/main/ofl/ibmplexmono/IBMPlexMono-Medium.ttf",
                font_path_medium,
            )
        except Exception:
            pass

    if os.path.exists(font_path):
        QFontDatabase.addApplicationFont(font_path)
    if os.path.exists(font_path_medium):
        QFontDatabase.addApplicationFont(font_path_medium)


def main():
    load_dotenv()
    app = QApplication(sys.argv)
    load_google_font()
    app.setStyleSheet(STYLESHEET)
    app.setFont(QFont("IBM Plex Mono", 10))
    window = MainWindow()
    window.setWindowTitle("LocomoAssist")
    window.resize(1280, 800)
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
