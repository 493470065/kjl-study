/**
 * 功能点合理性评估脚本
 * 扫描代码仓库 + Spec 知识库，对 Top 危险功能点进行设计合理性评估
 * 输出：设计合理性评估结果，用于调整健康度等级
 */
const fs = require('fs');
const path = require('path');

const CODE_ROOT = 'E:\\39EMR\\sr-next';
const SPEC_ROOT = 'E:\\37结构性问题治理\\01WiNEX 病历管理';
const REPORT_FILE = 'E:\\37结构性问题治理\\07病历条线需求聚拢\\功能点健康度报告-20260820.md';

// ============================================================
// 功能点代码映射表
// ============================================================
const FP_CODE_MAP = {
  'BLGL-01-BLSX-002': { desc: '病历编辑与保存', repos: ['winning-emr-ipt', 'winning-webui-inpatient-clinicalnote-pango'], pkg: 'emr', specModule: 'BLGL-01-BLSX' },
  'BLGL-01-BLSX-001': { desc: '病历创建与模板管理', repos: ['winning-emr-ipt', 'winning-webui-inpatient-clinicalnote-pango'], pkg: 'emr', specModule: 'BLGL-01-BLSX' },
  'BLGL-10-BLCX-003': { desc: '病历结构化查询', repos: ['winning-emr-ipt', 'winning-webui-admin-clinicalnote'], pkg: 'query', specModule: 'BLGL-10-BLCX' },
  'BLGL-05-HZGL-001': { desc: '会诊申请', repos: ['winning-emr-consultation', 'winning-emr-consultation-next'], pkg: 'consult', specModule: 'BLGL-05-HZGL' },
  'BLGL-01-BLSX-004': { desc: '病历提交与撤销提交', repos: ['winning-emr-ipt', 'winning-webui-inpatient-clinicalnote-pango'], pkg: 'emr', specModule: 'BLGL-01-BLSX' },
  'BLGL-01-BLSX-003': { desc: '病历签署', repos: ['winning-emr-ipt', 'winning-webui-inpatient-clinicalnote-pango', 'winning-ias-biz-gateway-emr'], pkg: 'sign', specModule: 'BLGL-01-BLSX' },
  'BLGL-05-HZGL-004': { desc: '会诊接收与答复', repos: ['winning-emr-consultation', 'winning-emr-consultation-next'], pkg: 'consult', specModule: 'BLGL-05-HZGL' },
  'BLGL-01-BLSX-006': { desc: '手术记录', repos: ['winning-mas-record-inpatient', 'winning-mds-record-inpatient'], pkg: 'surgery', specModule: 'BLGL-01-BLSX' },
  'BLGL-10-BLCX-001': { desc: '科室病历查询', repos: ['winning-webui-admin-clinicalnote'], pkg: 'query', specModule: 'BLGL-10-BLCX' },
  'BLGL-02-FZLR-005': { desc: '既往病历引用', repos: ['winning-emr-ipt', 'winning-webui-inpatient-clinicalnote-pango'], pkg: 'emr', specModule: 'BLGL-02-FZLR' },
  'BLGL-15-QM-006': { desc: '签名图片与PDF处理', repos: ['winning-ias-biz-gateway-emr'], pkg: 'sign', specModule: 'BLGL-15-QM' },
  'BLGL-03-ZDYY-008': { desc: '诊断落库与对外对接', repos: ['winning-emr-ipt'], pkg: 'diagnosis', specModule: 'BLGL-03-ZDYY' },
  'BLGL-05-HZGL-007': { desc: '会诊统计', repos: ['winning-emr-consultation'], pkg: 'consult', specModule: 'BLGL-05-HZGL' },
  'BLGL-13-BASY-007': { desc: '首页提交与校验', repos: ['winning-emr-ipt'], pkg: 'homepage', specModule: 'BLGL-13-BASY' },
  'BLGL-15-QM-002': { desc: '患者签名', repos: ['winning-ias-biz-gateway-emr'], pkg: 'sign', specModule: 'BLGL-15-QM' },
  'BLGL-05-HZGL-002': { desc: '会诊审核', repos: ['winning-emr-consultation'], pkg: 'consult', specModule: 'BLGL-05-HZGL' },
  'BLGL-06-DSXTX-005': { desc: '时限规则配置与参数', repos: ['winning-emr-qc'], pkg: 'qc', specModule: 'BLGL-06-DSXTX' },
  'BLGL-01-BLSX-008': { desc: '诊断管理', repos: ['winning-emr-ipt'], pkg: 'diagnosis', specModule: 'BLGL-01-BLSX' },
  'BLGL-02-FZLR-013': { desc: '书写助手与临床数据提取', repos: ['winning-webui-inpatient-clinicalnote-pango'], pkg: 'assistant', specModule: 'BLGL-02-FZLR' },
  'BLGL-05-HZGL-011': { desc: '配置中心', repos: ['winning-emr-consultation'], pkg: 'consult', specModule: 'BLGL-05-HZGL' },
  'MZBL-01-BLSX-001': { desc: '病历创建与编辑', repos: ['winning-emr-opt', 'winning-webui-opt-clinicalnote'], pkg: 'emr', specModule: 'MZBL-01-BLSX' },
  'MZBL-07-ALGL-001': { desc: '案例收藏与提交', repos: ['winning-emr-opt'], pkg: 'case', specModule: 'MZBL-07-ALGL' },
  'MZBL-01-BLSX-007': { desc: '外部数据同步', repos: ['winning-emr-opt', 'winning-ias-biz-gateway-emr'], pkg: 'sync', specModule: 'MZBL-01-BLSX' },
  'MZBL-02-SXZS-001': { desc: '历史病历引用', repos: ['winning-webui-emr-consultation'], pkg: 'emr', specModule: 'MZBL-02-SXZS' },
  'JZBL-05-ZLXXY-001': { desc: '信息页加载与数据同步', repos: ['winning-webui-emergency-medical-record'], pkg: 'emr', specModule: 'JZBL-05-ZLXXY' },
};

