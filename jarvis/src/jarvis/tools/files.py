"""File tools: read, write, list, search — all confined to the workspace jail.

Registered via :func:`register_file_tools`.
"""

from __future__ import annotations

from pathlib import Path

from ..core.errors import ToolError
from ..security.sandbox import PathJail
from .registry import Registry, tool_spec

MAX_READ_BYTES = 100_000


def register_file_tools(registry: Registry, jail: PathJail) -> None:
    async def read_file(args: dict) -> str:
        path = jail.resolve(args["path"])
        if not path.exists():
            raise ToolError(f"File not found: {args['path']}")
        if path.is_dir():
            raise ToolError(f"{args['path']} is a directory; use list_dir")
        data = path.read_bytes()[:MAX_READ_BYTES]
        text = data.decode("utf-8", "replace")
        return text or "(empty file)"

    async def write_file(args: dict) -> str:
        path = jail.resolve(args["path"])
        path.parent.mkdir(parents=True, exist_ok=True)
        content = args.get("content", "")
        mode = args.get("mode", "overwrite")
        if mode == "append":
            with path.open("a", encoding="utf-8") as fh:
                fh.write(content)
        else:
            path.write_text(content, encoding="utf-8")
        return f"Wrote {len(content)} chars to {args['path']}"

    async def list_dir(args: dict) -> str:
        path = jail.resolve(args.get("path", "."))
        if not path.exists():
            raise ToolError(f"Path not found: {args.get('path', '.')}")
        entries = []
        for child in sorted(path.iterdir()):
            kind = "dir " if child.is_dir() else "file"
            size = child.stat().st_size if child.is_file() else 0
            entries.append(f"{kind}  {child.name}  ({size}B)")
        return "\n".join(entries) or "(empty directory)"

    async def search_files(args: dict) -> str:
        """Recursively search workspace files for a substring."""
        query = args["query"]
        root = jail.resolve(args.get("path", "."))
        glob = args.get("glob", "**/*")
        matches: list[str] = []
        for f in root.glob(glob):
            if not f.is_file():
                continue
            try:
                for lineno, line in enumerate(
                    f.read_text("utf-8", "replace").splitlines(), start=1
                ):
                    if query.lower() in line.lower():
                        rel = f.relative_to(jail.root)
                        matches.append(f"{rel}:{lineno}: {line.strip()[:120]}")
                        if len(matches) >= 100:
                            break
            except Exception:
                continue
            if len(matches) >= 100:
                break
        return "\n".join(matches) or f"No matches for {query!r}"

    async def move_file(args: dict) -> str:
        src = jail.resolve(args["source"])
        dst = jail.resolve(args["destination"])
        if not src.exists():
            raise ToolError(f"Source not found: {args['source']}")
        dst.parent.mkdir(parents=True, exist_ok=True)
        src.rename(dst)
        return f"Moved {args['source']} to {args['destination']}"

    async def rename_file(args: dict) -> str:
        src = jail.resolve(args["source"])
        dst = jail.resolve(args["new_name"])
        if not src.exists():
            raise ToolError(f"Source not found: {args['source']}")
        dst.parent.mkdir(parents=True, exist_ok=True)
        src.rename(dst)
        return f"Renamed {args['source']} to {args['new_name']}"

    async def delete_file(args: dict) -> str:
        path = jail.resolve(args["path"])
        if not path.exists():
            raise ToolError(f"Path not found: {args['path']}")
        if path.is_dir():
            import shutil
            shutil.rmtree(path)
            return f"Deleted directory {args['path']}"
        path.unlink()
        return f"Deleted file {args['path']}"

    async def create_folder(args: dict) -> str:
        path = jail.resolve(args["path"])
        path.mkdir(parents=True, exist_ok=True)
        return f"Created folder {args['path']}"

    registry.register(
        tool_spec(
            "read_file",
            "Read a text file from the workspace.",
            {
                "type": "object",
                "properties": {"path": {"type": "string", "description": "Path relative to workspace"}},
                "required": ["path"],
            },
            capability="fs.read",
        ),
        read_file,
    )
    registry.register(
        tool_spec(
            "write_file",
            "Create or modify a file in the workspace.",
            {
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "content": {"type": "string"},
                    "mode": {"type": "string", "enum": ["overwrite", "append"], "default": "overwrite"},
                },
                "required": ["path", "content"],
            },
            capability="fs.write",
            dangerous=True,
        ),
        write_file,
    )
    registry.register(
        tool_spec(
            "list_dir",
            "List files and folders in a workspace directory.",
            {"type": "object", "properties": {"path": {"type": "string", "default": "."}}},
            capability="fs.read",
        ),
        list_dir,
    )
    registry.register(
        tool_spec(
            "search_files",
            "Search workspace files for text matching a query.",
            {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "path": {"type": "string", "default": "."},
                    "glob": {"type": "string", "default": "**/*"},
                },
                "required": ["query"],
            },
            capability="fs.read",
        ),
        search_files,
    )
    registry.register(
        tool_spec(
            "move_file",
            "Move a file or directory within the workspace.",
            {
                "type": "object",
                "properties": {
                    "source": {"type": "string"},
                    "destination": {"type": "string"},
                },
                "required": ["source", "destination"],
            },
            capability="fs.write",
            dangerous=True,
        ),
        move_file,
    )
    registry.register(
        tool_spec(
            "rename_file",
            "Rename a file or directory within the workspace.",
            {
                "type": "object",
                "properties": {
                    "source": {"type": "string"},
                    "new_name": {"type": "string"},
                },
                "required": ["source", "new_name"],
            },
            capability="fs.write",
            dangerous=True,
        ),
        rename_file,
    )
    registry.register(
        tool_spec(
            "delete_file",
            "Delete a file or directory within the workspace.",
            {
                "type": "object",
                "properties": {"path": {"type": "string"}},
                "required": ["path"],
            },
            capability="fs.write",
            dangerous=True,
        ),
        delete_file,
    )
    registry.register(
        tool_spec(
            "create_folder",
            "Create a folder (and any missing parent folders) in the workspace.",
            {
                "type": "object",
                "properties": {"path": {"type": "string"}},
                "required": ["path"],
            },
            capability="fs.write",
            dangerous=True,
        ),
        create_folder,
    )
