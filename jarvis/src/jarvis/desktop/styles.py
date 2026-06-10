"""Global styles and theme constants for the PySide6 desktop UI."""

from __future__ import annotations

import sys

from PySide6.QtCore import Qt
from PySide6.QtGui import QColor, QFont, QFontDatabase, QPalette
from PySide6.QtWidgets import QApplication

# ---------------------------------------------------------------------------
# Colours
# ---------------------------------------------------------------------------
DARK_BG = QColor("#0a0a0f")
DARK_PANEL = QColor("#12121a")
DARK_INPUT = QColor("#1a1a25")
ACCENT = QColor("#3b82f6")  # blue-500
ACCENT_HOVER = QColor("#2563eb")  # blue-600
TEXT_PRIMARY = QColor("#e2e8f0")  # slate-200
TEXT_SECONDARY = QColor("#94a3b8")  # slate-400
BORDER = QColor("#2d2d3a")
SUCCESS = QColor("#22c55e")  # green-500
WARNING = QColor("#f59e0b")  # amber-500
DANGER = QColor("#ef4444")  # red-500

LIGHT_BG = QColor("#f8fafc")  # slate-50
LIGHT_PANEL = QColor("#ffffff")
LIGHT_INPUT = QColor("#f1f5f9")  # slate-100
LIGHT_BORDER = QColor("#e2e8f0")  # slate-200


def _system_font() -> QFont:
    """Return the best available system font."""
    app = QApplication.instance()
    if app is None:
        return QFont("Helvetica", 13)
    families = QFontDatabase.families()
    preferred = ["SF Pro", ".AppleSystemUIFont", "Inter", "Segoe UI", "Helvetica Neue"]
    for name in preferred:
        if name in families:
            return QFont(name, 13)
    return QFont("Helvetica", 13)


# ---------------------------------------------------------------------------
# Global stylesheet (dark mode default)
# ---------------------------------------------------------------------------
def dark_stylesheet() -> str:
    return f"""
    QMainWindow {{
        background-color: {DARK_BG.name()};
    }}
    QWidget {{
        background-color: {DARK_BG.name()};
        color: {TEXT_PRIMARY.name()};
        font-family: "{_system_font().family()}";
        font-size: 13px;
    }}
    QPushButton {{
        background-color: {ACCENT.name()};
        color: white;
        border: none;
        border-radius: 8px;
        padding: 8px 16px;
        font-weight: 500;
    }}
    QPushButton:hover {{
        background-color: {ACCENT_HOVER.name()};
    }}
    QPushButton:pressed {{
        background-color: {ACCENT.name()};
    }}
    QTextEdit, QLineEdit {{
        background-color: {DARK_INPUT.name()};
        color: {TEXT_PRIMARY.name()};
        border: 1px solid {BORDER.name()};
        border-radius: 8px;
        padding: 8px;
        selection-background-color: {ACCENT.name()};
    }}
    QScrollBar:vertical {{
        background: {DARK_BG.name()};
        width: 8px;
        border-radius: 4px;
    }}
    QScrollBar::handle:vertical {{
        background: {BORDER.name()};
        border-radius: 4px;
        min-height: 20px;
    }}
    QScrollBar::handle:vertical:hover {{
        background: {TEXT_SECONDARY.name()};
    }}
    QLabel {{
        color: {TEXT_PRIMARY.name()};
    }}
    QMenu {{
        background-color: {DARK_PANEL.name()};
        color: {TEXT_PRIMARY.name()};
        border: 1px solid {BORDER.name()};
        border-radius: 6px;
        padding: 6px;
    }}
    QMenu::item:selected {{
        background-color: {ACCENT.name()};
        border-radius: 4px;
    }}
"""


def light_stylesheet() -> str:
    return f"""
    QMainWindow {{
        background-color: {LIGHT_BG.name()};
    }}
    QWidget {{
        background-color: {LIGHT_BG.name()};
        color: #1e293b;
        font-family: "{_system_font().family()}";
        font-size: 13px;
    }}
    QPushButton {{
        background-color: {ACCENT.name()};
        color: white;
        border: none;
        border-radius: 8px;
        padding: 8px 16px;
        font-weight: 500;
    }}
    QPushButton:hover {{
        background-color: {ACCENT_HOVER.name()};
    }}
    QTextEdit, QLineEdit {{
        background-color: {LIGHT_INPUT.name()};
        color: #1e293b;
        border: 1px solid {LIGHT_BORDER.name()};
        border-radius: 8px;
        padding: 8px;
        selection-background-color: {ACCENT.name()};
    }}
    QScrollBar:vertical {{
        background: {LIGHT_BG.name()};
        width: 8px;
        border-radius: 4px;
    }}
    QScrollBar::handle:vertical {{
        background: {LIGHT_BORDER.name()};
        border-radius: 4px;
        min-height: 20px;
    }}
    QScrollBar::handle:vertical:hover {{
        background: #94a3b8;
    }}
    QLabel {{
        color: #1e293b;
    }}
    QMenu {{
        background-color: {LIGHT_PANEL.name()};
        color: #1e293b;
        border: 1px solid {LIGHT_BORDER.name()};
        border-radius: 6px;
        padding: 6px;
    }}
    QMenu::item:selected {{
        background-color: {ACCENT.name()};
        border-radius: 4px;
        color: white;
    }}
"""


def apply_theme(app, dark: bool = True) -> None:
    """Apply a dark or light theme to the QApplication."""
    app.setStyleSheet(dark_stylesheet() if dark else light_stylesheet())