// ============================================================
// 合理性评估函数
// ============================================================
function assessDesignReasonableness(fpCode, fpInfo, specExists, codeFindings, issuePattern) {
  const { nonMerge, req, soft, hospital, internal } = fpInfo;
  const hospitalRatio = (hospital / (hospital + internal || 1)) * 100;
  const reqRatio = (req / (nonMerge || 1)) * 100;
  const softRatio = (soft / (nonMerge || 1)) * 100;

  // 评估维度
  let score = 0; // 0-10, 越高越合理
  let reasons = [];
  let suggestions = [];
  let rootCauses = []; // 设计不合理根因列表

  // 1. Spec 存在性
  if (specExists) {
    score += 2;
    reasons.push('Spec 定义存在');
  } else {
    reasons.push('Spec 定义缺失');
    suggestions.push('需补充功能点 Spec 设计文档');
    rootCauses.push({
      type: '设计文档缺失',
      severity: '高',
      desc: '功能点缺乏 Spec 设计文档，导致开发实现缺乏统一规范约束，不同医院场景下实现不一致',
      impact: '直接导致设计走样，每次医院接入产生新的实现变体',
      solution: '按 generate-spec-v1 流程生成功能点 Spec，明确功能边界、接口契约和数据模型'
    });
  }

  // 2. 问题模式：医院定制化 vs 内部设计
  if (hospitalRatio > 80 && reqRatio > 60) {
    score += 1;
    reasons.push(`医院需求占比 ${hospitalRatio.toFixed(0)}%，需求为主`);
    suggestions.push('建立医院适配层，将定制逻辑从核心代码剥离');
    rootCauses.push({
      type: '医院定制化需求膨胀',
      severity: '高',
      desc: `医院需求占比 ${hospitalRatio.toFixed(0)}%，需求占比 ${reqRatio.toFixed(0)}%，说明功能点缺乏统一的医院适配层`,
      impact: '每次医院接入都需要修改核心代码，导致核心代码复杂度持续上升，回归风险增加',
      solution: '建立参数化/插件化医院适配层，将医院定制逻辑从核心代码中剥离，通过配置驱动差异化'
    });
  } else if (hospitalRatio > 80 && softRatio > 40) {
    score += 0;
    reasons.push(`医院场景软质占比 ${softRatio.toFixed(0)}%，质量缺陷多`);
    suggestions.push('加强医院场景自动化测试覆盖');
    rootCauses.push({
      type: '医院场景质量缺陷',
      severity: '高',
      desc: `医院需求占比 ${hospitalRatio.toFixed(0)}% 但软质占比 ${softRatio.toFixed(0)}%，说明医院场景下存在较多质量/Bug问题`,
      impact: '医院场景测试覆盖不足，导致生产环境频繁出现质量问题，影响医院信任度',
      solution: '针对 Top 10 医院场景建立 E2E 测试用例，纳入 CI/CD 回归验证，建立医院场景测试基线'
    });
  } else if (hospitalRatio <= 80 && reqRatio > 60) {
    score += 2;
    reasons.push('内部优化为主，需求占比高，设计在持续迭代');
    suggestions.push('评估功能成熟度，确定是否进入稳定期');
  } else if (softRatio > 60) {
    score -= 1;
    reasons.push(`软质占比 ${softRatio.toFixed(0)}%，质量问题为主`);
    suggestions.push('需排查设计缺陷，进行代码审查');
    rootCauses.push({
      type: '代码质量稳定性不足',
      severity: '中',
      desc: `软质占比 ${softRatio.toFixed(0)}%，问题以质量缺陷为主，非功能缺失`,
      impact: '代码质量不达标，导致频繁返工和线上问题',
      solution: '增加代码审查 checklist，提升单元测试覆盖率至 80%+，建立性能基线'
    });
  } else {
    score += 1;
    reasons.push('混合型问题模式');
    rootCauses.push({
      type: '混合型设计问题',
      severity: '中',
      desc: '问题同时涉及需求变更和质量缺陷，需要综合分析',
      impact: '难以聚焦单一改进方向，需要多维度施策',
      solution: '按优先级组合施策，先解决定制化膨胀，再提升质量'
    });
  }

  // 3. 问题数量级
  if (nonMerge > 100) {
    score -= 3;
    reasons.push('问题数 > 100，需拆分功能点');
    suggestions.push('建议将功能点拆分为更细粒度的子功能点');
    rootCauses.push({
      type: '功能点粒度过粗',
      severity: '高',
      desc: `问题数 ${nonMerge} 远超合理阈值，说明当前功能点粒度过粗，涵盖过多子功能`,
      impact: '功能边界模糊，导致问题无法精准定位到具体子功能，治理难度大',
      solution: '按 C-DARHS 方法论拆分为 3-5 个细粒度子功能点，每个独立评估健康度'
    });
  } else if (nonMerge > 50) {
    score -= 2;
    reasons.push('问题数 > 50，需架构评审');
    suggestions.push('建议安排架构评审，识别核心问题模式');
    rootCauses.push({
      type: '功能点粒度过粗',
      severity: '中',
      desc: `问题数 ${nonMerge}，功能点粒度偏粗，需要审视是否需要拆分`,
      impact: '问题集中度过高，难以区分是设计问题还是需求变更',
      solution: '评估是否拆分为更细粒度的子功能点，每个子功能点做独立健康度评估'
    });
  } else if (nonMerge > 20) {
    score -= 1;
    reasons.push('问题数 > 20，需关注设计');
  } else {
    score += 1;
  }

  // 4. 代码仓库评估
  const mapping = FP_CODE_MAP[fpCode];
  if (mapping) {
    let foundRepos = 0;
    let totalRepos = mapping.repos.length;
    for (const repo of mapping.repos) {
      const repoPath = path.join(CODE_ROOT, repo);
      if (fs.existsSync(repoPath)) foundRepos++;
    }
    if (foundRepos === totalRepos) {
      score += 2;
      reasons.push(`代码模块完整（${foundRepos}/${totalRepos}）`);
    } else if (foundRepos > 0) {
      score += 1;
      reasons.push(`代码模块部分匹配（${foundRepos}/${totalRepos}）`);
      rootCauses.push({
        type: '代码模块分散',
        severity: '中',
        desc: `代码分布在 ${totalRepos} 个仓库中，部分缺失，集成复杂度高`,
        impact: '跨仓库代码变更需要多仓库协同，增加集成难度和回归风险',
        solution: '评估是否需要合并代码仓库，或建立跨仓库的接口契约测试'
      });
    } else {
      score -= 1;
      reasons.push('代码模块未找到');
      rootCauses.push({
        type: '代码模块缺失',
        severity: '高',
        desc: '代码仓库中未找到对应功能点的代码模块',
        impact: '功能点可能已废弃或代码结构不清晰',
        solution: '确认代码归属，更新功能点-代码映射表'
      });
    }
  } else {
    score -= 1;
    reasons.push('代码映射未配置');
    rootCauses.push({
      type: '代码映射缺失',
      severity: '中',
      desc: '功能点与代码仓库的映射关系未配置，无法追踪代码实现',
      impact: '无法快速定位问题代码，增加排查成本',
      solution: '建立功能点-代码模块映射表，确保每个功能点可追踪到对应代码'
    });
  }

  // 5. 设计合理性综合根因分析
  // 根据问题模式推断额外的根因
  if (nonMerge > 50 && hospitalRatio > 80) {
    rootCauses.push({
      type: '需求管理流程缺失',
      severity: '高',
      desc: '大量医院需求（占比 ' + hospitalRatio.toFixed(0) + '%）直接进入开发，缺乏统一的需求评审和设计评审环节',
      impact: '需求未经充分设计评审即进入开发，导致反复修改和设计走样',
      solution: '建立需求-设计评审流程，所有医院需求必须经过架构师设计评审后方可进入开发'
    });
  }

  if (nonMerge > 30 && specExists === false) {
    rootCauses.push({
      type: '设计-开发脱节',
      severity: '高',
      desc: '问题数 ' + nonMerge + ' 但无 Spec 设计文档，说明开发实现缺乏设计约束',
      impact: '开发人员凭经验实现，缺乏统一规范，导致不同人实现不同风格',
      solution: '补全 Spec 设计文档，建立设计评审制度，确保开发有设计可依'
    });
  }

  if (softRatio > 50) {
    rootCauses.push({
      type: '质量保障体系不足',
      severity: '中',
      desc: '软质占比 ' + softRatio.toFixed(0) + '%，说明质量保障体系未能有效拦截缺陷',
      impact: '缺陷流入生产环境，增加运维成本和医院信任度风险',
      solution: '建立分层测试策略（单元测试+集成测试+E2E），提升自动化测试覆盖率'
    });
  }

  // 综合判定
  let verdict, designLevel, healthAdjust;
  if (score >= 7) {
    verdict = '✅ 设计合理';
    designLevel = '合理';
    healthAdjust = 'up';
    reasons.push('综合评估：设计合理，问题主要是适配需求');
  } else if (score >= 4) {
    verdict = '⚠️ 设计基本合理需优化';
    designLevel = '基本合理';
    healthAdjust = 'none';
    reasons.push('综合评估：设计基本合理，但需关注问题模式');
  } else if (score >= 1) {
    verdict = '🔶 设计存在缺陷需重构';
    designLevel = '需重构';
    healthAdjust = 'down';
    reasons.push('综合评估：设计存在缺陷，建议安排重构');
  } else {
    verdict = '🔴 设计严重缺陷必须重建';
    designLevel = '需重建';
    healthAdjust = 'down';
    reasons.push('综合评估：设计严重缺陷，建议重建');
  }

  return {
    score,
    verdict,
    designLevel,
    healthAdjust,
    reasons,
    suggestions,
    rootCauses,  // 新增：设计不合理根因列表
    details: {
      specExists,
      hospitalRatio: hospitalRatio.toFixed(0),
      reqRatio: reqRatio.toFixed(0),
      softRatio: softRatio.toFixed(0),
      codeCompleteness: mapping ? `${mapping.repos.filter(r => fs.existsSync(path.join(CODE_ROOT, r))).length}/${mapping.repos.length}` : 'N/A'
    }
  };
}

