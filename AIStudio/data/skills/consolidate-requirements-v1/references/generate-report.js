/**
 * generate-report.js
 * 报告生成：按子系统生成需求归集报告（v2 结构）
 *
 * 需求归集四目标：
 *   (1) TFS 需求按 功能性的 / 接口 / 软件质量 三分类
 *   (2) 功能性需求区分 合并类 / 独立类
 *   (3) 独立性功能需求按 Spec 功能点归类并排序
 *   (4) 功能点健康度 = 独立需求 + 软件质量（脚本定量基线）；
 *       设计合理性由《功能点健康度与设计合理性评估指南》指导评估，
 *       健康度低的功能点优先纳入结构性治理
 *
 * 章节结构（每子系统八章）：
 *   （一）三分类归集汇总
 *   （二）合并需求详情（功能性-合并类）
 *   （三）独立需求功能点归类详情（功能性-独立类，按功能点编码排序）
 *   （四）接口需求详情
 *   （五）软质详情
 *   （六）建议新增功能点
 *   （七）功能点健康度基线（独立需求+软质，设计合理性待评估）
 *   （八）结构性治理优先级建议
 */

// ============================================================
// 工具：按三分类统计
// ============================================================
function countCategories(items) {
  let funcMerge = 0, funcIndep = 0, iface = 0, soft = 0;
  for (const item of items) {
    const cat = item.category || '功能性的';
    if (cat === '软件质量') soft++;
    else if (cat === '接口') iface++;
    else if (item.isMerge) funcMerge++;
    else funcIndep++;
  }
  return { funcMerge, funcIndep, iface, soft };
}

// TFS 状态排序权重（活动 > 已建议 > 其它）
function stateWeight(state) {
  if (state === '活动') return 0;
  if (state === '已建议') return 1;
  return 2;
}

// 健康度基线等级（定量：独立需求数 + 软质数）
function healthBaseLevel(total) {
  if (total <= 2) return { level: '🟢 健康', key: 'healthy', assessment: '新增问题少，功能点稳定' };
  if (total <= 5) return { level: '🟡 关注', key: 'concern', assessment: '新增问题较多，需评估设计合理性' };
  if (total <= 10) return { level: '🟠 预警', key: 'warning', assessment: '新增问题密集，可能存在设计缺陷' };
  return { level: '🔴 危险', key: 'danger', assessment: '新增问题过载，建议优先纳入结构性治理' };
}

