#!/usr/bin/env python3
"""Extract and optionally download TFS/Azure DevOps rich-text embedded images.

This script is a cross-platform fallback for images that appear inside
System.Description or Winning.Demand.Analysis but are not returned by the normal
attachment list API. It first tries to reuse the TFS MCP configuration from
the current agent config, then falls back to explicit environment/config args.
"""

from __future__ import annotations

import argparse
import base64
from html.parser import HTMLParser
import gzip
import html
import json
import mimetypes
import os
from pathlib import Path
import re
import sys
import tomllib
import urllib.error
import urllib.parse
import urllib.request


class RichTextLinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.urls: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = dict(attrs)
        if tag.lower() == "img" and data.get("src"):
            self.urls.append(data["src"] or "")
        if tag.lower() == "a" and data.get("href"):
            href = data["href"] or ""
            lowered = href.lower()
            if any(key in lowered for key in ("attachment", "filenameguid", "_api", "download")):
                self.urls.append(href)


def codex_config_paths() -> list[Path]:
    paths: list[Path] = []
    codex_home = os.environ.get("CODEX_HOME")
    if codex_home:
        paths.append(Path(codex_home).expanduser() / "config.toml")
    home = Path.home()
    paths.extend(
        [
            home / ".codex" / "config.toml",
            home / ".agents" / "config.toml",
        ]
    )
    return paths


def config_paths_from_agent_mcp() -> list[Path]:
    candidates: list[Path] = []
    for config_path in codex_config_paths():
        if not config_path.exists():
            continue
        try:
            data = tomllib.loads(config_path.read_text(encoding="utf-8"))
        except Exception:
            continue
        servers = data.get("mcp_servers", {})
        for name, server in servers.items():
            if "tfs" not in str(name).lower():
                continue
            env = server.get("env", {}) if isinstance(server, dict) else {}
            value = env.get("TFS_CONFIG_PATH") or env.get("MCP_TFS_CONFIG")
            if value:
                candidates.append(Path(str(value)).expanduser())
            cwd = server.get("cwd") if isinstance(server, dict) else None
            if cwd:
                candidates.append(Path(str(cwd)).expanduser() / "config.json")
            args = server.get("args", []) if isinstance(server, dict) else []
            for arg in args:
                arg_path = Path(str(arg)).expanduser()
                if arg_path.name in ("index.js", "server.js", "main.js"):
                    candidates.append(arg_path.parent / "config.json")
    return candidates


def candidate_config_paths(path: str | None) -> list[Path]:
    candidates: list[Path] = []
    for value in (
        path,
        os.environ.get("TFS_CONFIG_PATH"),
        os.environ.get("MCP_TFS_CONFIG"),
    ):
        if value:
            candidates.append(Path(value).expanduser())

    candidates.extend(config_paths_from_agent_mcp())

    for env_name in ("TFS_CLIENT_DIR", "MCP_TFS_QUERY_DIR"):
        value = os.environ.get(env_name)
        if value:
            candidates.append(Path(value).expanduser() / "config.json")

    cwd = Path.cwd()
    home = Path.home()
    candidates.extend(
        [
            cwd / "mcp-tfs-query" / "config.json",
            cwd.parent / "mcp-tfs-query" / "config.json",
            home / "mcp-tfs-query" / "config.json",
            home / ".config" / "mcp-tfs-query" / "config.json",
        ]
    )

    deduped: list[Path] = []
    seen: set[str] = set()
    for candidate in candidates:
        key = str(candidate)
        if key not in seen:
            seen.add(key)
            deduped.append(candidate)
    return deduped


def load_config(path: str | None) -> tuple[dict, str]:
    for config_path in candidate_config_paths(path):
        if not config_path.exists():
            continue
        config_path = config_path.resolve()
        return json.loads(config_path.read_text(encoding="utf-8")), str(config_path)
    if path:
        config_path = Path(path).expanduser()
        raise FileNotFoundError(f"TFS config file not found: {config_path}")
    return {}, ""


def first_value(config: dict, *names: str) -> str:
    for name in names:
        value = os.environ.get(name)
        if value:
            return value
    for name in names:
        for key in (name, name.lower(), name.lower().replace("tfs_", "")):
            value = config.get(key)
            if value:
                return str(value)
    return ""


