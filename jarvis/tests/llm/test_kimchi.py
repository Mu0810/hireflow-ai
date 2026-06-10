"""Tests for the Kimchi API LLM provider."""

from __future__ import annotations

import httpx
import pytest
import respx
from httpx import Response

from jarvis.core.errors import LLMError
from jarvis.core.models import ChatChunk, Message, Role, ToolCall, ToolSpec
from jarvis.llm.kimchi import KimchiProvider, _is_transient

BASE_URL = "https://llm.kimchi.dev/openai/v1"


# ---------------------------------------------------------------------------
# instantation
# ---------------------------------------------------------------------------
def test_instantiation_requires_api_key() -> None:
    with pytest.raises(LLMError, match="KIMCHI_API_KEY"):
        KimchiProvider("")


def test_instantiation_defaults() -> None:
    p = KimchiProvider("sk-test")
    assert p.api_key == "sk-test"
    assert p.model == "kimi-k2.6"
    assert p.base_url == BASE_URL
    assert p.temperature == 0.7
    assert p.max_tokens == 2048


def test_instantiation_custom() -> None:
    p = KimchiProvider(
        "sk-test",
        model="custom-model",
        base_url="https://custom.example.com/v1",
        temperature=0.5,
        max_tokens=1024,
        timeout=30.0,
    )
    assert p.model == "custom-model"
    assert p.base_url == "https://custom.example.com/v1"
    assert p.temperature == 0.5
    assert p.max_tokens == 1024
    assert p.timeout == 30.0


# ---------------------------------------------------------------------------
# payload generation
# ---------------------------------------------------------------------------
def test_payload_basic() -> None:
    p = KimchiProvider("sk-test")
    msg = Message(conversation_id="c1", role=Role.USER, content="Hello")
    payload = p._payload([msg], None, None, None, None, stream=False)
    assert payload["model"] == "kimi-k2.6"
    assert payload["messages"] == [{"role": "user", "content": "Hello"}]
    assert payload["temperature"] == 0.7
    assert payload["max_tokens"] == 2048
    assert payload["stream"] is False
    assert "tools" not in payload


def test_payload_with_tools() -> None:
    p = KimchiProvider("sk-test")
    msg = Message(conversation_id="c1", role=Role.USER, content="Hi")
    tool = ToolSpec(
        name="open_application",
        description="Open an app",
        parameters={"type": "object", "properties": {"name": {"type": "string"}}},
    )
    payload = p._payload([msg], [tool], None, None, None, stream=True)
    assert payload["stream"] is True
    assert "tools" in payload
    assert payload["tool_choice"] == "auto"


def test_payload_override_params() -> None:
    p = KimchiProvider("sk-test")
    msg = Message(conversation_id="c1", role=Role.USER, content="Hi")
    payload = p._payload([msg], None, "other-model", 0.3, 512, stream=False)
    assert payload["model"] == "other-model"
    assert payload["temperature"] == 0.3
    assert payload["max_tokens"] == 512


# ---------------------------------------------------------------------------
# complete — success
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_complete_success() -> None:
    p = KimchiProvider("sk-test")
    with respx.mock:
        route = respx.post(f"{BASE_URL}/chat/completions").mock(
            return_value=Response(
                200,
                json={
                    "choices": [
                        {"message": {"role": "assistant", "content": "Hello there"}}
                    ]
                },
            )
        )
        msg = Message(conversation_id="c1", role=Role.USER, content="Hi")
        result = await p.complete([msg])
        assert result.role == Role.ASSISTANT
        assert result.content == "Hello there"
        assert result.conversation_id == "c1"
        assert route.called
        request = route.calls[0].request
        assert request.headers["Authorization"] == "Bearer sk-test"


# ---------------------------------------------------------------------------
# complete — retry on 503
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_complete_retries_on_503() -> None:
    p = KimchiProvider("sk-test")
    with respx.mock:
        route = respx.post(f"{BASE_URL}/chat/completions").mock(
            side_effect=[
                Response(503, text="temporarily unavailable"),
                Response(503, text="still unavailable"),
                Response(
                    200,
                    json={
                        "choices": [
                            {"message": {"role": "assistant", "content": "Recovered"}}
                        ]
                    },
                ),
            ]
        )
        msg = Message(conversation_id="c1", role=Role.USER, content="Hi")
        result = await p.complete([msg])
        assert result.content == "Recovered"
        assert len(route.calls) == 3


# ---------------------------------------------------------------------------
# complete — retries exhausted
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_complete_retries_exhausted() -> None:
    p = KimchiProvider("sk-test", timeout=1.0)
    with respx.mock:
        route = respx.post(f"{BASE_URL}/chat/completions").mock(
            return_value=Response(503, text="down")
        )
        msg = Message(conversation_id="c1", role=Role.USER, content="Hi")
        with pytest.raises(LLMError, match="503"):
            await p.complete([msg])
        assert len(route.calls) == 3


# ---------------------------------------------------------------------------
# complete — non-retryable error
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_complete_no_retry_on_400() -> None:
    p = KimchiProvider("sk-test")
    with respx.mock:
        route = respx.post(f"{BASE_URL}/chat/completions").mock(
            return_value=Response(400, text="bad request")
        )
        msg = Message(conversation_id="c1", role=Role.USER, content="Hi")
        with pytest.raises(LLMError, match="400"):
            await p.complete([msg])
        assert len(route.calls) == 1