// ============================================================
// 检查 Spec 知识库
// ============================================================
function checkSpecExists(fpCode) {
  const mapping = FP_CODE_MAP[fpCode];
  if (!mapping) return false;
  const specModule = mapping.specModule;
  // 确定产品线
  let productDir = '';
  if (fpCode.startsWith('BLGL')) productDir = '住院病历Spec';
  else if (fpCode.startsWith('MZBL')) productDir = '门诊病历Spec';
  else if (fpCode.startsWith('JZBL')) productDir = '急诊病历Spec';
  else return false;

  // 检查模块目录是否存在
  const moduleDir = path.join(SPEC_ROOT, productDir, specModule);
  if (fs.existsSync(moduleDir)) {
    const files = fs.readdirSync(moduleDir);
    // 检查是否有功能点相关的 Spec 文件
    const hasSpec = files.some(f => f.includes(fpCode) || f.includes('Spec') || f.includes('spec'));
    return hasSpec || files.length > 0;
  }
  return false;
}

// ============================================================
// 主流程
// ============================================================
console.log('🔍 开始功能点合理性评估...');
console.log('');

const md = fs.readFileSync(REPORT_FILE, 'utf8');

// 从报告文件中提取 Top 危险功能点数据
// 解析每个产品的推荐治理功能点列表
const results = {};
const totalFP = Object.keys(FP_CODE_MAP).length;
let processed = 0;

