COLORS = {
    "primary":        "#1D9E75",
    "primary_light":  "#E1F5EE",
    "primary_dark":   "#085041",
    "warn":           "#EF9F27",
    "warn_light":     "#FAEEDA",
    "danger":         "#E24B4A",
    "surface":        "#FFFFFF",
    "bg":             "#F0F4F2",
    "border":         "#E5E7EB",
    "text_primary":   "#1A1A1A",
    "text_secondary": "#6B7280",
    "text_tertiary":  "#9CA3AF",
}

NAV_ICONS = {
    "dashboard":   """<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"COLOR\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"/><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1\"/></svg>""",
    "session":     """<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"COLOR\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.899L15 14\"/><rect x=\"3\" y=\"6\" width=\"12\" height=\"12\" rx=\"2\"/></svg>""",
    "planning":    """<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"COLOR\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\"/><path d=\"M16 2v4M8 2v4M3 10h18\"/></svg>""",
    "progression": """<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"COLOR\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"22 7 13.5 15.5 8.5 10.5 2 17\"/><polyline points=\"16 7 22 7 22 13\"/></svg>""",
    "rapports":    """<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"COLOR\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z\"/><polyline points=\"14 2 14 8 20 8\"/><line x1=\"9\" y1=\"13\" x2=\"15\" y2=\"13\"/><line x1=\"9\" y1=\"17\" x2=\"13\" y2=\"17\"/></svg>""",
    "medecin":     """<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"COLOR\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M22 12h-4l-3 9L9 3l-3 9H2\"/></svg>""",
    "parametres":  """<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"COLOR\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z\"/></svg>""",
    "logo_mark":   """<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"13\" height=\"13\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#FFFFFF\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M22 12h-4l-3 9L9 3l-3 9H2\"/></svg>""",
}


def svg_to_pixmap(svg_str: str, size: int = 16):
    from PyQt6.QtSvg import QSvgRenderer
    from PyQt6.QtGui import QPixmap, QPainter
    from PyQt6.QtCore import QByteArray, Qt
    renderer = QSvgRenderer(QByteArray(svg_str.encode()))
    pixmap = QPixmap(size, size)
    pixmap.fill(Qt.GlobalColor.transparent)
    painter = QPainter(pixmap)
    renderer.render(painter)
    painter.end()
    return pixmap


def get_nav_icon(name: str, active: bool = False) -> "QPixmap":
    color = "#085041" if active else "#6B7280"
    svg = NAV_ICONS[name].replace("COLOR", color)
    return svg_to_pixmap(svg, 16)


def get_logo_icon() -> "QPixmap":
    return svg_to_pixmap(NAV_ICONS["logo_mark"], 13)