function generateReport(logResult, logProgress, sysOrder, domainOrder, groups, specModules, fpMap,
  matchedFpCounts, fpStats, unassigned, suggestions, baselineItems, interfaceUnassigned, fpItems, allItems, elapsed, outputPath, fs, specCoverage) {

  const sysConfig = [
    { key: '住院病历', title: '一、住院病历', icon: '🏥' },
    { key: '门诊病历', title: '二、门诊病历', icon: '🏪' },
    { key: '急诊病历', title: '三、急诊病历', icon: '🚑' }
  ];

  // 模块编码 → "编码 中文名" 标签
  const moduleLabel = (code) => {
    if (!code) return '—';
    const info = specModules[code];
    let name = info && info.name ? info.name : '';
    name = name.replace(/^\d+\s*/, '').trim();
    return name ? (code + ' ' + name) : code;
  };

  const sysOutputs = {};

  for (const cfg of sysConfig) {
    const sys = cfg.key;
    const sysGroups = Object.entries(groups).filter(([k, g]) => g.sys === sys);
    if (sysGroups.length === 0) continue;

    const sysTotal = sysGroups.reduce((s, [k, g]) => s + g.items.length, 0);
    const lines = [];
    const L = (msg) => lines.push((msg || '') + '\n');

    // 提前收集：合并需求、软质、接口（当前系统）
    const sysPrefix = sys === '住院病历' ? 'BLGL' : (sys === '急诊病历' ? 'JZBL' : 'MZBL');
    const mergeItems = [];
    const softItems = [];
    const ifaceItems = [];
    for (const [key, group] of sysGroups) {
      for (const item of group.items) {
        if (item.category === '软件质量') softItems.push(item);
        else if (item.category === '接口') ifaceItems.push(item);
        else if (item.isMerge) mergeItems.push(item);
      }
    }
    // 未归属模块的合并单（来自 suggestions 中的合并项）
    const groupedMergeIds = new Set();
    for (const [key, group] of sysGroups) {
      for (const item of group.items) {
        if (item.isMerge) groupedMergeIds.add(item.id);
      }
    }
    for (const s of suggestions) {
      if (s.isMerge) {
        const code = s.suggestedCode || '';
        if (code.startsWith(sysPrefix) || code === '需新建模块') {
          mergeItems.push(s);
        }
      }
    }
    const ungroupedMerge = mergeItems.filter(m => !groupedMergeIds.has(m.id));
    // 建议新增功能点：仅功能性独立需求（合并需求已在（二）单列）
    const sysSuggestions = suggestions.filter(s => {
      const code = s.suggestedCode || '';
      if (s.isMerge) return false;
      return code.startsWith(sysPrefix) || code === '需新建模块';
    });

    L('');
    L('# ' + cfg.icon + ' ' + sys + '需求归集');
    L('');

    // ============================================================
    // 第一章：三分类归集汇总
    // ============================================================
    L('## （一）三分类归集汇总');
    L('');
    L('| 模块名称 | 匹配功能点数 | 功能性-合并 | 功能性-独立 | 接口 | 软质 | 问题数 | 占比 |');
    L('|:---------|:-----------:|:---------:|:---------:|:---:|:---:|:-----:|:----:|');

    let totalFpCount = 0, totalItems = 0;
    const totals = { funcMerge: 0, funcIndep: 0, iface: 0, soft: 0 };
    for (const domain of domainOrder) {
      const domainGroups = sysGroups.filter(([k, g]) => g.domain === domain);
      if (domainGroups.length === 0) continue;
      domainGroups.sort((a, b) => a[1].name.localeCompare(b[1].name));
      for (const [key, group] of domainGroups) {
        const itemCount = group.items.length;
        const c = countCategories(group.items);
        const fpCount = group.fp > 0 ? (matchedFpCounts[group.code] || 0) : 0;
        const fpDisplay = group.fp > 0 ? fpCount.toString() : '—';
        const pct = Math.round(itemCount / sysTotal * 100);
        L('| ' + group.code + ' ' + group.name + ' | ' + fpDisplay + ' | ' + c.funcMerge + ' | ' + c.funcIndep + ' | ' + c.iface + ' | ' + c.soft + ' | ' + itemCount + ' | ' + pct + '% |');
        totalFpCount += fpCount;
        totalItems += itemCount;
        totals.funcMerge += c.funcMerge;
        totals.funcIndep += c.funcIndep;
        totals.iface += c.iface;
        totals.soft += c.soft;
      }
    }
    const totalPct = Math.round(totalItems / sysTotal * 100);
    L('| **合计** | **' + totalFpCount + '** | **' + (totals.funcMerge + ungroupedMerge.length) + '** | **' + totals.funcIndep + '** | **' + totals.iface + '** | **' + totals.soft + '** | **' + totalItems + '** | **' + totalPct + '%** |');
    if (ungroupedMerge.length > 0) {
      L('');
      L('> 注：另有 ' + ungroupedMerge.length + ' 项合并需求未匹配到具体模块（归属"需新建模块"或待人工指派），未计入上方模块行，已纳入合计。详见（二）合并需求详情。');
    }
    L('');
    L('> 三分类合计：功能性 **' + (totals.funcMerge + ungroupedMerge.length + totals.funcIndep) + '** 项（合并 ' + (totals.funcMerge + ungroupedMerge.length) + ' / 独立 ' + totals.funcIndep + '），接口 **' + totals.iface + '** 项，软件质量 **' + totals.soft + '** 项。');
    L('');

    // ============================================================
    // 第二章：合并需求详情（功能性-合并类）
    // ============================================================
    L('## （二）合并需求详情');
    L('');
    if (mergeItems.length > 0) {
      const mergeModuleCount = {};
      let ungroupedCnt = 0;
      for (const item of mergeItems) {
        const modName = Object.entries(groups).find(([k, g]) => g.items.includes(item))?.[0] || '';
        if (modName) {
          mergeModuleCount[modName] = (mergeModuleCount[modName] || 0) + 1;
        } else {
          ungroupedCnt++;
        }
      }
      L('> **合并需求汇总**：共 ' + mergeItems.length + ' 项');
      if (Object.keys(mergeModuleCount).length > 0) {
        const detailParts = Object.entries(mergeModuleCount)
          .sort((a, b) => b[1] - a[1])
          .map(([code, cnt]) => moduleLabel(code) + ' ' + cnt + ' 项');
        if (ungroupedCnt > 0) detailParts.push('未归属模块 ' + ungroupedCnt + ' 项');
        L('> 按模块分布：' + detailParts.join('，'));
      } else if (ungroupedCnt > 0) {
        L('> 全部 ' + ungroupedCnt + ' 项均未匹配到具体模块（归属"需新建模块"或待人工指派）。');
      }
      L('');
      L('| 序号 | ID | 标题 | 所属模块 | 状态 |');
      L('|:---:|:--:|:-----|:--------|:----:|');
      let seq = 0;
      for (const item of mergeItems) {
        seq++;
        const modName = Object.entries(groups).find(([k, g]) => g.items.includes(item))?.[0] || '';
        L('| ' + seq + ' | #' + item.id + ' | ' + item.title + ' | ' + moduleLabel(modName) + ' | ' + (item.state || '') + ' |');
      }
    } else {
      L('无合并需求。');
    }
    L('');

    // ============================================================
    // 第三章：独立需求功能点归类详情（功能性-独立类，按功能点编码排序）
    // ============================================================
    L('## （三）独立需求功能点归类详情');
    L('');
    L('> 仅含功能性独立需求（不含合并需求、接口、软质），按 Spec 功能点编码排序。');
    L('');
    for (const domain of domainOrder) {
      const domainGroups = sysGroups.filter(([k, g]) => g.domain === domain);
      if (domainGroups.length === 0) continue;
      domainGroups.sort((a, b) => a[1].name.localeCompare(b[1].name));
      for (const [key, group] of domainGroups) {
        // 收集该模块内的功能性独立需求
        const indepItems = group.items.filter(item => {
          if (item.category !== '功能性的') return false;
          if (item.isMerge) return false;
          if (group.code === 'BLGL-98-JK') return false; // 接口模块不单列
          return true;
        });
        if (indepItems.length === 0) continue;

        L('### ' + group.code + ' ' + group.name);
        L('');
        L('| Spec 功能点 | 状态 | ID | 标题 |');
        L('|:-----------|:----:|:--:|:------|');

        // 按功能点编码分组并排序
        const byFp = {};
        const noFp = [];
        for (const item of indepItems) {
          if (item.fpCode && fpMap[item.fpCode]) {
            if (!byFp[item.fpCode]) byFp[item.fpCode] = [];
            byFp[item.fpCode].push(item);
          } else {
            noFp.push(item);
          }
        }
        const sortedFpCodes = Object.keys(byFp).sort();
        for (const fpCode of sortedFpCodes) {
          const items = byFp[fpCode].sort((a, b) => stateWeight(a.state) - stateWeight(b.state));
          const fpDisplay = fpCode + ' ' + (fpMap[fpCode] ? fpMap[fpCode].name : '');
          for (const item of items) {
            const shortTitle = item.title.length > 55 ? item.title.substring(0, 55) + '...' : item.title;
            const status = item.state === '活动' ? '● 活动' : (item.state === '已建议' ? '○ 已建议' : '◇ ' + item.state);
            L('| ' + fpDisplay + ' | ' + status + ' | #' + item.id + ' | ' + shortTitle + ' |');
          }
        }
        if (noFp.length > 0) {
          noFp.sort((a, b) => stateWeight(a.state) - stateWeight(b.state));
          for (const item of noFp) {
            const shortTitle = item.title.length > 55 ? item.title.substring(0, 55) + '...' : item.title;
            const status = item.state === '活动' ? '● 活动' : (item.state === '已建议' ? '○ 已建议' : '◇ ' + item.state);
            L('| — （模块级，未匹配功能点） | ' + status + ' | #' + item.id + ' | ' + shortTitle + ' |');
          }
        }
        L('');
      }
    }

    // ============================================================
    // 第四章：接口需求详情
    // ============================================================
    L('## （四）接口需求详情');
    L('');
    const sysIfaceUnassigned = (interfaceUnassigned || []).filter(() => true); // 全局，按系统前缀过滤
    if (ifaceItems.length > 0 || sysIfaceUnassigned.length > 0) {
      L('| ID | 标题 | 所属模块 | 状态 |');
      L('|:--:|:-----|:--------|:----:|');
      for (const item of ifaceItems) {
        const modName = Object.entries(groups).find(([k, g]) => g.items.includes(item))?.[0] || '';
        L('| #' + item.id + ' | ' + item.title + ' | ' + moduleLabel(modName) + ' | ' + (item.state || '') + ' |');
      }
      for (const item of sysIfaceUnassigned) {
        L('| #' + item.id + ' | ' + item.title + ' | （待指派） | ' + (item.state || '') + ' |');
      }
      L('');
      L('> 接口需求按分类单列，不计入功能点健康度。');
    } else {
      L('无接口需求。');
    }
    L('');

    // ============================================================
    // 第五章：软质详情
    // ============================================================
    L('## （五）软质详情');
    L('');
    if (softItems.length > 0) {
      L('| ID | 标题 | 所属模块 | 关联功能点 |');
      L('|:--:|:-----|:--------|:---------|');
      for (const item of softItems) {
        const modName = Object.entries(groups).find(([k, g]) => g.items.includes(item))?.[0] || '';
        const fpDisplay = item.fpCode ? (item.fpCode + ' ' + (fpMap[item.fpCode] ? fpMap[item.fpCode].name : '')) : '—';
        L('| #' + item.id + ' | ' + item.title + ' | ' + moduleLabel(modName) + ' | ' + fpDisplay + ' |');
      }
    } else {
      L('无软质问题。');
    }
    L('');

    // ============================================================
    // 第六章：建议新增功能点
    // ============================================================
    L('## （六）建议新增功能点');
    L('');
    if (sysSuggestions.length > 0) {
      L('| ID | 标题 | 建议归属模块 | 匹配置信度 |');
      L('|:--:|:-----|:-----------|:---------:|');
      for (const item of sysSuggestions) {
        L('| #' + item.id + ' | ' + item.title + ' | ' + (item.suggestedCode || '需新建模块') + ' | ' + (item.confidence || '低') + ' |');
      }
    } else {
      L('所有功能性独立需求均已匹配到现有功能点，无需新增。');
    }
    L('');

    // ============================================================
    // 第七章：功能点健康度基线
    // 健康度 = 独立需求 + 软质（定量基线，由脚本产出）
    // 设计合理性：脚本不评估，按《功能点健康度与设计合理性评估指南》执行
    // ============================================================
    L('## （七）功能点健康度基线');
    L('');
    L('> **健康度口径**：问题数 = 独立需求数 + 软质数（合并需求、接口不计入）。0~2 项 🟢健康，3~5 项 🟡关注，6~10 项 🟠预警，10 项以上 🔴危险。');
    L('> **Spec 正文证据**：归集匹配使用结构树骨架 + Spec 三件套正文（纳入范围/排除范围/业务规则/验收标准）；"Spec正文"列 = 该功能点下工单归集中命中正文证据索引的比例（spec-evidence.json 快照）。');
    L('> **设计合理性**：本表为定量基线，设计合理性不在脚本内评估，请按技能指导文档《功能点健康度与设计合理性评估指南》（`references/功能点健康度与设计合理性评估指南.md`）执行五维评分后回写调整。');
    L('');
    L('| 功能点 | 独立需求数 | 软质数 | 问题数 | 健康基线 | Spec正文 | 设计合理性 |');
    L('|:-----|:--------:|:----:|:-----:|:--------:|:--------:|:---------:|');

    // 当前系统涉及的功能点
    const sysFpCodes = new Set();
    for (const [key, group] of sysGroups) {
      for (const item of group.items) {
        if (item.fpCode) sysFpCodes.add(item.fpCode);
      }
    }
    const healthRows = [];
    for (const fpCode of sysFpCodes) {
      const stat = fpStats[fpCode] || { independent: 0, soft: 0, total: 0 };
      const base = healthBaseLevel(stat.total);
      // 该功能点下工单的 Spec 正文覆盖（有 specCovered 标注即视为正文证据参与过匹配）
      let evTotal = 0, evCovered = 0;
      for (const [key, group] of sysGroups) {
        for (const item of group.items) {
          if (item.fpCode !== fpCode) continue;
          if (item.category !== '功能性的' && item.category !== '软件质量') continue;
          evTotal++;
          if (item.specCovered) evCovered++;
        }
      }
      const evText = evTotal === 0 ? '—' : (evCovered === 0 ? '0%（无正文索引）' : Math.round(evCovered / evTotal * 100) + '%');
      healthRows.push({ fpCode, ...stat, base, evText });
    }
    healthRows.sort((a, b) => (b.total - a.total) || a.fpCode.localeCompare(b.fpCode));
    const fpNames = {};
    for (const [fpCode, fpInfo] of Object.entries(fpMap)) fpNames[fpCode] = fpInfo.name;
    for (const row of healthRows) {
      L('| ' + row.fpCode + ' ' + (fpNames[row.fpCode] || '') + ' | ' + row.independent + ' | ' + row.soft + ' | ' + row.total + ' | ' + row.base.level + ' | ' + row.evText + ' | ⚪ 待评估 |');
    }
    if (specCoverage && specCoverage.total > 0) {
      const pct = Math.round(specCoverage.covered / specCoverage.total * 100);
      L('');
      L('> **本系统 Spec 正文证据覆盖**：' + specCoverage.covered + '/' + specCoverage.total + '（' + pct + '%）'
        + '，排除范围改判 ' + specCoverage.redirectCount + ' 条。未覆盖部分仅用结构树骨架匹配，结果可能漂移；'
        + '索引过期时重跑 `node scripts/build-spec-index.js` 刷新。');
    }
    L('');

    // ============================================================
    // 第八章：结构性治理优先级建议
    // ============================================================
    L('## （八）结构性治理优先级建议');
    L('');
    const p0 = healthRows.filter(r => r.base.key === 'danger');
    const p1 = healthRows.filter(r => r.base.key === 'warning');
    const p2 = healthRows.filter(r => r.base.key === 'concern');
    if (p0.length + p1.length + p2.length === 0) {
      L('本期无 🟡 关注及以上功能点，暂无需纳入结构性治理。');
    } else {
      L('> 按定量健康基线给出治理优先级候选。**最终优先级须结合设计合理性评估结果调整**（一票否决/🔴 不合理的功能点应上调一级），详见《功能点健康度与设计合理性评估指南》。');
      L('');
      L('| 优先级 | 功能点 | 问题数 | 健康基线 | 治理建议 |');
      L('|:-----:|:-----|:-----:|:--------:|:--------|');
      for (const r of p0) {
        L('| **P0** | ' + r.fpCode + ' ' + (fpNames[r.fpCode] || '') + ' | ' + r.total + ' | 🔴 危险 | 问题过载，立即纳入结构性治理，评估功能点拆分/重构 |');
      }
      for (const r of p1) {
        L('| **P1** | ' + r.fpCode + ' ' + (fpNames[r.fpCode] || '') + ' | ' + r.total + ' | 🟠 预警 | 本期纳入结构性治理，先行设计合理性评估 |');
      }
      for (const r of p2) {
        L('| **P2** | ' + r.fpCode + ' ' + (fpNames[r.fpCode] || '') + ' | ' + r.total + ' | 🟡 关注 | 纳入治理规划，跟踪后续期次问题趋势 |');
      }
    }
    L('');

    L('---');
    L('');
    L('> 生成时间: ' + new Date().toLocaleString('zh-CN') + '  |  工具: consolidate-requirements-v1');
    L('');

    sysOutputs[sys] = lines.join('');
  }

  // 合并报告
  const merged = [];
  for (const cfg of sysConfig) {
    if (sysOutputs[cfg.key]) {
      merged.push(sysOutputs[cfg.key]);
    }
  }

  // 基线排除清单
  const baselineByType = {};
  for (const item of baselineItems) {
    const src = item.source || '基线排除';
    baselineByType[src] = (baselineByType[src] || 0) + 1;
  }
  const baselineTypeStats = Object.entries(baselineByType)
    .map(([k, v]) => `${k} ${v} 项`)
    .join('；');
  const baselineSection = `
## 基线排除清单

> 合计 **${baselineItems.length}** 项${baselineItems.length > 0 ? '（' + baselineTypeStats + '）' : ''}。以下功能性需求经方法论判断为基线能力（单对象增删改查/列表导出打印/字典配置/纯技术接口），不纳入功能点。接口与软质不做基线排除，分别单列。

${baselineItems.length > 0 ? `| ID | 标题 | 模块 | 基线类型 |
|:--:|:-----|:----|:---------|
${baselineItems.map(item => '| #' + item.id + ' | ' + (item.title.length > 50 ? item.title.substring(0, 50) + '...' : item.title) + ' | ' + (item.tfsModule || '—') + ' | ' + (item.source || '基线排除') + ' |').join('\n')}` : '_本次查询无基线排除需求。_'}
`;

  const caliberNote = `

---

## 数据口径说明

| 项目 | 说明 |
|:-----|:------|
| **筛选条件** | 产品名 ∈ {WiNEX 病历管理, 03 WiNEX 急诊病历, WiNEX 门诊病历管理}；AreaPath 排除 \`WiNEX-Inpatient-2\\\\病历质控\` 与 \`WiNEX-Outpatient\\\\病历质控\` |
| **R27 过滤** | ResolvedDate = '' OR ResolvedDate ≠ ClosedDate |
| **需求三分类** | 功能性的（RequirementType=功能性的/空）；接口（RequirementType=接口）；软件质量（RequirementType=软件质量） |
| **合并/独立** | 合并识别仅针对功能性需求；正则：\`/合并\\\\d{3,}|@1?\\\\d{6,}|（合并|合并多|合并代码|合代码|合并需求\\\\d|合并需求至|合并需求：|合并【\\\\d+】|克隆主数据|历史需求合并|合并升级|合并单|合并到版本|合并至版本|合并到\\\\d{5,}|合并至\\\\d{5,}|至\\\\d{6}迭代|到\\\\d{6}迭代|至\\\\d{6}版本|至泰康\\\\d/\` |
| **健康度口径** | 问题数 = 独立需求数 + 软质数；合并需求与接口不计入；设计合理性按指导文档评估后回写调整 |
| **来源分类** | 医院需求 = CreatedBy 含 TfsInterface；内部优化 = 其他创建者 |
| **主题分类** | 标题正则（细粒度）优先；标题归 G 时 TFS Module 标准模块兜底 |
| **本次分类方式** | 仅按产品过滤，主题分类由 AI 动态归纳 |

`;
  return merged.join('---\n\n') + baselineSection + caliberNote;
}

module.exports = { generateReport };
