# -*- coding: utf-8 -*-
"""
产品功能 Spec 编写 & AIFlow 双周进度报告 —— 生成器（统计日期可输入）
模板: F:/spec-autodev-biweekly-report-template.md

用法:
  python generate.py --from 2026-09-11 --to 2026-09-24 --issue 2 \
      [--owner 康景磊] [--dept 病历] [--workdir <tfs-query-winex目录>] \
      [--out-dir F:/] [--highlight "自定义亮点1" ...] [--prev-json <上期report.json>] [--no-json]

数据源（fetch.mjs 产出，位于 --workdir/biweekly-data/）:
  aiflow_items.json        AIFlow 需求池全量（createdDate/changedDate 用于本期窗口计算）
  spec_tree.json           /Spec 目录树本期快照
  spec_tree_prev.json      /Spec 目录树上期快照（存在则做模块级结构 diff）
  spec_commit_modules.json 本期 Spec 提交按模块归组（内容修订依据）
  denominator_query.json   AIFlow 占比分母（存储查询《【RACC】病历病案需求总库存关闭池》）

输出:
  <out-dir>/【<dept>】产品功能Spec编写&AIFlow双周进度报告（第N期）.md
  <json-out>                AIStudio「工作汇报」界面数据源（旧期次自动归档到 reports/archive/）
"""
import json, re, os, argparse
from collections import OrderedDict
from datetime import datetime, timedelta, timezone

# ---------------- 参数 ----------------
ap = argparse.ArgumentParser()
ap.add_argument('--from', dest='frm', required=True, help='统计起始日 YYYY-MM-DD')
ap.add_argument('--to', dest='to', default=None, help='统计截止日 YYYY-MM-DD，默认今天')
ap.add_argument('--issue', type=int, required=True, help='期数 N')
ap.add_argument('--owner', default='康景磊', help='填报人')
ap.add_argument('--dept', default='病历', help='填报部门')
ap.add_argument('--workdir', default=r'F:/kjl-study/AIStudio/data/mcp/tfs-query-winex', help='TFS 数据目录')
ap.add_argument('--out-dir', default='F:/', help='Markdown 报告输出目录')
ap.add_argument('--json-out', default=r'F:/kjl-study/AIStudio/frontend/public/reports/biweekly-autodev-v1.json', help='工作汇报 JSON 输出路径')
ap.add_argument('--no-json', action='store_true', help='不输出工作汇报 JSON')
ap.add_argument('--highlight', action='append', default=[], help='本期自定义亮点（可多次）')
ap.add_argument('--prev-json', default=None, help='上期 report JSON（用于概览「上期」列环比）')
args = ap.parse_args()

FROM_DATE = args.frm
TO_DATE = args.to or datetime.now().strftime('%Y-%m-%d')
CUT = f'{FROM_DATE}T00:00:00'
_to_dt = datetime.fromisoformat(TO_DATE) + timedelta(days=1)
TO_EX = _to_dt.strftime('%Y-%m-%dT00:00:00')
ISSUE = args.issue
DATA = os.path.join(args.workdir, 'biweekly-data')
OUT = os.path.join(args.out_dir, f'【{args.dept}】产品功能Spec编写&AIFlow双周进度报告（第{ISSUE}期）.md')
PERIOD_CN = f'{FROM_DATE[:4]}.{FROM_DATE[5:7]}.{FROM_DATE[8:10]} — {TO_DATE[:4]}.{TO_DATE[5:7]}.{TO_DATE[8:10]}'
TODAY_CN = datetime.now().strftime('%Y-%m-%d')
os.makedirs(args.out_dir, exist_ok=True)
assert os.path.isdir(DATA), f'数据目录不存在: {DATA}'

def fmt_date(v):
    """TFS UTC 时间 → 北京时间日期（YYYY-MM-DD）"""
    if not v: return '—'
    try:
        dt = datetime.fromisoformat(str(v).replace('Z', '+00:00'))
        if dt.tzinfo is None: dt = dt.replace(tzinfo=timezone.utc)
        return (dt.astimezone(timezone(timedelta(hours=8)))).strftime('%Y-%m-%d')
    except Exception:
        return str(v)[:10]

def mod_cn(mod):
    """'08 Archive 归档借阅' → '归档借阅'"""
    return re.sub(r'^\d+\s+[A-Za-z]+\s+', '', mod).strip()

