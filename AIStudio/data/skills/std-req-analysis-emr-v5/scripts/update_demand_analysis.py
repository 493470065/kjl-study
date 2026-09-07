#!/usr/bin/env python3
"""Convert demand-analysis Markdown to HTML and optionally write it to TFS/Azure DevOps.

The script is intentionally stdlib-only so the skill can be copied across
Windows, macOS, and Linux. Prefer the current agent's MCP file-path update tool
when available; use this script when a local conversion or REST fallback is
needed.
"""

from __future__ import annotations

import argparse
import base64
import html
import json
import os
from pathlib import Path
import re
import sys
import urllib.error
import urllib.parse
import urllib.request


def inline_markdown(text: str) -> str:
    escaped = html.escape(text, quote=True)
    escaped = re.sub(r"`([^`]+)`", r"<code>\1</code>", escaped)
    escaped = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", escaped)
    escaped = re.sub(r"\*([^*]+)\*", r"<em>\1</em>", escaped)
    return escaped


def is_table_separator(line: str) -> bool:
    return bool(re.match(r"^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$", line))


def split_table_row(line: str) -> list[str]:
    return [inline_markdown(cell.strip()) for cell in line.strip().strip("|").split("|")]


def markdown_to_html(markdown: str) -> str:
    lines = markdown.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    out: list[str] = []
    paragraph: list[str] = []
    i = 0

    def close_paragraph() -> None:
        if paragraph:
            out.append(f"<p>{inline_markdown(' '.join(paragraph))}</p>")
            paragraph.clear()

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if not stripped:
            close_paragraph()
            i += 1
            continue

        heading = re.match(r"^(#{1,6})\s+(.+)$", stripped)
        if heading:
            close_paragraph()
            level = len(heading.group(1))
            out.append(f"<h{level}>{inline_markdown(heading.group(2))}</h{level}>")
            i += 1
            continue

        if stripped.startswith("|") and i + 1 < len(lines) and is_table_separator(lines[i + 1]):
            close_paragraph()
            headers = split_table_row(stripped)
            out.append("<table>")
            out.append("<tr>" + "".join(f"<th>{cell}</th>" for cell in headers) + "</tr>")
            i += 2
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = split_table_row(lines[i])
                out.append("<tr>" + "".join(f"<td>{cell}</td>" for cell in cells) + "</tr>")
                i += 1
            out.append("</table>")
            continue

        if re.match(r"^[-*]\s+", stripped):
            close_paragraph()
            out.append("<ul>")
            while i < len(lines) and re.match(r"^[-*]\s+", lines[i].strip()):
                item = re.sub(r"^[-*]\s+", "", lines[i].strip())
                out.append(f"<li>{inline_markdown(item)}</li>")
                i += 1
            out.append("</ul>")
            continue

        if re.match(r"^\d+\.\s+", stripped):
            close_paragraph()
            out.append("<ol>")
            while i < len(lines) and re.match(r"^\d+\.\s+", lines[i].strip()):
                item = re.sub(r"^\d+\.\s+", "", lines[i].strip())
                out.append(f"<li>{inline_markdown(item)}</li>")
                i += 1
            out.append("</ol>")
            continue

        paragraph.append(stripped)
        i += 1

    close_paragraph()
    body = "\n".join(out)
    return f"""<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
body{{font-family:"Microsoft YaHei",Arial,sans-serif;line-height:1.55;color:#333;font-size:13px;padding:8px;}}
h1{{font-size:18px;color:#2c3e50;border-bottom:1px solid #409EFF;padding-bottom:4px;}}
h2{{font-size:16px;color:#34495e;border-bottom:1px solid #E4E7ED;padding-bottom:3px;margin-top:14px;}}
h3{{font-size:14px;color:#409EFF;margin-top:10px;}}
p{{margin:6px 0;}}
ul,ol{{margin:6px 0 8px 22px;padding:0;}}
li{{margin:3px 0;}}
table{{border-collapse:collapse;width:100%;margin:8px 0;font-size:12px;}}
th,td{{border:1px solid #DCDFE6;padding:5px 7px;text-align:left;vertical-align:top;}}
th{{background:#F5F7FA;color:#303133;font-weight:bold;}}
code{{background:#F5F7FA;color:#E6A23C;padding:1px 3px;border-radius:3px;font-family:Consolas,monospace;}}
</style>
</head>
<body>
{body}
</body>
</html>"""


