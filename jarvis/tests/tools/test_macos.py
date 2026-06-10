"""Tests for macOS-specific tools."""

from __future__ import annotations

import platform
from unittest.mock import MagicMock, patch

import pytest

from jarvis.tools.macos import _run_applescript, _take_screenshot, register_macos_tools
from jarvis.tools.registry import Registry


@pytest.fixture
def macos_registry():
    from jarvis.security.gate import SecurityGate
    from jarvis.security.permissions import PermissionService

    gate = SecurityGate(
        PermissionService(["macos.system"]),
        MagicMock(),
        MagicMock(),
    )
    return Registry(gate)


# ---------------------------------------------------------------------------
# _run_applescript
# ---------------------------------------------------------------------------
@patch("jarvis.tools.macos.subprocess.run")
def test_run_applescript_success(mock_run) -> None:
    mock_run.return_value = MagicMock(returncode=0, stdout="Hello\n", stderr="")
    out = _run_applescript('display dialog "test"')
    assert out == "Hello"
    mock_run.assert_called_once()
    args = mock_run.call_args[0][0]
    assert args[0] == "osascript"


@patch("jarvis.tools.macos.subprocess.run")
def test_run_applescript_failure(mock_run) -> None:
    from jarvis.core.errors import ToolError

    mock_run.return_value = MagicMock(returncode=1, stdout="", stderr="syntax error")
    with pytest.raises(ToolError, match="AppleScript failed"):
        _run_applescript("bad script")


# ---------------------------------------------------------------------------
# _take_screenshot
# ---------------------------------------------------------------------------
@patch("jarvis.tools.macos.subprocess.run")
def test_take_screenshot_success(mock_run, tmp_path) -> None:
    mock_run.return_value = MagicMock(returncode=0, stdout="", stderr="")
    path = tmp_path / "screenshot.png"
    out = _take_screenshot(str(path))
    assert "Screenshot saved" in out
    assert str(path) in out
    mock_run.assert_called_once()


# ---------------------------------------------------------------------------
# register & dispatch
# ---------------------------------------------------------------------------
@pytest.fixture
def macos_tools():
    from jarvis.security.gate import SecurityGate
    from jarvis.security.permissions import PermissionService
    from jarvis.tools.registry import Registry

    gate = SecurityGate(
        PermissionService(["macos.system"]),
        MagicMock(),
        MagicMock(),
    )
    reg = Registry(gate)
    register_macos_tools(reg)
    return reg


@pytest.mark.asyncio
async def test_set_volume(macos_tools) -> None:
    with patch("jarvis.tools.macos._run_applescript") as mock:
        mock.return_value = ""
        tool = macos_tools._tools["set_volume"]
        result = await tool[1]({"level": 50})
        assert "50" in result
        mock.assert_called_once()


@pytest.mark.asyncio
async def test_get_volume(macos_tools) -> None:
    with patch("jarvis.tools.macos._run_applescript") as mock:
        mock.return_value = "75"
        tool = macos_tools._tools["get_volume"]
        result = await tool[1]({})
        assert "75" in result


@pytest.mark.asyncio
async def test_lock_screen(macos_tools) -> None:
    with patch("jarvis.tools.macos._run_applescript") as mock:
        mock.return_value = ""
        tool = macos_tools._tools["lock_screen"]
        result = await tool[1]({})
        assert "locked" in result.lower()


@pytest.mark.asyncio
async def test_sleep_system(macos_tools) -> None:
    with patch("jarvis.tools.macos._run_applescript") as mock:
        mock.return_value = ""
        tool = macos_tools._tools["sleep_system"]
        result = await tool[1]({})
        assert "sleep" in result.lower()


@pytest.mark.asyncio
async def test_open_app(macos_tools) -> None:
    with patch("jarvis.tools.macos._run_applescript") as mock:
        mock.return_value = ""
        tool = macos_tools._tools["open_app"]
        result = await tool[1]({"name": "Safari"})
        assert "Safari" in result


@pytest.mark.asyncio
async def test_quit_app(macos_tools) -> None:
    with patch("jarvis.tools.macos._run_applescript") as mock:
        mock.return_value = ""
        tool = macos_tools._tools["quit_app"]
        result = await tool[1]({"name": "Safari"})
        assert "Quit" in result
        assert "Safari" in result


@pytest.mark.asyncio
async def test_switch_app(macos_tools) -> None:
    with patch("jarvis.tools.macos._run_applescript") as mock:
        mock.return_value = ""
        tool = macos_tools._tools["switch_app"]
        result = await tool[1]({"name": "Finder"})
        assert "Finder" in result


@pytest.mark.asyncio
async def test_run_applescript(macos_tools) -> None:
    with patch("jarvis.tools.macos._run_applescript") as mock:
        mock.return_value = "result text"
        tool = macos_tools._tools["run_applescript"]
        result = await tool[1]({"script": 'display dialog "hi"'})
        assert result == "result text"


@pytest.mark.asyncio
async def test_take_screenshot_tool(macos_tools, tmp_path) -> None:
    with patch("jarvis.tools.macos._take_screenshot") as mock:
        mock.return_value = "saved"
        tool = macos_tools._tools["take_screenshot"]
        result = await tool[1]({"path": str(tmp_path / "ss.png")})
        assert result == "saved"


@pytest.mark.asyncio
async def test_set_brightness(macos_tools) -> None:
    with patch("jarvis.tools.macos._run_applescript") as mock:
        mock.return_value = ""
        tool = macos_tools._tools["set_brightness"]
        result = await tool[1]({"level": 80})
        assert "80" in result


@pytest.mark.asyncio
async def test_get_brightness(macos_tools) -> None:
    tool = macos_tools._tools["get_brightness"]
    result = await tool[1]({})
    assert "permissions" in result.lower()
