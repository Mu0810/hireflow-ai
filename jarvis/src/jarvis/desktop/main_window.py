"""JARVIS main desktop window."""

from __future__ import annotations

from PySide6.QtCore import Qt, QTimer, Signal
from PySide6.QtGui import QAction, QCloseEvent, QIcon, QKeySequence, QShortcut
from PySide6.QtWidgets import (
    QApplication,
    QHBoxLayout,
    QLabel,
    QMainWindow,
    QMenu,
    QPushButton,
    QSplitter,
    QStackedWidget,
    QSystemTrayIcon,
    QVBoxLayout,
    QWidget,
)

from .chat_widget import ChatWidget

from ..logging import get_logger

log = get_logger(__name__)


class OrbWidget(QWidget):
    """A small circular widget that changes colour to indicate voice state."""

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setFixedSize(24, 24)
        self._colour = "#3b82f6"
        self._pulsing = False

    def set_state(self, colour: str, pulse: bool = False) -> None:
        self._colour = colour
        self._pulsing = pulse
        self.update()

    def paintEvent(self, event) -> None:
        from PySide6.QtGui import QBrush, QPainter, QRadialGradient

        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        rect = self.rect()
        gradient = QRadialGradient(rect.center(), rect.width() / 2)
        gradient.setColorAt(0.0, self._colour)
        gradient.setColorAt(1.0, "#000000")
        brush = QBrush(gradient)
        painter.setBrush(brush)
        painter.setPen(Qt.NoPen)
        painter.drawEllipse(rect)
        painter.end()


class DashboardWidget(QWidget):
    """Placeholder dashboard with task/memory/project tabs."""

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        layout = QVBoxLayout(self)
        label = QLabel("Dashboard — coming in Phase 2 step 2", self)
        label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(label)


