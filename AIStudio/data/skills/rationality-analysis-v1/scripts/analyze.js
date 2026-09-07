#!/usr/bin/env node
/**
 * rationality-analysis-v1 — 合理性设计分析脚本（AIStudio 需求归集「合理性设计」技能数据源）
 *
 * 输入：环境变量 SKILL_ARGS_JSON（JSON 对象），由平台 /exec 端点注入：
 *   {
 *     fp:       { code, name, module, total, req, soft, avgMonthly, softRatio, trend, fpi, level },
 *     reqItems: [ { id, title, state, type, reqType, createdDate } ],   // 需求类工单
 *     softItems:[ { id, title, state, type, reqType, createdDate } ],   // 软质类工单
 *     ...其他调用参数原样透传
 *   }
 * 输出：stdout 输出 Markdown 格式的合理性设计分析报告（现状评估/主要风险/成因分析/治理建议/结论）
 */
'use strict';

const fs = require('fs');

function loadArgs() {
  const raw = process.env.SKILL_ARGS_JSON || '{}';
  try { return JSON.parse(raw) || {}; } catch (e) {
    process.stderr.write('[analyze] SKILL_ARGS_JSON 解析失败: ' + e.message + '\n');
    return {};
  }
}

/** 关键词 → 设计薄弱维度分类 */
const DIMENSIONS = [
  { key: '稳定性',     re: /无法|失败|报错|异常|崩溃|闪退|死机|卡死|丢失|出错/i },
  { key: '校验与边界', re: /校验|判断|为空|越界|超出|上限|下限|边界|必填|合法/i },
  { key: '性能',       re: /慢|性能|卡顿|超时|加载|响应|优化速度|占用/i },
  { key: '交互与展示', re: /界面|显示|样式|布局|按钮|提示|体验|展示|弹窗|回车/i },
  { key: '流程与闭环', re: /撤销|回退|同步|闭环|流转|状态|签署|审批|归档|交接/i },
  { key: '数据一致性', re: /重复|不一致|错乱|覆盖|丢失数据|数据错误|串/i },
];

function classify(items) {
  const buckets = {};
  for (const it of items || []) {
    const title = String(it.title || '');
    const hit = DIMENSIONS.find(d => d.re.test(title));
    const key = hit ? hit.key : '其他';
    (buckets[key] = buckets[key] || []).push(it);
  }
  return buckets;
}

function fmtRatio(fp) {
  if (fp.softRatio == null) return '—';
  if (fp.softRatio >= 1e6) return '∞（该功能点无需求类工单，全部为软质）';
  return String(fp.softRatio);
}