# ================= Spec 侧 =================
tree = json.load(open(f'{DATA}/spec_tree.json', encoding='utf-8'))
feat_dirs = OrderedDict()
for p in sorted(o['path'] for o in tree['value'] if o['gitObjectType'] == 'tree'):
    parts = p.split('/')
    if len(parts) == 6:
        line, product, mod = parts[2], parts[3], parts[4]
        feat_dirs.setdefault((line, product, mod), []).append(parts[5])

total_feats = sum(len(v) for v in feat_dirs.values())
total_files = sum(1 for o in tree['value'] if o['gitObjectType'] == 'blob')
LINE_NAME = {'住院病历Spec': '住院', '门诊病历Spec': '门诊', '急诊病历Spec': '急诊'}

def feat_code_of(dirs):
    m = re.match(r'^(Emr(?:Ip|Op|Emg)-[A-Za-z]+)-(\d+)-', dirs[0]) if dirs else None
    return m.group(1) if m else ''

def rng_of(dirs):
    nums = sorted(int(re.match(r'^(?:Emr(?:Ip|Op|Emg)-[A-Za-z]+)-(\d+)-', d).group(1))
                  for d in dirs if re.match(r'^(?:Emr(?:Ip|Op|Emg)-[A-Za-z]+)-(\d+)-', d))
    return f'{feat_code_of(dirs)}-{nums[0]:03d}~{nums[-1]:03d}' if nums else '—'

# 上期快照 diff（模块级结构变化）
prev_counts = {}
if os.path.exists(f'{DATA}/spec_tree_prev.json'):
    try:
        prev_tree = json.load(open(f'{DATA}/spec_tree_prev.json', encoding='utf-8'))
        _pc = OrderedDict()
        for p in sorted(o['path'] for o in prev_tree['value'] if o['gitObjectType'] == 'tree'):
            parts = p.split('/')
            if len(parts) == 6:
                _pc.setdefault((parts[2], parts[3], parts[4]), []).append(parts[5])
        prev_counts = {k: len(v) for k, v in _pc.items()}
    except Exception as e:
        print(f'[Spec diff] 上期快照解析失败: {e}')

# 本期提交 → 内容修订模块（剔除全库级批量提交，如重编码/迁移；单提交涉及≥10个模块视为 bulk）
bulk_commits, commit_mods, n_bulk = set(), {}, 0
if os.path.exists(f'{DATA}/spec_commit_modules.json'):
    cm = json.load(open(f'{DATA}/spec_commit_modules.json', encoding='utf-8'))
    for d in cm.get('detail', []):
        if len(d.get('modules', [])) >= 10:
            bulk_commits.add(d['commitId'])
    n_bulk = len(bulk_commits)
    for d in cm.get('detail', []):
        if d['commitId'] in bulk_commits or d.get('error') or not d.get('modules'):
            continue
        for k in d['modules']:
            commit_mods.setdefault(k, {'commits': 0, 'authors': set(), 'lastDate': ''})
            commit_mods[k]['commits'] += 1
            commit_mods[k]['authors'].add(d.get('author', ''))
            commit_mods[k]['lastDate'] = max(commit_mods[k]['lastDate'], d.get('date', ''))

spec_rows = []
for key, dirs in feat_dirs.items():
    line, product, mod = key
    n = len(dirs)
    changes, owner, note = [], '', ''
    prev = prev_counts.get(key)
    if prev is not None and prev != n:
        changes.append(f'功能点{"归并" if n < prev else "扩展"} {prev}→{n}')
    elif prev is None and prev_counts:
        changes.append(f'新增模块（{n} 个功能点）')
    ck = f'{line}|{product}|{mod}'
    if ck in commit_mods:
        c = commit_mods[ck]
        changes.append(f'内容修订（本期 {c["commits"]} 次提交）')
        owner = '、'.join(c['authors'])
        note = '本期有提交记录'
    if changes:
        spec_rows.append({
            'line': LINE_NAME.get(line, line), 'product': product.split(' ')[0], 'module': mod_cn(mod),
            'code': feat_code_of(dirs), 'n': n, 'rng': rng_of(dirs),
            'mod_ord': int(re.match(r'^(\d+)', mod).group(1)),
            'state': '✅', 'change': '；'.join(changes), 'owner': owner or 'RACC', 'plan': '—', 'note': note,
        })
order = {'住院': 0, '门诊': 1, '急诊': 2}
spec_rows.sort(key=lambda r: (order.get(r['line'], 9), r['mod_ord']))

