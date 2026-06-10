"""Tests for the PySide6 security confirmer and emergency stop."""

from __future__ import annotations

import pytest
from unittest.mock import MagicMock, patch


@pytest.fixture(scope="session")
def qapp():
    from PySide6.QtWidgets import QApplication

    app = QApplication.instance()
    if app is None:
        app = QApplication([])
    yield app


# ---------------------------------------------------------------------------
# PySide6Confirmer
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_confirmer_always_allow_when_disabled() -> None:
    from jarvis.security.confirm import PySide6Confirmer

    c = PySide6Confirmer(require_confirmation=False)
    result = await c.confirm("foo", "bar")
    assert result is True


@pytest.mark.asyncio
async def test_confirmer_returns_true_when_preapproved() -> None:
    from jarvis.security.confirm import PySide6Confirmer

    c = PySide6Confirmer(require_confirmation=True)
    c.preapprove("test_action")
    result = await c.confirm("test_action", "detail")
    assert result is True


@pytest.mark.asyncio
async def test_confirmer_returns_false_on_emergency_stop() -> None:
    from jarvis.security.confirm import PySide6Confirmer

    c = PySide6Confirmer(require_confirmation=True)
    c.trigger_emergency_stop()
    result = await c.confirm("any_action", "detail")
    assert result is False


@pytest.mark.asyncio
async def test_confirmer_shows_dialog_when_required(qapp) -> None:
    from jarvis.security.confirm import PySide6Confirmer

    c = PySide6Confirmer(require_confirmation=True)
    with patch("PySide6.QtWidgets.QMessageBox.exec") as mock_exec:
        mock_exec.return_value = 0x00004000  # QMessageBox.Yes
        result = await c.confirm("delete_file", "path: test.txt")
        assert result is True
        mock_exec.assert_called_once()


@pytest.mark.asyncio
async def test_confirmer_dialog_no_when_declined(qapp) -> None:
    from jarvis.security.confirm import PySide6Confirmer

    c = PySide6Confirmer(require_confirmation=True)
    with patch("PySide6.QtWidgets.QMessageBox.exec") as mock_exec:
        mock_exec.return_value = 0x00010000  # QMessageBox.No
        result = await c.confirm("delete_file", "path: test.txt")
        assert result is False


# ---------------------------------------------------------------------------
# Emergency stop integration
# ---------------------------------------------------------------------------
def test_emergency_stop_button_exists(qapp, settings, memory) -> None:
    from jarvis.desktop.main_window import MainWindow

    win = MainWindow(settings, engine=None, memory=memory, voice_status=None)
    assert win.btn_stop is not None
    assert "Emergency Stop" in win.btn_stop.toolTip()
    win.close()


def test_emergency_stop_triggers_confirmer(qapp, settings, memory) -> None:
    from jarvis.desktop.main_window import MainWindow
    from jarvis.security.confirm import PySide6Confirmer

    win = MainWindow(settings, engine=None, memory=memory, voice_status=None)
    confirmer = PySide6Confirmer(require_confirmation=True)
    win._confirmer = confirmer
    assert confirmer.emergency_stop is False
    with patch("PySide6.QtWidgets.QMessageBox.warning"):
        win._emergency_stop()
    assert confirmer.emergency_stop is True
    win.close()
