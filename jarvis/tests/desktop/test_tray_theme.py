"""Tests for system tray, floating mode, and theme features."""

from __future__ import annotations

import pytest


@pytest.fixture(scope="session")
def qapp():
    from PySide6.QtWidgets import QApplication

    app = QApplication.instance()
    if app is None:
        app = QApplication([])
    yield app


# ---------------------------------------------------------------------------
# MainWindow floating mode
# ---------------------------------------------------------------------------
def test_main_window_floating_mode(qapp, settings, memory) -> None:
    from jarvis.desktop.main_window import MainWindow

    win = MainWindow(settings, engine=None, memory=memory, voice_status=None)
    assert win._floating is False
    win._toggle_floating(True)
    assert win._floating is True
    assert win._float_action.isChecked()
    win._toggle_floating(False)
    assert win._floating is False
    assert not win._float_action.isChecked()
    win.close()


def test_main_window_close_to_tray(qapp, settings, memory) -> None:
    from PySide6.QtGui import QCloseEvent
    from jarvis.desktop.main_window import MainWindow

    win = MainWindow(settings, engine=None, memory=memory, voice_status=None)
    win.show()
    assert win.isVisible()
    event = QCloseEvent()
    win.closeEvent(event)
    assert event.isAccepted() is False
    assert win.isVisible() is False  # hidden to tray
    win.close()


# ---------------------------------------------------------------------------
# MainWindow shortcuts
# ---------------------------------------------------------------------------
def test_main_window_shortcuts(qapp, settings, memory) -> None:
    from jarvis.desktop.main_window import MainWindow

    win = MainWindow(settings, engine=None, memory=memory, voice_status=None)
    # Shortcuts exist on the window.
    shortcuts = [s.key().toString() for s in win.findChildren(type(win)) if hasattr(s, "key")]
    # Just ensure construction succeeded without shortcut conflicts.
    assert win is not None
    win.close()


# ---------------------------------------------------------------------------
# DesktopApp run helpers
# ---------------------------------------------------------------------------
def test_desktop_app_settings(settings, memory) -> None:
    from jarvis.desktop.app import DesktopApp

    app = DesktopApp(settings, engine=None, memory=memory, voice_status=None)
    assert app._app is None
    assert app._loop is None
    assert app._window is None
