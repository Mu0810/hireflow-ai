"""Bridge between the asyncio VoiceStatus pub/sub and PySide6 signals."""

from __future__ import annotations

import asyncio

from PySide6.QtCore import QObject, Signal

from ..logging import get_logger

log = get_logger(__name__)


class VoiceBridge(QObject):
    """Consumes VoiceStatus events via asyncio and re-emits them as Qt signals.

    Usage::

        bridge = VoiceBridge(voice_status)
        bridge.start()          # spawns an asyncio task
        bridge.state_changed.connect(orb.set_state)
        bridge.transcript_received.connect(chat.append_transcript)
        bridge.reply_received.connect(chat.append_reply)
        ...
        bridge.stop()           # cancels the consumer task
    """

    state_changed = Signal(str, dict)   # state_name, extra_info
    transcript_received = Signal(str)
    reply_received = Signal(str)

    def __init__(self, voice_status) -> None:
        super().__init__()
        self.voice_status = voice_status
        self._queue = None
        self._task: asyncio.Task | None = None

    def start(self) -> None:
        """Subscribe to VoiceStatus and start the consumer task."""
        if self._task is not None and not self._task.done():
            return
        self._queue = self.voice_status.subscribe()
        try:
            loop = asyncio.get_running_loop()
            self._task = loop.create_task(self._consume())
            log.info("Voice bridge started")
        except RuntimeError:
            log.debug("No running event loop; voice bridge consumer not started")

    def stop(self) -> None:
        """Unsubscribe and cancel the consumer task."""
        if self._queue is not None:
            self.voice_status.unsubscribe(self._queue)
            self._queue = None
        if self._task is not None and not self._task.done():
            self._task.cancel()
        self._task = None
        log.info("Voice bridge stopped")

    async def _consume(self) -> None:
        try:
            while True:
                event = await self._queue.get()
                etype = event.get("type")
                if etype == "state":
                    self.state_changed.emit(event.get("state", ""), event)
                elif etype == "transcript":
                    self.transcript_received.emit(event.get("text", ""))
                elif etype == "reply":
                    self.reply_received.emit(event.get("text", ""))
        except asyncio.CancelledError:
            log.debug("Voice bridge consumer cancelled")
        except Exception:  # noqa: BLE001
            log.exception("Voice bridge consumer error")