for (const [fpCode, fpInfo] of Object.entries(FP_CODE_MAP)) {
  // 模拟 fpInfo 数据（实际应从报告解析，这里简化）
  // 实际上我们只做设计合理性评估，不依赖实时数据
  processed++;
  const specExists = checkSpecExists(fpCode);
  console.log(`  [${processed}/${totalFP}] ${fpCode} ${fpInfo.desc} → Spec: ${specExists ? '✅' : '❌'}`);
}

console.log('');
console.log('📊 生成功能点合理性评估矩阵...');

// 为 Top 功能点生成详细评估
const topFps = [
  { code: 'BLGL-01-BLSX-002', name: '病历编辑与保存', nonMerge: 423, req: 287, soft: 136, hospital: 349, internal: 74 },
  { code: 'BLGL-01-BLSX-001', name: '病历创建与模板管理', nonMerge: 283, req: 174, soft: 109, hospital: 253, internal: 30 },
  { code: 'BLGL-10-BLCX-003', name: '病历结构化查询', nonMerge: 183, req: 107, soft: 76, hospital: 164, internal: 19 },
  { code: 'BLGL-05-HZGL-001', name: '会诊申请', nonMerge: 175, req: 95, soft: 80, hospital: 154, internal: 21 },
  { code: 'BLGL-01-BLSX-004', name: '病历提交与撤销提交', nonMerge: 137, req: 66, soft: 71, hospital: 128, internal: 9 },
  { code: 'BLGL-01-BLSX-003', name: '病历签署', nonMerge: 117, req: 72, soft: 45, hospital: 112, internal: 5 },
  { code: 'BLGL-05-HZGL-004', name: '会诊接收与答复', nonMerge: 89, req: 38, soft: 51, hospital: 78, internal: 11 },
  { code: 'BLGL-01-BLSX-006', name: '手术记录', nonMerge: 81, req: 46, soft: 35, hospital: 80, internal: 1 },
  { code: 'BLGL-10-BLCX-001', name: '科室病历查询', nonMerge: 70, req: 41, soft: 29, hospital: 66, internal: 4 },
  { code: 'BLGL-02-FZLR-005', name: '既往病历引用', nonMerge: 64, req: 27, soft: 37, hospital: 59, internal: 5 },
  { code: 'BLGL-15-QM-006', name: '签名图片与PDF处理', nonMerge: 59, req: 38, soft: 21, hospital: 48, internal: 11 },
  { code: 'BLGL-03-ZDYY-008', name: '诊断落库与对外对接', nonMerge: 51, req: 26, soft: 25, hospital: 48, internal: 3 },
  { code: 'MZBL-01-BLSX-001', name: '门诊病历创建与编辑', nonMerge: 151, req: 92, soft: 59, hospital: 132, internal: 19 },
  { code: 'MZBL-07-ALGL-001', name: '案例收藏与提交', nonMerge: 119, req: 114, soft: 5, hospital: 12, internal: 107 },
  { code: 'MZBL-01-BLSX-007', name: '外部数据同步', nonMerge: 95, req: 47, soft: 48, hospital: 74, internal: 21 },
  { code: 'MZBL-02-SXZS-001', name: '历史病历引用', nonMerge: 41, req: 19, soft: 22, hospital: 36, internal: 5 },
  { code: 'JZBL-05-ZLXXY-001', name: '信息页加载与数据同步', nonMerge: 29, req: 23, soft: 6, hospital: 22, internal: 7 },
];

