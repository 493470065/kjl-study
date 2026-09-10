# -*- coding: utf-8 -*-
"""
rename_spec_codes.py — SPEC 知识库四层编码批量迁移脚本

用法:
  uv run python rename_spec_codes.py --root <SPEC根目录> --mapping mapping.json [--dry-run] [--registry-only]

mapping.json 结构:
{
  "product":  {"code": "Emr", "cn_name": "WiNEX 病历", "repo_hint": "winning-emr-*"},
  "module":   {"old": "JZBL-06-BLCX", "old_dir": "JZBL-06-BLCX 06病历查询", "code": "EmgQry",
               "ordinal": "06", "cn_name": "病历查询（急诊）", ...},
  "features": [
    {"sss": "001", "old_name": "急诊病历综合查询", "feat": "EmrSetQuery", "services": ["EmgEmrSetQueryService"]}
  ],
  "keep_refs": ["JZBL-01-BLSX", "JZBL-04-JWBL"]
}

命名口径（方案B）:
  文件夹名   = {ProductCode}-{ModCode}-{SSS}-{中文名}   如 Emr-Write-001-病历创建与模板选择
  文件名/引用 = {ProductCode}-{ModCode}-{SSS}-{FeatName} 如 Emr-Write-001-EmrCreate
  即: 中文只做文件夹显示段; 规范编码(含英文 FeatName)用于文件名、front matter、文档内引用、注册表
  中文名约束: 1~12 字, 不含 '-' 和空格
  module.ordinal: 模块序号（两位, 沿用旧体系如 06/15）。可选; 提供时模块目录名 = {ordinal}-{ModCode} {中文名}
  模块/功能点序号只进目录名与注册表, 不进编码与文档引用（编码仍为四段）

行为:
  1. 目录/文件迁移:  {root}/{旧模块目录}/...  ->  {root}/{ProductCode}/{ModCode}/{编码}-{中文名}/
  2. 文档内替换优先级: 完整引用(编码_中文名) -> 子编号(编码-001-01[-02]) -> 裸模块码
  3. 文件名规范化: _PM-spec -> -PM-spec, _Analyst-spec -> -Analyst-spec
  4. 注入 YAML front matter (spec-id/title/type/repo/status)
  5. 生成或追加 _SPEC注册表.md
  6. 残留扫描: keep_refs 标记为跨模块保留, 其余残留为警告
  7. 路径长度校验: 编码超 55 字符拒绝执行
"""
import argparse, json, re, shutil, sys, unicodedata
from pathlib import Path

FRONT_KEYS = ("spec-id", "title", "type", "repo", "status")
NAME_RE = re.compile(r"^[A-Z][A-Za-z0-9]{1,9}-[A-Z][A-Za-z]{1,9}-\d{3}-[A-Z][A-Za-z0-9]{5,24}$")


def wide_len(s: str) -> int:
    """编码长度按显示宽度计（全角/中文计 2），与规则文档的紧凑原则一致。"""
    return sum(2 if unicodedata.east_asian_width(c) in "WF" else 1 for c in s)


def build_map(mp: dict):
    old_mod = mp["module"]["old"]
    mod_code = mp["module"]["code"]
    prod = mp["product"]["code"]
    feats = {}
    for f in mp["features"]:
        new_code = f"{prod}-{mod_code}-{f['sss']}-{f['feat']}"
        if not NAME_RE.match(new_code):
            sys.exit(f"[拒绝] 新编码不符合规则正则: {new_code}")
        if wide_len(new_code) > 55:
            sys.exit(f"[拒绝] 编码超 55 字符上限: {new_code}")
        cn = f["old_name"]
        if re.search(r"[-\s]", cn):
            sys.exit(f"[拒绝] 中文名含 '-' 或空格，会破坏路径分段解析: {cn}")
        if len(cn) > 12:
            sys.exit(f"[拒绝] 中文名超 12 字: {cn}（{len(cn)} 字）")
        feats[f["sss"]] = {"feat": f["feat"], "cn": cn, "code": new_code,
                           "folder": f"{prod}-{mod_code}-{f['sss']}-{cn}"}
    mod = mp["module"]
    ordinal = mod.get("ordinal")
    if ordinal and not re.match(r"^\d{2}$", ordinal):
        sys.exit(f"[拒绝] module.ordinal 须为两位数字: {ordinal!r}")
    # 模块目录名: 有序号时 {ordinal}-{ModCode} {中文名}, 否则 {ModCode} {中文名}
    mod_dir = (f"{ordinal}-{mod['code']} {mod.get('cn_name', '')}".strip()
               if ordinal else f"{mod['code']} {mod.get('cn_name', '')}".strip())
    mp["_mod_dir"] = mod_dir
    return old_mod, feats


