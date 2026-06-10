"""Tests for the enhanced chat widget with glassmorphism."""

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
# GlassPanel
# ---------------------------------------------------------------------------
def test_glass_panel_exists(qapp) -> None:
    from jarvis.desktop.chat_widget import GlassPanel

    panel = GlassPanel()
    assert panel is not None
    assert panel._radius == 14


def test_glass_panel_custom_colours(qapp) -> None:
    from jarvis.desktop.chat_widget import GlassPanel

    panel = GlassPanel(radius=20, bg_colour="#ff0000", bg_alpha=100)
    assert panel._radius == 20
    assert panel._bg.red() == 255
    assert panel._bg.alpha() == 100


# ---------------------------------------------------------------------------
# TypingIndicator
# ---------------------------------------------------------------------------
def test_typing_indicator_animates(qapp) -> None:
    from jarvis.desktop.chat_widget import TypingIndicator

    indicator = TypingIndicator()
    assert not indicator.isVisible()
    indicator.start()
    assert indicator.isVisible()
    indicator.stop()
    assert not indicator.isVisible()


# ---------------------------------------------------------------------------
# MessageBubble
# ---------------------------------------------------------------------------
def test_message_bubble_user(qapp) -> None:
    from jarvis.desktop.chat_widget import MessageBubble

    bubble = MessageBubble("user", "Hello there")
    assert bubble.role == "user"
    assert "Hello there" in bubble.body.text()


def test_message_bubble_assistant(qapp) -> None:
    from jarvis.desktop.chat_widget import MessageBubble

    bubble = MessageBubble("assistant", "I can help!")
    assert bubble.role == "assistant"
    assert "I can help!" in bubble.body.text()


def test_message_bubble_update(qapp) -> None:
    from jarvis.desktop.chat_widget import MessageBubble

    bubble = MessageBubble("assistant", "Hello")
    bubble.update_text("Hello world")
    assert "Hello world" in bubble.body.text()


def test_message_bubble_html_escaping(qapp) -> None:
    from jarvis.desktop.chat_widget import MessageBubble

    bubble = MessageBubble("assistant", "<script>alert(1)</script>")
    text = bubble.body.text()
    assert "<script>" not in text
    assert "&lt;script&gt;" in text or "alert(1)" not in text


# ---------------------------------------------------------------------------
# ChatWidget
# ---------------------------------------------------------------------------
def test_chat_widget_construction(qapp) -> None:
    from jarvis.desktop.chat_widget import ChatWidget

    chat = ChatWidget()
    assert chat.input_line is not None
    assert chat.send_btn is not None
    assert chat.typing is not None


def test_chat_widget_append_message(qapp) -> None:
    from jarvis.desktop.chat_widget import ChatWidget

    chat = ChatWidget()
    chat.append_message("user", "Test message")
    assert len(chat._bubbles) == 1
    assert chat._bubbles[0].role == "user"


def test_chat_widget_append_chunk(qapp) -> None:
    from jarvis.desktop.chat_widget import ChatWidget

    chat = ChatWidget()
    chat.append_chunk("Hello ")
    chat.append_chunk("world")
    assert len(chat._bubbles) == 1
    assert chat._current_bubble is not None
    assert "Hello world" in chat._current_bubble.body.text()


def test_chat_widget_clear(qapp) -> None:
    from jarvis.desktop.chat_widget import ChatWidget

    chat = ChatWidget()
    chat.append_message("user", "Hi")
    chat.append_message("assistant", "Hello")
    chat.clear_chat()
    assert len(chat._bubbles) == 0
    assert chat._current_bubble is None


def test_chat_widget_typing(qapp) -> None:
    from jarvis.desktop.chat_widget import ChatWidget

    chat = ChatWidget()
    chat.start_typing()
    assert chat.typing._timer.isActive()
    chat.stop_typing()
    assert not chat.typing._timer.isActive()


def test_chat_widget_signal(qapp) -> None:
    from jarvis.desktop.chat_widget import ChatWidget

    chat = ChatWidget()
    received = []
    chat.message_sent.connect(lambda text: received.append(text))
    chat.input_line.setText("Hello")
    chat._on_send()
    assert received == ["Hello"]
    assert chat.input_line.text() == ""
