#!/usr/bin/env python3
"""Small cross-platform text search fallback when ripgrep is unavailable."""

from __future__ import annotations

import argparse
from pathlib import Path
import re
import sys


DEFAULT_EXCLUDES = {
    ".git", ".svn", ".hg", "node_modules", "dist", "build", "target",
    ".idea", ".vscode", "__pycache__", ".next", ".nuxt", ".gradle",
    "logs", "log", "coverage", ".cache", ".m2", "out", "tmp", "temp",
}


def iter_files(root: Path, excludes: set[str]):
    for path in root.rglob("*"):
        if any(part in excludes for part in path.parts):
            continue
        if path.is_file():
            yield path


def is_probably_binary(path: Path) -> bool:
    try:
        with path.open("rb") as handle:
            return b"\0" in handle.read(4096)
    except OSError:
        return True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", help="Directory to search.")
    parser.add_argument("pattern", help="Text or regex pattern.")
    parser.add_argument("--regex", action="store_true", help="Treat pattern as regex.")
    parser.add_argument("--ignore-case", action="store_true")
    parser.add_argument("--glob", action="append", default=[], help="File glob, repeatable. Example: --glob '*.java'")
    parser.add_argument("--max-count", type=int, default=120)
    args = parser.parse_args()

    root = Path(args.root).expanduser().resolve()
    if not root.exists():
        raise FileNotFoundError(f"Search root not found: {root}")

    flags = re.IGNORECASE if args.ignore_case else 0
    pattern = re.compile(args.pattern if args.regex else re.escape(args.pattern), flags)
    globs = args.glob or ["*"]
    count = 0

    for file_path in iter_files(root, DEFAULT_EXCLUDES):
        if not any(file_path.match(glob) for glob in globs):
            continue
        if is_probably_binary(file_path):
            continue
        try:
            lines = file_path.read_text(encoding="utf-8", errors="replace").splitlines()
        except OSError:
            continue
        for line_number, line in enumerate(lines, 1):
            if pattern.search(line):
                print(f"{file_path}:{line_number}:{line.strip()}")
                count += 1
                if count >= args.max_count:
                    return 0
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
