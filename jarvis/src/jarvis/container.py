"""Composition root.

Assembles the whole object graph from :class:`Settings`, honouring the
dependency rule (everything depends inward on ``core`` protocols). Surfaces
(CLI, dashboard, channels) call :func:`build_container` to get a ready-to-use
:class:`Container`.

The ``confirmer`` differs per surface: the CLI uses an interactive one, bots and
the dashboard use a policy-based one.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .agent.engine import AgentEngine
from .config import Settings, get_settings
from .core.interfaces import Confirmer
from .llm.kimchi import KimchiProvider
from .llm.openrouter import OpenRouterProvider
from .logging import get_logger, setup_logging
from .mcp.manager import MCPManager
from .memory.service import MemoryService
from .memory.sqlite_store import SQLiteStore
from .memory.vector_store import ChromaVectorStore
from .plugins.loader import PluginManager
from .security.audit import AuditLogger
from .security.confirm import AutoConfirmer, CLIConfirmer
from .security.gate import SecurityGate
from .security.permissions import PermissionService
from .security.sandbox import CommandSandbox, PathJail
from .tools.browser import BrowserSession, register_browser_tools
from .tools.computer import register_computer_tools
from .tools.files import register_file_tools
from .tools.memory_tools import register_memory_tools
from .tools.registry import Registry
from .voice.status import VoiceStatus

log = get_logger(__name__)


@dataclass
class Container:
    settings: Settings
    memory: MemoryService
    permissions: PermissionService
    audit: AuditLogger
    gate: SecurityGate
    registry: Registry
    plugins: PluginManager
    mcp: MCPManager
    browser: BrowserSession
    engine: AgentEngine
    voice_status: VoiceStatus

    async def startup(self) -> None:
        """Async initialisation: connect MCP servers (best-effort)."""
        await self.mcp.connect_all()

    async def shutdown(self) -> None:
        await self.mcp.close_all()
        await self.browser.close()


def build_container(
    settings: Settings | None = None,
    *,
    confirmer: Confirmer | None = None,
    interactive: bool = False,
) -> Container:
    settings = settings or get_settings()
    setup_logging(settings.log_level, settings.log_json)
    settings.ensure_dirs()

    # --- memory ---
    store = SQLiteStore(settings.sqlite_path)
    vectors = ChromaVectorStore(settings.chroma_dir, prefer_fallback=settings.vector_fallback)
    memory = MemoryService(store, vectors)
    memory.init()

    # --- security ---
    permissions = PermissionService(settings.allowed_capabilities)
    audit = AuditLogger(settings.audit_dir)
    if confirmer is None:
        confirmer = (
            CLIConfirmer(require_confirmation=settings.require_confirmation)
            if interactive
            else AutoConfirmer(require_confirmation=settings.require_confirmation)
        )
    gate = SecurityGate(permissions, confirmer, audit)

    # --- tools ---
    registry = Registry(gate)
    jail = PathJail(settings.workspace_dir)
    sandbox = CommandSandbox(
        settings.shell_allowlist, cwd=settings.workspace_dir, timeout=settings.shell_timeout
    )
    browser = BrowserSession(headless=True)

    register_file_tools(registry, jail)
    register_computer_tools(registry, sandbox)
    register_browser_tools(registry, browser)
    register_memory_tools(registry, memory)

    # --- plugins ---
    plugins = PluginManager(settings, memory, registry)
    plugins.load_all()

    # --- mcp (connected lazily in startup) ---
    mcp = MCPManager(settings, registry)

    # --- llm + engine ---
    llm: Any = None
    if settings.llm_configured:
        if settings.llm_provider == "kimchi":
            llm = KimchiProvider(
                settings.kimchi_api_key,
                model=settings.llm_model,
                base_url=settings.kimchi_base_url,
                temperature=settings.llm_temperature,
                max_tokens=settings.llm_max_tokens,
            )
        else:
            llm = OpenRouterProvider(
                settings.openrouter_api_key,
                model=settings.llm_model,
                base_url=settings.openrouter_base_url,
                referrer=settings.openrouter_referrer,
                title=settings.openrouter_title,
                temperature=settings.llm_temperature,
                max_tokens=settings.llm_max_tokens,
            )

    engine = AgentEngine(settings, llm, memory, registry) if llm else None  # type: ignore[arg-type]

    return Container(
        settings=settings,
        memory=memory,
        permissions=permissions,
        audit=audit,
        gate=gate,
        registry=registry,
        plugins=plugins,
        mcp=mcp,
        browser=browser,
        engine=engine,  # type: ignore[arg-type]
        voice_status=VoiceStatus(),
    )
