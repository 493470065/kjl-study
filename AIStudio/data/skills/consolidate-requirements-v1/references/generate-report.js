// ============================================================
// 工具：按需求类型统计
// ============================================================
function countReqSoft(items) {
  let req = 0, soft = 0;
  for (const item of items) {
    const rt = (item.requirementType || '').trim();
    if (rt === '软件质量') soft++;
    else req++;
  }
  return { req, soft };
}

function countMerge(items) {
  return items.filter(i => i.isMerge).length;
}

/**
 * generateReport.js
 * 报告生成：按子系统生成四章内容，合并为一个文档
 */
function generateReport(logResult, logProgress, sysOrder, domainOrder, groups, specModules, fpMap,
  matchedFpCounts, fpReqCounts, unassigned, suggestions, baselineItems, fpItems, allItems, elapsed, outputPath, fs) {

  const sysConfig = [
    { key: '住院病历', title: '一、住院病历', icon: '🏥' },
    { key: '门诊病历', title: '二、门诊病历', icon: '🏪' },
    { key: '急诊病历', title: '三、急诊病历', icon: '🚑' }
  ];

  // 模块编码 → "编码 中文名" 标签（补充中文名称，便于阅读）
  // 注意：specModules[code].name 可能已含 "13 病案首页" 这类前缀数字，需剥离取纯中文名
  const moduleLabel = (code) => {
    if (!code) return '—';
    const info = specModules[code];
    let name = info && info.name ? info.name : '';
    name = name.replace(/^\d+\s*/, '').trim(); // 去掉开头的 "13 " 等前缀
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

    // 提前收集：合并需求、软质、（当前系统）建议项
    // 合并项需同时纳入「未匹配到模块、暂挂 suggestions 的合并单」
    const sysPrefix = sys === '住院病历' ? 'BLGL' : (sys === '急诊病历' ? 'JZBL' : 'MZBL');
    const mergeItems = [];
    const softItems = [];
    for (const [key, group] of sysGroups) {
      for (const item of group.items) {
        if (item.isMerge) mergeItems.push(item);
        const rt = (item.requirementType || '').trim();
        if (rt === '软件质量') softItems.push(item);
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
    const sysSuggestions = suggestions.filter(s => {
      const code = s.suggestedCode || '';
      // 合并需求不计入「建议新增」，已在合并需求详情中单列
      if (s.isMerge) return false;
      return code.startsWith(sysPrefix) || code === '需新建模块';
    });

    L('');
    L('# ' + cfg.icon + ' ' + sys + '需求归集');
    L('');

    // ============================================================
    // 第一章：聚拢总计汇总
    // ============================================================
    L('## （一）归集汇总');
    L('');
    L('| 模块名称 | 匹配功能点数 | 问题数 | 合并需求 | 独立需求 | 软质数 | 占比 |');
    L('|:---------|:-----------:|:-----:|:--------:|:--------:|:-----:|:----:|');

    let sysTotalAssigned = 0;
    let totalFpCount = 0, totalItems = 0, totalReq = 0, totalSoft = 0, totalMerge = 0;
    for (const domain of domainOrder) {
      const domainGroups = sysGroups.filter(([k, g]) => g.domain === domain);
      if (domainGroups.length === 0) continue;
      domainGroups.sort((a, b) => a[1].name.localeCompare(b[1].name));
      for (const [key, group] of domainGroups) {
        const itemCount = group.items.length;
        const { req, soft } = countReqSoft(group.items);
        const mergeCount = countMerge(group.items);
        const reqNoMerge = req - mergeCount;
        const fpCount = group.fp > 0 ? (matchedFpCounts[group.code] || 0) : 0;
        const fpDisplay = group.fp > 0 ? fpCount.toString() : '—';
        const pct = Math.round(itemCount / sysTotal * 100);
        L('| ' + group.code + ' ' + group.name + ' | ' + fpDisplay + ' | ' + itemCount + ' | ' + mergeCount + ' | ' + reqNoMerge + ' | ' + soft + ' | ' + pct + '% |');
        sysTotalAssigned += itemCount;
        totalFpCount += fpCount;
        totalItems += itemCount;
        totalReq += req;
        totalSoft += soft;
        totalMerge += mergeCount;
      }
    }
    const totalPct = Math.round(totalItems / sysTotal * 100);
    // 合并需求合计需纳入「未归属模块的合并单」（来自 mergeItems 中不在任何 group 的项）
    const groupedMergeIds = new Set();
    for (const [key, group] of sysGroups) {
      for (const item of group.items) {
        if (item.isMerge) groupedMergeIds.add(item.id);
      }
    }
    const ungroupedMerge = mergeItems.filter(m => !groupedMergeIds.has(m.id));
    const totalMergeAll = totalMerge + ungroupedMerge.length;
    // 注：totalReq 为各模块内非软质项计数，未归属模块的合并需求（ungroupedMerge）已由 countReqSoft 排除在 totalReq 之外，
    // 因此不应再从 totalReq 中减去 ungroupedMerge.length，否则造成重复减扣产生负数（Bug 复现）。
    const totalReqNoMerge = totalReq;
    L('| **合计** | **' + totalFpCount + '** | **' + totalItems + '** | **' + totalMergeAll + '** | **' + totalReqNoMerge + '** | **' + totalSoft + '** | **' + totalPct + '%** |');
    if (ungroupedMerge.length > 0) {
      L('');
      L('> 注：另有 ' + ungroupedMerge.length + ' 项合并需求未匹配到具体模块（归属"需新建模块"或待人工指派），未计入上方模块行，已纳入合计。详见（二）合并需求详情。');
    }
    L('');

    // ============================================================
    // 第二章：合并需求详情（汇总数据 + 完整列表）
    // ============================================================
    L('## （二）合并需求详情');
    L('');
    if (mergeItems.length > 0) {
      // --- 汇总数据 ---
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

      // --- 完整列表（HTML 版本中实现交互分页） ---
      L('| 序号 | ID | 标题 | 所属模块 | 类型 |');
      L('|:---:|:--:|:-----|:--------|:----:|');
      let seq = 0;
      for (const item of mergeItems) {
        seq++;
        const modName = Object.entries(groups).find(([k, g]) => g.items.includes(item))?.[0] || '';
        L('| ' + seq + ' | #' + item.id + ' | ' + item.title + ' | ' + moduleLabel(modName) + ' | ' + (item.requirementType || '') + ' |');
      }
    } else {
      L('无合并需求。');
    }
    L('');

    // ============================================================
    // 第三章：软质详情（原「基线需求详情」章节已删除）
    // ============================================================
    L('## （三）软质详情');
    L('');
    if (softItems.length > 0) {
      L('| ID | 标题 | 所属模块 |');
      L('|:--:|:-----|:--------|');
      for (const item of softItems) {
        const modName = Object.entries(groups).find(([k, g]) => g.items.includes(item))?.[0] || '';
        L('| #' + item.id + ' | ' + item.title + ' | ' + moduleLabel(modName) + ' |');
      }
    } else {
      L('无软质问题。');
    }
    L('');

    // ============================================================
    // 第四章：功能点需求详情
    // ============================================================
    L('## （四）功能点需求详情');
    L('');
    for (const domain of domainOrder) {
      const domainGroups = sysGroups.filter(([k, g]) => g.domain === domain);
      if (domainGroups.length === 0) continue;
      domainGroups.sort((a, b) => a[1].name.localeCompare(b[1].name));
      for (const [key, group] of domainGroups) {
        L('### ' + group.code + ' ' + group.name);
        L('');
        L('| Spec 功能点 | 状态 | 类型 | ID | 标题 |');
        L('|:-----------|:----:|:----:|:--:|:------|');

        const stateGroups = {};
        for (const item of group.items) {
          const rt = (item.requirementType || '').trim();
          if (rt !== '功能性的') continue;
          if (group.code === 'BLGL-98-JK') continue;
          if (!stateGroups[item.state]) stateGroups[item.state] = [];
          stateGroups[item.state].push(item);
        }
        for (const st of ['活动', '已建议']) {
          const stItems = stateGroups[st];
          if (stItems) {
            for (const item of stItems) {
              const shortTitle = item.title.length > 55 ? item.title.substring(0, 55) + '...' : item.title;
              const status = st === '活动' ? '● 活动' : '○ 已建议';
              const fpDisplay = item.fpCode
                ? (item.fpCode + ' ' + (fpMap[item.fpCode] ? fpMap[item.fpCode].name : ''))
                : '—';
              L('| ' + fpDisplay + ' | ' + status + ' | ' + (item.requirementType || '') + ' | #' + item.id + ' | ' + shortTitle + ' |');
            }
          }
        }
        for (const [st, stItems] of Object.entries(stateGroups)) {
          if (['活动', '已建议'].includes(st)) continue;
          for (const item of stItems) {
            const shortTitle = item.title.length > 55 ? item.title.substring(0, 55) + '...' : item.title;
            const fpDisplay = item.fpCode
              ? (item.fpCode + ' ' + (fpMap[item.fpCode] ? fpMap[item.fpCode].name : ''))
              : '—';
            L('| ' + fpDisplay + ' | ◇ ' + st + ' | ' + (item.requirementType || '') + ' | #' + item.id + ' | ' + shortTitle + ' |');
          }
        }
        L('');
      }
    }

    // ============================================================
    // 第五章：建议新增功能点
    // ============================================================
    L('## （五）建议新增功能点');
    L('');
    if (sysSuggestions.length > 0) {
      L('| ID | 标题 | 建议归属模块 | 匹配置信度 |');
      L('|:--:|:-----|:-----------|:---------:|');
      for (const item of sysSuggestions) {
        L('| #' + item.id + ' | ' + item.title + ' | ' + (item.suggestedCode || '需新建模块') + ' | ' + (item.confidence || '低') + ' |');
      }
    } else {
      L('所有需求均已匹配到现有功能点，无需新增。');
    }
    L('');

    // ============================================================
    // 第六章：健康度分析
    // ============================================================
    L('## （六）健康度分析');
    L('');
    L('> 健康度按功能点新增问题数量评估：问题越少，健康度越高。新增 0~2 项为健康，3~5 项需关注，6 项以上需预警。');
    L('');
    L('| 功能点 | 问题数 | 健康等级 | 评估 |');
    L('|:-----|:-----:|:--------:|:-----|');

    const healthAlerts = [];
    const fpNames = {};
    for (const [fpCode, fpInfo] of Object.entries(fpMap)) {
      fpNames[fpCode] = fpInfo.name;
    }
    const sysFpCodes = new Set();
    for (const [key, group] of sysGroups) {
      for (const item of group.items) {
        if (item.fpCode) sysFpCodes.add(item.fpCode);
      }
    }
    const sortedFps = [...sysFpCodes].sort((a, b) => (fpReqCounts[b] || 0) - (fpReqCounts[a] || 0));
    for (const fpCode of sortedFps) {
      const count = fpReqCounts[fpCode] || 0;
      const fpName = fpNames[fpCode] || fpCode;
      let healthLevel, assessment;
      if (count <= 2) {
        healthLevel = '🟢 健康';
        assessment = '新增需求少，功能点稳定';
      } else if (count <= 5) {
        healthLevel = '🟡 关注';
        assessment = '新增需求较多，关注设计合理性';
        healthAlerts.push({ code: fpCode, name: fpName, level: '关注', count });
      } else if (count <= 10) {
        healthLevel = '🟠 预警';
        assessment = '新增需求密集，可能存在设计缺陷';
        healthAlerts.push({ code: fpCode, name: fpName, level: '预警', count });
      } else {
        healthLevel = '🔴 危险';
        assessment = '新增需求过载，需考虑重构';
        healthAlerts.push({ code: fpCode, name: fpName, level: '危险', count });
      }
      L('| ' + fpCode + ' ' + fpName + ' | ' + count + ' | ' + healthLevel + ' | ' + assessment + ' |');
    }

    if (healthAlerts.length > 0) {
      L('');
      L('**需要关注的功能点**：');
      L('');
      for (const alert of healthAlerts) {
        if (alert.level === '危险') {
          L('- 🔴 **' + alert.code + ' ' + alert.name + '**：新增需求 ' + alert.count + ' 项，超过 10 项，需求过载，需考虑重构');
        } else if (alert.level === '预警') {
          L('- 🟠 **' + alert.code + ' ' + alert.name + '**：新增需求 ' + alert.count + ' 项，6~10 项区间，需求密集，可能存在设计缺陷');
        } else {
          L('- 🟡 **' + alert.code + ' ' + alert.name + '**：新增需求 ' + alert.count + ' 项，3~5 项区间，需求较多，关注设计合理性');
        }
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

> 合计 **${baselineItems.length}** 项${baselineItems.length > 0 ? '（' + baselineTypeStats + '）' : ''}。以下需求经方法论判断为基线能力（单对象增删改查/列表导出打印/字典配置/纯技术接口），不纳入功能点。

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
| **需求分类** | 需求 = 功能性 + 接口；软质 = 软件质量 |
| **来源分类** | 医院需求 = CreatedBy 含 TfsInterface；内部优化 = 其他创建者 |
| **合并需求识别** | 正则：\`/合并\\\\d{3,}|@1?\\\\d{6,}|（合并|合并多|合并代码|合代码|合并需求\\\\d|合并需求至|合并需求：|合并【\\\\d+】|克隆主数据|历史需求合并|合并升级|合并单|合并到版本|合并至版本|至\\\\d{6}迭代|到\\\\d{6}迭代|至\\\\d{6}版本|至泰康\\\\d/\`（覆盖「合并+单号/版本号」自由格式） |
| **主题分类** | 标题正则（细粒度）优先；标题归 G 时 TFS Module 标准模块兜底 |
| **本次分类方式** | 仅按产品过滤，主题分类由 AI 动态归纳 |

`;
  return merged.join('---\n\n') + baselineSection + caliberNote;
}

module.exports = { generateReport };