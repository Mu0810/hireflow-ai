"""Tests for the PySide6 desktop application."""

from __future__ import annotations

import pytest


@pytest.fixture(scope="session")
def qapp():
    """Create a single QApplication for the test session."""
    from PySide6.QtWidgets import QApplication

    app = QApplication.instance()
    if app is None:
        app = QApplication([])
    yield app


# ---------------------------------------------------------------------------
# import smoke tests
# ---------------------------------------------------------------------------
def test_import_desktop_modules() -> None:
    from jarvis.desktop import MainWindow, run_desktop
    from jarvis.desktop.app import DesktopApp
    from jarvis.desktop.main_window import ChatWidget, DashboardWidget, OrbWidget
    from jarvis.desktop.styles import apply_theme, dark_stylesheet, light_stylesheet

    assert MainWindow is not None
    assert run_desktop is not None
    assert DesktopApp is not None
    assert ChatWidget is not None
    assert DashboardWidget is not None
    assert OrbWidget is not None
    assert apply_theme is not None
    assert dark_stylesheet is not None
    assert light_stylesheet is not None


# ---------------------------------------------------------------------------
# styles
# ---------------------------------------------------------------------------
def test_dark_stylesheet_contains_colors() -> None:
    from jarvis.desktop.styles import dark_stylesheet

    css = dark_stylesheet()
    assert "#0a0a0f" in css
    assert "#3b82f6" in css
    assert "QMainWindow" in css
    assert "QPushButton" in css


def test_light_stylesheet_contains_colors() -> None:
    from jarvis.desktop.styles import light_stylesheet

    css = light_stylesheet()
    assert "#f8fafc" in css
    assert "#3b82f6" in css
    assert "QMainWindow" in css


def test_apply_theme_sets_stylesheet(qapp) -> None:
    from jarvis.desktop.styles import apply_theme

    apply_theme(qapp, dark=True)
    assert "#0a0a0f" in qapp.styleSheet()
    apply_theme(qapp, dark=False)
    assert "#f8fafc" in qapp.styleSheet()


# ---------------------------------------------------------------------------
# widgets (headless — created but not shown)
# ---------------------------------------------------------------------------
def test_orb_widget(qapp) -> None:
    from jarvis.desktop.main_window import OrbWidget

    orb = OrbWidget()
    assert orb.width() == 24
    assert orb.height() == 24
    orb.set_state("#ff0000", pulse=True)


def test_chat_widget(qapp) -> None:
    from jarvis.desktop.main_window import ChatWidget

    chat = ChatWidget()
    assert chat.output is not None
    assert chat.input_line is not None
    chat.append_message("assistant", "Hello")
    assert "Hello" in chat.output.toPlainText()


def test_dashboard_widget(qapp) -> None:
    from jarvis.desktop.main_window import DashboardWidget

    dash = DashboardWidget()
    assert dash is not None


# ---------------------------------------------------------------------------
# MainWindow (headless — created but not shown)
# ---------------------------------------------------------------------------
def test_main_window_construction(qapp, settings, memory) -> None:
    from jarvis.desktop.main_window import MainWindow

    # engine may be None if no API key — that's fine for UI construction.
    win = MainWindow(settings, engine=None, memory=memory, voice_status=None)
    assert win.windowTitle() == settings.assistant_name
    assert win.chat_widget is not None
    assert win.dashboard_widget is not None
    assert win.tray is not None
    win.close()


def test_main_window_new_conversation(qapp, settings, memory) -> None:
    from jarvis.desktop.main_window import MainWindow

    win = MainWindow(settings, engine=None, memory=memory, voice_status=None)
    win._start_new_conversation()
    assert win._conversation_id is not None
    win.close()


def test_main_window_theme_toggle(qapp, settings, memory) -> None:
    from jarvis.desktop.main_window import MainWindow

    win = MainWindow(settings, engine=None, memory=memory, voice_status=None)
    assert win._dark_mode is True
    win._toggle_theme()
    assert win._dark_mode is False
    win.close()


# ---------------------------------------------------------------------------
# DesktopApp
# ---------------------------------------------------------------------------
def test_desktop_app_construction(settings, memory) -> None:
    from jarvis.desktop.app import DesktopApp

    app = DesktopApp(settings, engine=None, memory=memory, voice_status=None)
    assert app.settings == settings
    assert app.engine is None
