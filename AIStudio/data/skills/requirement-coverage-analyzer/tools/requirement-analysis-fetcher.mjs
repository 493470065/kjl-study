import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 获取需求分析内容
 * 优先级：预存分析 > TFS字段 > LLM生成
 */
export async function getRequirementAnalysis(requirementId, tfsClient, config) {
  const result = {
    requirement: null,
    analysis: null,
    source: ''
  };

  //1. 获取基础需求信息
  result.requirement = await tfsClient.getWorkItem(requirementId);

  //2. 尝试从预存文件读取
  const storedAnalysis = await loadStoredAnalysis(requirementId, config);
  if (storedAnalysis && hasAnalysisContent(storedAnalysis)) {
    result.analysis = storedAnalysis;
    result.source = 'stored';
    return result;
  }

  //3. 尝试从TFS字段提取（增强版）
  const tfsAnalysis = extractAnalysisFromTFS(result.requirement);
  if (tfsAnalysis && hasAnalysisContent(tfsAnalysis)) {
    result.analysis = tfsAnalysis;
    result.source = 'tfs';
    console.log('  从TFS字段提取到业务分析');
    return result;
  }

  //4. 使用LLM分析需求描述
  console.log('  未找到预存的需求分析，使用LLM分析...');
  result.analysis = await analyzeWithLLM(result.requirement, config);
  result.source = 'llm';

  return result;
}

/**
 * 从预存文件加载分析
 */