def new_text(text: str, old_mod: str, feats: dict, mod_code: str, prod_code: str, dry: bool):
    """按优先级替换四类引用，返回 (新文本, 替换计数, 残留列表)。"""
    n = 0
    # 1) 完整引用: 编码-SSS_中文名
    for sss, f in feats.items():
        full = f"{old_mod}-{sss}_{f['cn']}"
        c = text.count(full)
        if c:
            text = text.replace(full, f["code"]); n += c
    # 2) 子编号: 编码-SSS(-NN[-NNN]*)
    sub = re.compile(re.escape(old_mod) + r"-(\d{3})((?:-\d{2,3})*)")

    def sub_repl(m):
        nonlocal n
        sss, tail = m.group(1), m.group(2) or ""
        if sss in feats:
            n += 1
            return feats[sss]["code"] + tail
        return m.group(0)
    text = sub.sub(sub_repl, text)
    # 裸模块码（先于完整引用/子编号替换前的计数已并入各自分支, 此处兜底剩余引用）
    c = len(re.findall(re.escape(old_mod), text))
    if c:
        text = re.sub(re.escape(old_mod), f"{prod_code}-{mod_code}", text)
        n += c
    return text, n


def front_matter(text: str, code: str, cn: str, doctype: str, repo: str) -> str:
    if text.lstrip("﻿").startswith("---"):
        return text  # 已有 front matter 则不重复注入
    fm = (f"---\nspec-id: {code}\ntitle: {cn}\ntype: {doctype}\n"
          f"repo: {repo}\nstatus: draft\n---\n\n")
    return fm + text


def normalize_name(name: str) -> str:
    return name.replace("_PM-spec", "-PM-spec").replace("_Analyst-spec", "-Analyst-spec")


def doctype_of(fname: str) -> str:
    if "-PM-spec" in fname or "_PM-spec" in fname: return "PM"
    if "-Analyst-spec" in fname or "_Analyst-spec" in fname: return "Analyst"
    return "Spec"