function main() {
  const args = loadArgs();
  const fp = args.fp || {};
  const reqItems = Array.isArray(args.reqItems) ? args.reqItems : [];
  const softItems = Array.isArray(args.softItems) ? args.softItems : [];
  const total = fp.total != null ? fp.total : (reqItems.length + softItems.length);
  const softRatio = fp.softRatio != null ? fp.softRatio : (fp.req > 0 ? +(softItems.length / fp.req).toFixed(2) : (softItems.length > 0 ? 1e7 : 0));
  const trend = fp.trend || '—';
  const trendUp = /^\+\d/.test(trend);
  const name = fp.name || fp.code || '该功能点';

  const lines = [];
  lines.push(`## 一、现状评估`);
  lines.push('');
  lines.push(`- **功能点**：${fp.code || '（无编码）'} ${name}（模块：${fp.module || '—'}）`);
  lines.push(`- **健康度**：FPI ${fp.fpi ?? '—'}${fp.level ? `（${fp.level}）` : ''}，工单 ${total ?? '—'} 条 = 需求 ${reqItems.length} + 软质 ${softItems.length}，软质/需求 ${fmtRatio(fp) || fmtRatio({ softRatio })}，近90天趋势 ${trend}`);
  if (total === 0) {
    lines.push(`- **判断**：当前无工单数据，功能点处于空闲状态，暂无明显设计问题信号，建议保持关注。`);
  } else if (softItems.length === 0) {
    lines.push(`- **判断**：无软件质量类工单，软质比为 0，设计层面暂无暴露的质量风险，属合理形态。`);
  } else if (reqItems.length === 0) {
    lines.push(`- **判断**：全部工单均为软件质量类（软质比 ∞），说明该功能点在无新增需求的情况下持续产生质量问题，设计与实现存在薄弱点，需重点排查。`);
  } else if (softRatio >= 1) {
    lines.push(`- **判断**：软质数（${softItems.length}）不低于需求数（${reqItems.length}），软质比 ${fmtRatio({ softRatio })}，每提出 1 项需求即伴随至少 1 项质量缺陷，质量债偏重。`);
  } else if (softRatio >= 0.5) {
    lines.push(`- **判断**：软质比 ${fmtRatio({ softRatio })} 处于中等偏高水平，存在一定质量债，需要关注缺陷收敛趋势。`);
  } else {
    lines.push(`- **判断**：软质比 ${fmtRatio({ softRatio })} 较低，需求与质量比例基本合理。`);
  }
  lines.push('');

  lines.push(`## 二、主要风险`);
  lines.push('');
  const softBuckets = classify(softItems);
  const softRank = Object.entries(softBuckets).sort((a, b) => b[1].length - a[1].length);
  if (softRank.length === 0) {
    lines.push(`- 暂无软质工单，无显著质量风险。`);
  } else {
    for (const [dim, items] of softRank) {
      const titles = items.slice(0, 3).map(x => `#${x.id} ${x.title}`).join('；');
      lines.push(`- **${dim}（${items.length} 条）**：${titles}${items.length > 3 ? ' 等' : ''}`);
    }
  }
  if (trendUp && softItems.length > 0) lines.push(`- **热度上升**：近90天趋势 ${trend}，若持续升温而软质未收敛，风险将放大。`);
  const openSoft = softItems.filter(x => !['已关闭', '已解决', '已完成', '关闭'].includes(String(x.state || '').trim()));
  if (openSoft.length > 0) lines.push(`- **未完结软质 ${openSoft.length} 条**：存量缺陷尚未清零（如 #${openSoft[0].id} 状态 ${openSoft[0].state || '—'}）。`);
  lines.push('');

  lines.push(`## 三、成因分析（设计层面）`);
  lines.push('');
  if (softRank.length > 0) {
    const causes = {
      '稳定性': '异常分支覆盖不足、容错处理欠缺，接口/服务异常场景未在设计中枚举',
      '校验与边界': '输入约束与边界条件在需求/设计中定义不充分，开发按各自理解实现',
      '性能': '数据量估算与查询设计未纳入设计考量，缺少性能场景设计',
      '交互与展示': '交互细节（提示、布局、操作反馈）设计粒度过粗，实现自由度大',
      '流程与闭环': '状态机与逆向流程（撤销/回退/同步）设计不完整，流程存在断点',
      '数据一致性': '多端/多场景并发写同一数据的策略未定义，缺少唯一性与冲突设计',
      '其他': '问题场景较分散，需逐条结合需求背景进一步定位',
    };
    for (const [dim] of softRank.slice(0, 4)) lines.push(`- **${dim}**：${causes[dim] || causes['其他']}`);
    if (softRatio >= 1) lines.push(`- **功能点拆分粒度**：软质比 ≥ 1 提示该功能点可能承载了过多职责，建议评估是否需要拆分为更细的功能点分别治理。`);
  } else {
    lines.push(`- 当前无软质工单，未暴露明显设计薄弱维度；若后续软质上升，建议从异常处理、边界校验、交互细节三方面优先排查。`);
  }
  lines.push('');

  lines.push(`## 四、治理建议（按优先级）`);
  lines.push('');
  let pri = 1;
  if (openSoft.length > 0) {
    lines.push(`${pri++}. **优先清零存量软质**：对 ${openSoft.length} 条未完结软质排期修复，先解决稳定性/数据一致性类高风险缺陷。`);
  }
  if (softRatio >= 1) {
    lines.push(`${pri++}. **复评功能点设计**：结合需求文档与设计文档复核该功能点的拆分粒度与职责边界，必要时拆分重构。`);
  }
  if (softRank.length > 0) {
    lines.push(`${pri++}. **补强设计约束**：针对「${softRank[0][0]}」维度补充设计规范（边界条件、异常分支、交互细节），并在需求评审时增加对应检查项。`);
  }
  if (trendUp) {
    lines.push(`${pri++}. **控制热度**：趋势 ${trend} 上升，建议对该功能点的后续需求加强评审与测试准入，避免边新增边产生缺陷。`);
  }
  if (pri === 1) {
    lines.push(`1. **保持监控**：当前形态合理，维持月度 FPI 盘点观察即可。`);
  }
  lines.push('');

  lines.push(`## 五、结论`);
  lines.push('');
  if (total === 0) lines.push(`**${name}** 当前无工单，形态健康，保持常规监控。`);
  else if (softItems.length === 0) lines.push(`**${name}** 无软质暴露，设计基本合理（FPI ${fp.fpi ?? '—'}）。`);
  else if (softRatio >= 1) lines.push(`**${name}** 软质比 ${fmtRatio({ softRatio })} 且趋势 ${trend}，设计存在明显薄弱点，建议限期整改并复评功能点拆分。`);
  else lines.push(`**${name}** 存在以「${softRank[0]?.[0] || '质量'}」为主的质量债（软质 ${softItems.length} 条），建议针对性补强设计约束并收敛存量缺陷。`);

  process.stdout.write(lines.join('\n') + '\n');
}

main();
