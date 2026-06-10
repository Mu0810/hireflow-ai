"""Tests for the voice bridge between asyncio VoiceStatus and PySide6 signals."""

from __future__ import annotations

import asyncio

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
# VoiceBridge
# ---------------------------------------------------------------------------
def test_voice_bridge_construction(qapp, voice_status) -> None:
    from jarvis.desktop.voice_bridge import VoiceBridge

    bridge = VoiceBridge(voice_status)
    assert bridge.voice_status == voice_status


@pytest.mark.asyncio
async def test_voice_bridge_emits_state_changed(qapp, voice_status) -> None:
    from jarvis.desktop.voice_bridge import VoiceBridge

    bridge = VoiceBridge(voice_status)
    states = []
    bridge.state_changed.connect(lambda s, e: states.append(s))
    bridge.start()
    voice_status.set_state("listening")
    await asyncio.sleep(0.05)
    bridge.stop()
    assert "listening" in states


@pytest.mark.asyncio
async def test_voice_bridge_emits_transcript(qapp, voice_status) -> None:
    from jarvis.desktop.voice_bridge import VoiceBridge

    bridge = VoiceBridge(voice_status)
    texts = []
    bridge.transcript_received.connect(lambda t: texts.append(t))
    bridge.start()
    voice_status.transcript("Hello")
    await asyncio.sleep(0.05)
    bridge.stop()
    assert "Hello" in texts


@pytest.mark.asyncio
async def test_voice_bridge_emits_reply(qapp, voice_status) -> None:
    from jarvis.desktop.voice_bridge import VoiceBridge

    bridge = VoiceBridge(voice_status)
    texts = []
    bridge.reply_received.connect(lambda t: texts.append(t))
    bridge.start()
    voice_status.reply("Hi there")
    await asyncio.sleep(0.05)
    bridge.stop()
    assert "Hi there" in texts


@pytest.mark.asyncio
async def test_voice_bridge_idempotent_start(qapp, voice_status) -> None:
    from jarvis.desktop.voice_bridge import VoiceBridge

    bridge = VoiceBridge(voice_status)
    bridge.start()
    bridge.start()  # should be idempotent
    assert bridge._task is not None
    bridge.stop()


# ---------------------------------------------------------------------------
# MainWindow voice integration (headless)
# ---------------------------------------------------------------------------
def test_main_window_voice_methods_exist(qapp, settings, memory, voice_status) -> None:
    from jarvis.desktop.main_window import MainWindow

    win = MainWindow(settings, engine=None, memory=memory, voice_status=voice_status, container=None)
    assert win.btn_voice is not None
    assert win._voice_bridge is not None
    win._on_voice_state_changed("listening", {})
    win._on_voice_state_changed("thinking", {})
    win._on_voice_state_changed("speaking", {})
    win.close()


def test_main_window_voice_transcript_updates_chat(qapp, settings, memory, voice_status) -> None:
    from jarvis.desktop.main_window import MainWindow

    win = MainWindow(settings, engine=None, memory=memory, voice_status=voice_status, container=None)
    win.chat_widget.clear_chat()
    win._on_voice_transcript("Hello voice")
    assert len(win.chat_widget._bubbles) == 1
    assert win.chat_widget._bubbles[0]._text == "Hello voice"
    win.close()


def test_main_window_voice_reply_updates_chat(qapp, settings, memory, voice_status) -> None:
    from jarvis.desktop.main_window import MainWindow

    win = MainWindow(settings, engine=None, memory=memory, voice_status=voice_status, container=None)
    win.chat_widget.clear_chat()
    win._on_voice_reply("Voice reply")
    assert len(win.chat_widget._bubbles) == 1
    assert win.chat_widget._bubbles[0]._text == "Voice reply"
    win.close()
