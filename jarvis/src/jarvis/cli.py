"""Jarvis command-line interface (Typer).

Subcommands:
    chat       interactive terminal conversation
    desktop    run the PySide6 desktop application
    serve      run the FastAPI dashboard
    telegram   run the Telegram bot
    voice      start the voice loop (requires the [voice] extra + ffmpeg)
    plugins    list discovered plugins
    memory     search / inspect long-term memory
    doctor     environment readiness check
"""

from __future__ import annotations

import asyncio

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from .config import get_settings

app = typer.Typer(
    add_completion=False,
    help="Jarvis — your personal AI assistant.",
    no_args_is_help=True,
)
console = Console()


# ---------------------------------------------------------------------------
# chat
# ---------------------------------------------------------------------------
@app.command()
def chat() -> None:
    """Start an interactive terminal conversation."""
    from .container import build_container

    settings = get_settings()
    container = build_container(settings, interactive=True)
    if container.engine is None:
        console.print("[red]OPENROUTER_API_KEY is not set.[/] Add it to .env and retry.")
        raise typer.Exit(1)

    asyncio.run(_chat_loop(container))


async def _chat_loop(container) -> None:
    await container.startup()
    name = container.settings.assistant_name
    console.print(
        Panel.fit(
            f"[bold]{name}[/] is ready. Type your message, or [bold]/exit[/] to quit, "
            "[bold]/new[/] for a new conversation.",
            border_style="blue",
        )
    )
    conv = container.memory.start_conversation(channel="cli")
    try:
        while True:
            try:
                user = console.input("[bold cyan]you ›[/] ").strip()
            except (EOFError, KeyboardInterrupt):
                break
            if not user:
                continue
            if user in {"/exit", "/quit"}:
                break
            if user == "/new":
                conv = container.memory.start_conversation(channel="cli")
                console.print("[dim]— new conversation —[/]")
                continue
            with console.status("[dim]thinking…[/]"):
                reply = await container.engine.respond(conv.id, user)
            console.print(f"[bold green]{name} ›[/] {reply.content}")
    finally:
        await container.shutdown()
        console.print("\n[dim]Goodbye.[/]")


# ---------------------------------------------------------------------------
# desktop
# ---------------------------------------------------------------------------
@app.command()
def desktop() -> None:
    """Launch the native PySide6 desktop application."""
    from .container import build_container
    from .desktop.app import run_desktop

    settings = get_settings()
    container = build_container(settings)
    if container.engine is None:
        console.print(
            "[red]No LLM provider configured.[/] Set OPENROUTER_API_KEY or KIMCHI_API_KEY in .env"
        )
        raise typer.Exit(1)
    run_desktop(
        settings=container.settings,
        engine=container.engine,
        memory=container.memory,
        voice_status=container.voice_status,
    )


# ---------------------------------------------------------------------------
# serve
# ---------------------------------------------------------------------------
@app.command()
def serve(
    host: str = typer.Option(None, help="Bind host (defaults to JARVIS_HOST)."),
    port: int = typer.Option(None, help="Bind port (defaults to JARVIS_PORT)."),
    reload: bool = typer.Option(False, help="Enable autoreload (development)."),
    voice: bool = typer.Option(
        False,
        "--voice/--no-voice",
        help="Also run the voice loop in-process (the dashboard's orb reflects it "
        "and can toggle it). Avoid combining with --reload (starts voice per worker).",
    ),
) -> None:
    """Run the FastAPI web dashboard (optionally with the voice loop)."""
    import os

    import uvicorn

    settings = get_settings()
    host = host or settings.host
    port = port or settings.port
    if voice:
        # The app factory reads settings fresh in the (possibly reloaded) worker
        # process, so pass the intent through the environment.
        os.environ["JARVIS_VOICE_AUTOSTART"] = "true"
        console.print("[blue]Voice:[/] starting in-process (say the wake word to talk).")
    console.print(f"[blue]Dashboard:[/] http://{host}:{port}")
    uvicorn.run(
        "jarvis.api.app:create_app",
        factory=True,
        host=host,
        port=port,
        reload=reload,
    )


# ---------------------------------------------------------------------------
# telegram
# ---------------------------------------------------------------------------
@app.command()
def telegram() -> None:
    """Run the Telegram bot (requires TELEGRAM_BOT_TOKEN)."""
    from .channels.telegram import TelegramChannel
    from .container import build_container

    container = build_container(get_settings())
    if container.engine is None:
        console.print("[red]OPENROUTER_API_KEY is not set.[/]")
        raise typer.Exit(1)
    # TelegramChannel.run() is synchronous: it connects MCP via post_init and
    # then runs python-telegram-bot's polling loop (which manages its own loop).
    channel = TelegramChannel(container)
    try:
        channel.run()
    except KeyboardInterrupt:
        pass


# ---------------------------------------------------------------------------
# voice
# ---------------------------------------------------------------------------
@app.command()
def voice() -> None:
    """Start the always-on voice loop (requires the [voice] extra + ffmpeg)."""
    from .container import build_container
    from .voice.pipeline import VoicePipeline

    container = build_container(get_settings())
    if container.engine is None:
        console.print("[red]OPENROUTER_API_KEY is not set.[/]")
        raise typer.Exit(1)
    pipeline = VoicePipeline(container)
    asyncio.run(pipeline.run())


# ---------------------------------------------------------------------------
# plugins
# ---------------------------------------------------------------------------
plugins_app = typer.Typer(help="Manage plugins.")
app.add_typer(plugins_app, name="plugins")


@plugins_app.command("list")
def plugins_list() -> None:
    """List discovered plugins and their tools."""
    from .container import build_container

    container = build_container(get_settings())
    table = Table(title="Plugins")
    table.add_column("Name", style="cyan")
    table.add_column("Capabilities")
    table.add_column("Tools")
    for p in container.plugins.loaded:
        tools = ", ".join(meta["name"] for meta, _ in p.iter_tools())
        table.add_row(p.name, ", ".join(p.capabilities) or "-", tools)
    console.print(table)


# ---------------------------------------------------------------------------
# memory
# ---------------------------------------------------------------------------
memory_app = typer.Typer(help="Inspect long-term memory.")
app.add_typer(memory_app, name="memory")


@memory_app.command("search")
def memory_search(query: str, k: int = 6) -> None:
    """Semantic search over long-term memory."""
    from .container import build_container

    container = build_container(get_settings())
    results = container.memory.recall(query, k=k)
    if not results:
        console.print("[dim]No matches.[/]")
        return
    for r in results:
        console.print(f"[cyan]({r.kind}, {r.score})[/] {r.text}")


@memory_app.command("stats")
def memory_stats() -> None:
    """Show memory statistics."""
    from .container import build_container

    container = build_container(get_settings())
    console.print(container.memory.stats())


# ---------------------------------------------------------------------------
# doctor
# ---------------------------------------------------------------------------
@app.command()
def doctor() -> None:
    """Check environment readiness."""
    from .doctor import run_doctor

    run_doctor(console)


if __name__ == "__main__":
    app()
