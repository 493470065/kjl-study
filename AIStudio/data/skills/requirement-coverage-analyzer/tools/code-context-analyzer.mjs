#!/usr/bin/env node
/**
 * 代码上下文分析模块
 * 从代码中提取业务逻辑，与需求进行匹配分析
 */

import path from 'path';

/**
 * 提取 API 接口定义
 * @param {string} content - 代码内容
 * @param {string} filePath - 文件路径
 * @returns {Array} API 接口列表
 */
export function extractApiEndpoints(content, filePath) {
  const endpoints = [];

  // 匹配 Spring 注解（包括自定义注解如 @WinPostMapping）
  // @GetMapping("/path"), @PostMapping("/path"), @WinPostMapping("/path")
  const springPatterns = [
    /@(?:\w*)(?:Get|Post|Put|Delete|Patch)Mapping\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/gi,
    /@RequestMapping\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/gi
  ];

  for (const pattern of springPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      endpoints.push({
        path: match[1],
        method: extractMethodFromAnnotation(match[0]),
        source: 'Spring',
        file: filePath
      });
    }
  }

  // 匹配 axios/fetch 调用
  // axios.get('/api/xxx'), fetch('/api/xxx')
  const httpPatterns = [
    /(?:axios|http|fetch)\s*\.\s*(get|post|put|delete|patch)\s*\(\s*["'`]([^"'`]+)["'`]/gi,
    /(?:axios|http)\s*\(\s*\{\s*(?:method\s*:\s*)?["']?(get|post|put|delete|patch)["']?\s*,?\s*(?:url\s*:\s*)?["'`]([^"'`]+)["'`]/gi
  ];

  for (const pattern of httpPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      endpoints.push({
        path: match[2],
        method: match[1].toUpperCase(),
        source: 'HTTP Client',
        file: filePath
      });
    }
  }

  // 匹配路由定义
  // router.get('/path'), app.get('/path')
  const routePattern = /(?:router|app|Route)\s*\.\s*(get|post|put|delete|patch)\s*\(\s*["'`]([^"'`]+)["'`]/gi;
  let routeMatch;
  while ((routeMatch = routePattern.exec(content)) !== null) {
    endpoints.push({
      path: routeMatch[2],
      method: routeMatch[1].toUpperCase(),
      source: 'Route',
      file: filePath
    });
  }

  return endpoints;
}

/**
 * 从注解提取 HTTP 方法
 */
function extractMethodFromAnnotation(annotation) {
  if (annotation.includes('GetMapping')) return 'GET';
  if (annotation.includes('PostMapping')) return 'POST';
  if (annotation.includes('PutMapping')) return 'PUT';
  if (annotation.includes('DeleteMapping')) return 'DELETE';
  if (annotation.includes('PatchMapping')) return 'PATCH';
  return 'REQUEST';
}

/**
 * 提取函数/方法定义
 * @param {string} content - 代码内容
 * @param {string} filePath - 文件路径
 * @returns {Array} 函数列表
 */
export function extractFunctions(content, filePath) {
  const functions = [];

  // JS/TS 函数定义
  // function name(params) {}
  // const name = (params) => {}
  // const name = async (params) => {}
  const jsPatterns = [
    /(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g,
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*(?::\s*[^=]+)?\s*=>/g,
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function\s*(?:\w*)\s*\(([^)]*)\)/g
  ];

  for (const pattern of jsPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      functions.push({
        name: match[1],
        params: match[2].split(',').map(p => p.trim()).filter(p => p),
        type: 'function',
        file: filePath
      });
    }
  }

  // Java 方法定义
  // public returnType methodName(params) {}
  const javaPattern = /(?:public|private|protected)?\s*(?:static\s+)?(?:\w+(?:<[^>]+>)?)\s+(\w+)\s*\(([^)]*)\)\s*(?:throws\s+[\w\s,]+)?\s*\{/g;
  let javaMatch;
  while ((javaMatch = javaPattern.exec(content)) !== null) {
    // 过滤掉常见的非方法名称
    if (!['if', 'for', 'while', 'switch', 'catch', 'class', 'interface'].includes(javaMatch[1])) {
      functions.push({
        name: javaMatch[1],
        params: javaMatch[2].split(',').map(p => p.trim()).filter(p => p),
        type: 'method',
        file: filePath
      });
    }
  }

  // Vue methods
  const vueMethodsMatch = content.match(/methods\s*:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/);
  if (vueMethodsMatch) {
    const methodNames = vueMethodsMatch[1].match(/(\w+)\s*\(/g);
    if (methodNames) {
      for (const mName of methodNames) {
        const name = mName.replace(/\s*\($/, '');
        functions.push({
          name: name,
          params: [],
          type: 'vue-method',
          file: filePath
        });
      }
    }
  }

  return functions;
}

/**
 * 提取业务规则和验证逻辑
 * @param {string} content - 代码内容
 * @param {string} filePath - 文件路径
 * @returns {Array} 业务规则列表
 */
export function extractBusinessRules(content, filePath) {
  const rules = [];

  // 提取 if 条件判断
  const ifPattern = /if\s*\(([^)]+)\)\s*\{/g;
  let ifMatch;
  while ((ifMatch = ifPattern.exec(content)) !== null) {
    const condition = ifMatch[1].trim();
    // 过滤太简单或太复杂的条件
    if (condition.length > 5 && condition.length < 200) {
      rules.push({
        type: 'condition',
        content: condition,
        file: filePath
      });
    }
  }

  // 提取常量定义
  const constPattern = /(?:const|static\s+final|enum)\s+(\w+)\s*=\s*([^;,\n]+)/g;
  let constMatch;
  while ((constMatch = constPattern.exec(content)) !== null) {
    rules.push({
      type: 'constant',
      name: constMatch[1],
      value: constMatch[2].trim(),
      file: filePath
    });
  }

  // 提取验证规则
  const validatePatterns = [
    /(?:validate|check|verify|ensure)\w*\s*\(([^)]+)\)/gi,
    /@NotNull|@NotEmpty|@NotBlank|@Valid|@Pattern|@Size|@Min|@Max/gi
  ];

  for (const pattern of validatePatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      rules.push({
        type: 'validation',
        content: match[0],
        file: filePath
      });
    }
  }

  // 提取配置参数相关
  const configPattern = /(?:参数|配置|config|param|setting)["\s:=]+(\d+|["'][^"']+["'])/gi;
  let configMatch;
  while ((configMatch = configPattern.exec(content)) !== null) {
    rules.push({
      type: 'config',
      value: configMatch[1],
      context: configMatch[0],
      file: filePath
    });
  }

  return rules;
}

/**
 * 提取数据模型定义
 * @param {string} content - 代码内容
 * @param {string} filePath - 文件路径
 * @returns {Array} 数据模型列表
 */
export function extractDataModels(content, filePath) {
  const models = [];

  // TypeScript interface
  const interfacePattern = /interface\s+(\w+)\s*\{([^}]+)\}/g;
  let interfaceMatch;
  while ((interfaceMatch = interfacePattern.exec(content)) !== null) {
    const fields = extractFields(interfaceMatch[2]);
    models.push({
      name: interfaceMatch[1],
      type: 'interface',
      fields: fields,
      file: filePath
    });
  }

  // TypeScript type
  const typePattern = /type\s+(\w+)\s*=\s*\{([^}]+)\}/g;
  let typeMatch;
  while ((typeMatch = typePattern.exec(content)) !== null) {
    const fields = extractFields(typeMatch[2]);
    models.push({
      name: typeMatch[1],
      type: 'type',
      fields: fields,
      file: filePath
    });
  }

  // Java class (DTO/VO/Entity)
  const classPattern = /class\s+(\w+(?:DTO|VO|Entity|Model|Data)?)\s*(?:extends\s+\w+)?\s*\{/g;
  let classMatch;
  while ((classMatch = classPattern.exec(content)) !== null) {
    models.push({
      name: classMatch[1],
      type: 'class',
      fields: [], // 需要更复杂的解析
      file: filePath
    });
  }

  // Vue props
  const propsMatch = content.match(/props\s*:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/);
  if (propsMatch) {
    const props = propsMatch[1].split(',').map(p => p.split(':')[0].trim()).filter(p => p);
    models.push({
      name: 'props',
      type: 'vue-props',
      fields: props,
      file: filePath
    });
  }

  return models;
}

/**
 * 从内容提取字段定义
 */
function extractFields(content) {
  const fields = [];
  const fieldPattern = /(\w+)\s*[?:]\s*(\w+(?:<[^>]+>)?|\[[^\]]+\]|["'][^"']+["'])/g;
  let match;
  while ((match = fieldPattern.exec(content)) !== null) {
    fields.push({
      name: match[1],
      type: match[2]
    });
  }
  return fields;
}

/**
 * 提取缓存操作
 * @param {string} content - 代码内容
 * @param {string} filePath - 文件路径
 * @returns {Array} 缓存操作列表
 */
export function extractCacheOperations(content, filePath) {
  const operations = [];

  // Java Spring 缓存注解
  // @Cacheable(value = "cacheName", key = "#id")
  // @CacheEvict(value = "cacheName", allEntries = true)
  // @CachePut(value = "cacheName", key = "#id")
  const springCachePatterns = [
    /@Cacheable\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/gi,
    /@CacheEvict\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/gi,
    /@CachePut\s*\(\s*(?:value\s*=\s*)?["']([^"']+)["']/gi,
    /@CacheConfig\s*\(\s*cacheNames\s*=\s*\{?\s*["']([^"']+)["']/gi
  ];

  const springCacheTypes = ['Cacheable', 'CacheEvict', 'CachePut'];

  for (let i = 0; i < springCachePatterns.length; i++) {
    const pattern = springCachePatterns[i];
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const annotationType = springCacheTypes[i] || 'CacheConfig';
      operations.push({
        operation: annotationType.toLowerCase(),
        key: match[1],
        type: 'spring-cache',
        file: filePath
      });
    }
  }

  // 缓存操作模式（JS/TS）
  const cachePatterns = [
    // Redis/缓存客户端
    /(?:redis|cache)\s*\.\s*(get|set|del|delete|put|remove|h?set|h?get)\s*\(\s*["'`]([^"'`]+)["'`]/gi,
    // 缓存服务
    /(?:cacheService|cacheUtil)\s*\.\s*(get|set|del|delete|put|remove)\s*\(\s*["'`]([^"'`]+)["'`]/gi,
    // localStorage/sessionStorage
    /(?:local|session)Storage\s*\.\s*(get|set|remove)Item\s*\(\s*["'`]([^"'`]+)["'`]/gi,
    // Map 缓存
    /(?:cache|map)\s*\.\s*(get|set|delete|has)\s*\(\s*["'`]([^"'`]+)["'`]/gi
  ];

  for (const pattern of cachePatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      operations.push({
        operation: match[1].toLowerCase(),
        key: match[2],
        type: 'cache',
        file: filePath
      });
    }
  }

  return operations;
}

/**
 * 提取状态流转
 * @param {string} content - 代码内容
 * @param {string} filePath - 文件路径
 * @returns {Array} 状态流转列表
 */
export function extractStateTransitions(content, filePath) {
  const transitions = [];

  // 枚举定义
  const enumPattern = /enum\s+(\w+)\s*\{([^}]+)\}/g;
  let enumMatch;
  while ((enumMatch = enumPattern.exec(content)) !== null) {
    const values = enumMatch[2].split(',').map(v => v.trim().split(/[=:]/)[0]).filter(v => v);
    transitions.push({
      type: 'enum',
      name: enumMatch[1],
      values: values,
      file: filePath
    });
  }

  // 状态变量赋值
  const stateAssignPattern = /(?:status|state)\s*[=:]\s*["']?(\w+)["']?/gi;
  let stateMatch;
  while ((stateMatch = stateAssignPattern.exec(content)) !== null) {
    transitions.push({
      type: 'state-change',
      value: stateMatch[1],
      file: filePath
    });
  }

  return transitions;
}

/**
 * 综合分析代码内容
 * @param {string} content - 代码内容
 * @param {string} filePath - 文件路径
 * @returns {Object} 分析结果
 */
export function analyzeCodeContent(content, filePath) {
  return {
    file: filePath,
    apiEndpoints: extractApiEndpoints(content, filePath),
    functions: extractFunctions(content, filePath),
    businessRules: extractBusinessRules(content, filePath),
    dataModels: extractDataModels(content, filePath),
    cacheOperations: extractCacheOperations(content, filePath),
    stateTransitions: extractStateTransitions(content, filePath)
  };
}

/**
 * 与需求进行匹配分析
 * @param {Object} codeAnalysis - 代码分析结果
 * @param {string} requirementAnalysis - 需求分析内容
 * @returns {Object} 匹配结果
 */
export function matchWithRequirement(codeAnalysis, requirementAnalysis) {
  const result = {
    matches: [],
    unmatched: [],
    score: 0
  };

  if (!requirementAnalysis) {
    return result;
  }

  const reqText = requirementAnalysis.toLowerCase();
  let matchedCount = 0;
  let totalChecks = 0;

  // 检查 API 匹配
  for (const api of codeAnalysis.apiEndpoints || []) {
    totalChecks++;
    const apiPath = api.path.toLowerCase();

    // 检查需求中是否提到这个 API
    if (reqText.includes(apiPath) ||
        reqText.includes(apiPath.replace(/\//g, ''))) {
      result.matches.push({
        type: 'api',
        requirement: apiPath,
        implementation: `${api.method} ${api.path}`,
        file: api.file
      });
      matchedCount++;
    }
  }

  // 检查关键词匹配
  const keywords = extractKeywords(requirementAnalysis);
  for (const keyword of keywords) {
    totalChecks++;

    // 在代码中搜索关键词
    const found = searchKeywordInAnalysis(codeAnalysis, keyword);
    if (found) {
      result.matches.push({
        type: 'keyword',
        requirement: keyword,
        implementation: found.context,
        file: found.file
      });
      matchedCount++;
    } else {
      result.unmatched.push({
        type: 'keyword',
        requirement: keyword
      });
    }
  }

  // 计算匹配分数
  result.score = totalChecks > 0 ? Math.round((matchedCount / totalChecks) * 100) : 0;

  return result;
}

/**
 * 从需求分析中提取关键词（智能版）
 * 使用业务领域知识库提取有意义的功能点
 */
function extractKeywords(text) {
  const keywords = [];

  // 需要过滤的章节标题和文档结构词汇
  const sectionHeaders = [
    '需求概述', '背景现状', '客户诉求', '需求分析', '功能分析', '业务', '数据流程',
    '功能目标', '界面设计', '设计方案', '定义态', '业务兼容', '兼容要求',
    '接口说明', '模块', '流程', '关联需求', '注意事项', '测试注意',
    '开发者设计', '设计说明', '评审说明', '分析者描述', '开发者描述',
    '测试者描述', '其他', '受影响', '一、', '二、', '三、',
    '1.1', '1.2', '1.3', '1.4', '1.5', '2.1', '2.2', '2.3', '2.4', '2.5',
    '重新启动', '原需求', '内容如下', '详细调研', '调研结果'
  ];

  // 业务领域关键词库（基于常见医疗IT系统需求）
  const businessKeywords = [
    // 医嘱相关
    '医嘱', '检查医嘱', '检验医嘱', '病理医嘱', '治疗医嘱', '药品医嘱',
    // 执行地点相关
    '执行地点', '采集地点', '院区', '科室', '开单院区', '执行科室',
    // 显示相关
    '悬浮窗', '列表', '显示', '展示',
    // 数据字段相关
    '字段', '数据源', '项目ID', '就诊类型',
    // 配置相关
    '参数配置', '配置项', '选项', '默认值',
    // 业务规则相关
    '优先级', '规则', '按照', '根据', '只有', '多个',
    // 支付相关
    '支付上限', '自付比例', '后付费', '医保',
    // 版本相关
    '合并需求', '版本', '优化'
  ];

  // 提取包含业务关键词的短语
  for (const keyword of businessKeywords) {
    if (text.includes(keyword)) {
      keywords.push(keyword);
    }
  }

  // 提取数字编号的需求点（如 2.1, 2.2）
  const numberedPoints = text.match(/\d+\.\d+\s*[^，。\n]{5,50}/g) || [];
  for (const point of numberedPoints) {
    const cleanPoint = point.replace(/\d+\.\d+\s*/, '').trim();
    if (cleanPoint.length >= 3) {
      keywords.push(cleanPoint.substring(0, 20)); // 取前20个字符
    }
  }

  // 过滤并去重
  return [...new Set(keywords.filter(k =>
    k.length >= 2 &&
    !sectionHeaders.some(h => k.includes(h))
  ))];
}

/**
 * 在分析结果中搜索关键词（改进版）
 */
function searchKeywordInAnalysis(analysis, keyword) {
  const keywordLower = keyword.toLowerCase();

  // 业务术语映射表（将需求术语映射到代码术语）
  const termMapping = {
    '执行地点': ['execLocation', 'executionLocation', 'location', 'csXLocation', 'setExecLocationName'],
    '采集地点': ['csXLocation', 'collectionLocation', 'xLocation'],
    '医嘱': ['order', 'clinicalOrder', 'medicalOrder'],
    '检查': ['exam', 'examination'],
    '检验': ['labtest', 'labTest', 'laboratory'],
    '病理': ['pathology'],
    '治疗': ['treatment'],
    '药品': ['drug', 'medicine', 'medication'],
    '卫材': ['consumable', 'material'],
    '打印': ['print', 'Print', 'printOrder'],
    '单据': ['order', 'document', 'dto'],
    '院区': ['orgArea', 'hospitalArea', 'area', 'orgId'],
    '科室': ['department', 'dept', 'execDept'],
    '就诊类型': ['encounterType', 'encounterTypeCode', 'ENCOUNTER_TYPE'],
    '门诊': ['outpatient', 'outp'],
    '配置': ['config', 'setting', 'parameter', 'param'],
    '参数': ['param', 'parameter', 'config'],
    '字段': ['field', 'column', 'property'],
    'HIS': ['his', 'external'],
    '接口': ['api', 'interface', 'endpoint'],
    '数据源': ['dataSource', 'source', 'data'],
    '显示': ['show', 'display', 'render', 'view'],
    '优先': ['priority', 'first'],
    '默认': ['default'],
    '多个': ['multiple', 'list', 'array'],
    '筛选': ['filter', 'where', 'condition'],
    '支付上限': ['payLimit', 'outpPayUpperLimit', 'paymentLimit'],
    '自付比例': ['selfAffordingRatio', 'selfPaymentRatio'],
    '医保': ['insurance', 'medInsur', 'insur']
  };

  // 1. 搜索函数名
  for (const fn of analysis.functions || []) {
    const fnName = (fn.name || '').toLowerCase();
    if (fnName.includes(keywordLower)) {
      return { context: fn.name, file: fn.file };
    }
    // 使用术语映射搜索
    for (const [term, codeTerms] of Object.entries(termMapping)) {
      if (keyword.includes(term) && codeTerms.some(ct => fnName.toLowerCase().includes(ct.toLowerCase()))) {
        return { context: fn.name, file: fn.file, matched: `${term} -> ${fn.name}` };
      }
    }
  }

  // 2. 搜索业务规则内容
  for (const rule of analysis.businessRules || []) {
    const ruleContent = (rule.content || '').toLowerCase();
    if (ruleContent.includes(keywordLower)) {
      return { context: rule.content.substring(0, 100), file: rule.file };
    }
    // 使用术语映射搜索
    for (const [term, codeTerms] of Object.entries(termMapping)) {
      if (keyword.includes(term) && codeTerms.some(ct => ruleContent.toLowerCase().includes(ct.toLowerCase()))) {
        return { context: rule.content.substring(0, 100), file: rule.file, matched: `${term} -> rule` };
      }
    }
  }

  // 3. 搜索数据模型名和字段
  for (const model of analysis.dataModels || []) {
    const modelName = (model.name || '').toLowerCase();
    if (modelName.includes(keywordLower)) {
      return { context: model.name, file: model.file };
    }
    for (const field of model.fields || []) {
      const fieldName = (field.name || '').toLowerCase();
      if (fieldName.includes(keywordLower)) {
        return { context: `${model.name}.${field.name}`, file: model.file };
      }
    }
    // 使用术语映射搜索模型
    for (const [term, codeTerms] of Object.entries(termMapping)) {
      if (keyword.includes(term)) {
        if (codeTerms.some(ct => modelName.includes(ct.toLowerCase())) ||
            model.fields.some(f => (f.name || '').toLowerCase().includes(ct.toLowerCase()))) {
          return { context: model.name, file: model.file, matched: `${term} -> ${model.name}` };
        }
      }
    }
  }

  return null;
}

/**
 * 批量分析多个文件
 * @param {Array} files - 文件列表 [{ path, content, changeType }]
 * @returns {Object} 综合分析结果
 */
export function analyzeMultipleFiles(files) {
  const result = {
    files: [],
    summary: {
      totalFiles: files.length,
      totalEndpoints: 0,
      totalFunctions: 0,
      totalRules: 0,
      totalModels: 0,
      totalCacheOps: 0
    }
  };

  for (const file of files) {
    if (!file.content) continue;

    const analysis = analyzeCodeContent(file.content, file.path);
    result.files.push(analysis);

    result.summary.totalEndpoints += analysis.apiEndpoints.length;
    result.summary.totalFunctions += analysis.functions.length;
    result.summary.totalRules += analysis.businessRules.length;
    result.summary.totalModels += analysis.dataModels.length;
    result.summary.totalCacheOps += analysis.cacheOperations.length;
  }

  return result;
}

export default {
  extractApiEndpoints,
  extractFunctions,
  extractBusinessRules,
  extractDataModels,
  extractCacheOperations,
  extractStateTransitions,
  analyzeCodeContent,
  matchWithRequirement,
  analyzeMultipleFiles
};