def load_config(path: str | None) -> dict:
    if not path:
        path = os.environ.get("TFS_CONFIG_PATH")
    if not path:
        return {}
    config_path = Path(path).expanduser()
    if not config_path.exists():
        raise FileNotFoundError(f"TFS config file not found: {config_path}")
    return json.loads(config_path.read_text(encoding="utf-8"))


def first_value(config: dict, *names: str) -> str | None:
    for name in names:
        value = os.environ.get(name)
        if value:
            return value
    for name in names:
        key = name.lower()
        for candidate in (key, key.replace("tfs_", ""), name):
            value = config.get(candidate)
            if value:
                return str(value)
    return None


def request_json(url: str, method: str, pat: str, payload: object | bytes | None, content_type: str) -> dict:
    if isinstance(payload, bytes):
        data = payload
    elif payload is None:
        data = None
    else:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")

    token = base64.b64encode(f":{pat}".encode("utf-8")).decode("ascii")
    request = urllib.request.Request(url, data=data, method=method)
    request.add_header("Authorization", f"Basic {token}")
    request.add_header("Accept", "application/json")
    if data is not None:
        request.add_header("Content-Type", content_type)

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"TFS request failed: HTTP {exc.code}\nURL: {url}\n{body}") from exc


def patch_demand_analysis(args: argparse.Namespace, converted_html: str) -> dict:
    config = load_config(args.config)
    server_url = (args.server_url or first_value(config, "TFS_SERVER_URL", "AZURE_DEVOPS_URL") or "").rstrip("/")
    pat = args.pat or first_value(config, "TFS_PAT", "AZURE_DEVOPS_PAT")
    project = args.project or first_value(config, "TFS_PROJECT", "AZURE_DEVOPS_PROJECT") or ""

    if not server_url or not pat:
        raise RuntimeError(
            "Missing TFS REST configuration. Set TFS_SERVER_URL and TFS_PAT, "
            "or prefer the current MCP file-path update tool."
        )

    project_path = f"{urllib.parse.quote(project)}/" if project else ""
    url = f"{server_url}/{project_path}_apis/wit/workitems/{args.id}?api-version={args.api_version}"
    payload = [{"op": "add", "path": "/fields/Winning.Demand.Analysis", "value": converted_html}]
    return request_json(url, "PATCH", pat, payload, "application/json-patch+json; charset=utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--id", type=int, required=True, help="TFS/Azure DevOps work item id.")
    parser.add_argument("--markdown-file", required=True, help="UTF-8 Markdown source file.")
    parser.add_argument("--collection-hint", default="", help="Human-readable collection/project hint for logs.")
    parser.add_argument("--convert-only", action="store_true", help="Only convert Markdown to HTML.")
    parser.add_argument("--html-output", help="Where to write converted HTML. Defaults to stdout in convert-only mode.")
    parser.add_argument("--config", help="Optional local JSON config with server_url/pat/project.")
    parser.add_argument("--server-url", help="TFS/Azure DevOps collection URL. Prefer env TFS_SERVER_URL.")
    parser.add_argument("--project", help="Team project name. Prefer env TFS_PROJECT.")
    parser.add_argument("--pat", help="PAT token. Prefer env TFS_PAT; avoid passing secrets in shell history.")
    parser.add_argument("--api-version", default="4.1")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    markdown_path = Path(args.markdown_file).expanduser().resolve()
    if not markdown_path.exists():
        raise FileNotFoundError(f"Markdown file not found: {markdown_path}")

    converted = markdown_to_html(markdown_path.read_text(encoding="utf-8"))

    if args.convert_only:
        if args.html_output:
            output_path = Path(args.html_output).expanduser().resolve()
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_text(converted, encoding="utf-8")
            print(json.dumps({"converted": True, "outputPath": str(output_path), "contentLength": len(converted)}, ensure_ascii=False, indent=2))
        else:
            print(converted)
        return 0

    result = patch_demand_analysis(args, converted)
    print(json.dumps({
        "id": result.get("id", args.id),
        "rev": result.get("rev"),
        "collectionHint": args.collection_hint,
        "contentLength": len(converted),
        "updated": True,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
