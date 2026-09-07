#!/usr/bin/env node
/**
 * rational-design-v1 — 功能点深挖与结构治理报告脚本（AIStudio 需求归集「合理性设计」技能数据源）
 *
 * 输入：环境变量 SKILL_ARGS_JSON（JSON 对象），由平台 /exec 端点注入：
 *   {
 *     fp:       { code, name, module, total, req, soft, avgMonthly, softRatio, trend, fpi, level },
 *     reqItems: [ { id, title, state, type, reqType, createdDate } ],   // 需求类工单 (需)
 *     softItems:[ { id, title, state, type, reqType, createdDate } ],   // 软质类工单 (软)
 *   }
 * 输出：stdout 首行为 ```fpd-meta``` 结构化数据块（报告头/摘要/目录，供前端渲染卡片组件），
 *   随后为 Markdown 四章节正文（骨架见 references/report-template.md，判定规则见 references/judgment-rules.md）
 *   一、工单分类 → 二、合理性判定 → 三、治理方案（3.1/3.2/3.3）→ 四、需求分析（4.1~4.5）
 */
'use strict';

function loadArgs() {
  try { return JSON.parse(process.env.SKILL_ARGS_JSON || '{}') || {}; } catch (e) {
    process.stderr.write('[deep-dive] SKILL_ARGS_JSON 解析失败: ' + e.message + '\n');
    return {};
  }
}

// ===== 通用工具 =====
/** 转义表格单元格内的竖线与换行，防止表格错乱 */
function esc(s) {
  return String(s ?? '—').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim() || '—';
}
/** 工单列表在单元格内竖排展示 */
function cellTickets(items, kind) {
  return items.map(x => `${x.id}(${kind})`).join('<br>') || '—';
}
function pad2(n) { return String(n).padStart(2, '0'); }

// ===== 维度分类（软质问题点归并口径） =====
const DIMENSIONS = [
  { key: '合规与签名', re: /签名|CA|签章|电子签|法规|合规/i },
  { key: '状态与闭环', re: /撤销|回退|同步|闭环|流转|状态|归档|交接|作废|残留/i },
  { key: '校验与边界', re: /校验|判断|为空|越界|超出|上限|下限|边界|必填|合法|重复/i },
  { key: '稳定性',     re: /无法|失败|报错|异常|崩溃|卡死|丢失|出错/i },
  { key: '交互与展示', re: /界面|显示|样式|布局|按钮|提示|体验|弹窗|回车/i },
  { key: '性能',       re: /慢|性能|卡顿|超时|加载|响应|占用/i },
];
function dimOf(title) {
  const hit = DIMENSIONS.find(d => d.re.test(String(title || '')));
  return hit ? hit.key : '其他';
}
// ===== 根因四分类（启发式，判定标准见 judgment-rules.md 二） =====
function rootCauseOf(title, kind) {
  const t = String(title || '');
  if (kind === '需') return '产品方向缺位';
  if (/缓存|日志|漏写|没同步|未同步|写错|漏调|状态没/.test(t)) return '实现质量失守';
  if (/双链路|多入口|并存|无校验|靠约定|手工|前端.*写|重复签署|残留/.test(t)) return '设计本身缺陷';
  if (/撤销|回退|同步|残留|重复/.test(t)) return '混合';
  return '混合';
}
function dominantOf(cause) {
  if (cause === '混合') return '混合，设计缺陷主导';
  return cause;
}

// ===== 严重等级判定 =====
// 🔴：合规维度软质 或 同维度软质≥2（结构性缺口导致同类问题反复）；
// 🟡：单条软质但有明显缺口；🟢：个案
function severityOf(dim, count) {
  if (dim === '合规与签名') return '🔴';
  if (count >= 2) return '🔴';
  if (count === 1) return '🟡';
  return '🟢';
}