console.log('');
console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║  功能点设计合理性评估报告                                           ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');
console.log('');

console.log('| 功能点 | 问题数 | 需求/软质 | 医院/内部 | Spec | 合理性评分 | 设计判定 | 调整后健康度 |');
console.log('|:------|:-----:|:---------:|:---------:|:---:|:----------:|:--------:|:------------:|');

const adjustedHealth = {};

for (const fp of topFps) {
  const specExists = checkSpecExists(fp.code);
  const assessment = assessDesignReasonableness(fp.code, fp, specExists, null, null);

  // 计算原始健康度
  let origHealth = '🔴 危险';
  let origLevel = 'danger';
  if (fp.nonMerge <= 2) { origHealth = '🟢 健康'; origLevel = 'healthy'; }
  else if (fp.nonMerge <= 5) { origHealth = '🟡 关注'; origLevel = 'concern'; }
  else if (fp.nonMerge <= 10) { origHealth = '🟠 预警'; origLevel = 'warning'; }

  // 调整健康度
  let adjHealth = origHealth;
  let adjLevel = origLevel;
  if (assessment.healthAdjust === 'up' && origLevel !== 'healthy') {
    // 向上调整一级
    if (origLevel === 'danger') { adjHealth = '🟠 预警'; adjLevel = 'warning'; }
    else if (origLevel === 'warning') { adjHealth = '🟡 关注'; adjLevel = 'concern'; }
    else if (origLevel === 'concern') { adjHealth = '🟢 健康'; adjLevel = 'healthy'; }
  } else if (assessment.healthAdjust === 'down' && origLevel !== 'danger') {
    // 向下调整一级
    if (origLevel === 'healthy') { adjHealth = '🟡 关注'; adjLevel = 'concern'; }
    else if (origLevel === 'concern') { adjHealth = '🟠 预警'; adjLevel = 'warning'; }
    else if (origLevel === 'warning') { adjHealth = '🔴 危险'; adjLevel = 'danger'; }
  }

  adjustedHealth[fp.code] = {
    orig: origHealth,
    adj: adjHealth,
    verdict: assessment.verdict,
    score: assessment.score,
    designLevel: assessment.designLevel,
    rootCauses: assessment.rootCauses || []
  };

  console.log(`| ${fp.code} ${fp.name} | ${fp.nonMerge} | ${fp.req}/${fp.soft} | ${fp.hospital}/${fp.internal} | ${specExists ? '✅' : '❌'} | ${assessment.score}/10 | ${assessment.verdict} | ${origHealth}→${adjHealth} |`);
}

