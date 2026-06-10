"""Centralised, environment-driven configuration.

All settings load from environment variables (and a local ``.env``) via
pydantic-settings. Nothing else in the codebase should read ``os.environ``
directly — depend on :class:`Settings` instead so configuration stays in one
auditable place.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class MCPServerConfig(dict):
    """A plain dict describing one MCP server (name, command, args, env, url)."""


class Settings(BaseSettings):
    """Typed application configuration.

    Field names map to ``JARVIS_<UPPER>`` env vars by default; third-party
    tokens use their conventional names via explicit aliases.
    """

    model_config = SettingsConfigDict(
        env_prefix="JARVIS_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- LLM ---------------------------------------------------------------
    openrouter_api_key: str = Field("", alias="OPENROUTER_API_KEY")
    kimchi_api_key: str = Field("", alias="KIMCHI_API_KEY")
    llm_provider: str = "openrouter"
    llm_model: str = "anthropic/claude-3.5-sonnet"
    llm_fast_model: str = "anthropic/claude-3.5-haiku"
    llm_temperature: float = 0.7
    llm_max_tokens: int = 2048
    openrouter_referrer: str = "http://localhost:8000"
    openrouter_title: str = "Jarvis"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    kimchi_base_url: str = "https://llm.kimchi.dev/openai/v1"

    # --- Identity ----------------------------------------------------------
    assistant_name: str = "Jarvis"
    user_name: str = ""
    persona: str = "You are Jarvis, a concise, capable personal assistant."

    # --- Server ------------------------------------------------------------
    host: str = "127.0.0.1"
    port: int = 8000
    dashboard_token: str = ""

    # --- Storage -----------------------------------------------------------
    data_dir: Path = Path("./data")
    sqlite_path: Path = Path("./data/jarvis.db")
    chroma_dir: Path = Path("./data/chroma")
    audit_dir: Path = Path("./data/audit")

    # --- Memory ------------------------------------------------------------
    memory_recent_turns: int = 12
    memory_semantic_k: int = 6
    # Force the lightweight difflib-based semantic store instead of ChromaDB
    # (avoids downloading an embedding model; handy for minimal installs / CI).
    vector_fallback: bool = False

    # --- Security ----------------------------------------------------------
    # NoDecode: these accept comma-separated env values, parsed by the validators
    # below, instead of pydantic-settings' default JSON decoding.
    allowed_capabilities: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["fs.read", "app.open", "browser"]
    )
    workspace_dir: Path = Path("./workspace")
    shell_allowlist: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["ls", "cat", "echo", "pwd", "date", "whoami"]
    )
    shell_timeout: int = 20
    require_confirmation: bool = True

    # --- Channels ----------------------------------------------------------
    telegram_bot_token: str = Field("", alias="TELEGRAM_BOT_TOKEN")
    telegram_allowed_users: Annotated[list[int], NoDecode] = Field(default_factory=list)
    discord_bot_token: str = Field("", alias="DISCORD_BOT_TOKEN")
    slack_bot_token: str = Field("", alias="SLACK_BOT_TOKEN")
    slack_app_token: str = Field("", alias="SLACK_APP_TOKEN")

    # --- Voice -------------------------------------------------------------
    voice_wake_word: str = "jarvis"
    voice_stt_model: str = "base.en"
    voice_piper_model: Path = Path("./data/models/en_US-lessac-medium.onnx")
    voice_input_device: str = ""
    voice_output_device: str = ""
    # Energy gate (RMS, 0..1) for detecting that the user is speaking.
    voice_speech_threshold: float = 0.02
    # Barge-in: interrupt TTS playback when the user starts speaking.
    voice_barge_in: bool = True
    # RMS threshold for barge-in detection during playback. Higher = less
    # likely to self-trigger on the assistant's own audio through speakers.
    voice_barge_in_threshold: float = 0.05
    # Say a short acknowledgement ("Yes?") when the wake word fires.
    voice_acknowledge: bool = True
    # Seconds to keep listening for a follow-up before re-arming the wake word.
    voice_followup_timeout: float = 8.0
    # Start the voice loop automatically inside the dashboard process (`serve`).
    # The dashboard can also start/stop it at runtime from the UI.
    voice_autostart: bool = False

    # --- MCP ---------------------------------------------------------------
    mcp_servers: list[dict] = Field(default_factory=list)

    # --- Plugins -----------------------------------------------------------
    plugins_dir: Path = Path("./plugins")

    # --- Logging -----------------------------------------------------------
    log_level: str = "INFO"
    log_json: bool = False

    # ----------------------------------------------------------------------
    # Validators: accept comma-separated strings or JSON for list/dict fields
    # so the .env file stays human-friendly.
    # ----------------------------------------------------------------------
    @field_validator(
        "allowed_capabilities", "shell_allowlist", mode="before"
    )
    @classmethod
    def _split_csv(cls, v):
        if isinstance(v, str):
            return [item.strip() for item in v.split(",") if item.strip()]
        return v

    @field_validator("telegram_allowed_users", mode="before")
    @classmethod
    def _split_int_csv(cls, v):
        if isinstance(v, str):
            return [int(x) for x in v.split(",") if x.strip()]
        return v

    @field_validator("mcp_servers", mode="before")
    @classmethod
    def _parse_json_list(cls, v):
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return []
            return json.loads(v)
        return v

    # ----------------------------------------------------------------------
    # Derived helpers
    # ----------------------------------------------------------------------
    def ensure_dirs(self) -> None:
        """Create all runtime directories. Safe to call repeatedly."""
        for path in (
            self.data_dir,
            self.chroma_dir,
            self.audit_dir,
            self.workspace_dir,
            self.sqlite_path.parent,
        ):
            Path(path).mkdir(parents=True, exist_ok=True)

    @property
    def llm_configured(self) -> bool:
        if self.llm_provider == "kimchi":
            return bool(self.kimchi_api_key)
        return bool(self.openrouter_api_key)


@lru_cache
def get_settings() -> Settings:
    """Return the process-wide settings singleton."""
    return Settings()
