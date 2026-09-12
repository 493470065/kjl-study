---
name: spec-autodev-biweekly-report
description: >-
  生成《产品功能 Spec 编写 & AIFlow 双周进度报告》。以 F:/spec-autodev-biweekly-report-template.md
  为模板，从 TFS（WiNEX-Inpatient-2 集合）实时采集 Spec 目录树/提交记录与 AIFlow 需求池数据，
  统计时间可输入（--from/--to），后端查询按输入日期动态计算：本期活跃需求、占比分母（存储查询
  《【RACC】病历病案需求总库存关闭池》实时执行）、Spec 模块级结构 diff 与内容修订定位。
  输出 Markdown 报告 + AIStudio「工作汇报」界面 JSON。触发词：双周报告、双周进度报告、
  Spec编写进度报告、AIFlow进度报告、生成第N期报告。
---

# 产品功能 Spec 编写 & AIFlow 双周进度报告生成

病历条线双周期报告自动化技能。按模板产出「一、本期工作亮点 / 做法」「二、Spec 编写进度」「三、AIFlow 自动开发进度」三段式报告。

## 何时使用

- 用户要求生成第 N 期双周报告 / 双周进度报告
- 用户要求统计某时间段内的 Spec 编写进度或 AIFlow 自动开发进度

## 关键参数（统计时间可输入）

| 参数 | 说明 | 默认 |
|------|------|------|
| `--from` | 统计起始日 `YYYY-MM-DD`（必填）。AIFlow 本期活跃判定、Spec 提交采集均以此为起点 | fetch 默认 14 天前 |
| `--to` | 统计截止日 `YYYY-MM-DD` | 今天 |
| `--issue` | 期数 N | 必填 |
| `--owner` / `--dept` | 填报人 / 填报部门（决定输出文件名 `【部门】…（第N期）.md`） | 康景磊 / 病历 |
| `--highlight` | 本期自定义亮点，可多次传（生成的亮点排在自动亮点之前） | 无 |
| `--prev-json` | 上期 report JSON 路径，用于概览「上期」列环比 | 无（上期列显示 —） |

数据目录（TFS 客户端与采集产出）：`F:/kjl-study/AIStudio/data/mcp/tfs-query-winex/biweekly-data/`，可用 `--workdir` 覆盖。

## 执行流程（两步）

### 第 1 步：采集（TFS 实时查询，注意存储过程较慢 37~51 秒属正常，建议 run_in_background）

```bash
node "C:/Users/Lenovo/.workbuddy/skills/spec-autodev-biweekly-report/scripts/fetch.mjs" \
  --from 2026-09-11 --to 2026-09-24
```

产出（`--workdir/biweekly-data/`）：
- `aiflow_items.json` — AIFlow 需求池全量（存储查询 `d8d4554b-8918-4a0e-a108-245d227633b4`）
- `spec_tree.json` — /Spec 目录树本期快照；**覆盖前自动把旧快照存为 `spec_tree_prev.json`**（供本期结构 diff）
- `spec_snapshot.zip` — /Spec 全量 zip
- `spec_commits.json` + `spec_commit_modules.json` — 自 `--from` 以来的 /Spec 提交及按模块归组摘要
- `denominator_query.json` — 占比分母（存储查询 `c5276b73-fed9-4c4f-83c7-86fea07c3ee4`《【RACC】病历病案需求总库存关闭池》实时执行）

### 第 2 步：生成报告

```bash
python "C:/Users/Lenovo/.workbuddy/skills/spec-autodev-biweekly-report/scripts/generate.py" \
  --from 2026-09-11 --to 2026-09-24 --issue 2 \
  --highlight "**产品评审闭环**：……" \
  --prev-json "F:/kjl-study/AIStudio/frontend/public/reports/archive/biweekly-autodev-第1期.json"
```

输出：
- `F:/【病历】产品功能Spec编写&AIFlow双周进度报告（第N期）.md`（`--out-dir` 可改）
- AIStudio 工作汇报 JSON：`F:/kjl-study/AIStudio/frontend/public/reports/biweekly-autodev-v1.json`（旧期次自动归档到同目录 `archive/`；`--no-json` 可跳过）

### 第 3 步：核对与交付

1. 检查脚本 stdout 的统计摘要（Spec 功能点数、AIFlow 活跃数、分母数）是否与明细表一致
2. 用 `sed -n` / Read 抽查报告关键段落（报告期、亮点、两张明细表）
3. `present_files` 交付 MD 报告；若 AIStudio 在运行，提醒用户刷新「工作汇报」界面即可看到本期报告

## 统计口径（内置于脚本，向用户解释时使用）

- **AIFlow 本期活跃** = 满足以下之一的需求数（窗口 `[--from, --to]`，按 createdDate/changedDate 判定）：
  本期完成（上期已存在、本期进入已关闭/已验证）+ 本期新增并完成 + 推进至已解决 + 本期新增（未完成）。
  「无变化」的上期遗留需求不进明细与统计。
- **AIFlow 占比分母** = 存储查询《【RACC】病历病案需求总库存关闭池》实时命中数（病历条线四项目：住院/门诊/病案/急诊）。
- **Spec 明细** = 仅列本期有实质变化的模块：①与上期快照 diff 出的功能点归并/扩展/新增模块；②本期有 /Spec 提交的内容修订模块。纯编码定稿无变化的模块不列。
- **状态映射**：✅ 已关闭+已验证｜🔄 已解决｜⏳ 其他；TFS UTC 时间统一转北京时间（+8）。

## 已知坑（务必遵守）

1. TFS 存储查询慢（37~51 秒），fetch 必须后台运行或给足 timeout（≥300 秒）。
2. TFS 4.1 的 getQuery 返回 wiql 为 undefined；执行存储查询用 `GET _apis/wit/wiql/{id}?api-version=4.1`。
3. `System.StateChangeDate` 字段在「需求」工作项上不存在；已解决时间用 `Microsoft.VSTS.Common.ResolvedDate`（如需精确"首次进入已解决"口径）。
4. 仓库名拼写为 `winning-record-konwledge`（历史拼写），fetch 已自动回退尝试 `knowledge`。
5. Node 运行环境：依赖 `azure-devops-node-api`，已装在 `--workdir`（tfs-client.mjs 同目录）下，技能脚本通过绝对路径 import，勿移动 tfs-client.mjs。
6. 期数连续性：第 1 期报告在 `F:/【病历】产品功能Spec编写&AIFlow双周进度报告（第1期）.md`；生成第 N 期时若需要环比，`--prev-json` 传上一期归档 JSON（`reports/archive/biweekly-autodev-第N-1期.json`）。
7. 亮点中人工部分（评审闭环、跨条线复用等）由调用方结合本期实际工作通过 `--highlight` 提供，脚本只自动生成 Spec/AIFlow 两条数据驱动亮点。
