"""Confirmation gate for dangerous actions.

Different surfaces need different confirmation behaviour:

* CLI — prompt the user interactively (y/N).
* Bots / dashboard / voice — non-interactive; apply a policy. By default,
  dangerous actions are auto-denied unless confirmation is disabled in settings
  or the specific action has been pre-approved for the session.

All implementations satisfy :class:`jarvis.core.interfaces.Confirmer`.
"""

from __future__ import annotations

import anyio


class AutoConfirmer:
    """Non-interactive policy confirmer (for bots, dashboard, voice)."""

    def __init__(self, *, require_confirmation: bool, default_allow: bool = False) -> None:
        self.require_confirmation = require_confirmation
        self.default_allow = default_allow
        self._approved: set[str] = set()

    def preapprove(self, action: str) -> None:
        self._approved.add(action)

    async def confirm(self, action: str, detail: str = "") -> bool:
        if not self.require_confirmation:
            return True
        if action in self._approved:
            return True
        return self.default_allow


class CLIConfirmer:
    """Interactive y/N confirmer for the terminal."""

    def __init__(self, *, require_confirmation: bool) -> None:
        self.require_confirmation = require_confirmation

    async def confirm(self, action: str, detail: str = "") -> bool:
        if not self.require_confirmation:
            return True
        prompt = f"\n[confirm] Allow: {action}"
        if detail:
            prompt += f"\n          {detail}"
        prompt += "\n          Proceed? [y/N] "

        # input() is blocking — run it off the event loop.
        def _ask() -> bool:
            try:
                return input(prompt).strip().lower() in {"y", "yes"}
            except EOFError:
                return False

        return await anyio.to_thread.run_sync(_ask)


class AlwaysAllowConfirmer:
    """For tests / fully-trusted contexts."""

    async def confirm(self, action: str, detail: str = "") -> bool:
        return True


class PySide6Confirmer:
    """Modal dialog confirmer for the PySide6 desktop UI.

    Shows a QMessageBox with Yes/No buttons for dangerous actions.
    Supports an emergency-stop flag that auto-denies everything.
    """

    def __init__(
        self,
        *,
        parent=None,
        require_confirmation: bool,
        default_allow: bool = False,
    ) -> None:
        self.parent = parent
        self.require_confirmation = require_confirmation
        self.default_allow = default_allow
        self.emergency_stop = False
        self._approved: set[str] = set()

    def trigger_emergency_stop(self) -> None:
        """Activate emergency stop — all future dangerous actions are denied."""
        self.emergency_stop = True

    def clear_emergency_stop(self) -> None:
        """Deactivate emergency stop."""
        self.emergency_stop = False

    def preapprove(self, action: str) -> None:
        self._approved.add(action)

    async def confirm(self, action: str, detail: str = "") -> bool:
        if not self.require_confirmation:
            return True
        if action in self._approved:
            return True
        if self.emergency_stop:
            return False
        if self.default_allow:
            return True

        # Modal dialog blocks the coroutine but Qt events are still processed.
        from PySide6.QtWidgets import QMessageBox

        msg = QMessageBox(self.parent)
        msg.setWindowTitle("Confirm Action")
        msg.setText(f"Allow: <b>{action}</b>")
        msg.setInformativeText(detail)
        msg.setStandardButtons(
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        msg.setDefaultButton(QMessageBox.StandardButton.No)
        msg.setIcon(QMessageBox.Icon.Warning)
        result = msg.exec()
        return result == QMessageBox.StandardButton.Yes