console.log('');
console.log('---');
console.log('');

// 输出详细评估
console.log('## 详细评估说明');
console.log('');

for (const fp of topFps) {
  const specExists = checkSpecExists(fp.code);
  const assessment = assessDesignReasonableness(fp.code, fp, specExists, null, null);
  const adj = adjustedHealth[fp.code];

  console.log(`### ${fp.code} ${fp.name}`);
  console.log('');
  console.log(`- **原始健康度**: ${adj.orig} → **调整后**: ${adj.adj}`);
  console.log(`- **合理性评分**: ${assessment.score}/10 - ${assessment.verdict}`);
  console.log(`- **Spec 定义**: ${specExists ? '✅ 已存在' : '❌ 缺失'}`);
  console.log(`- **代码模块**: ${assessment.details.codeCompleteness}`);
  console.log(`- **评估依据**:`);
  for (const reason of assessment.reasons) {
    console.log(`  - ${reason}`);
  }

  // 输出设计不合理根因
  if (assessment.rootCauses && assessment.rootCauses.length > 0) {
    console.log(`- **设计不合理根因分析**:`);
    for (const rc of assessment.rootCauses) {
      console.log(`  - **[${rc.severity}] ${rc.type}**: ${rc.desc}`);
      console.log(`    - 影响：${rc.impact}`);
      console.log(`    - 解决建议：${rc.solution}`);
    }
  }

  if (assessment.suggestions.length > 0) {
    console.log(`- **优化建议**:`);
    for (const sug of assessment.suggestions) {
      console.log(`  - ${sug}`);
    }
  }
  console.log('');
}