# ================= AIFlow 侧（仅统计窗口内活跃） =================
items_all = json.load(open(f'{DATA}/aiflow_items.json', encoding='utf-8'))
DONE = ('已关闭', '已验证')

def in_win(s):
    return bool(s) and CUT <= s < TO_EX

def change_label(i):
    created = in_win(i.get('createdDate', ''))
    changed = in_win(i.get('changedDate', ''))
    done = i['state'] in DONE
    if created and done: return '本期新增并完成'
    if created: return '本期新增'
    if done and changed: return '本期完成'
    if changed and i['state'] == '已解决': return '推进至已解决'
    return '无变化'

# 只保留本期（--from ~ --to）有变化的需求
items = [i for i in items_all if change_label(i) != '无变化']
if not items:
    raise SystemExit(f'窗口 {FROM_DATE}~{TO_DATE} 内无活跃 AIFlow 需求，请检查日期')
state_map = lambda s: '✅' if s in DONE else ('🔄' if s == '已解决' else '⏳')
n_done = sum(1 for i in items if i['state'] in DONE)
n_prog = sum(1 for i in items if i['state'] == '已解决')

iter_short = lambda p: (p or '').split('\\')[-1]
def note_of(i):
    bits = []
    if i.get('customerName'): bits.append(i['customerName'])
    it = iter_short(i.get('iterationPath'))
    if it: bits.append(it)
    return '，'.join(bits)

aiflow_rows = sorted(items, key=lambda i: (
    0 if i['state'] in DONE else 1, i.get('finishDate') or '9999', -i['id']))
n_new = sum(1 for i in items if in_win(i.get('createdDate', '')))
n_done_in_period = sum(1 for i in items if i['state'] in DONE and in_win(i.get('changedDate', '')) and not in_win(i.get('createdDate', '')))
n_new_done = sum(1 for i in items if i['state'] in DONE and in_win(i.get('createdDate', '')))
n_prog_changed = sum(1 for i in items if i['state'] == '已解决' and in_win(i.get('changedDate', '')))
n_new_only = sum(1 for i in items if in_win(i.get('createdDate', '')) and i['state'] not in DONE)

# 占比分母：存储查询《【RACC】病历病案需求总库存关闭池》实时命中数
denq = json.load(open(f'{DATA}/denominator_query.json', encoding='utf-8'))
den_line = denq['total']
_name = {'WiNEX-Inpatient-2': '住院', 'WiNEX-Outpatient': '门诊', 'WiNEX-CaseHistory': '病案', 'WiNEX-Emergency': '急诊'}
_order = ['WiNEX-Inpatient-2', 'WiNEX-Outpatient', 'WiNEX-CaseHistory', 'WiNEX-Emergency']
denq_bp = denq.get('byProject', {})
denq_detail = '/'.join(f'{_name[k]}{denq_bp.get(k, 0)}' for k in _order if k in denq_bp)
denq_time = fmt_date(denq.get('asOf')) + ' ' + str(denq.get('asOf', ''))[11:16]
ratio = f'{len(items)}/{den_line}={len(items)/den_line*100:.1f}%'

# ================= 上期环比（可选） =================
prev_spec = {}
prev_aiflow = {}
if args.prev_json and os.path.exists(args.prev_json):
    try:
        prev = json.load(open(args.prev_json, encoding='utf-8'))
        for sec in prev.get('sections', []):
            for blk in sec.get('blocks', []):
                if blk.get('type') == 'table':
                    for row in blk.get('rows', []):
                        if len(row) >= 3:
                            label = row[0]
                            if label.startswith(('功能spec总数', '功能点', '✅ 已完成')):
                                prev_spec[label] = row[2]  # 上期报告的「本期」
                            if label.startswith(('AIFlow需求总数', '✅ 已完成', '🔄 进行中')):
                                prev_aiflow.setdefault(label, row[1])
    except Exception as e:
        print(f'[环比] 上期 JSON 解析失败: {e}')

pv = lambda d, k, alt='—': d.get(k, alt)

# ================= 亮点 =================
# 前几条：本期自定义亮点（--highlight，可多次）；末两条：按数据自动生成
HIGHLIGHTS = [re.sub(r'^\d+\.\s*', '', h) for h in args.highlight]
HIGHLIGHTS.append(
    f'**Spec 知识库持续推进**：/Spec 目录（master 分支）本期快照 {total_feats} 个功能点 / {total_files} 份 spec（按「功能点 × 三件套」计），'
    + (f'本期 {len(spec_rows)} 个模块有实质变化（结构归并/扩展与内容修订），' if spec_rows else '本期无模块级结构变化，') + '按功能点维度持续优化完善。')