// ===== 治理要点模板（按维度定制） =====
function planFocusOf(dim) {
  switch (dim) {
    case '合规与签名': return { gap: '签名状态与文档状态未强绑定，撤销/作废场景下签名残留或失效路径不唯一', action: '签名生命周期收口为单一权威服务，状态变更加服务端强校验与审计日志', scenario: '签名-撤销-作废全生命周期' };
    case '状态与闭环': return { gap: '关键状态变更依赖多入口/手工触发，缺服务端自动同步与失败回滚，任一路径漏调即状态不一致', action: '状态机收口+变更事件自动同步+失败补偿', scenario: '状态流转与撤销闭环' };
    case '校验与边界': return { gap: '入参与边界条件靠前端约定校验、服务端未兜底，异常输入可穿透至存储层', action: '服务端校验前置+统一错误码+边界用例全覆盖', scenario: '入参校验与边界处理' };
    case '稳定性':     return { gap: '失败路径缺诊断日志与错误分类，问题定位靠猜、同类报错反复发生', action: '错误码分类+后端诊断日志+失败兜底与重试', scenario: '异常路径诊断与恢复' };
    case '交互与展示': return { gap: '交互反馈与数据状态脱节，界面展示与实际存储状态不一致', action: '展示状态统一从权威数据源读取，操作反馈与后端结果强一致', scenario: '操作反馈与状态展示' };
    case '性能':       return { gap: '大数据量/高并发场景响应劣化，缺分页、缓存失效与异步化设计', action: '查询分页+缓存策略治理+重操作异步化', scenario: '大数据量与并发场景' };
    default:           return { gap: '问题模式尚未归入结构化缺口，需结合代码实扫进一步定位', action: '代码实扫定位后制定针对性改造', scenario: '个案场景' };
  }
}

