"""Tests for SQLAlchemy ORM models."""

from __future__ import annotations

import pytest
from sqlalchemy.orm import Session

from jarvis.db.engine import create_db_engine, get_session, init_db
from jarvis.db.models import (
    ConversationMetadata,
    Project,
    Task,
    UserPreference,
)


@pytest.fixture
def db_session(tmp_path):
    """A SQLAlchemy session backed by a temporary SQLite file."""
    path = tmp_path / "test_sa.db"
    engine = create_db_engine(path)
    init_db(engine)
    session = get_session(engine)
    yield session
    session.close()


# ---------------------------------------------------------------------------
# UserPreference
# ---------------------------------------------------------------------------
def test_user_preference_crud(db_session: Session) -> None:
    pref = UserPreference(key="theme", value="dark", category="ui")
    db_session.add(pref)
    db_session.commit()

    fetched = db_session.query(UserPreference).filter_by(key="theme").first()
    assert fetched is not None
    assert fetched.value == "dark"
    assert fetched.category == "ui"
    assert fetched.json_value is None


def test_user_preference_json_value(db_session: Session) -> None:
    pref = UserPreference(
        key="shortcuts",
        value="",
        json_value={"ctrl+t": "new_task", "ctrl+n": "new_chat"},
    )
    db_session.add(pref)
    db_session.commit()

    fetched = db_session.query(UserPreference).filter_by(key="shortcuts").first()
    assert fetched.json_value == {"ctrl+t": "new_task", "ctrl+n": "new_chat"}


def test_user_preference_unique_key(db_session: Session) -> None:
    db_session.add(UserPreference(key="dup", value="a"))
    db_session.commit()
    db_session.add(UserPreference(key="dup", value="b"))
    with pytest.raises(Exception):
        db_session.commit()


# ---------------------------------------------------------------------------
# Project
# ---------------------------------------------------------------------------
def test_project_crud(db_session: Session) -> None:
    proj = Project(name="Weather App", description="A simple weather app", status="active")
    db_session.add(proj)
    db_session.commit()

    fetched = db_session.query(Project).filter_by(name="Weather App").first()
    assert fetched is not None
    assert fetched.status == "active"
    assert fetched.tasks == []


def test_project_metadata_json(db_session: Session) -> None:
    proj = Project(
        name="Portfolio",
        metadata_json={"tech_stack": ["react", "tailwind"], "client": "acme"},
    )
    db_session.add(proj)
    db_session.commit()

    fetched = db_session.query(Project).filter_by(name="Portfolio").first()
    assert fetched.metadata_json["tech_stack"] == ["react", "tailwind"]


# ---------------------------------------------------------------------------
# Task
# ---------------------------------------------------------------------------
def test_task_crud(db_session: Session) -> None:
    proj = Project(name="Game", status="active")
    db_session.add(proj)
    db_session.commit()

    task = Task(
        project_id=proj.id,
        title="Implement inventory",
        description="Add inventory system",
        status="in_progress",
        priority="high",
    )
    db_session.add(task)
    db_session.commit()

    fetched = db_session.query(Task).filter_by(title="Implement inventory").first()
    assert fetched is not None
    assert fetched.status == "in_progress"
    assert fetched.priority == "high"
    assert fetched.project.name == "Game"


def test_task_cascade_delete(db_session: Session) -> None:
    proj = Project(name="Temp", status="active")
    db_session.add(proj)
    db_session.commit()

    task = Task(project_id=proj.id, title="T1", status="pending")
    db_session.add(task)
    db_session.commit()

    db_session.delete(proj)
    db_session.commit()

    assert db_session.query(Task).filter_by(title="T1").first() is None


# ---------------------------------------------------------------------------
# ConversationMetadata
# ---------------------------------------------------------------------------
def test_conversation_metadata_crud(db_session: Session) -> None:
    meta = ConversationMetadata(
        id="abc123",
        conversation_id="conv-001",
        channel="desktop",
        title_override="Weather Chat",
        summary="Discussed weather API options",
        message_count=12,
        token_usage=345,
        tags=["weather", "api"],
    )
    db_session.add(meta)
    db_session.commit()

    fetched = db_session.query(ConversationMetadata).filter_by(conversation_id="conv-001").first()
    assert fetched is not None
    assert fetched.channel == "desktop"
    assert fetched.title_override == "Weather Chat"
    assert fetched.summary == "Discussed weather API options"
    assert fetched.message_count == 12
    assert fetched.token_usage == 345
    assert fetched.tags == ["weather", "api"]
    assert fetched.archived == 0


def test_conversation_metadata_unique_conversation_id(db_session: Session) -> None:
    db_session.add(ConversationMetadata(id="a", conversation_id="c1"))
    db_session.commit()
    db_session.add(ConversationMetadata(id="b", conversation_id="c1"))
    with pytest.raises(Exception):
        db_session.commit()
