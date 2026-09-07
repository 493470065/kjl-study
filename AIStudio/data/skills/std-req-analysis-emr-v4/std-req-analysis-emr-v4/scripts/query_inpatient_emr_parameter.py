#!/usr/bin/env python3
"""Search inpatient EMR parameters from CSV, or from Oracle when configured."""

from __future__ import annotations

import argparse
import csv
import json
import os
from pathlib import Path
import re
import sys


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CACHE = ROOT / "references" / "Param" / "病历参数合集.csv"
DEFAULT_CONFIG = ROOT / "config" / "inpatient-emr-parameter-db.json"


DISPLAY_COLUMNS = [
    "INP_EMR_PARAM_NO",
    "INP_EMR_PARAM_NAME",
    "INP_EMR_PARAM_CONTENT",
    "INP_EMR_PARAM_DESC",
    "ENABLED_FLAG",
    "HOSPITAL_SOID",
    "HOSPITAL_AREA_ID",
    "PARAM_VALUE",
]


def read_config(path: Path) -> dict:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def cfg(config: dict, key: str, env_name: str, required: bool = False) -> str:
    value = os.environ.get(env_name) or config.get(key) or ""
    if required and not str(value).strip():
        raise RuntimeError(f"Missing Oracle configuration: {env_name} / {key}")
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


def query_oracle(config: dict, keywords: list[str], top: int) -> list[dict]:
    try:
        import oracledb  # type: ignore
    except ImportError as exc:
        raise RuntimeError("oracledb is required for Oracle queries. Use CSV fallback or install oracledb.") from exc

    dsn = cfg(config, "dsn", "INP_EMR_PARAM_DSN") or cfg(config, "jdbcUrl", "INP_EMR_PARAM_JDBC_URL", True)
    if dsn.startswith("jdbc:oracle:thin:@//"):
        dsn = dsn.removeprefix("jdbc:oracle:thin:@//")
    user = cfg(config, "user", "INP_EMR_PARAM_DB_USER", True)
    password = cfg(config, "password", "INP_EMR_PARAM_DB_PASSWORD", True)
    table = cfg(config, "table", "INP_EMR_PARAM_DB_TABLE", True)
    if not re.match(r"^[A-Za-z0-9_.$]+$", table):
        raise ValueError(f"Unsafe Oracle table name: {table}")

    columns = [
        "INP_EMR_PARAM_ID", "INP_EMR_PARAM_NO", "INP_EMR_PARAM_NAME", "INP_EMR_PARAM_CONTENT",
        "INP_EMR_PARAM_DESC", "ENABLED_FLAG", "DEPT_ID", "INP_EMR_PARAM_TYPE_NO",
        "INP_EMR_PARAM_VALUE_TYPE_NO", "HOSPITAL_SOID", "IS_DEL", "CREATED_AT", "MODIFIED_AT",
        "CREATED_BY", "MODIFIED_BY", "INP_EMR_PARAM_GROUP_NO", "HOSPITAL_AREA_ID", "PARAM_VALUE",
    ]
    searchable = ["INP_EMR_PARAM_NO", "INP_EMR_PARAM_NAME", "INP_EMR_PARAM_CONTENT", "INP_EMR_PARAM_DESC", "PARAM_VALUE"]
    where = ["1 = 1"]
    binds: dict[str, object] = {"top": top}
    if keywords:
        parts = []
        for index, word in enumerate(keywords):
            bind_name = f"kw{index}"
            parts.append("(" + " OR ".join(f"{column} LIKE :{bind_name}" for column in searchable) + ")")
            binds[bind_name] = f"%{word}%"
        where.append("(" + " OR ".join(parts) + ")")

    sql = (
        f"SELECT * FROM (SELECT {', '.join(columns)} FROM {table} "
        f"WHERE {' AND '.join(where)} ORDER BY INP_EMR_PARAM_NO, HOSPITAL_SOID, HOSPITAL_AREA_ID) "
        "WHERE ROWNUM <= :top"
    )
    with oracledb.connect(user=user, password=password, dsn=dsn) as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql, binds)
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
    parser.add_argument("--db", action="store_true", help="Query Oracle instead of local CSV.")
    parser.add_argument("--output-csv", help="Write results to a CSV file.")
    args = parser.parse_args()

    if args.top < 1 or args.top > 5000:
        raise ValueError("--top must be between 1 and 5000")

    keywords = [word for word in args.keyword if word.strip()]
    config = read_config(Path(args.config_path).expanduser())
    rows = query_oracle(config, keywords, args.top) if args.db else search_csv(Path(args.cache_path).expanduser(), keywords, args.top)

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
