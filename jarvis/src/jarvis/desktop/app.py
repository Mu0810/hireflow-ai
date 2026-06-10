"""PySide6 application entry point with qasync asyncio bridge."""

from __future__ import annotations

import asyncio
import sys

from PySide6.QtWidgets import QApplication
from qasync import QEventLoop

from ..logging import get_logger
from .main_window import MainWindow
from .styles import apply_theme

log = get_logger(__name__)


class DesktopApp:
    """The JARVIS desktop application wrapper.

    Handles QApplication lifecycle, qasync event loop, theme application, and
    the main window.  Surfaces call :meth:`run` to block until the user quits.
    """

    def __init__(
        self,
        settings,
        engine,
        memory,
        voice_status,
    ) -> None:
        self.settings = settings
        self.engine = engine
        self.memory = memory
        self.voice_status = voice_status
        self._app: QApplication | None = None
        self._loop: QEventLoop | None = None
        self._window: MainWindow | None = None

    def _build_app(self) -> QApplication:
        app = QApplication(sys.argv)
        app.setApplicationName(self.settings.assistant_name)
        app.setApplicationDisplayName(self.settings.assistant_name)
        app.setQuitOnLastWindowClosed(False)
        apply_theme(app, dark=True)
        return app

    def run(self) -> None:
        """Start the desktop app and block until the user quits."""
        self._app = self._build_app()
        self._loop = QEventLoop(self._app)
        asyncio.set_event_loop(self._loop)

        self._window = MainWindow(
            self.settings,
            self.engine,
            self.memory,
            self.voice_status,
        )
        self._window.show()

        log.info("Desktop UI started")
        with self._loop:
            self._loop.run_forever()
        log.info("Desktop UI stopped")


def run_desktop(
    settings,
    engine,
    memory,
    voice_status,
) -> None:
    """Convenience function: build and run the desktop app."""
    app = DesktopApp(settings, engine, memory, voice_status)
    app.run()
