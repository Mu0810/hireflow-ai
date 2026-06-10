"""Tests for voice-specific UI widgets (orb, button, toggle)."""

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
# OrbWidget voice states
# ---------------------------------------------------------------------------
def test_orb_idle_state(qapp) -> None:
    from jarvis.desktop.main_window import OrbWidget

    orb = OrbWidget()
    orb.set_state("#3b82f6", pulse=False)
    assert orb._colour == "#3b82f6"
    assert orb._pulsing is False


def test_orb_listening_state(qapp) -> None:
    from jarvis.desktop.main_window import OrbWidget

    orb = OrbWidget()
    orb.set_state("#22c55e", pulse=True)
    assert orb._colour == "#22c55e"
    assert orb._pulsing is True


# ---------------------------------------------------------------------------
# MainWindow voice button
# ---------------------------------------------------------------------------
def test_voice_button_exists(qapp, settings, memory) -> None:
    from jarvis.desktop.main_window import MainWindow

    win = MainWindow(settings, engine=None, memory=memory, voice_status=None)
    assert win.btn_voice is not None
    assert win.btn_voice.isCheckable()
    win.close()


def test_voice_button_toggles(qapp, settings, memory) -> None:
    from jarvis.desktop.main_window import MainWindow

    win = MainWindow(settings, engine=None, memory=memory, voice_status=None)
    assert not win.btn_voice.isChecked()
    win.btn_voice.click()
    assert win.btn_voice.isChecked()
    win.btn_voice.click()
    assert not win.btn_voice.isChecked()
    win.close()


# ---------------------------------------------------------------------------
# MainWindow voice state handler
# ---------------------------------------------------------------------------
def test_on_voice_state_changes_orb(qapp, settings, memory) -> None:
    from jarvis.desktop.main_window import MainWindow

    win = MainWindow(settings, engine=None, memory=memory, voice_status=None)
    win._on_voice_state_changed("listening", {})
    assert win.orb._colour == "#22c55e"
    win._on_voice_state_changed("speaking", {})
    assert win.orb._colour == "#e2e8f0"
    win._on_voice_state_changed("offline", {})
    assert win.orb._colour == "#6b7280"
    win.close()