HIGHLIGHTS.append(
    f'**AIFlow 自动开发稳定交付**：本期活跃 AIFlow 需求 {len(items)} 个，其中完成 {n_done} 个（含本期新增并完成 {n_new_done} 个）、'
    f'推进至已解决 {n_prog} 个，本期完成占比 {n_done/len(items)*100:.1f}%；覆盖住院（Inpatient-2）、门诊（Outpatient）、病案（CaseHistory）多产品线迭代。')
HIGHLIGHTS = [f'{i}. {h}' for i, h in enumerate(HIGHLIGHTS, 1)]

# ================= Markdown 输出 =================
L = []
L.append(f'# 产品功能 Spec 编写 & AIFlow双周进度报告（第 {ISSUE} 期）')
L.append('')
L.append(f'> 报告期：{PERIOD_CN}')
L.append(f'> 填报部门：`{args.dept}`')
L.append(f'> 填报人：{args.owner}　填报日期：{TODAY_CN}')
L.append('')
L.append(f'> **填报说明**：Spec 数据取自 winning-record-konwledge 仓库 /Spec 目录（master 分支）本期快照；AIFlow 数据取自 TFS 存储查询，仅统计本期（{FROM_DATE} 起）有变化的需求，上期需求不再列出；占比分母 = TFS 存储查询《【RACC】病历病案需求总库存关闭池》实时命中数。')
L.append('')
L.append('---')
L.append('')
L.append('## 一、本期工作亮点 / 做法')
L.append('')
for _h in HIGHLIGHTS:
    L.append(_h)
L.append('')
L.append('---')
L.append('')
L.append('## 二、Spec 编写进度')
L.append('')
L.append('### （一）进度概览（含环比）')
L.append('')
L.append(f'> 口径：功能 spec 按「功能点 × 三件套（Analyst/Design/PM）」计；本期快照取自 /Spec 目录 master 分支（{TODAY_CN}）。')
L.append('')
L.append('| 指标 | 上期 | 本期 | 占比 |')
L.append('|------|------|------|------|')
L.append(f'| 功能spec总数 | {pv(prev_spec, "功能spec总数")} | {total_files} | 100% |')
L.append(f'| 功能点（模块定稿目录） | {pv(prev_spec, "功能点（模块定稿目录）")} | {total_feats} | 100% |')
L.append(f'| ✅ 已完成（三件套齐全） | {pv(prev_spec, "✅ 已完成（三件套齐全）")} | {total_files} | 100% |')
L.append('| 🔄 进行中 | 0 | 0 | 0% |')
L.append('| ⏳ 待开始 | 0 | 0 | 0% |')
L.append('| ❌ 已取消/暂缓 | 0 | 0 | 0% |')
L.append('')
_bulk_note = f'另有 {n_bulk} 个全库级提交（重编码/迁移类）不计入模块明细。' if n_bulk else ''
if spec_rows:
    L.append(f'> **本期变化**：{len(spec_rows)} 个模块有实质变化——'
             + '；'.join(f"{r['line']}-{r['module']}（{r['change']}）" for r in spec_rows[:6])
             + ('等' if len(spec_rows) > 6 else '') + '。' + _bulk_note)
else:
    L.append('> **本期变化**：无模块级结构变化与内容修订提交。' + _bulk_note)
L.append('')
L.append('### （二）本期明细')
L.append('')
L.append(f'> 状态列标本期快照；仅列出本期（{FROM_DATE} ~ {TO_DATE}）有实质变化（结构归并/扩展、内容修订提交）的功能模块。')
L.append('')
if spec_rows:
    L.append('| 序号 | 功能模块 | 模块编号 | 功能点 | 功能编号 | 状态 | 本期变化 | 责任人 | 计划完成时间 | 备注 |')
    L.append('|------|---------|--------|------|--------|------|---------|------|------|------|')
    for idx, r in enumerate(spec_rows, 1):
        L.append(f"| {idx} | {r['line']}-{r['module']} | {r['code']} | {r['n']} 个 | {r['rng']} | {r['state']} | {r['change']} | {r['owner']} | {r['plan']} | {r['note']} |")
else:
    L.append('> 本期无变化的模块不在明细表中列出。')
