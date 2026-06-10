"""Tests for voice transcript/reply integration into chat widget."""

from __future__ import annotations

import pytest


@pytest.fixture(scope="session")
def qapp():
    from PySide6.QtWidgets import QApplication

    app = QApplication.instance()
    if app is None:
        app = QApplication([])
    yield app


@pytest.fixture
def voice_status():
    from jarvis.voice.status import VoiceStatus
    return VoiceStatus()


# ---------------------------------------------------------------------------
# Voice transcript → chat
# ---------------------------------------------------------------------------
def test_voice_transcript_appears_in_chat(qapp, settings, memory, voice_status) -> None:
    from jarvis.desktop.main_window import MainWindow

    win = MainWindow(settings, engine=None, memory=memory, voice_status=voice_status, container=None)
    win.chat_widget.clear_chat()
    win._on_voice_transcript("Hey Jarvis")
    assert len(win.chat_widget._bubbles) == 1
    assert win.chat_widget._bubbles[0].role == "user"
    assert "Hey Jarvis" in win.chat_widget._bubbles[0].body.text()
    win.close()


# ---------------------------------------------------------------------------
# Voice reply → chat
# ---------------------------------------------------------------------------
def test_voice_reply_appears_in_chat(qapp, settings, memory, voice_status) -> None:
    from jarvis.desktop.main_window import MainWindow

    win = MainWindow(settings, engine=None, memory=memory, voice_status=voice_status, container=None)
    win.chat_widget.clear_chat()
    win._on_voice_reply("Hello! How can I help?")
    assert len(win.chat_widget._bubbles) == 1
    assert win.chat_widget._bubbles[0].role == "assistant"
    assert "Hello! How can I help?" in win.chat_widget._bubbles[0].body.text()
    win.close()


# ---------------------------------------------------------------------------
# Full voice conversation flow
# ---------------------------------------------------------------------------
def test_voice_conversation_flow(qapp, settings, memory, voice_status) -> None:
    from jarvis.desktop.main_window import MainWindow

    win = MainWindow(settings, engine=None, memory=memory, voice_status=voice_status, container=None)
    win.chat_widget.clear_chat()
    win._on_voice_transcript("What's the weather?")
    win._on_voice_reply("It's sunny today.")
    assert len(win.chat_widget._bubbles) == 2
    assert win.chat_widget._bubbles[0].role == "user"
    assert win.chat_widget._bubbles[1].role == "assistant"
    win.close()