def extract_urls(html_text: str) -> list[str]:
    parser = RichTextLinkParser()
    parser.feed(html_text)
    urls = list(parser.urls)
    # TFS rich text sometimes stores useful URLs in escaped JSON-ish fragments.
    for match in re.finditer(r"""(?i)(https?://[^"' <>)]+|/_?[^"' <>)]+(?:FileNameGuid|attachments?)[^"' <>)]+)""", html_text):
        urls.append(match.group(1))
    deduped: list[str] = []
    seen: set[str] = set()
    for url in urls:
        normalized = html.unescape(url.strip())
        if not normalized:
            continue
        parsed = urllib.parse.urlsplit(normalized)
        query_pairs = urllib.parse.parse_qsl(parsed.query, keep_blank_values=True)
        query = urllib.parse.urlencode(query_pairs)
        dedupe_key = urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, query, ""))
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        deduped.append(normalized)
    return deduped


def resolve_url(url: str, base_url: str) -> str:
    if url.startswith("data:"):
        return url
    if base_url:
        return urllib.parse.urljoin(base_url.rstrip("/") + "/", url)
    return url


def extension_from_response(url: str, content_type: str, index: int) -> str:
    parsed = urllib.parse.urlparse(url)
    path_ext = Path(parsed.path).suffix
    if path_ext and len(path_ext) <= 8:
        return path_ext
    guessed = mimetypes.guess_extension(content_type.split(";")[0].strip()) if content_type else None
    return guessed or f"-{index}.bin"


def decode_data_url(url: str) -> tuple[bytes, str]:
    header, data = url.split(",", 1)
    mime_match = re.match(r"data:([^;,]+)", header)
    mime_type = mime_match.group(1) if mime_match else "application/octet-stream"
    if ";base64" in header:
        return base64.b64decode(data), mime_type
    return urllib.parse.unquote_to_bytes(data), mime_type


def download_url(url: str, pat: str, output_dir: Path, index: int) -> dict:
    if url.startswith("data:"):
        content, mime_type = decode_data_url(url)
        ext = mimetypes.guess_extension(mime_type) or ".bin"
        target = output_dir / f"embedded-{index}{ext}"
        target.write_bytes(content)
        return {"url": "data-url", "path": str(target), "status": "ok", "contentType": mime_type}

    request = urllib.request.Request(url)
    request.add_header("Accept", "image/*,*/*")
    request.add_header("User-Agent", "std-req-analysis-emr/embedded-image-downloader")
    if pat:
        token = base64.b64encode(f":{pat}".encode("utf-8")).decode("ascii")
        request.add_header("Authorization", f"Basic {token}")

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            raw = response.read()
            content_encoding = response.headers.get("Content-Encoding", "")
            if "gzip" in content_encoding.lower() or raw[:2] == b"\x1f\x8b":
                raw = gzip.decompress(raw)
            content_type = response.headers.get("Content-Type", "")
            ext = extension_from_response(url, content_type, index)
            if not ext.startswith("."):
                ext = "." + ext
            target = output_dir / f"embedded-{index}{ext}"
            target.write_bytes(raw)
            return {"url": url, "path": str(target), "status": "ok", "contentType": content_type, "bytes": len(raw)}
    except urllib.error.HTTPError as exc:
        return {"url": url, "status": "auth_failed" if exc.code in (401, 403) else "http_error", "httpStatus": exc.code}
    except Exception as exc:
        return {"url": url, "status": "error", "error": str(exc)}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-html", required=True, help="HTML or Markdown file containing rich-text img/link URLs.")
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--base-url", help="TFS collection/project base URL used to resolve relative image URLs.")
    parser.add_argument("--config", help="Optional JSON config containing serverUrl/server_url and pat/patToken. If omitted, common local TFS/MCP config paths are auto-detected.")
    parser.add_argument("--pat", help="PAT token. Prefer env TFS_PAT to avoid shell history.")
    args = parser.parse_args()

    config, config_path = load_config(args.config)
    base_url = args.base_url or first_value(config, "TFS_SERVER_URL", "serverUrl", "server_url")
    pat = args.pat or first_value(config, "TFS_PAT", "patToken", "pat", "token")

    source = Path(args.source_html).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    text = source.read_text(encoding="utf-8", errors="replace")
    urls = [resolve_url(url, base_url) for url in extract_urls(text)]
    results = [download_url(url, pat, output_dir, index) for index, url in enumerate(urls, 1)]
    auth_failures = [item for item in results if item.get("status") == "auth_failed"]
    print(json.dumps({"source": str(source), "outputDir": str(output_dir), "configPath": config_path, "hasPat": bool(pat), "count": len(results), "results": results}, ensure_ascii=False, indent=2))
    return 2 if auth_failures else 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
