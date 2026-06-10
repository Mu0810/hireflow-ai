"""Capability-based permission service.

Every tool declares a ``capability`` (e.g. ``fs.write``, ``shell.exec``). The
permission service checks the call against the configured allowlist before the
tool runs. Capabilities support a simple ``prefix.*`` wildcard.
"""

from __future__ import annotations

from ..core.errors import PermissionDenied
from ..logging import get_logger

log = get_logger(__name__)

# Known capabilities, documented for the dashboard/settings page.
KNOWN_CAPABILITIES = {
    "fs.read": "Read files within the workspace",
    "fs.write": "Create/modify files within the workspace",
    "shell.exec": "Execute allow-listed shell commands",
    "app.open": "Open desktop applications / URLs",
    "browser": "Drive a headless/visible browser",
    "network": "Make outbound network requests",
    "memory.write": "Store long-term memories",
    "macos.system": "Control macOS system functions (volume, brightness, screenshots, lock, sleep, apps)",
}


class PermissionService:
    def __init__(self, granted: list[str]) -> None:
        # Normalise; memory.write is always granted (agent self-management).
        self._granted = set(granted) | {"memory.write"}

    def granted(self) -> list[str]:
        return sorted(self._granted)

    def is_granted(self, capability: str | None) -> bool:
        if capability is None:
            return True  # capability-free tools are always allowed
        if capability in self._granted:
            return True
        # wildcard: granting "fs.*" allows "fs.read", "fs.write"
        prefix = capability.split(".", 1)[0]
        return f"{prefix}.*" in self._granted or "*" in self._granted

    def check(self, capability: str | None, detail: str = "") -> None:
        if not self.is_granted(capability):
            raise PermissionDenied(capability or "unknown", detail)

    def grant(self, capability: str) -> None:
        self._granted.add(capability)

    def revoke(self, capability: str) -> None:
        self._granted.discard(capability)