class MainWindow(QMainWindow):
    """Primary PySide6 window for the JARVIS desktop experience."""

    def __init__(self, settings, engine, memory, voice_status) -> None:
        super().__init__()
        self.settings = settings
        self.engine = engine
        self.memory = memory
        self.voice_status = voice_status
        self._conversation_id: str | None = None
        self._dark_mode = True
        self._floating = False
        self._setup_ui()
        self._setup_tray()
        self._setup_shortcuts()
        self._start_new_conversation()

    def _setup_ui(self) -> None:
        self.setWindowTitle(self.settings.assistant_name)
        self.setMinimumSize(960, 640)
        self.resize(1200, 800)

        # Central splitter: sidebar + main area.
        splitter = QSplitter(Qt.Orientation.Horizontal, self)
        self.setCentralWidget(splitter)

        # Sidebar
        sidebar = QWidget(self)
        sidebar.setFixedWidth(56)
        sidebar_layout = QVBoxLayout(sidebar)
        sidebar_layout.setContentsMargins(6, 12, 6, 12)
        sidebar_layout.setSpacing(12)

        self.orb = OrbWidget(sidebar)
        sidebar_layout.addWidget(self.orb, alignment=Qt.AlignmentFlag.AlignHCenter)

        self.btn_chat = QPushButton("💬", sidebar)
        self.btn_chat.setToolTip("Chat")
        self.btn_chat.setFixedSize(44, 44)
        self.btn_chat.clicked.connect(self._show_chat)
        sidebar_layout.addWidget(self.btn_chat)

        self.btn_dash = QPushButton("📊", sidebar)
        self.btn_dash.setToolTip("Dashboard")
        self.btn_dash.setFixedSize(44, 44)
        self.btn_dash.clicked.connect(self._show_dashboard)
        sidebar_layout.addWidget(self.btn_dash)

        sidebar_layout.addStretch()

        self.btn_stop = QPushButton("⛔", sidebar)
        self.btn_stop.setToolTip("Emergency Stop")
        self.btn_stop.setFixedSize(44, 44)
        self.btn_stop.setStyleSheet("background-color: #ef4444; color: white; border-radius: 8px;")
        self.btn_stop.clicked.connect(self._emergency_stop)
        sidebar_layout.addWidget(self.btn_stop)

        self.btn_theme = QPushButton("🌙", sidebar)
        self.btn_theme.setToolTip("Toggle theme")
        self.btn_theme.setFixedSize(44, 44)
        self.btn_theme.clicked.connect(self._toggle_theme)
        sidebar_layout.addWidget(self.btn_theme)

        splitter.addWidget(sidebar)

        # Main stacked widget
        self.stack = QStackedWidget(self)
        self.chat_widget = ChatWidget(self)
        self.chat_widget.message_sent.connect(self._on_user_message)
        self.stack.addWidget(self.chat_widget)

        self.dashboard_widget = DashboardWidget(self)
        self.stack.addWidget(self.dashboard_widget)

        splitter.addWidget(self.stack)
        splitter.setSizes([56, 1144])

    def _setup_tray(self) -> None:
        self.tray = QSystemTrayIcon(self)
        # Use a simple circle icon; in production ship an actual icon file.
        self.tray.setToolTip(self.settings.assistant_name)
        self.tray.activated.connect(self._tray_activated)

        tray_menu = QMenu(self)
        show_action = QAction("Show", self)
        show_action.triggered.connect(self.showNormal)
        tray_menu.addAction(show_action)

        float_action = QAction("Floating Mode", self)
        float_action.setCheckable(True)
        float_action.triggered.connect(self._toggle_floating)
        tray_menu.addAction(float_action)
        self._float_action = float_action

        tray_menu.addSeparator()

        quit_action = QAction("Quit", self)
        quit_action.triggered.connect(QApplication.quit)
        tray_menu.addAction(quit_action)

        self.tray.setContextMenu(tray_menu)
        self.tray.show()

    def _setup_shortcuts(self) -> None:
        QShortcut(QKeySequence("Ctrl+N"), self, self._start_new_conversation)
        QShortcut(QKeySequence("Ctrl+Shift+D"), self, self._toggle_floating)

    def _start_new_conversation(self) -> None:
        conv = self.memory.start_conversation(channel="desktop")
        self._conversation_id = conv.id
        self.chat_widget.clear_chat()
        self.chat_widget.append_message("assistant", "Hello! I'm ready to help.")

    def _show_chat(self) -> None:
        self.stack.setCurrentWidget(self.chat_widget)

    def _show_dashboard(self) -> None:
        self.stack.setCurrentWidget(self.dashboard_widget)

    def _on_user_message(self, text: str) -> None:
        if self.engine is None or self._conversation_id is None:
            self.chat_widget.append_message("assistant", "LLM is not configured.")
            return
        # Async response handled via qasync.
        import asyncio

        asyncio.create_task(self._respond(text))

    async def _respond(self, text: str) -> None:
        try:
            reply = await self.engine.respond(self._conversation_id, text)
            self.chat_widget.append_message("assistant", reply.content)
        except Exception as exc:
            log.exception("Agent response failed")
            self.chat_widget.append_message("assistant", f"Error: {exc}")

    def _toggle_theme(self) -> None:
        self._dark_mode = not self._dark_mode
        from .styles import apply_theme

        apply_theme(QApplication.instance(), self._dark_mode)
        self.btn_theme.setText("🌙" if self._dark_mode else "☀️")

    def _emergency_stop(self) -> None:
        """Activate emergency stop — deny all dangerous actions and show status."""
        if hasattr(self, "_confirmer") and self._confirmer is not None:
            self._confirmer.trigger_emergency_stop()
        from PySide6.QtWidgets import QMessageBox
        QMessageBox.warning(
            self,
            "Emergency Stop",
            "Emergency stop activated. All dangerous actions will be denied until the app is restarted.",
        )
        self.chat_widget.append_message(
            "assistant", "🛑 Emergency stop activated. Dangerous actions are now blocked."
        )

    def _toggle_floating(self, checked: bool | None = None) -> None:
        if checked is None:
            checked = not self._floating
        self._floating = checked
        if self._floating:
            self.setWindowFlags(Qt.WindowType.Tool | Qt.WindowType.FramelessWindowHint)
            self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, True)
            self.show()
        else:
            self.setWindowFlags(Qt.WindowType.Window)
            self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, False)
            self.show()
        if self._float_action:
            self._float_action.setChecked(self._floating)

    def _tray_activated(self, reason: QSystemTrayIcon.ActivationReason) -> None:
        if reason == QSystemTrayIcon.ActivationReason.DoubleClick:
            self.showNormal()
            self.raise_()
            self.activateWindow()

    def closeEvent(self, event: QCloseEvent) -> None:
        """Hide to tray instead of quitting."""
        event.ignore()
        self.hide()
        self.tray.showMessage(
            self.settings.assistant_name,
            "Running in the background. Click the tray icon to restore.",
        )