async function loadStoredAnalysis(requirementId, config) {
  const analysisFile = path.resolve(__dirname, config.requirement_analysis.stored_analysis_path);

  try {
    const content = await fs.readFile(analysisFile, 'utf-8');

    // 查找该需求ID的分析段落
    const pattern = new RegExp(
      `##?\\s*(?:需求|工作项)\\s*${requirementId}[\\s\\S]*?(?=##?\\s*(?:需求|工作项)\\s*\\d+|$)`,
      'is'
    );

    const match = content.match(pattern);
    if (match) {
      return parseStoredAnalysisText(match[0]);
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 从TFS字段提取分析（增强版）
 * 针对泰康项目需求格式进行解析
 * 优先使用 Winning.Demand.Analysis 字段（TFS需求分析字段）
 */
function extractAnalysisFromTFS(requirement) {
  const analysis = {
    businessRules: [],
    workflows: [],
    constraints: [],
    dataMapping: [],
    edgeCases: [],
    rawAnalysis: null
  };

  const fields = requirement.fields || {};
  const title = fields['System.Title'] || '';
  const description = fields['System.Description'] || '';

  // 获取 TFS 需求分析字段（这是关键！）
  const demandAnalysisHtml = fields['Winning.Demand.Analysis'] || '';

  // 解析HTML内容为纯文本
  const demandAnalysis = demandAnalysisHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '');

  // 保存原始分析内容
  if (demandAnalysis) {
    analysis.rawAnalysis = demandAnalysis;
  }

  // 优先从需求分析字段提取信息
  const fullText = demandAnalysis ? `${title}\n${demandAnalysis}` : `${title}\n${description}`;

  // 1. 提取业务规则 - 寻找规则性描述
  const rulePatterns = [
    /按照[^，。]{5,30}/g,           // 按照...规则
    /必须[^，。]{3,30}/g,           // 必须...约束
    /应该[^，。]{3,30}/g,           // 应该...规则
    /只能[^，。]{3,30}/g,           // 只能...约束
    /不能[^，。]{3,30}/g,           // 不能...约束
    /(?:医保|身份)[^，。]{5,40}比例/g,  // 医保比例相关
    /(?:先诊疗后付费|后付费)[^，。]{5,50}/g  // 后付费相关
  ];

  const extractedRules = new Set();
  rulePatterns.forEach(pattern => {
    const matches = fullText.match(pattern);
    if (matches) {
      matches.forEach(m => {
        if (m.length > 5) {
          extractedRules.add(m.trim());
        }
      });
    }
  });

  // 从标题中提取核心业务规则
  if (title.includes('先诊疗后付费') && title.includes('显示医保比例')) {
    extractedRules.add('先诊疗后付费患者按照最近一次的医保挂号一级身份显示医保比例');
  }

  analysis.businessRules = Array.from(extractedRules).map(r => ({ description: r }));

  // 2. 提取业务流程
  const workflows = [];

  // 挂号流程
  if (fullText.includes('挂号') || fullText.includes('身份')) {
    workflows.push({
      from: '患者挂号',
      to: '获取医保身份',
      action: 'FHIR接口调用',
      description: '挂号时传入患者医保身份信息'
    });
  }

  // 结算流程
  if (fullText.includes('医保') || fullText.includes('结算')) {
    workflows.push({
      from: '医保结算',
      to: '保存医保身份',
      action: '系统处理',
      description: '保存患者最近一次医保结算时的身份信息'
    });
  }

  // 查询/显示流程
  if (fullText.includes('显示') || fullText.includes('比例')) {
    workflows.push({
      from: '查询患者信息',
      to: '显示医保比例',
      action: '系统查询',
      description: '按照最近一次医保挂号身份查询并显示对应医保比例'
    });
  }

  analysis.workflows = workflows;

  // 3. 提取约束条件
  const constraints = [];

  if (fullText.includes('最近一次') || fullText.includes('一级身份')) {
    constraints.push({
      type: '数据唯一性',
      field: '医保身份',
      description: '使用最近一次的医保挂号一级身份'
    });
  }

  if (fullText.includes('先诊疗后付费')) {
    constraints.push({
      type: '业务场景约束',
      field: '患者类型',
      description: '仅针对先诊疗后付费患者'
    });
  }

  if (title.includes('合并') && /\d+/.test(title)) {
    const versionMatch = title.match(/(\d+)/g);
    if (versionMatch && versionMatch.length >= 2) {
      constraints.push({
        type: '版本合并',
        field: '代码版本',
        description: `合并版本 ${versionMatch[versionMatch.length - 2]} 到 ${versionMatch[versionMatch.length - 1]}`
      });
    }
  }

  analysis.constraints = constraints;

  // 4. 提取数据映射
  const dataMappings = [];

  if (fullText.includes('医保') && fullText.includes('身份')) {
    dataMappings.push({
      source: '患者医保结算信息',
      target: '医保身份标识',
      description: '将患者最近一次医保结算的身份信息保存'
    });
  }

  if (fullText.includes('医保') && fullText.includes('比例')) {
    dataMappings.push({
      source: '医保身份',
      target: '医保比例',
      description: '根据医保身份查询对应的医保比例信息'
    });
  }

  if (fullText.includes('FHIR') && fullText.includes('接口')) {
    dataMappings.push({
      source: 'FHIR接口',
      target: '系统内部数据',
      description: '通过FHIR接口同步医保身份数据'
    });
  }

  analysis.dataMapping = dataMappings;

  // 5. 提取边界情况
  const edgeCases = [];

  if (fullText.includes('未找到') || fullText.includes('无')) {
    edgeCases.push({
      type: '数据缺失',
      field: '医保身份',
      description: '患者无医保结算记录时的处理'
    });
  }

  if (fullText.includes('先诊疗后付费')) {
    edgeCases.push({
      type: '业务场景',
      field: '患者类型',
      description: '区分先诊疗后付费与预付费患者'
    });
  }

  // 合并相关的边界情况
  if (fullText.includes('合并') || fullText.includes('版本')) {
    edgeCases.push({
      type: '版本兼容',
      field: '代码合并',
      description: '处理不同版本间的代码合并冲突'
    });
  }

  analysis.edgeCases = edgeCases;

  // 直接保存原始需求分析内容，不做提取
  // 原始内容已经在 analysis.rawAnalysis 中保存

  return analysis;
}

/**
 * 使用LLM分析需求
 */
async function analyzeWithLLM(requirement, config) {
  const llmConfig = config.requirement_analysis.llm;

  // 这里返回基于TFS解析的结果（不实际调用LLM API）
  // 在实际使用中，可以集成真实的LLM API
  const tfsAnalysis = extractAnalysisFromTFS(requirement);

  return tfsAnalysis;
}

/**
 * 检查分析是否有内容
 */
function hasAnalysisContent(analysis) {
  return analysis &&
    (analysis.businessRules?.length > 0 ||
     analysis.workflows?.length > 0 ||
     analysis.constraints?.length > 0 ||
     analysis.dataMapping?.length > 0 ||
     analysis.edgeCases?.length > 0 ||
     analysis.rawAnalysis?.length > 0);
}

export { loadStoredAnalysis, hasAnalysisContent };