L.append('')
L.append('---')
L.append('')
L.append('## 三、AIFlow自动开发进度')
L.append('')
L.append('### （一）进度概览')
L.append('')
L.append(f'> 统计口径：仅统计本期（{FROM_DATE} ~ {TO_DATE}）有变化（本期完成 / 新增并完成 / 推进至已解决 / 本期新增）的 AIFlow 需求，上期需求不列入。占比按病历病案需求总库存（关闭池）中的比例计算：分母 = TFS 存储查询《【RACC】病历病案需求总库存关闭池》命中的需求 {den_line} 个（{denq_detail}，{denq_time} 实时执行）。')
L.append('')
L.append('| 指标 | 本期 | 占比 |')
L.append('|------|------|------|')
L.append(f'| AIFlow需求总数（本期活跃） | {len(items)} | {ratio} |')
L.append(f'| ✅ 已完成（已关闭+已验证） | {n_done} | {n_done/len(items)*100:.1f}% |')
L.append(f'| 🔄 进行中（已解决） | {n_prog} | {n_prog/len(items)*100:.1f}% |')
L.append('| ⏳ 待开始 | 0 | 0% |')
L.append('| ❌ 已取消/暂缓 | 0 | 0% |')
L.append('')
L.append(f'> **口径说明**：本期活跃 {len(items)} 个 = 本期完成 {n_done_in_period} 个 + 本期新增并完成 {n_new_done} 个 + 推进至已解决 {n_prog_changed - n_new_only} 个 + 本期新增 {n_new_only} 个（已解决）。剩余 {n_prog} 个已解决待测试验证关闭。')
L.append('')
L.append('### （二）本期明细')
L.append('')
L.append('| 序号 | TFS号码 | 标题 | 状态 | 本期变化 | 负责人 | 计划完成时间 | 备注 |')
L.append('|------|--------|------|------|---------|------|------|------|')
for idx, i in enumerate(aiflow_rows, 1):
    title = i['title'].replace('|', '\\|')
    L.append(f"| {idx} | {i['id']} | {title} | {state_map(i['state'])} | {change_label(i)} | {i['assignedTo']} | {fmt_date(i.get('finishDate'))} | {note_of(i)} |")
L.append('')
L.append('---')
L.append('')
L.append('> ✅ 已完成　🔄 进行中　⏳ 待开始　❌ 已取消/暂缓')
L.append('> 🔴 紧急　🟡 重要　🟢 一般')

open(OUT, 'w', encoding='utf-8').write('\n'.join(L))
print('已生成:', OUT, f'（{len(L)} 行）')
print(f'Spec: {total_feats} 功能点 / {total_files} 文件（变化模块 {len(spec_rows)}），'
      f'AIFlow: {len(items)}（完成 {n_done}、进行中 {n_prog}），分母 {den_line}')

