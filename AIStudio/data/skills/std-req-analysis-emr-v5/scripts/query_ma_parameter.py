#!/usr/bin/env python3
"""Search medical-archive parameters from CSV, or from SQL Server when configured."""

from __future__ import annotations

import argparse
import csv
import json
import os
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CACHE = ROOT / "references" / "Param" / "ma-parameter.csv"
DEFAULT_CONFIG = ROOT / "config" / "ma-parameter-db.json"


DISPLAY_COLUMNS = [
    "MA_PARAMETER_KEY",
    "MA_PARAMETER_NAME",
    "MA_PARAMETER_DESC",
    "MA_PARAMETER_VALUE",
    "MA_PARAMETER_DEFAULT_VALUE",
    "HOSPITAL_SOID",
]


def read_config(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def cfg(config: dict, key: str, env_name: str, required: bool = False) -> str:
    value = os.environ.get(env_name) or config.get(key) or ""
    if required and not str(value).strip():
        raise RuntimeError(f"Missing database configuration: {env_name} / {key}")
    return str(value)


def search_csv(path: Path, keywords: list[str], top: int) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(f"Parameter CSV not found: {path}")
    lowered = [word.lower() for word in keywords if word.strip()]
    rows: list[dict] = []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            haystack = "\n".join(str(value or "") for value in row.values()).lower()
            if not lowered or any(word in haystack for word in lowered):
                rows.append(row)
                if len(rows) >= top:
                    break
    return rows


def query_sql_server(config: dict, keywords: list[str], top: int) -> list[dict]:
    try:
        import pyodbc  # type: ignore
    except ImportError as exc:
        raise RuntimeError("pyodbc is required for SQL Server queries. Use CSV fallback or install pyodbc.") from exc

    server = cfg(config, "server", "MA_PARAM_DB_SERVER", True)
    database = cfg(config, "database", "MA_PARAM_DB_DATABASE", True)
    user = cfg(config, "user", "MA_PARAM_DB_USER", True)
    password = cfg(config, "password", "MA_PARAM_DB_PASSWORD", True)
    schema = cfg(config, "schema", "MA_PARAM_DB_SCHEMA") or "WINDBA"
    table = cfg(config, "table", "MA_PARAM_DB_TABLE") or "MA_PARAMETER"
    qualified = f"[{schema.replace(']', ']]')}].[{table.replace(']', ']]')}]"

    columns = [
        "MA_PARAMETER_ID", "MA_PARAMETER_NAME", "MA_PARAMETER_DESC", "MA_PARAMETER_KEY",
        "MA_PARAMETER_VALUE", "MA_PARAMETER_DEFAULT_VALUE", "ALLOW_DELETE_FLAG",
        "HOSPITAL_SOID", "IS_DEL", "CREATED_AT", "MODIFIED_AT", "CREATED_BY", "MODIFIED_BY",
    ]
    where = ["IS_DEL = 0"]
    params: list[str] = []
    if keywords:
        parts = []
        for word in keywords:
            parts.append(
                "(MA_PARAMETER_NAME LIKE ? OR MA_PARAMETER_DESC LIKE ? OR MA_PARAMETER_KEY LIKE ? "
                "OR CONVERT(NVARCHAR(MAX), MA_PARAMETER_VALUE) LIKE ? "
                "OR CONVERT(NVARCHAR(MAX), MA_PARAMETER_DEFAULT_VALUE) LIKE ?)"
            )
            params.extend([f"%{word}%"] * 5)
        where.append("(" + " OR ".join(parts) + ")")

    connection_string = (
        f"DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={server};DATABASE={database};"
        f"UID={user};PWD={password};Encrypt=no;TrustServerCertificate=yes"
    )
    sql = f"SELECT TOP ({top}) {', '.join(columns)} FROM {qualified} WHERE {' AND '.join(where)} ORDER BY MA_PARAMETER_KEY, HOSPITAL_SOID"
    with pyodbc.connect(connection_string, timeout=10) as connection:
        cursor = connection.cursor()
        cursor.execute(sql, params)
        names = [column[0] for column in cursor.description]
        return [dict(zip(names, row)) for row in cursor.fetchall()]


def write_csv(rows: list[dict], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = sorted({key for row in rows for key in row.keys()})
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def print_rows(rows: list[dict]) -> None:
    writer = csv.DictWriter(sys.stdout, fieldnames=DISPLAY_COLUMNS, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--keyword", action="append", default=[], help="Keyword; repeat for multiple keywords.")
    parser.add_argument("--top", type=int, default=80)
    parser.add_argument("--cache-path", default=str(DEFAULT_CACHE))
    parser.add_argument("--config-path", default=str(DEFAULT_CONFIG))
    parser.add_argument("--db", action="store_true", help="Query SQL Server instead of local CSV.")
    parser.add_argument("--output-csv", help="Write results to a CSV file.")
    args = parser.parse_args()

    if args.top < 1 or args.top > 1000:
        raise ValueError("--top must be between 1 and 1000")

    keywords = [word for word in args.keyword if word.strip()]
    config = read_config(Path(args.config_path).expanduser())
    rows = query_sql_server(config, keywords, args.top) if args.db else search_csv(Path(args.cache_path).expanduser(), keywords, args.top)

    if args.output_csv:
        write_csv(rows, Path(args.output_csv).expanduser())
    else:
        print_rows(rows)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