def registry_text(mp: dict, feats: dict, today: str) -> str:
    prod, mod = mp["product"], mp["module"]
    services_col = {f["sss"]: " / ".join(f.get("services") or ["—"]) for f in mp["features"]}
    rows = []
    for sss, f in feats.items():
        rows.append(
            f"| {f['code']} | {f['cn']} | {f['folder']} | {mod['old']}-{sss} | {mod['repo']} | "
            f"{services_col[sss]} | Active | 待定 | {today} |")
    body = (
        "# SPEC 注册表\n\n"
        "> 依据《SPEC编码规则说明.md》维护。编码 = `{ProductCode}-{ModCode}-{SSS}-{FeatName}`，"
        "稳定 ID 三段（ProductCode-ModCode-SSS）一经分配不变。\n\n"
        "## 产品层\n\n| 产品 | ProductCode | 说明 |\n|---|---|---|\n"
        f"| {prod['cn_name']} | {prod['code']} | {prod.get('repo_hint', '')} |\n\n"
        "## 模块层\n\n| 模块编码 | 中文名 | 目录 | 代码仓库 | 备注 |\n|---|---|---|---|---|\n"
        f"| {prod['code']}-{mod['code']} | {mod['cn_name']} | {prod['code']}/{mp['_mod_dir']} | {mod['repo']} | "
        f"原编码 {mod['old']}，{today} 按编码规则重编码 |\n\n"
        "## 功能点登记\n\n"
        "| 编码 | 中文名 | 文件夹 | 旧编码 | 代码仓库 | 主要服务/Controller | 状态 | 负责人 | 创建日期 |\n"
        "|---|---|---|---|---|---|---|---|---|\n" + "\n".join(rows) + "\n")
    return body


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", required=True)
    ap.add_argument("--mapping", required=True)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--registry-only", action="store_true", help="只补写注册表（用于分开执行时）")
    args = ap.parse_args()

    root = Path(args.root)
    mp = json.loads(Path(args.mapping).read_text(encoding="utf-8"))
    old_mod, feats = build_map(mp)
    keep = set(mp.get("keep_refs", []))
    dry = args.dry_run
    print(f"[模式] {'DRY-RUN 预演' if dry else '实跑'}  root={root}")

    moved = replaced_total = 0
    leftovers = []
    new_root = root / mp["product"]["code"] / mp["_mod_dir"]

    if not args.registry_only:
        old_root = root / mp["module"].get("old_dir", old_mod) if mp["module"].get("old_dir") else root / old_mod
        # 旧目录名可能是 "编码 中文说明" 形式, 自动匹配
        if not old_root.exists():
            cands = [p for p in root.iterdir() if p.is_dir() and p.name.startswith(old_mod)]
            if len(cands) == 1:
                old_root = cands[0]
                print(f"[提示] 匹配到旧模块目录: {old_root.name}")
        if not old_root.exists():
            sys.exit(f"[错误] 旧模块目录不存在: {old_root}")
        for sss, f in feats.items():
            src = old_root / f"{old_mod}-{sss}_{f['cn']}"
            dst = new_root / f["folder"]
            if not src.exists():
                print(f"[跳过] 未找到功能点目录: {src}")
                continue
            dst.mkdir(parents=True, exist_ok=True)
            for fp in sorted(src.iterdir()):
                if fp.suffix != ".md":
                    continue
                text = fp.read_text(encoding="utf-8")
                before = text.count(old_mod)
                text, n = new_text(text, old_mod, feats, mp["module"]["code"], mp["product"]["code"], dry)
                text = front_matter(text, f["code"], f["cn"], doctype_of(fp.name), mp["module"]["repo"])
                new_name = normalize_name(fp.name.replace(f"{old_mod}-{sss}_{f['cn']}", f["code"]))
                if not dry:
                    (dst / new_name).write_text(text, encoding="utf-8")
                moved += 1
                replaced_total += before
                print(f"  {fp.name}  ->  {new_name}  (替换 {before} 处)")
                # 残留
                for line_no, line in enumerate(text.splitlines(), 1):
                    for m in re.finditer(re.escape(old_mod), line):
                        ctx = line.strip()[:60]
                        if any(k in line for k in keep):
                            leftovers.append(("KEEP", str(fp), line_no, ctx))
                        else:
                            leftovers.append(("WARN", str(fp), line_no, ctx))
        if not dry:
            shutil.rmtree(old_root)
            print(f"[完成] 已移除旧目录: {old_root}")

    # 注册表
    import datetime
    today = datetime.date.today().isoformat()
    reg_path = root / "_SPEC注册表.md"
    body = registry_text(mp, feats, today)
    if dry:
        print(f"[DRY] 将{'追加' if reg_path.exists() else '生成'}注册表: {reg_path}")
    else:
        if reg_path.exists():
            old = reg_path.read_text(encoding="utf-8")
            mod_head = f"| {mp['product']['code']}-{mp['module']['code']} |"
            if mod_head not in old:
                sep = old.rstrip("\n") + "\n\n---\n\n"
                add = body.split("## 模块层", 1)[1]
                reg_path.write_text(sep + "## 模块层（追加）" + add, encoding="utf-8")
                print(f"[完成] 已追加注册表: {reg_path}")
            else:
                print(f"[跳过] 注册表已含该模块，不重复追加")
        else:
            reg_path.write_text(body, encoding="utf-8")
            print(f"[完成] 已生成注册表: {reg_path}")

    print(f"\n[统计] 迁移文件 {moved} 个，替换引用 {replaced_total} 处")
    if leftovers:
        keep_n = sum(1 for x in leftovers if x[0] == "KEEP")
        print(f"[残留] 共 {len(leftovers)} 处（跨模块保留 {keep_n}，需关注 {len(leftovers)-keep_n}）:")
        for kind, f, ln, ctx in leftovers[:20]:
            print(f"  [{kind}] {Path(f).name}:{ln}  {ctx}")
        if len(leftovers) > 20:
            print(f"  ... 其余 {len(leftovers)-20} 条略")


if __name__ == "__main__":
    main()