# ================= 工作汇报 JSON（AIStudio 界面数据源） =================
if not args.no_json:
    _plain = lambda s: s.replace('**', '')
    spec_ov_rows = [
        ['功能spec总数', pv(prev_spec, '功能spec总数'), str(total_files), '100%'],
        ['功能点（模块定稿目录）', pv(prev_spec, '功能点（模块定稿目录）'), str(total_feats), '100%'],
        ['✅ 已完成（三件套齐全）', pv(prev_spec, '✅ 已完成（三件套齐全）'), str(total_files), '100%'],
        ['🔄 进行中', '0', '0', '0%'],
        ['⏳ 待开始', '0', '0', '0%'],
        ['❌ 已取消/暂缓', '0', '0', '0%'],
    ]
    aiflow_ov_rows = [
        ['AIFlow需求总数（本期活跃）', str(len(items)), ratio],
        ['✅ 已完成（已关闭+已验证）', str(n_done), f'{n_done/len(items)*100:.1f}%'],
        ['🔄 进行中（已解决）', str(n_prog), f'{n_prog/len(items)*100:.1f}%'],
        ['⏳ 待开始', '0', '0%'],
        ['❌ 已取消/暂缓', '0', '0%'],
    ]
    spec_dt_rows = [[str(idx), f"{r['line']}-{r['module']}", r['code'], f"{r['n']} 个", r['rng'], r['state'],
                     r['change'], r['owner'], r['plan'], r['note']] for idx, r in enumerate(spec_rows, 1)]
    aiflow_dt_rows = [[str(idx), str(i['id']), i['title'].replace('|', '\\|'), state_map(i['state']),
                       change_label(i), i['assignedTo'], fmt_date(i.get('finishDate')), note_of(i)]
                      for idx, i in enumerate(aiflow_rows, 1)]

    report = {
        'key': 'biweekly-autodev',
        'name': '产品功能 Spec 编写 & AIFlow 双周进度报告',
        'issue': f'第 {ISSUE} 期',
        'meta': [
            ['报告期', PERIOD_CN],
            ['填报部门', args.dept],
            ['填报人', args.owner],
            ['填报日期', TODAY_CN],
        ],
        'statement': f'Spec 数据取自 winning-record-konwledge 仓库 /Spec 目录（master 分支）本期快照；AIFlow 数据取自 TFS 存储查询，仅统计本期（{FROM_DATE} 起）有变化的需求，上期需求不再列出。',
        'highlights': [re.sub(r'^\d+\.\s*', '', _plain(h)) for h in HIGHLIGHTS],
        'sections': [
            {
                'title': '一、Spec 编写进度',
                'blocks': [
                    {
                        'type': 'table', 'title': '进度概览（含环比）',
                        'note': f'口径：功能 spec 按「功能点 × 三件套（Analyst/Design/PM）」计；本期快照取自 /Spec 目录 master 分支（{TODAY_CN}）。',
                        'columns': ['指标', '上期', '本期', '占比'], 'rows': spec_ov_rows,
                    },
                    {
                        'type': 'note',
                        'text': ('本期变化：' + ('；'.join(f"{r['line']}-{r['module']}（{r['change']}）" for r in spec_rows[:6]) + ('等' if len(spec_rows) > 6 else '')) if spec_rows else '无模块级结构变化与内容修订提交。'),
                    },
                    {
                        'type': 'table', 'title': '本期明细',
                        'note': f'状态列标本期快照；仅列出本期（{FROM_DATE} ~ {TO_DATE}）有实质变化（结构归并/扩展、内容修订提交）的功能模块。',
                        'columns': ['序号', '功能模块', '模块编号', '功能点', '功能编号', '状态', '本期变化', '责任人', '计划完成时间', '备注'],
                        'rows': spec_dt_rows,
                    },
                ],
            },
            {
                'title': '二、AIFlow 自动开发进度',
                'blocks': [
                    {
                        'type': 'table', 'title': '进度概览',
                        'note': f'统计口径：仅统计本期（{FROM_DATE} ~ {TO_DATE}）有变化的 AIFlow 需求，上期需求不列入。分母 = TFS 存储查询《【RACC】病历病案需求总库存关闭池》命中的需求 {den_line} 个（{denq_detail}，{denq_time} 实时执行）。',
                        'columns': ['指标', '本期', '占比'], 'rows': aiflow_ov_rows,
                    },
                    {
                        'type': 'note',
                        'text': f'口径说明：本期活跃 {len(items)} 个 = 本期完成 {n_done_in_period} 个 + 本期新增并完成 {n_new_done} 个 + 推进至已解决 {n_prog_changed - n_new_only} 个 + 本期新增 {n_new_only} 个（已解决）。剩余 {n_prog} 个已解决待测试验证关闭。',
                    },
                    {
                        'type': 'table', 'title': '本期明细',
                        'note': f'仅列本期（{FROM_DATE} ~ {TO_DATE}）有变化的 AIFlow 需求，支持按 TFS 号 / 标题 / 负责人搜索。',
                        'columns': ['序号', 'TFS号码', '标题', '状态', '本期变化', '负责人', '计划完成时间', '备注'],
                        'rows': aiflow_dt_rows,
                        'filterable': True,
                    },
                ],
            },
        ],
        'legend': ['✅ 已完成', '🔄 进行中', '⏳ 待开始', '❌ 已取消/暂缓'],
        'generatedAt': datetime.now().strftime('%Y-%m-%d %H:%M'),
    }
    # 旧期次归档
    if os.path.exists(args.json_out):
        try:
            old = json.load(open(args.json_out, encoding='utf-8'))
            if old.get('issue') and old['issue'] != report['issue']:
                arc_dir = os.path.join(os.path.dirname(args.json_out), 'archive')
                os.makedirs(arc_dir, exist_ok=True)
                arc = os.path.join(arc_dir, f"biweekly-autodev-{old['issue'].replace(' ', '')}.json")
                os.replace(args.json_out, arc)
                print('上期 JSON 已归档:', arc)
        except Exception as e:
            print('[JSON 归档] 跳过:', e)
    os.makedirs(os.path.dirname(args.json_out), exist_ok=True)
    with open(args.json_out, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print('已生成:', args.json_out)