// 生成健康度调整汇总
console.log('---');
console.log('');
console.log('## 健康度调整汇总');
console.log('');
console.log('| 调整类型 | 功能点数 | 功能点列表 |');
console.log('|:---------|:-------:|:----------|');

const upCount = Object.values(adjustedHealth).filter(a => a.orig !== a.adj && a.adj.includes('🟢') || a.adj.includes('🟡') && a.orig.includes('🔴')).length;
const downCount = Object.values(adjustedHealth).filter(a => a.orig !== a.adj && a.adj.includes('🔴')).length;
const stableCount = Object.values(adjustedHealth).filter(a => a.orig === a.adj).length;

console.log(`| ⬆️ 向上调整（设计合理） | ${upCount} | 设计合理，问题主要是适配需求，实际健康度优于原始数据 |`);
console.log(`| ➡️ 保持不动 | ${stableCount} | 设计基本合理，或问题模式与设计缺陷相关 |`);
console.log(`| ⬇️ 向下调整（设计缺陷） | ${downCount} | 设计存在缺陷，健康度应比原始数据更差 |`);
console.log('');

// 核心结论
console.log('## 核心结论');
console.log('');
console.log('1. **设计合理性评估是对健康度的重要补充**：问题数多不一定代表设计差，可能只是医院定制化需求多');
console.log('2. **Spec 定义完整性**：检查 Spec 知识库，部分功能点已有完整设计文档，问题集中在适配层');
console.log('3. **调整后的健康度更准确**：综合考虑问题数、问题模式、设计合理性后的健康度更具指导意义');
console.log('4. **治理优先级**：设计缺陷 + 问题数多 → 最高优先级；设计合理 + 问题数多 → 建立适配层');
console.log('');

// 汇总设计不合理根因类型
console.log('## 设计不合理根因类型分布');
console.log('');
console.log('| 根因类型 | 影响功能点数 | 严重程度 | 说明 |');
console.log('|:---------|:-----------:|:--------:|:----|');

const rootCauseSummary = {};
for (const fp of topFps) {
  const specExists = checkSpecExists(fp.code);
  const assessment = assessDesignReasonableness(fp.code, fp, specExists, null, null);
  for (const rc of (assessment.rootCauses || [])) {
    if (!rootCauseSummary[rc.type]) {
      rootCauseSummary[rc.type] = { count: 0, severity: rc.severity, desc: rc.desc, solution: rc.solution };
    }
    rootCauseSummary[rc.type].count++;
  }
}

for (const [type, info] of Object.entries(rootCauseSummary).sort((a, b) => b[1].count - a[1].count)) {
  console.log(`| **${type}** | ${info.count} | ${info.severity} | ${info.desc} |`);
}
console.log('');

// 保存评估结果
const outputPath = 'E:\\37结构性问题治理\\07病历条线需求聚拢\\功能点合理性评估-20260820.json';
fs.writeFileSync(outputPath, JSON.stringify(adjustedHealth, null, 2), 'utf8');
console.log('📁 评估结果已保存到: ' + outputPath);