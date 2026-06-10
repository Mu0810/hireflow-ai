"""macOS-specific control tools using AppleScript and system utilities.

These tools provide control over macOS system functions that are not available
through cross-platform APIs. They require macOS and may prompt for accessibility
permissions for some actions (e.g., screenshots, volume control).
"""

from __future__ import annotations

import platform
import subprocess
from pathlib import Path

from ..core.errors import ToolError
from .registry import Registry, tool_spec


def _run_applescript(script: str) -> str:
    """Execute an AppleScript and return stdout, or raise ToolError."""
    if platform.system() != "Darwin":
        raise ToolError("macOS tools only work on Darwin (macOS).")
    try:
        result = subprocess.run(
            ["osascript", "-e", script],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode != 0:
            err = result.stderr.strip()[:200]
            raise ToolError(f"AppleScript failed: {err}")
        return result.stdout.strip()
    except subprocess.TimeoutExpired as exc:
        raise ToolError("AppleScript timed out") from exc
    except FileNotFoundError as exc:
        raise ToolError("osascript not found — are you on macOS?") from exc


def _take_screenshot(path: str) -> str:
    """Capture the screen using macOS screencapture utility."""
    if platform.system() != "Darwin":
        raise ToolError("Screenshot only works on macOS.")
    out = Path(path).expanduser()
    out.parent.mkdir(parents=True, exist_ok=True)
    try:
        subprocess.run(
            ["screencapture", str(out)],
            capture_output=True,
            check=True,
            timeout=15,
        )
        return f"Screenshot saved to {out}"
    except subprocess.CalledProcessError as exc:
        raise ToolError(f"Screenshot failed: {exc.stderr.decode()[:200]}") from exc


def register_macos_tools(registry: Registry) -> None:
    async def set_volume(args: dict) -> str:
        level = max(0, min(100, int(args["level"])))
        _run_applescript(f'set volume output volume {level}')
        return f"System volume set to {level}"

    async def get_volume(_args: dict) -> str:
        out = _run_applescript('output volume of (get volume settings)')
        return f"Current system volume: {out}"

    async def set_brightness(args: dict) -> str:
        level = max(0, min(100, int(args["level"])))
        # Brightness via AppleScript is unreliable; use display-brightness CLI if available.
        # Fallback: osascript via System Events (requires accessibility permissions).
        script = (
            'tell application "System Events" to tell appearance preferences to '
            f'set autohide menu bar to false'  # dummy to force System Events launch
        )
        try:
            # Try brightness-cli wrapper approach with osascript.
            script = (
                'tell application "System Events" to key code 144 using {option down, shift down}'
                if level > 50 else
                'tell application "System Events" to key code 145 using {option down, shift down}'
            )
            _run_applescript(script)
            return f"Brightness adjusted toward {level}% (use accessibility permissions for precise control)"
        except ToolError:
            # If accessibility is denied, return a helpful message.
            return (
                f"Could not set brightness to {level}%. "
                "Grant accessibility permissions to JARVIS in System Preferences > Security & Privacy."
            )

    async def get_brightness(_args: dict) -> str:
        return "Brightness reading requires accessibility permissions on macOS."

    async def take_screenshot(args: dict) -> str:
        path = args.get("path", "~/Desktop/jarvis_screenshot.png")
        return _take_screenshot(path)

    async def lock_screen(_args: dict) -> str:
        # Modern macOS: pmset displaysleepnow + Keychain lock
        # Or: osascript 'tell application "System Events" to keystroke "q" using {command down, control down}'
        _run_applescript(
            'tell application "System Events" to keystroke "q" using {command down, control down}'
        )
        return "Screen locked."

    async def sleep_system(_args: dict) -> str:
        _run_applescript('tell application "Finder" to sleep')
        return "System is going to sleep."

    async def open_app(args: dict) -> str:
        name = args["name"]
        _run_applescript(f'tell application "{name}" to activate')
        return f"Activated application: {name}"

    async def quit_app(args: dict) -> str:
        name = args["name"]
        _run_applescript(f'tell application "{name}" to quit')
        return f"Quit application: {name}"

    async def switch_app(args: dict) -> str:
        name = args["name"]
        _run_applescript(f'tell application "{name}" to activate')
        return f"Switched to application: {name}"

    async def run_applescript(args: dict) -> str:
        script = args["script"]
        out = _run_applescript(script)
        return out or "(no output)"

    registry.register(
        tool_spec(
            "set_volume",
            "Set the system output volume (0-100).",
            {"type": "object", "properties": {"level": {"type": "integer", "minimum": 0, "maximum": 100}}, "required": ["level"]},
            capability="macos.system",
            dangerous=True,
        ),
        set_volume,
    )
    registry.register(
        tool_spec(
            "get_volume",
            "Get the current system output volume.",
            {"type": "object", "properties": {}},
            capability="macos.system",
        ),
        get_volume,
    )
    registry.register(
        tool_spec(
            "set_brightness",
            "Set the display brightness (0-100). Requires accessibility permissions.",
            {"type": "object", "properties": {"level": {"type": "integer", "minimum": 0, "maximum": 100}}, "required": ["level"]},
            capability="macos.system",
            dangerous=True,
        ),
        set_brightness,
    )
    registry.register(
        tool_spec(
            "get_brightness",
            "Get the current display brightness.",
            {"type": "object", "properties": {}},
            capability="macos.system",
        ),
        get_brightness,
    )
    registry.register(
        tool_spec(
            "take_screenshot",
            "Capture a screenshot and save it to the given path.",
            {"type": "object", "properties": {"path": {"type": "string", "default": "~/Desktop/jarvis_screenshot.png"}}},
            capability="macos.system",
            dangerous=True,
        ),
        take_screenshot,
    )
    registry.register(
        tool_spec(
            "lock_screen",
            "Lock the screen immediately.",
            {"type": "object", "properties": {}},
            capability="macos.system",
            dangerous=True,
        ),
        lock_screen,
    )
    registry.register(
        tool_spec(
            "sleep_system",
            "Put the system to sleep.",
            {"type": "object", "properties": {}},
            capability="macos.system",
            dangerous=True,
        ),
        sleep_system,
    )
    registry.register(
        tool_spec(
            "open_app",
            "Open or activate a macOS application by name.",
            {"type": "object", "properties": {"name": {"type": "string"}}, "required": ["name"]},
            capability="macos.system",
            dangerous=True,
        ),
        open_app,
    )
    registry.register(
        tool_spec(
            "quit_app",
            "Quit a macOS application by name.",
            {"type": "object", "properties": {"name": {"type": "string"}}, "required": ["name"]},
            capability="macos.system",
            dangerous=True,
        ),
        quit_app,
    )
    registry.register(
        tool_spec(
            "switch_app",
            "Switch focus to a macOS application by name.",
            {"type": "object", "properties": {"name": {"type": "string"}}, "required": ["name"]},
            capability="macos.system",
            dangerous=True,
        ),
        switch_app,
    )
    registry.register(
        tool_spec(
            "run_applescript",
            "Execute an arbitrary AppleScript snippet and return its output.",
            {"type": "object", "properties": {"script": {"type": "string"}}, "required": ["script"]},
            capability="macos.system",
            dangerous=True,
        ),
        run_applescript,
    )
