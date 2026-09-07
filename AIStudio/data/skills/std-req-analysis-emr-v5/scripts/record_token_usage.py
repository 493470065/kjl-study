#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
record_token_usage.py — 需求分析 Token 用量埋点

设计说明
--------
WorkBuddy 不会把"单个任务"的 token 明细落盘，只在会话日志里记录
"压缩前累计 token 数"(tokenCount=...)。本脚本从该日志读取**当前会话累计
token 数**作为参考值，配合调用方在"分析开始"与"分析结束"两次调用
(传 --start / --end)，用差值近似得到单个需求分析的 token 消耗。

用法
----
  # 分析开始时记录起始累计值(可选，把输出值作为后续 --start 入参)
  python record_token_usage.py --req 1749706 --phase start

  # 分析结束时记录结束累计值并算增量
  python record_token_usage.py --req 1749706 --phase end --start <起始累计值>

  # 也可只记录一次(结束累计值，delta 为 null)
  python record_token_usage.py --req 1749706

参数
----
  --req        需求号(必填)，决定写出目录 .ai-work/requirements/<req>/<ts>/
  --phase      start | end | once(默认 once)
  --start      起始会话累计 token 数(整数)。提供后 delta = end - start
  --workspace  工作区目录(默认从环境变量 WB_WORKSPACE 或 CWD 推断)
  --logdir     日志目录(默认 ~/.workbuddy/logs/<今天>/)
  --out        强制指定输出 json 路径(默认落在需求工作目录下 token_usage.json)

输出
----
  <需求工作目录>/token_usage.json，结构:
  {
    "req": "1749706",
    "skill": "...",         // 调用方可传 --skill
    "phase": "end",
    "session_cum_tokens": 126501,   // 从日志读到的当前会话累计
    "start_cum_tokens": 104679,     // --start 值或 null
    "delta_tokens": 21822,          // end - start 或 null
    "recorded_at": "2026-08-24T10:36:23+08:00",
    "source": "workbuddy-session-log"
  }
  多次调用同一需求会追加到 token_usage.json 的 "entries" 数组(保留历史)。
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone, timedelta

CHINA_TZ = timezone(timedelta(hours=8))


def find_log_dir(explicit=None):
    if explicit:
        return explicit
    base = os.path.expanduser("~/.workbuddy/logs")
    today = datetime.now(CHINA_TZ).strftime("%Y-%m-%d")
    cand = os.path.join(base, today)
    if os.path.isdir(cand):
        return cand
    # 退回 base 下最新的日期目录
    if os.path.isdir(base):
        sub = [d for d in os.listdir(base)
               if os.path.isdir(os.path.join(base, d)) and re.match(r"\d{4}-\d{2}-\d{2}", d)]
        if sub:
            sub.sort()
            return os.path.join(base, sub[-1])
    return None


def read_latest_session_cum_tokens(logdir, workspace_hint=None):
    """读取日志目录中最新一条 tokenCount= 数值(会话累计)。"""
    if not logdir or not os.path.isdir(logdir):
        return None
    # 优先匹配含 workspace 名的日志文件，否则取目录下最新修改的日志
    files = []
    for fn in os.listdir(logdir):
        if not fn.endswith(".log"):
            continue
        if workspace_hint and workspace_hint not in fn:
            continue
        files.append(os.path.join(logdir, fn))
    if not files:
        # 放宽：取全部 log
        for fn in os.listdir(logdir):
            if fn.endswith(".log"):
                files.append(os.path.join(logdir, fn))
    if not files:
        return None
    files.sort(key=lambda p: os.path.getmtime(p), reverse=True)

    latest = None
    pat = re.compile(r"tokenCount=(\d+)")
    # 从最新文件往前找，取文件中出现的最后一个 tokenCount
    for fp in files[:3]:
        try:
            with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                # 只读尾部，避免大文件全量
                f.seek(0, os.SEEK_END)
                size = f.tell()
                f.seek(max(0, size - 2_000_000))
                tail = f.read()
        except OSError:
            continue
        matches = pat.findall(tail)
        if matches:
            latest = int(matches[-1])
            break
    return latest


def resolve_workspace(explicit):
    if explicit:
        return explicit
    env = os.environ.get("WB_WORKSPACE")
    if env:
        return env
    try:
        return os.getcwd()
    except OSError:
        return None


def main():
    ap = argparse.ArgumentParser(description="需求分析 Token 用量埋点")
    ap.add_argument("--req", required=True, help="TFS 需求号")
    ap.add_argument("--phase", default="once", choices=["start", "end", "once"])
    ap.add_argument("--start", type=int, default=None,
                    help="起始会话累计 token 数；提供后计算 delta")
    ap.add_argument("--skill", default=None, help="技能名(写入档案，便于区分 v4/v5)")
    ap.add_argument("--workspace", default=None)
    ap.add_argument("--logdir", default=None)
    ap.add_argument("--out", default=None)
    args = ap.parse_args()

    workspace = resolve_workspace(args.workspace)
    ws_hint = os.path.basename(workspace) if workspace else None
    logdir = find_log_dir(args.logdir)
    end_cum = read_latest_session_cum_tokens(logdir, ws_hint)

    start_cum = args.start
    delta = (end_cum - start_cum) if (end_cum is not None and start_cum is not None) else None

    # 决定输出路径
    if args.out:
        out_path = args.out
    else:
        if not workspace:
            print("ERROR: 无法推断工作区目录，请用 --workspace 或 --out 指定", file=sys.stderr)
            sys.exit(2)
        ts = datetime.now(CHINA_TZ).strftime("%Y%m%d-%H%M%S")
        req_dir = os.path.join(workspace, ".ai-work", "requirements", args.req, ts)
        os.makedirs(req_dir, exist_ok=True)
        out_path = os.path.join(req_dir, "token_usage.json")

    entry = {
        "req": args.req,
        "skill": args.skill,
        "phase": args.phase,
        "session_cum_tokens": end_cum,
        "start_cum_tokens": start_cum,
        "delta_tokens": delta,
        "recorded_at": datetime.now(CHINA_TZ).isoformat(),
        "source": "workbuddy-session-log",
    }

    # 追加式写入：保留同一需求多次记录
    existing = {"req": args.req, "entries": []}
    if os.path.exists(out_path):
        try:
            with open(out_path, "r", encoding="utf-8") as f:
                existing = json.load(f)
            if "entries" not in existing:
                existing["entries"] = []
        except (OSError, json.JSONDecodeError):
            existing = {"req": args.req, "entries": []}
    existing["entries"].append(entry)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)

    # 终端输出便于 agent 读取
    print(json.dumps(entry, ensure_ascii=False, indent=2))
    print(f"[token-usage] 已写入: {out_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
