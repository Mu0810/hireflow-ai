"""Kimchi API LLM provider.

Implements :class:`jarvis.core.interfaces.LLMProvider` over Kimchi's
OpenAI-compatible endpoint (https://llm.kimchi.dev/openai/v1), with tool
calling, streaming, and automatic retry on transient failures.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any, AsyncIterator

import httpx

from ..core.errors import LLMError
from ..core.models import ChatChunk, Message, ToolCall, ToolSpec
from ..logging import get_logger
from .base import message_to_wire, tool_to_wire, wire_to_message

log = get_logger(__name__)

# Exponential backoff: 0.5s, 1s, 2s
_BACKOFF_DELAYS = (0.5, 1.0, 2.0)


def _is_transient(exc: Exception) -> bool:
    """Return True if ``exc`` is a retryable failure."""
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code >= 500 or exc.response.status_code == 429
    if isinstance(exc, (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError)):
        return True
    return False


class KimchiProvider:
    def __init__(
        self,
        api_key: str,
        *,
        model: str = "kimi-k2.6",
        base_url: str = "https://llm.kimchi.dev/openai/v1",
        temperature: float = 0.7,
        max_tokens: int = 2048,
        timeout: float = 120.0,
    ) -> None:
        if not api_key:
            raise LLMError("KIMCHI_API_KEY is not set")
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.timeout = timeout
        self._headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    def _payload(
        self,
        messages: list[Message],
        tools: list[ToolSpec] | None,
        model: str | None,
        temperature: float | None,
        max_tokens: int | None,
        stream: bool,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": model or self.model,
            "messages": [message_to_wire(m) for m in messages],
            "temperature": self.temperature if temperature is None else temperature,
            "max_tokens": self.max_tokens if max_tokens is None else max_tokens,
            "stream": stream,
        }
        if tools:
            payload["tools"] = [tool_to_wire(t) for t in tools]
            payload["tool_choice"] = "auto"
        return payload

    async def complete(
        self,
        messages: list[Message],
        *,
        tools: list[ToolSpec] | None = None,
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> Message:
        payload = self._payload(messages, tools, model, temperature, max_tokens, stream=False)
        conv_id = messages[-1].conversation_id if messages else ""

        last_exc: Exception | None = None
        for attempt, delay in enumerate(_BACKOFF_DELAYS, start=1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=self._headers,
                        json=payload,
                    )
                    resp.raise_for_status()
                data = resp.json()
                try:
                    choice = data["choices"][0]["message"]
                except (KeyError, IndexError) as exc:
                    raise LLMError(f"Unexpected Kimchi response: {data}") from exc
                return wire_to_message(choice, conv_id)
            except Exception as exc:  # noqa: BLE001
                last_exc = exc
                if not _is_transient(exc) or attempt == len(_BACKOFF_DELAYS):
                    break
                log.warning(
                    "Kimchi complete() transient error (attempt %d/%d): %s — retrying in %.1fs",
                    attempt,
                    len(_BACKOFF_DELAYS),
                    exc,
                    delay,
                )
                await asyncio.sleep(delay)

        # All retries exhausted or non-retryable error.
        assert last_exc is not None
        if isinstance(last_exc, httpx.HTTPStatusError):
            raise LLMError(
                f"Kimchi error {last_exc.response.status_code}: {last_exc.response.text[:500]}"
            ) from last_exc
        if isinstance(last_exc, LLMError):
            raise last_exc
        raise LLMError(f"Kimchi request failed: {last_exc}") from last_exc

    async def stream(
        self,
        messages: list[Message],
        *,
        tools: list[ToolSpec] | None = None,
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> AsyncIterator[ChatChunk]:
        payload = self._payload(messages, tools, model, temperature, max_tokens, stream=True)

        # Retry only the initial connection / headers phase.
        last_exc: Exception | None = None
        for attempt, delay in enumerate(_BACKOFF_DELAYS, start=1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    async with client.stream(
                        "POST",
                        f"{self.base_url}/chat/completions",
                        headers=self._headers,
                        json=payload,
                    ) as resp:
                        if resp.status_code >= 400:
                            body = await resp.aread()
                            raise httpx.HTTPStatusError(
                                f"Kimchi {resp.status_code}",
                                request=resp.request,
                                response=resp,  # type: ignore[arg-type]
                            )
                        # Connection succeeded — hand off to the internal generator.
                        async for chunk in self._stream_chunks(resp):
                            yield chunk
                        return
            except Exception as exc:  # noqa: BLE001
                last_exc = exc
                if not _is_transient(exc) or attempt == len(_BACKOFF_DELAYS):
                    break
                log.warning(
                    "Kimchi stream() transient error (attempt %d/%d): %s — retrying in %.1fs",
                    attempt,
                    len(_BACKOFF_DELAYS),
                    exc,
                    delay,
                )
                await asyncio.sleep(delay)

        assert last_exc is not None
        if isinstance(last_exc, httpx.HTTPStatusError):
            yield ChatChunk(
                type="error",
                text=f"Kimchi {last_exc.response.status_code}: {(await last_exc.response.aread())[:300]!r}",
            )
            return
        if isinstance(last_exc, LLMError):
            yield ChatChunk(type="error", text=str(last_exc))
            return
        yield ChatChunk(type="error", text=f"Kimchi stream failed: {last_exc}")

    async def _stream_chunks(
        self, resp: httpx.AsyncResponse
    ) -> AsyncIterator[ChatChunk]:
        """Consume an established SSE stream and yield ChatChunks."""
        tool_buf: dict[int, dict[str, Any]] = {}
        async for line in resp.aiter_lines():
            if not line or not line.startswith("data:"):
                continue
            data_str = line[len("data:") :].strip()
            if data_str == "[DONE]":
                break
            try:
                chunk = json.loads(data_str)
            except json.JSONDecodeError:
                continue
            delta = chunk.get("choices", [{}])[0].get("delta", {})
            if delta.get("content"):
                yield ChatChunk(type="text", text=delta["content"])
            for tc in delta.get("tool_calls") or []:
                idx = tc.get("index", 0)
                slot = tool_buf.setdefault(idx, {"id": "", "name": "", "args": ""})
                if tc.get("id"):
                    slot["id"] = tc["id"]
                fn = tc.get("function", {})
                if fn.get("name"):
                    slot["name"] = fn["name"]
                if fn.get("arguments"):
                    slot["args"] += fn["arguments"]

        for slot in tool_buf.values():
            try:
                args = json.loads(slot["args"]) if slot["args"] else {}
            except json.JSONDecodeError:
                args = {"_raw": slot["args"]}
            call = ToolCall(id=slot["id"], name=slot["name"], arguments=args)
            yield ChatChunk(type="tool_call", data=call.model_dump())

        yield ChatChunk(type="done")
