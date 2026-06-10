"""Tests for tools + registry (dispatch, file tools, security integration)."""

from __future__ import annotations

import pytest

from jarvis.core.models import ToolCall
from jarvis.security.audit import AuditLogger
from jarvis.security.confirm import AlwaysAllowConfirmer
from jarvis.security.gate import SecurityGate
from jarvis.security.permissions import PermissionService
from jarvis.security.sandbox import CommandSandbox, PathJail
from jarvis.tools.computer import register_computer_tools
from jarvis.tools.files import register_file_tools
from jarvis.tools.registry import Registry, tool_spec


@pytest.fixture
def registry(tmp_path):
    gate = SecurityGate(
        PermissionService(["fs.read", "fs.write", "shell.exec"]),
        AlwaysAllowConfirmer(),
        AuditLogger(tmp_path / "audit"),
    )
    reg = Registry(gate)
    register_file_tools(reg, PathJail(tmp_path / "ws"))
    register_computer_tools(reg, CommandSandbox(["echo"], cwd=tmp_path / "ws", timeout=5))
    return reg


async def test_write_then_read_file(registry):
    res = await registry.dispatch(
        ToolCall(name="write_file", arguments={"path": "a.txt", "content": "hello"})
    )
    assert res.ok, res.error
    res2 = await registry.dispatch(ToolCall(name="read_file", arguments={"path": "a.txt"}))
    assert res2.ok
    assert res2.content == "hello"


async def test_unknown_tool_returns_error(registry):
    res = await registry.dispatch(ToolCall(name="nope", arguments={}))
    assert not res.ok
    assert "No such tool" in res.error


async def test_permission_denied_surfaces_as_result(tmp_path):
    gate = SecurityGate(
        PermissionService(["fs.read"]),  # no fs.write
        AlwaysAllowConfirmer(),
        AuditLogger(tmp_path / "audit"),
    )
    reg = Registry(gate)
    register_file_tools(reg, PathJail(tmp_path / "ws"))
    res = await reg.dispatch(
        ToolCall(name="write_file", arguments={"path": "a.txt", "content": "x"})
    )
    assert not res.ok
    assert "Permission denied" in res.error


async def test_specs_include_registered_tools(registry):
    names = {s.name for s in registry.specs()}
    assert {"read_file", "write_file", "run_shell", "system_info"} <= names


async def test_tool_exception_becomes_error_result(registry):
    # read a missing file -> ToolError -> ok=False
    res = await registry.dispatch(ToolCall(name="read_file", arguments={"path": "missing.txt"}))
    assert not res.ok
    assert "not found" in res.error.lower()


async def test_run_shell_through_sandbox(registry):
    res = await registry.dispatch(ToolCall(name="run_shell", arguments={"command": "echo hi"}))
    assert res.ok
    assert "hi" in res.content


async def test_create_folder(registry):
    res = await registry.dispatch(ToolCall(name="create_folder", arguments={"path": "sub/dir"}))
    assert res.ok
    assert "Created folder" in res.content


async def test_move_file(registry):
    await registry.dispatch(ToolCall(name="write_file", arguments={"path": "src.txt", "content": "hello"}))
    res = await registry.dispatch(ToolCall(name="move_file", arguments={"source": "src.txt", "destination": "dst.txt"}))
    assert res.ok
    assert "Moved" in res.content
    read = await registry.dispatch(ToolCall(name="read_file", arguments={"path": "dst.txt"}))
    assert read.ok
    assert read.content == "hello"


async def test_rename_file(registry):
    await registry.dispatch(ToolCall(name="write_file", arguments={"path": "old.txt", "content": "content"}))
    res = await registry.dispatch(ToolCall(name="rename_file", arguments={"source": "old.txt", "new_name": "new.txt"}))
    assert res.ok
    assert "Renamed" in res.content
    read = await registry.dispatch(ToolCall(name="read_file", arguments={"path": "new.txt"}))
    assert read.ok
    assert read.content == "content"


async def test_delete_file(registry):
    await registry.dispatch(ToolCall(name="write_file", arguments={"path": "del.txt", "content": "bye"}))
    res = await registry.dispatch(ToolCall(name="delete_file", arguments={"path": "del.txt"}))
    assert res.ok
    assert "Deleted file" in res.content
    read = await registry.dispatch(ToolCall(name="read_file", arguments={"path": "del.txt"}))
    assert not read.ok
    assert "not found" in read.error.lower()


async def test_delete_directory(registry):
    await registry.dispatch(ToolCall(name="create_folder", arguments={"path": "foo/bar"}))
    await registry.dispatch(ToolCall(name="write_file", arguments={"path": "foo/bar/baz.txt", "content": "x"}))
    res = await registry.dispatch(ToolCall(name="delete_file", arguments={"path": "foo"}))
    assert res.ok
    assert "Deleted directory" in res.content


async def test_specs_include_new_file_tools(registry):
    names = {s.name for s in registry.specs()}
    assert {"move_file", "rename_file", "delete_file", "create_folder"} <= names