STYLESHEET = """
QMainWindow, QWidget {
    background-color: #F0F4F2;
    font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif;
    font-size: 12px;
    color: #1A1A1A;
}
#sidebar {
    background-color: #FFFFFF;
    border-right: 0.5px solid #E5E7EB;
    min-width: 172px;
    max-width: 172px;
}
#logo_container {
    background-color: #FFFFFF;
    border-bottom: 0.5px solid #E5E7EB;
    min-height: 46px;
    max-height: 46px;
    padding: 0 14px;
}
#logo_mark_box {
    background-color: #1D9E75;
    border-radius: 5px;
    min-width: 22px;
    max-width: 22px;
    min-height: 22px;
    max-height: 22px;
}
#logo_text {
    font-size: 13px;
    font-weight: 600;
    color: #1A1A1A;
    padding-left: 8px;
    font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif;
}
#nav_area {
    background-color: #FFFFFF;
    padding: 8px 0;
}
QPushButton#nav_btn {
    background: transparent;
    border: none;
    text-align: left;
    padding: 0px 8px 0px 8px;
    border-radius: 6px;
    color: #6B7280;
    font-size: 11px;
    min-height: 30px;
    max-height: 30px;
    font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif;
}
QPushButton#nav_btn:hover {
    background-color: #F0F4F2;
    color: #1A1A1A;
}
QPushButton#nav_btn[active="true"] {
    background-color: #E1F5EE;
    color: #085041;
    font-weight: 500;
}
#topbar {
    background-color: #FFFFFF;
    border-bottom: 0.5px solid #E5E7EB;
    min-height: 42px;
    max-height: 42px;
}
#breadcrumb {
    font-size: 11px;
    color: #9CA3AF;
    padding-left: 16px;
    font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif;
}
#breadcrumb_current {
    font-size: 11px;
    font-weight: 500;
    color: #1A1A1A;
    font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif;
}
#session_timer {
    font-size: 11px;
    color: #6B7280;
    padding-right: 16px;
    font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif;
}
QFrame#card {
    background-color: #FFFFFF;
    border: 0.5px solid #E5E7EB;
    border-radius: 8px;
}
#stat_value {
    font-size: 20px;
    font-weight: 500;
    color: #1A1A1A;
    font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif;
}
#stat_label {
    font-size: 10px;
    color: #9CA3AF;
    font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif;
}
#panel_title {
    font-size: 10px;
    color: #9CA3AF;
    letter-spacing: 0.04em;
    padding-bottom: 6px;
    font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif;
}
#angle_name {
    font-size: 11px;
    color: #6B7280;
    min-width: 52px;
    max-width: 52px;
    font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif;
}
#angle_value {
    font-size: 11px;
    font-weight: 500;
    color: #1A1A1A;
    min-width: 28px;
    text-align: right;
    font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif;
}
#angle_value_warn {
    font-size: 11px;
    font-weight: 500;
    color: #EF9F27;
    min-width: 28px;
    text-align: right;
    font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif;
}
QProgressBar#angle_bar {
    border: none;
    border-radius: 1px;
    background-color: #F0F4F2;
    max-height: 2px;
    min-height: 2px;
}
QProgressBar#angle_bar::chunk { border-radius: 1px; background-color: #1D9E75; }
QProgressBar#angle_bar_warn { border: none; border-radius: 1px; background-color: #F0F4F2; max-height: 2px; min-height: 2px; }
QProgressBar#angle_bar_warn::chunk { border-radius: 1px; background-color: #EF9F27; }
QScrollArea#coach_scroll { border: none; background: transparent; }
QWidget#coach_scroll_content { background: transparent; }
#coach_info {
    border-left: 2px solid #1D9E75;
    padding: 2px 0px 2px 7px;
    color: #1A1A1A;
    font-size: 11px;
    background: transparent;
    font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif;
}
#coach_warn {
    border-left: 2px solid #EF9F27;
    padding: 2px 0px 2px 7px;
    color: #1A1A1A;
    font-size: 11px;
    background: transparent;
    font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif;
}
#coach_success {
    border-left: 2px solid #1D9E75;
    padding: 2px 0px 2px 7px;
    color: #1A1A1A;
    font-size: 11px;
    background: transparent;
    font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif;
}
#coach_icon {
    background-color: #1D9E75;
    border-radius: 9px;
    min-width: 18px; max-width: 18px;
    min-height: 18px; max-height: 18px;
}
#hist_label { font-size: 10px; color: #6B7280; font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif; }
#hist_value { font-size: 10px; color: #9CA3AF; font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif; }
#hist_dot_green  { background-color: #1D9E75; border-radius: 1px; min-width: 6px; max-width: 6px; min-height: 6px; max-height: 6px; }
#hist_dot_amber  { background-color: #EF9F27; border-radius: 1px; min-width: 6px; max-width: 6px; min-height: 6px; max-height: 6px; }
#hist_dot_gray   { background-color: #E5E7EB; border-radius: 1px; min-width: 6px; max-width: 6px; min-height: 6px; max-height: 6px; }
#exercise_bar { background-color: #FFFFFF; border-top: 0.5px solid #E5E7EB; min-height: 42px; max-height: 42px; }
#ex_label        { font-size: 11px; color: #6B7280; font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif; }
#ex_label_active { font-size: 11px; font-weight: 500; color: #1A1A1A; font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif; }
#ex_num_done   { background-color: #E1F5EE; color: #085041; border-radius: 9px; min-width: 17px; max-width: 17px; min-height: 17px; max-height: 17px; font-size: 9px; }
#ex_num_active { background-color: #1D9E75; color: #FFFFFF; border-radius: 9px; min-width: 17px; max-width: 17px; min-height: 17px; max-height: 17px; font-size: 10px; }
#ex_num_idle   { background-color: #F0F4F2; color: #9CA3AF; border-radius: 9px; min-width: 17px; max-width: 17px; min-height: 17px; max-height: 17px; font-size: 10px; }
#exercise_separator { background-color: #E5E7EB; max-width: 1px; min-width: 1px; }
#pip_camera { background-color: #F0F4F2; border: 0.5px solid #E5E7EB; border-radius: 5px; }
#ref_video_container { background-color: #F0F4F2; border-right: 0.5px solid #E5E7EB; min-width: 140px; max-width: 140px; }
#ref_video_placeholder { background-color: #F0F4F2; color: #9CA3AF; font-size: 10px; }
#ref_badge { font-size: 9px; color: #0F6E56; border-left: 2px solid #1D9E75; padding-left: 5px; }
#floating_alert { background-color: #FAEEDA; border: 0.5px solid #EF9F27; border-radius: 4px; padding: 3px 8px; color: #854F0B; font-size: 10px; }
QPushButton#btn_primary { background-color: #1D9E75; color: white; border: none; border-radius: 6px; padding: 6px 14px; font-size: 12px; font-weight: 500; font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif; }
QPushButton#btn_primary:hover { background-color: #178a64; }
QPushButton#btn_secondary { background-color: transparent; color: #6B7280; border: 0.5px solid #E5E7EB; border-radius: 6px; padding: 5px 12px; font-size: 11px; font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif; }
QPushButton#btn_secondary:hover { background-color: #F0F4F2; }
QFrame#h_separator { background-color: #E5E7EB; max-height: 1px; min-height: 1px; }
QSlider::groove:horizontal { height: 3px; background: #E5E7EB; border-radius: 1px; }
QSlider::handle:horizontal { background: #1D9E75; border: none; width: 12px; height: 12px; margin: -5px 0; border-radius: 6px; }
QSlider::sub-page:horizontal { background: #1D9E75; border-radius: 1px; }
QCheckBox { font-size: 12px; color: #1A1A1A; spacing: 8px; font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif; }
QCheckBox::indicator { width: 15px; height: 15px; border: 1px solid #E5E7EB; border-radius: 3px; background: #FFFFFF; }
QCheckBox::indicator:checked { background-color: #1D9E75; border-color: #1D9E75; }
QComboBox { border: 0.5px solid #E5E7EB; border-radius: 5px; padding: 5px 10px; background: #FFFFFF; color: #1A1A1A; font-size: 12px; min-height: 28px; font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif; }
QComboBox::drop-down { border: none; width: 20px; }
QComboBox QAbstractItemView { border: 0.5px solid #E5E7EB; background: #FFFFFF; selection-background-color: #E1F5EE; selection-color: #085041; }
QLineEdit { border: 0.5px solid #E5E7EB; border-radius: 5px; padding: 5px 10px; background: #FFFFFF; color: #1A1A1A; font-size: 12px; min-height: 28px; font-family: 'IBM Plex Mono', 'Segoe UI', Arial, sans-serif; }
QLineEdit:focus { border-color: #1D9E75; }
QScrollBar:vertical { border: none; background: transparent; width: 5px; margin: 0; }
QScrollBar::handle:vertical { background: #E5E7EB; border-radius: 2px; min-height: 20px; }
QScrollBar::handle:vertical:hover { background: #9CA3AF; }
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical { height: 0px; }
QScrollBar:horizontal { border: none; background: transparent; height: 5px; }
QScrollBar::handle:horizontal { background: #E5E7EB; border-radius: 2px; min-width: 20px; }
QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal { width: 0px; }
"""