# ---------------------------------------------------------------------------
# stream — success
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_stream_success() -> None:
    p = KimchiProvider("sk-test")
    with respx.mock:
        route = respx.post(f"{BASE_URL}/chat/completions").mock(
            return_value=Response(
                200,
                text="data: {\"choices\":[{\"delta\":{\"content\":\"Hello \"}}]}\n\n"
                "data: {\"choices\":[{\"delta\":{\"content\":\"world\"}}]}\n\n"
                "data: [DONE]\n\n",
            )
        )
        msg = Message(conversation_id="c1", role=Role.USER, content="Hi")
        chunks = [c async for c in p.stream([msg])]
        assert [c.type for c in chunks] == ["text", "text", "done"]
        assert chunks[0].text == "Hello "
        assert chunks[1].text == "world"
        assert route.called


# ---------------------------------------------------------------------------
# stream — tool calls assembled
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_stream_tool_calls() -> None:
    p = KimchiProvider("sk-test")
    with respx.mock:
        respx.post(f"{BASE_URL}/chat/completions").mock(
            return_value=Response(
                200,
                text='data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","function":{"name":"open_app"}}]}}]}\n\n'
                'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\\"name\\": \\"Calc\\"}"}}]}}]}\n\n'
                "data: [DONE]\n\n",
            )
        )
        msg = Message(conversation_id="c1", role=Role.USER, content="Open calculator")
        chunks = [c async for c in p.stream([msg])]
        tool_chunks = [c for c in chunks if c.type == "tool_call"]
        assert len(tool_chunks) == 1
        assert tool_chunks[0].data["name"] == "open_app"
        assert tool_chunks[0].data["arguments"] == {"name": "Calc"}


# ---------------------------------------------------------------------------
# stream — retry on transient error
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_stream_retries_on_503() -> None:
    p = KimchiProvider("sk-test")
    with respx.mock:
        route = respx.post(f"{BASE_URL}/chat/completions").mock(
            side_effect=[
                Response(503, text="temporarily unavailable"),
                Response(
                    200,
                    text="data: {\"choices\":[{\"delta\":{\"content\":\"Recovered\"}}]}\n\n"
                    "data: [DONE]\n\n",
                ),
            ]
        )
        msg = Message(conversation_id="c1", role=Role.USER, content="Hi")
        chunks = [c async for c in p.stream([msg])]
        assert chunks[0].text == "Recovered"
        assert len(route.calls) == 2


# ---------------------------------------------------------------------------
# stream — error chunk on exhausted retries
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_stream_error_on_exhausted_retries() -> None:
    p = KimchiProvider("sk-test", timeout=1.0)
    with respx.mock:
        respx.post(f"{BASE_URL}/chat/completions").mock(
            return_value=Response(503, text="down")
        )
        msg = Message(conversation_id="c1", role=Role.USER, content="Hi")
        chunks = [c async for c in p.stream([msg])]
        assert len(chunks) == 1
        assert chunks[0].type == "error"
        assert "503" in chunks[0].text


# ---------------------------------------------------------------------------
# _is_transient helper
# ---------------------------------------------------------------------------
def test_is_transient() -> None:
    assert _is_transient(httpx.ConnectError("conn"))
    assert _is_transient(httpx.TimeoutException("timeout"))
    assert _is_transient(httpx.NetworkError("net"))
    assert _is_transient(httpx.HTTPStatusError("", request=None, response=Response(503)))  # type: ignore[arg-type]
    assert _is_transient(httpx.HTTPStatusError("", request=None, response=Response(429)))  # type: ignore[arg-type]
    assert not _is_transient(httpx.HTTPStatusError("", request=None, response=Response(400)))  # type: ignore[arg-type]
    assert not _is_transient(ValueError("nope"))


# ---------------------------------------------------------------------------
# config integration
# ---------------------------------------------------------------------------
def test_llm_configured_openrouter() -> None:
    from jarvis.config import Settings

    s = Settings()
    s.openrouter_api_key = "sk-or"
    s.llm_provider = "openrouter"
    assert s.llm_configured is True


def test_llm_configured_kimchi() -> None:
    from jarvis.config import Settings

    s = Settings()
    s.openrouter_api_key = ""
    s.kimchi_api_key = "sk-kimchi"
    s.llm_provider = "kimchi"
    assert s.llm_configured is True


def test_llm_configured_neither() -> None:
    from jarvis.config import Settings

    s = Settings()
    s.openrouter_api_key = ""
    s.kimchi_api_key = ""
    s.llm_provider = "kimchi"
    assert s.llm_configured is False


# ---------------------------------------------------------------------------
# provider selection from container
# ---------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_container_selects_kimchi_when_configured(monkeypatch) -> None:
    from jarvis.config import Settings, get_settings
    from jarvis.container import build_container

    monkeypatch.setenv("KIMCHI_API_KEY", "sk-kimchi")
    monkeypatch.setenv("JARVIS_LLM_PROVIDER", "kimchi")
    monkeypatch.setenv("JARVIS_DATA_DIR", "/tmp/jarvis-test")
    monkeypatch.setenv("JARVIS_SQLITE_PATH", "/tmp/jarvis-test/db")
    monkeypatch.setenv("JARVIS_CHROMA_DIR", "/tmp/jarvis-test/chroma")
    monkeypatch.setenv("JARVIS_AUDIT_DIR", "/tmp/jarvis-test/audit")
    monkeypatch.setenv("JARVIS_WORKSPACE_DIR", "/tmp/jarvis-test/ws")
    get_settings.cache_clear()
    s = Settings()
    s.ensure_dirs()
    c = build_container(s)
    from jarvis.llm.kimchi import KimchiProvider

    assert isinstance(c.engine.llm, KimchiProvider)  # type: ignore[union-attr]