function main() {
  const args = loadArgs();
  const fp = args.fp || {};
  const reqItems = Array.isArray(args.reqItems) ? args.reqItems : [];
  const softItems = Array.isArray(args.softItems) ? args.softItems : [];
  const name = fp.name || fp.code || '该功能点';
  const code = fp.code || '（无编码）';
  const module = fp.module || '—';
  const total = fp.total != null ? fp.total : (reqItems.length + softItems.length);
  const today = new Date().toISOString().slice(0, 10);
  const softRatioText = fp.softRatio != null ? (fp.softRatio >= 1e6 ? '∞' : String(fp.softRatio)) : '—';

  // ===== 问题点归并：软质按维度、需求逐条 =====
  const softByDim = {};
  for (const it of softItems) {
    const d = dimOf(it.title);
    (softByDim[d] = softByDim[d] || []).push(it);
  }
  const problems = [];
  let pn = 0;
  for (const [dim, items] of Object.entries(softByDim)) {
    pn++;
    const sev = severityOf(dim, items.length);
    const cause = rootCauseOf(items[0]?.title, '软');
    problems.push({ id: 'P' + pad2(pn), kind: '软', kindLabel: '软质', name: dim, items, sev, cause, focus: planFocusOf(dim) });
  }
  for (const it of reqItems) {
    pn++;
    problems.push({ id: 'P' + pad2(pn), kind: '需', kindLabel: '需求', name: it.title, items: [it], sev: '🟢', cause: rootCauseOf(it.title, '需'), focus: planFocusOf('其他') });
  }

  // ===== 2×2 象限（阈值：≥3 为高） =====
  const hi = n => n >= 3;
  let quadrant, quadrantAction;
  if (hi(reqItems.length) && hi(softItems.length)) { quadrant = '高需高软（结构问题区）'; quadrantAction = '功能点级判定重点对象，进 3.1'; }
  else if (!hi(reqItems.length) && hi(softItems.length)) { quadrant = '低需高软（质量债区）'; quadrantAction = '进 3.1 或 3.3，视根因'; }
  else if (hi(reqItems.length) && !hi(softItems.length)) { quadrant = '高需低软（能力缺位区）'; quadrantAction = '进 3.2'; }
  else { quadrant = '低需低软（健康区）'; quadrantAction = '保持监控'; }

  // ===== 功能点级判定 =====
  const redPs = problems.filter(p => p.sev === '🔴');
  const yellowPs = problems.filter(p => p.sev === '🟡');
  const greenSoftPs = problems.filter(p => p.sev === '🟢' && p.kind === '软');
  const reqPs = problems.filter(p => p.kind === '需');
  const channelOf = p => p.cause === '产品方向缺位' ? '3.2 产品规划' : p.cause === '实现质量失守' ? '3.3 缺陷治理' : '3.1 设计优化';
  let fpVerdictShort, fpVerdictDetail;
  if (redPs.length > 0) {
    const targets = [...new Set(redPs.map(channelOf))];
    fpVerdictShort = '🔴 功能点级不合理';
    fpVerdictDetail = `${redPs.map(p => p.name).join('、')} 存在结构性缺口——同类软质问题的集中地（软质/需求 ${softRatioText}）；进 ${targets.join(' 与 ')}`;
  } else if (yellowPs.length > 0) {
    const targets = [...new Set(yellowPs.map(channelOf))];
    fpVerdictShort = '🟡 功能点级部分不合理';
    fpVerdictDetail = `${yellowPs.map(p => p.name).join('、')} 存在可用但有缺口的方案；进 ${targets.join(' 与 ')}，保持监控收敛`;
  } else {
    fpVerdictShort = '🟢 功能点级合理';
    fpVerdictDetail = '现状方案可用，无结构性缺口，保持监控';
  }

  // ===== 治理分组 =====
  const designPs = problems.filter(p => (p.cause === '设计本身缺陷' || p.cause === '混合') && p.sev !== '🟢');
  const productPs = problems.filter(p => p.cause === '产品方向缺位'); // 全部需求类 + 产品方向缺位软质
  const bugPs = problems.filter(p => p.cause === '实现质量失守' && p.sev !== '🟢');

  const L = [];
  const W = s => L.push(s);

  // ===== 结构化报告头（fpd-meta）：前端识别后渲染为卡片组件，不进 Markdown 正文 =====
  const levelLabel = fp.level === 'danger' ? '危险' : fp.level === 'warn' ? '预警' : fp.level === 'healthy' ? '健康' : esc(fp.level);
  const kpiToneOf = t => t === 'danger' ? 'danger' : t === 'warn' ? 'warn' : 'neutral';
  const trendTone = String(fp.trend || '').startsWith('+') ? 'warn' : 'neutral';
  const reqCount = fp.req != null ? fp.req : reqItems.length;
  const softCount = fp.soft != null ? fp.soft : softItems.length;
  const meta = {
    title: `${name} 功能点深挖报告`,
    code, module,
    kpis: [
      { label: 'FPI', value: String(fp.fpi ?? '—'), sub: levelLabel, tone: kpiToneOf(fp.level) },
      { label: '趋势', value: String(fp.trend ?? '—'), sub: '环比上月', tone: trendTone },
      { label: '月均工单', value: String(fp.avgMonthly ?? '—'), sub: `软质/需求 ${softRatioText}`, tone: 'neutral' },
    ],
    verdict: {
      tone: redPs.length > 0 ? 'danger' : yellowPs.length > 0 ? 'warn' : 'ok',
      text: fpVerdictShort.replace(/^(🔴|🟡|🟢)\s*/, ''),
      cause: redPs.length > 0 ? dominantOf(redPs[0].cause) : yellowPs.length > 0 ? dominantOf(yellowPs[0].cause) : '—',
      detail: fpVerdictDetail,
    },
    metrics: [
      { label: '工单总数', value: String(total), sub: `需求 ${reqCount} + 软质 ${softCount}` },
      { label: '问题点', value: String(problems.length), sub: `🔴 ${redPs.length} · 🟡 ${yellowPs.length} · 🟢 ${greenSoftPs.length + reqPs.length}` },
      { label: '2×2 象限', value: quadrant.replace(/（.*）/, ''), sub: quadrant.replace(/.*（/, '').replace(/）/, '') + ' · ' + quadrantAction },
      { label: '治理去向', value: designPs.length > 0 ? '3.1 设计优化' : productPs.length > 0 ? '3.2 产品规划' : bugPs.length > 0 ? '3.3 缺陷治理' : '保持监控', sub: `方案 ${designPs.length} / 规划 ${productPs.length} / 缺陷 ${bugPs.reduce((s, p) => s + p.items.length, 0)} 条` },
    ],
    chapters: ['一 工单分类', '二 合理性判定', '三 治理方案', '四 需求分析'],
  };
  W('```fpd-meta');
  W(JSON.stringify(meta));
  W('```');
  W('');

  // ===== 正文（报告头/目录/摘要已由结构化组件承载，正文从第一章开始） =====

  // ===== 一、工单分类 =====
  W(`## 一、工单分类（有什么问题）`);
  W('');
  W(`> 本章把本功能点全部工单按 **需求**（医院要什么新能力）/ **软质**（系统哪里出了质量问题）两条线分开读，再合成问题点全景表。`);
  W('');
  W(`### 1.1 功能点一维汇总`);
  W('');
  W(`| 功能点 | 合计 | 需求 | 软质 |`);
  W(`|---|---:|---:|---:|`);
  W(`| ${esc(code)}-${esc(name)} | ${total} | ${reqItems.length} | ${softItems.length} |`);
  W(`| **合计** | **${total}** | **${reqItems.length}** | **${softItems.length}** |`);
  W('');
  W(`### 1.2 问题点全景（软质按维度归并，需求逐条立点）`);
  W('');
  W(`| 编号 | 类型 | 问题点 | 关联工单 | 数量 | 等级 | 根因 |`);
  W(`|---|---|---|---|---:|---|---|`);
  for (const p of problems) {
    W(`| ${p.id} | ${p.kindLabel} | ${esc(p.name)} | ${cellTickets(p.items, p.kind)} | ${p.items.length} | ${p.sev} | ${esc(dominantOf(p.cause))} |`);
  }
  W('');
  W(`### 1.3 需求工单明细`);
  W('');
  if (reqItems.length > 0) {
    W(`| 工单 | 状态 | 标题 | 关联问题点 |`);
    W(`|---|---|---|---|`);
    for (const it of reqItems) {
      const p = problems.find(x => x.kind === '需' && x.items[0].id === it.id);
      W(`| ${esc(it.id)}(需) | ${esc(it.state)} | ${esc(it.title)} | ${p ? p.id : '—'} |`);
    }
  } else {
    W(`本功能点暂无需求类工单。`);
  }
  W('');
  W(`### 1.4 软质工单明细`);
  W('');
  if (softItems.length > 0) {
    W(`| 工单 | 状态 | 标题 | 维度归并 | 关联问题点 |`);
    W(`|---|---|---|---|---|`);
    for (const it of softItems) {
      const d = dimOf(it.title);
      const p = problems.find(x => x.kind === '软' && x.name === d);
      W(`| ${esc(it.id)}(软) | ${esc(it.state)} | ${esc(it.title)} | ${esc(d)} | ${p ? p.id : '—'} |`);
    }
  } else {
    W(`本功能点暂无软质类工单。`);
  }
  W('');
  W('---');
  W('');

  // ===== 二、合理性判定 =====
  W(`## 二、合理性判定（要不要改、为什么）`);
  W('');
  W(`### 2.1 判定汇总（问题点级 + 功能点级）`);
  W('');
  W(`**功能点级判定**：`);
  W('');
  W(`> **${fpVerdictShort}**`);
  W(`> - 核心结论：${fpVerdictDetail}`);
  W(`> - 判定依据：🔴 问题点 ${redPs.length} 个、🟡 问题点 ${yellowPs.length} 个、🟢 问题点 ${greenSoftPs.length} 个（判定规则见 judgment-rules.md）。`);
  W('');
  W(`| 问题点 | 类型 | 数量 | 问题点级判定 | 根因 | 处置去向 |`);
  W(`|---|---|---:|---|---|---|`);
  for (const p of problems) {
    const sevText = p.sev === '🔴' ? '🔴 不合理' : p.sev === '🟡' ? '🟡 部分不合理' : '🟢 合理（监控）';
    const target = p.sev === '🟢' ? '保持监控，不展开' : p.cause === '产品方向缺位' ? '3.2 产品规划' : p.cause === '实现质量失守' ? '3.3 缺陷治理' : '3.1 设计优化';
    W(`| ${p.id} ${esc(p.name)} | ${p.kindLabel} | ${p.items.length} | ${sevText} | ${esc(dominantOf(p.cause))} | ${target} |`);
  }
  W('');

  // 2.2 🔴 判定
  if (redPs.length > 0) {
    W(`### 2.2 🔴 判定（严重者在前）`);
    W('');
    for (const p of redPs) {
      W(`**${p.id} ${p.kindLabel}-${p.name}——🔴 不合理（${dominantOf(p.cause)}）**`);
      W('');
      W(`- 现象集中：${p.items.map(x => `${x.id}(软) ${x.title}`).join('；')}`);
      W(`- 不合理之处：同类「${p.name}」问题工单反复出现（${p.items.length} 条），提示存在结构性缺口——${p.focus.gap}${p.name === '合规与签名' ? '；且触及电子签名"签名与文档状态绑定"类合规要求' : ''}。（代码证据：待实扫补充，格式 文件名:行号）`);
      W(`- 根因：${dominantOf(p.cause)}（依据：工单现象模式匹配，详见 judgment-rules.md 二）。`);
      W(`- **下文**：进 ${p.cause === '实现质量失守' ? '3.3 缺陷批量治理清单' : '3.1 设计优化方案'}。`);
      W('');
    }
  }
  // 2.3 🟡 判定
  if (yellowPs.length > 0) {
    W(`### 2.3 🟡 判定`);
    W('');
    for (const p of yellowPs) {
      W(`**${p.id} ${p.kindLabel}-${p.name}——🟡 部分不合理（${dominantOf(p.cause)}）**`);
      W('');
      W(`- 缺口：问题点 ${p.items.map(x => `${x.id}(软)`).join(' ')} 暴露的方案可用但需补强——${p.focus.gap}。`);
      W(`- **下文**：进 ${p.cause === '实现质量失守' ? '3.3 缺陷批量治理清单' : '3.1 设计优化方案'}，随修复收敛。`);
      W('');
    }
  }
  // 2.4 🟢 处理
  W(`### 2.4 🟢 处理`);
  W('');
  const greenAll = [...greenSoftPs, ...reqPs];
  if (greenAll.length > 0) {
    W(`以下问题点判定为 🟢 合理（合理业务演进/个案），仅在全景表列出并保持监控，不展开判定章节：`);
    W('');
    for (const p of greenAll) {
      W(`- ${p.id} ${p.kindLabel}-${esc(p.name)}：${cellTicketsInline(p)}`);
    }
  } else {
    W(`本功能点无 🟢 问题点。`);
  }
  W('');
  W('---');
  W('');

  // ===== 三、治理方案 =====
  W(`## 三、治理方案（怎么改）`);
  W('');
  W(`> 三类根因各走一条通道：设计本身有缺陷的给**详细改造方案**（3.1，本报告核心交付）；产品还没做的能力给**产品规划建议**（3.2，待产品拍板）；代码写错的给**缺陷批量治理清单**（3.3，照清单修 bug）。`);
  W('');

  // 3.1
  W(`### 3.1 设计优化方案（根因=设计缺陷/混合）`);
  W('');
  if (designPs.length > 0) {
    W(`**方案 ↔ 问题点对应表**：`);
    W('');
    W(`| 方案 | 问题点 | 根因 |`);
    W(`|---|---|---|`);
    designPs.forEach((p, i) => {
      W(`| 方案${i + 1} ${esc(p.name)}治理 | ${p.id} ${esc(p.name)} | ${esc(dominantOf(p.cause))} |`);
    });
    W('');
    designPs.forEach((p, i) => {
      const f = p.focus;
      W(`#### 方案${i + 1} ${esc(p.name)}治理`);
      W('');
      W(`**1 问题定位**：`);
      W('');
      W(`- 结构性缺口：${f.gap}；`);
      W(`- 现象证据：${p.items.map(x => `${x.id}(软)`).join(' ')}（${p.items.length} 条同类工单）；`);
      W(`- 代码证据：待代码仓库实扫补充（格式 文件名:行号）。`);
      W('');
      W(`**2 优化对比**：`);
      W('');
      W(`| 场景 | 现状 | 方案后 |`);
      W(`|---|---|---|`);
      W(`| 正常流（${f.scenario}） | 依赖既有实现，${p.name}类操作结果不可预期 | 单一权威实现，结果确定可追溯 |`);
      W(`| 异常流（失败/中断/非法输入） | 缺失败回滚与提示，${p.name}问题残留 | 服务端校验前置，失败有明确错误码与回滚，状态一致 |`);
      W(`| 并发/存量兼容（重复操作/历史数据） | 多链路并存时序无保障，存量数据残留不一致 | 事务边界明确，存量数据提供修复迁移脚本 |`);
      W('');
      W(`**3 改造要点**：`);
      W('');
      W(`- 归并重复链路为单一权威实现，收口入口；`);
      W(`- 关键状态变更加服务端校验与自动同步，去掉"靠约定"的隐式依赖；`);
      W(`- 补充失败回滚路径与诊断日志，异常可分类、可定位。`);
      W('');
      W(`**4 用户故事**：`);
      W('');
      W(`- 作为医生，我在${f.scenario}时，希望系统一次性给出确定结果，不出现「${p.name}」类残留或报错。`);
      W(`- 作为运维人员，我希望${p.name}类问题发生时，有诊断日志能直接定位根因。`);
      W('');
      W(`**5 测试用例**：`);
      W('');
      W(`- ① 关键路径：${f.scenario}正常操作一次成功，状态与日志一致；`);
      W(`- ② 异常路径：断网/并发/重复操作下有明确提示且状态一致；`);
      W(`- ③ 存量兼容：历史数据经迁移脚本后校验通过；`);
      W(`- ④ 事件/日志完整性：每次状态变更均产生审计日志；`);
      W(`- ⑤ 回归验证：近 90 天同类软质工单场景全部复测通过。`);
      W('');
    });
  } else {
    W(`暂无设计缺陷主导的问题点，本节不展开。`);
    W('');
  }

  // 3.2
  W(`### 3.2 产品规划建议（根因=产品方向缺位）`);
  W('');
  if (productPs.length > 0) {
    for (const p of productPs) {
      W(`**${esc(p.name)}（${p.id}）**`);
      W('');
      W(`- 诉求场景：${p.items.map(x => `${x.id}(需) ${x.title}`).join('；')}`);
      W(`- 建议：诉求合理但产品尚未规划，建议沉淀为标准能力（对接规范/配置化支持），纳入产品路线图排期；`);
      W(`- 不做的后果：医院侧重复提同类需求，实施侧各自绕行定制，交付成本持续放大。`);
      W('');
    }
  } else {
    W(`暂无产品方向缺位类问题点。`);
    W('');
  }

  // 3.3
  W(`### 3.3 缺陷批量治理清单（根因=实现质量失守）`);
  W('');
  if (bugPs.length > 0) {
    W(`| 序号 | 工单 | 问题 | 状态 | 修复策略 |`);
    W(`|---:|---|---|---|---|`);
    let i = 1;
    for (const p of bugPs) {
      for (const x of p.items) {
        W(`| ${i++} | ${esc(x.id)}(软) | ${esc(x.title)} | ${esc(x.state)} | ${esc(p.focus.action)} |`);
      }
    }
    W('');
  } else {
    W(`暂无实现质量失守类问题点。`);
    W('');
  }
  W('---');
  W('');

  // ===== 四、需求分析 =====
  W(`## 四、需求分析（改成什么样算合格）`);
  W('');
  const fixPs = [...designPs, ...bugPs];
  if (fixPs.length > 0 || productPs.length > 0) {
    // 4.1 背景
    W(`### 4.1 背景`);
    W('');
    W(`**4.1.1 业务诉求**：`);
    W('');
    if (reqItems.length > 0) {
      for (const it of reqItems.slice(0, 5)) W(`- ${esc(it.title)}（${it.id}）`);
    } else {
      W(`- 本功能点近 ${total} 条工单以软质问题为主，医院侧核心诉求是**现有功能稳定可用**。`);
    }
    W('');
    W(`**4.1.2 业务现状**：`);
    W('');
    for (const p of [...redPs, ...yellowPs]) {
      W(`- ${p.name}：${p.items.length} 条软质工单反复出现（${p.items.map(x => x.id).join('、')}），${f_gapsep(p)}；`);
    }
    if (redPs.length === 0 && yellowPs.length === 0) {
      W(`- 现状无 🔴/🟡 级问题点，本节不展开。`);
    }
    W('');
    // 4.2 业务流程
    W(`### 4.2 业务流程（现状时序）`);
    W('');
    W('```mermaid');
    W(`sequenceDiagram`);
    W(`    participant U as 用户`);
    W(`    participant FE as 前端`);
    W(`    participant SV as 服务端`);
    W(`    participant DB as 存储`);
    W(`    U->>FE: 发起${name}操作`);
    W(`    FE->>SV: 请求（靠约定传参，校验在前端）`);
    W(`    SV->>DB: 写入状态`);
    W(`    alt 正常路径`);
    W(`        DB-->>SV: 写入成功`);
    W(`        SV-->>FE: 返回成功`);
    W(`    else 异常路径（现状缺口）`);
    W(`        DB--xSV: 写入失败/部分成功`);
    W(`        SV--xFE: 无分类错误码，状态不同步`);
    W(`        Note over FE,DB: 同类问题反复发生（软质工单 ${softItems.length} 条）`);
    W(`    end`);
    W('```');
    W('');
    // 4.3 产品分析概述
    W(`### 4.3 产品分析概述`);
    W('');
    W(`| 方案 | 改造主题 | 影响范围 |`);
    W(`|---|---|---|`);
    designPs.forEach((p, i) => W(`| 方案${i + 1} | ${esc(p.name)}治理（${esc(p.focus.action)}） | ${esc(code)}-${esc(name)} 及同链路功能点 |`));
    if (designPs.length === 0) W(`| — | 无设计改造方案 | — |`);
    W('');
    // 4.4 产品设计
    W(`### 4.4 产品设计`);
    W('');
    W(`**核心功能改造**：${designPs.length > 0 ? `以「${designPs[0].focus.action}」为总纲，对 ${esc(code)}-${esc(name)} 完成入口收口与状态一致性改造。` : `无设计级改造项，仅按 3.3 缺陷清单修复与 3.2 产品规划推进。`}`);
    W('');
    let rn = 0;
    for (const p of designPs) {
      rn++;
      W(`**R${rn} ${esc(p.name)}治理**`);
      W('');
      W(`- 对应功能点：${esc(code)}-${esc(name)}；`);
      W(`- 为何改：挂 ${p.id}（${p.sev}，${dominantOf(p.cause)}），同类工单 ${p.items.length} 条反复发生；`);
      W(`- 如何改：${p.focus.action}；明确事务边界，提供存量数据修复脚本与迁移窗口；`);
      W(`- 概要流程：前端操作 → 服务端强校验 → 权威实现写入 → 事件自动同步 → 失败回滚+日志。`);
      W('');
    }
    if (rn > 0) {
      W(`**操作流程（改造后）**：`);
      W('');
      W('```mermaid');
      W(`flowchart LR`);
      W(`    A[用户发起操作] --> B{服务端校验}`);
      W(`    B -- 通过 --> C[权威实现写入+事务提交]`);
      W(`    C --> D[状态事件自动同步]`);
      W(`    D --> E[返回成功+审计日志]`);
      W(`    B -- 不通过 --> F[统一错误码+明确提示]`);
      W(`    C -- 失败 --> G[回滚+补偿+诊断日志]`);
      W('```');
      W('');
    }
    // 4.5 验收标准
    W(`### 4.5 验收标准`);
    W('');
    let ac = 0;
    for (const p of fixPs.slice(0, 6)) {
      ac++;
      W(`- AC${ac}：${p.name}场景改造后——正常场景一次成功；异常场景（断网/并发/重复操作）有明确提示且状态一致；`);
    }
    ac++;
    W(`- AC${ac}：关键状态变更加服务端校验与审计日志，日志可定位到失败根因；`);
    ac++;
    W(`- AC${ac}：回归验证近 90 天同类软质工单（${softItems.slice(0, 5).map(x => x.id).join('、')}${softItems.length > 5 ? ' 等' : ''}）场景不再复现。`);
    W('');
  } else {
    W(`本功能点无待改造项，无新增需求分析。`);
    W('');
  }
  W('---');
  W('');
  W(`> **衍生文档**：如需登记 TFS，可基于第四章衍生《【结构治理】${esc(code)}-${esc(name)} 功能点需求说明》（模板见 references/report-template.md 末节）。`);

  process.stdout.write(L.join('\n') + '\n');
}

function cellTicketsInline(p) {
  return p.items.map(x => `${x.id}(${p.kind})`).join(' ');
}
function f_gapsep(p) { return p.focus ? p.focus.gap : ''; }

main();
