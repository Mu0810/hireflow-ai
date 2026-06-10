"""SQLAlchemy engine and session utilities.

Provides a single SQLite engine with WAL mode for compatibility with the
existing raw-sqlite memory store, plus an async-aware session factory.
"""

from __future__ import annotations

from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker


def create_db_engine(sqlite_path: str | Path) -> "sqlalchemy.Engine":
    """Create a SQLite engine with WAL mode enabled."""
    path = Path(sqlite_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(
        f"sqlite:///{path}",
        connect_args={"check_same_thread": False},
        echo=False,
    )
    # Enable WAL so the engine plays nicely with the raw sqlite3 connections
    # used by SQLiteStore in the same process.
    @event.listens_for(engine, "connect")
    def _set_wal(dbapi_conn, _connection_record):
        dbapi_conn.execute("PRAGMA journal_mode = WAL")
        dbapi_conn.execute("PRAGMA foreign_keys = ON")

    return engine


SessionLocal = sessionmaker(autocommit=False, autoflush=False)


def get_session(engine) -> Session:
    """Return a new Session bound to *engine*."""
    return SessionLocal(bind=engine)


def init_db(engine) -> None:
    """Create all SQLAlchemy-managed tables."""
    from . import models  # noqa: F401 – imports register models with Base metadata
    from .models import Base

    Base.metadata.create_all(bind=engine)
