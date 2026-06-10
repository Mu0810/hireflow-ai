"""Enhanced chat widget with glassmorphism panels and streaming support."""

from __future__ import annotations

from PySide6.QtCore import Qt, QTimer, Signal
from PySide6.QtGui import QColor, QFontMetrics, QPainter, QPainterPath
from PySide6.QtWidgets import (
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QScrollArea,
    QSizePolicy,
    QSpacerItem,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)

from ..logging import get_logger

log = get_logger(__name__)


class GlassPanel(QWidget):
    """A rounded panel with semi-transparent background for glassmorphism."""

    def __init__(
        self,
        parent: QWidget | None = None,
        *,
        radius: int = 14,
        bg_colour: str = "#1a1a25",
        bg_alpha: int = 180,
        border_colour: str = "#2d2d3a",
        border_width: int = 1,
    ) -> None:
        super().__init__(parent)
        self._radius = radius
        self._bg = QColor(bg_colour)
        self._bg.setAlpha(bg_alpha)
        self._border = QColor(border_colour)
        self._border_width = border_width
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)

    def paintEvent(self, event) -> None:
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        path = QPainterPath()
        path.addRoundedRect(self.rect(), self._radius, self._radius)
        painter.fillPath(path, self._bg)
        if self._border_width > 0:
            pen = painter.pen()
            pen.setColor(self._border)
            pen.setWidth(self._border_width)
            painter.setPen(pen)
            painter.drawPath(path)
        painter.end()


class TypingIndicator(QWidget):
    """Animated three-dot typing indicator."""

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._dots = ["●", "○", "○"]
        self._idx = 0
        self._label = QLabel("", self)
        self._label.setStyleSheet("color: #94a3b8; font-size: 10px; padding: 4px 12px;")
        layout = QHBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.addWidget(self._label)
        self._timer = QTimer(self)
        self._timer.timeout.connect(self._tick)
        self._timer.setInterval(400)
        self._update_text()

    def start(self) -> None:
        self._timer.start()
        self.show()

    def stop(self) -> None:
        self._timer.stop()
        self.hide()

    def _tick(self) -> None:
        self._idx = (self._idx + 1) % 3
        self._dots = [
            "●" if i == self._idx else "○" for i in range(3)
        ]
        self._update_text()

    def _update_text(self) -> None:
        self._label.setText("  ".join(self._dots))


class MessageBubble(QWidget):
    """A single chat message bubble with glassmorphism styling."""

    def __init__(
        self,
        role: str,
        text: str,
        parent: QWidget | None = None,
    ) -> None:
        super().__init__(parent)
        self.role = role
        self._text = text
        self._setup_ui()

    def _setup_ui(self) -> None:
        is_user = self.role == "user"
        layout = QHBoxLayout(self)
        layout.setContentsMargins(8, 4, 8, 4)
        layout.setSpacing(8)

        if is_user:
            layout.addSpacerItem(QSpacerItem(40, 1, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum))

        panel = GlassPanel(
            self,
            radius=12,
            bg_colour="#1e3a5f" if is_user else "#1a1a25",
            bg_alpha=200,
            border_colour="#2d4a6f" if is_user else "#2d2d3a",
        )
        panel_layout = QVBoxLayout(panel)
        panel_layout.setContentsMargins(10, 8, 10, 8)
        panel_layout.setSpacing(2)

        name = "You" if is_user else "Jarvis"
        colour = "#22c55e" if is_user else "#3b82f6"
        header = QLabel(f'<span style="color:{colour};font-weight:600;font-size:12px">{name}</span>')
        panel_layout.addWidget(header)

        self.body = QLabel(self._format_text(self._text))
        self.body.setWordWrap(True)
        self.body.setTextInteractionFlags(Qt.TextInteractionFlag.TextSelectableByMouse)
        panel_layout.addWidget(self.body)

        layout.addWidget(panel)

        if not is_user:
            layout.addSpacerItem(QSpacerItem(40, 1, QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum))

    def _format_text(self, text: str) -> str:
        """Escape HTML and convert some markdown to simple HTML."""
        import html

        text = html.escape(text)
        # Bold
        text = text.replace("**", "<b>", 1).replace("**", "</b>", 1)
        # Inline code
        text = text.replace("`", "<code style='background:#2d2d3a;padding:1px 4px;border-radius:4px'>", 1)
        text = text.replace("`", "</code>", 1)
        # Line breaks
        text = text.replace("\n", "<br>")
        return f'<span style="color:#e2e8f0;font-size:13px;line-height:1.5">{text}</span>'

    def update_text(self, text: str) -> None:
        self._text = text
        self.body.setText(self._format_text(text))


class ChatWidget(QWidget):
    """Chat interface with streaming text, glassmorphism bubbles, and typing indicator."""

    message_sent = Signal(str)

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._bubbles: list[MessageBubble] = []
        self._current_bubble: MessageBubble | None = None
        self._setup_ui()

    def _setup_ui(self) -> None:
        layout = QVBoxLayout(self)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(8)

        # Scroll area for messages
        scroll = QScrollArea(self)
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        scroll.setStyleSheet("background: transparent; border: none;")

        self.messages_container = QWidget()
        self.messages_layout = QVBoxLayout(self.messages_container)
        self.messages_layout.setContentsMargins(4, 4, 4, 4)
        self.messages_layout.setSpacing(6)
        self.messages_layout.addStretch()
        scroll.setWidget(self.messages_container)
        layout.addWidget(scroll, stretch=1)

        # Typing indicator (hidden by default)
        self.typing = TypingIndicator(self)
        self.typing.hide()
        layout.addWidget(self.typing)

        # Input row
        input_row = QHBoxLayout()
        input_row.setSpacing(8)

        self.input_line = QLineEdit(self)
        self.input_line.setPlaceholderText("Type a message…")
        self.input_line.returnPressed.connect(self._on_send)
        input_row.addWidget(self.input_line, stretch=1)

        self.send_btn = QPushButton("Send", self)
        self.send_btn.setFixedWidth(80)
        self.send_btn.clicked.connect(self._on_send)
        input_row.addWidget(self.send_btn)

        layout.addLayout(input_row)

    def _on_send(self) -> None:
        text = self.input_line.text().strip()
        if not text:
            return
        self.input_line.clear()
        self.append_message("user", text)
        self.message_sent.emit(text)

    def append_message(self, role: str, text: str) -> None:
        bubble = MessageBubble(role, text)
        # Insert before the stretch
        self.messages_layout.insertWidget(self.messages_layout.count() - 1, bubble)
        self._bubbles.append(bubble)
        self._current_bubble = bubble if role == "assistant" else None

    def append_chunk(self, text: str) -> None:
        """Append a streaming chunk to the current assistant message."""
        if self._current_bubble is None or self._current_bubble.role != "assistant":
            self.append_message("assistant", text)
        else:
            new_text = self._current_bubble._text + text
            self._current_bubble.update_text(new_text)

    def start_typing(self) -> None:
        self.typing.start()

    def stop_typing(self) -> None:
        self.typing.stop()

    def clear_chat(self) -> None:
        for i in reversed(range(self.messages_layout.count() - 1)):
            item = self.messages_layout.itemAt(i)
            if item and item.widget():
                item.widget().deleteLater()
        self._bubbles.clear()
        self._current_bubble = None
