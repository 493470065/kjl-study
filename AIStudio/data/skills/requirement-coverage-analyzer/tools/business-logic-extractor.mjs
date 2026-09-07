import { execSync } from 'child_process';

/**
 * 从代码变更中提取业务逻辑
 * @param {Array} commits - 提交记录数组
 * @param {string} repoPath - 仓库路径
 * @returns {Object} 提取的业务逻辑要素
 */
export async function extractBusinessLogic(commits, repoPath) {
  const logic = {
    validationRules: [],
    stateTransitions: [],
    calculations: [],
    dataOperations: [],
    exceptionHandling: []
  };

  if (!commits || commits.length === 0) {
    return logic;
  }

  for (const commit of commits) {
    const patch = getCommitPatch(commit.commitId || commit.id || commit, repoPath);
    if (!patch) continue;

    logic.validationRules.push(...extractValidations(patch));
    logic.stateTransitions.push(...extractStateTransitions(patch));
    logic.calculations.push(...extractCalculations(patch));
    logic.dataOperations.push(...extractDataOperations(patch));
    logic.exceptionHandling.push(...extractExceptionHandling(patch));
  }

  return logic;
}

/**
 * 获取提交的代码差异
 * @param {string} commitId - 提交ID
 * @param {string} repoPath - 仓库路径
 * @returns {string|null} 代码差异内容
 */
function getCommitPatch(commitId, repoPath) {
  try {
    return execSync(
      `cd "${repoPath}" && git show ${commitId} --format=""`,
      { encoding: 'utf-8', timeout: 10000 }
    );
  } catch (error) {
    return null;
  }
}

/**
 * 从文件路径提取代码内容
 * @param {string} filePath - 文件路径
 * @param {string} repoPath - 仓库路径
 * @param {string} ref - Git引用（如HEAD、commitId）
 * @returns {string|null} 文件内容
 */
export function extractFromFile(filePath, repoPath, ref = 'HEAD') {
  try {
    return execSync(
      `cd "${repoPath}" && git show ${ref}:${filePath}`,
      { encoding: 'utf-8', timeout: 10000 }
    );
  } catch (error) {
    return null;
  }
}

/**
 * 提取验证规则
 * 支持Java注解、条件判断、断言等多种验证模式
 * @param {string} code - 代码内容
 * @returns {Array} 验证规则列表
 */
function extractValidations(code) {
  const validations = [];

  const patterns = [
    // Java验证注解
    { regex: /@NotNull|@NotEmpty|@NotBlank|@Min|@Max|@Pattern|@Size|@Email|@Positive|@Negative/g, type: 'annotation' },
    // null检查
    { regex: /if\s*\([^)]*==\s*null|if\s*\([^)]*===?\s*null|if\s*\([^)]*\.isEmpty\(\)|if\s*\([^)]*\.isBlank\(\)|if\s*\([^)]*\.length\s*==\s*0/g, type: 'null_check' },
    // 异常抛出
    { regex: /throw new (BusinessException|ValidationException|IllegalArgumentException|IllegalStateException)/g, type: 'exception_throw' },
    // 断言
    { regex: /Assert\.(notNull|notEmpty|hasText|isTrue|isFalse|notBlank)/g, type: 'assertion' },
    // 参数校验
    { regex: /Objects\.(requireNonNull|isNull|nonNull)/g, type: 'objects_check' },
    // 字符串验证
    { regex: /StringUtils\.(isBlank|isEmpty|isNotBlank)/g, type: 'string_check' },
    // 范围检查
    { regex: /\b(age|count|amount|quantity|num|size)\s*[><=!]+\s*\d+/gi, type: 'range_check' }
  ];

  patterns.forEach(({ regex, type }) => {
    const matches = code.matchAll(regex);
    for (const match of matches) {
      const context = extractContext(code, match.index);
      validations.push({
        type: type,
        pattern: match[0],
        context: context,
        target: extractTarget(context)
      });
    }
  });

  return validations;
}

/**
 * 提取状态流转
 * 识别状态机变化、状态字段更新等
 * @param {string} code - 代码内容
 * @returns {Array} 状态流转列表
 */
function extractStateTransitions(code) {
  const transitions = [];

  const patterns = [
    // setStatus方法
    /(\w+)\.setStatus\(\s*['"]?(\w+)['"]?\s*\)/g,
    // 状态枚举赋值
    /(\w+\.status|status|state)\s*=\s*[\w.]+\.(\w+)/g,
    // 状态枚举直接引用
    /OrderStatus|TaskStatus|PatientStatus|ApprovalStatus|(\w+Status)\.(\w+)/g,
    // 状态变更方法
    /(\w+)\.(approve|reject|submit|cancel|close|complete|start|finish|activate|deactivate|enable|disable)\(/g,
    // 流程节点
    /workflow|transition|transform|from\s+\w+\s+to\s+\w+/gi
  ];

  patterns.forEach(regex => {
    const matches = code.matchAll(regex);
    for (const match of matches) {
      const context = extractContext(code, match.index);
      transitions.push({
        type: 'state_change',
        from: match[1] || null,
        toState: match[2] || match[1] || null,
        action: match[2] || null,
        context: context
      });
    }
  });

  return transitions;
}

/**
 * 提取计算逻辑
 * 识别数值计算、日期计算、聚合操作等
 * @param {string} code - 代码内容
 * @returns {Array} 计算逻辑列表
 */
function extractCalculations(code) {
  const calculations = [];

  const patterns = [
    // BigDecimal运算
    { regex: /BigDecimal\.valueOf|\.add\(|\.subtract\(|\.multiply\(|\.divide\(|\.setScale\(/g, type: 'bigdecimal' },
    // 日期计算
    { regex: /DateUtils\.(add|subtract|difference|parse|format)/g, type: 'date_calc' },
    { regex: /LocalDate\.(plus|minus|now)|LocalDateTime\.(plus|minus|now)/g, type: 'localdate_calc' },
    { regex: /Calendar\.(add|get|set)|Instant\.(plus|minus)/g, type: 'calendar_calc' },
    // 聚合计算
    { regex: /stream\(\)\.map.*\.reduce.*sum|\.collect.*summing|\.collect.*averaging/gs, type: 'stream_reduce' },
    // 统计计算
    { regex: /Count|Sum|Average|Max|Min|Total|calculate|compute/gi, type: 'statistical' },
    // 数学运算
    { regex: /Math\.(abs|round|floor|ceil|pow|sqrt|min|max)/g, type: 'math_func' },
    // 百分比计算
    { regex: /\*\s*100\s*\/|\(\s*\w+\s*\/\s*\w+\s*\)\s*\*\s*100/g, type: 'percentage' }
  ];

  patterns.forEach(({ regex, type }) => {
    const matches = code.matchAll(regex);
    for (const match of matches) {
      const context = extractContext(code, match.index);
      calculations.push({
        type: type,
        expression: match[0],
        context: context
      });
    }
  });

  return calculations;
}

/**
 * 提取数据操作
 * 识别数据库查询、数据访问层调用等
 * @param {string} code - 代码内容
 * @returns {Array} 数据操作列表
 */
function extractDataOperations(code) {
  const operations = [];

  const patterns = [
    // MyBatis Mapper
    { regex: /(\w+)Mapper\.(\w+)\(/g, type: 'mybatis_query' },
    // JPA Repository
    { regex: /(\w+)Repository\.(\w+)\(/g, type: 'jpa_query' },
    // DAO层
    { regex: /(\w+)Dao\.(\w+)\(/g, type: 'dao_query' },
    // Service层方法
    { regex: /(\w+)Service\.(\w+)\(/g, type: 'service_call' },
    // SQL语句
    { regex: /SELECT\s+.*?\s+FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM/gi, type: 'sql_dml' },
    // 数据库连接
    { regex: /Connection|PreparedStatement|Statement|ResultSet/g, type: 'jdbc_operation' },
    // ORM操作
    { regex: /\.save\(|\.delete\(|\.update\(|\.findById\(|\.findAll\(\)/g, type: 'orm_operation' },
    // 缓存操作
    { regex: /redis|cache|put\(|get\(|evict\(/gi, type: 'cache_operation' }
  ];

  patterns.forEach(({ regex, type }) => {
    const matches = code.matchAll(regex);
    for (const match of matches) {
      const context = extractContext(code, match.index);
      operations.push({
        type: type,
        method: match[2] || match[0],
        entity: match[1] || null,
        context: context
      });
    }
  });

  return operations;
}

/**
 * 提取异常处理
 * 识别try-catch块、异常处理器等
 * @param {string} code - 代码内容
 * @returns {Array} 异常处理列表
 */
function extractExceptionHandling(code) {
  const handlers = [];

  const patterns = [
    // try-catch块
    { regex: /catch\s*\(\s*(\w+(?:\s*\|\s*\w+)*)\s+(\w+)\s*\)/g, type: 'try_catch' },
    // Spring异常处理器
    { regex: /@ExceptionHandler/g, type: 'exception_handler' },
    // try块检测
    { regex: /try\s*\{[\s\S]*?\}\s*catch/g, type: 'try_block' },
    // finally块
    { regex: /finally\s*\{/g, type: 'finally_block' },
    // 抛出异常
    { regex: /throw\s+new\s+\w+Exception/g, type: 'throw_statement' },
    // 方法签名throws
    { regex: /throws\s+(\w+(?:\s*,\s*\w+)*)/g, type: 'throws_clause' },
    // 自定义异常
    { regex: /extends\s+\w+Exception|class\s+\w+Exception/g, type: 'custom_exception' }
  ];

  patterns.forEach(({ regex, type }) => {
    const matches = code.matchAll(regex);
    for (const match of matches) {
      const context = extractContext(code, match.index);
      handlers.push({
        type: type,
        exception: match[1] || match[0],
        context: context
      });
    }
  });

  return handlers;
}

/**
 * 提取代码上下文
 * 获取匹配位置前后的代码行，便于理解代码逻辑
 * @param {string} code - 完整代码
 * @param {number} matchIndex - 匹配位置索引
 * @param {number} linesBefore - 前置行数
 * @param {number} linesAfter - 后置行数
 * @returns {string} 上下文代码片段
 */
function extractContext(code, matchIndex, linesBefore = 2, linesAfter = 2) {
  const beforeMatch = code.substring(0, matchIndex);
  const lineNum = beforeMatch.split('\n').length - 1;

  const lines = code.split('\n');
  const start = Math.max(0, lineNum - linesBefore);
  const end = Math.min(lines.length, lineNum + linesAfter + 1);

  return lines.slice(start, end).join('\n');
}

/**
 * 从上下文中提取目标字段
 * 通过多种模式匹配提取被操作的字段名
 * @param {string} context - 代码上下文
 * @returns {string|null} 目标字段名
 */
function extractTarget(context) {
  const patterns = [
    // 字符串中的字段名
    /['"](\w+)['"]/,
    // 注解中的字段名
    /@Assert\((\w+)/,
    // 条件中的变量名
    /if\s*\((\w+)\s*==/,
    // null检查的变量名
    /(\w+)\s*!=\s*null/,
    // 方法调用参数
    /(?:requireNonNull|notNull|notEmpty)\(\s*(\w+)/,
    // 验证注解参数
    /@(?:NotNull|NotEmpty|NotBlank)\((?:message\s*=\s*['"][^'"]*['"])?,?\s*(?:groups|payload)\s*=\s*\{\s*(\w+)/
  ];

  for (const pattern of patterns) {
    const match = context.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * 批量提取多个文件的业务逻辑
 * @param {Array} files - 文件路径列表
 * @param {string} repoPath - 仓库路径
 * @param {string} ref - Git引用
 * @returns {Object} 合并的业务逻辑要素
 */
export async function extractFromFiles(files, repoPath, ref = 'HEAD') {
  const logic = {
    validationRules: [],
    stateTransitions: [],
    calculations: [],
    dataOperations: [],
    exceptionHandling: []
  };

  for (const file of files) {
    const content = extractFromFile(file, repoPath, ref);
    if (!content) continue;

    logic.validationRules.push(...extractValidations(content));
    logic.stateTransitions.push(...extractStateTransitions(content));
    logic.calculations.push(...extractCalculations(content));
    logic.dataOperations.push(...extractDataOperations(content));
    logic.exceptionHandling.push(...extractExceptionHandling(content));
  }

  return logic;
}

/**
 * 统计业务逻辑要素的数量
 * @param {Object} logic - 业务逻辑对象
 * @returns {Object} 统计结果
 */
export function summarizeLogic(logic) {
  return {
    validations: logic.validationRules?.length || 0,
    stateTransitions: logic.stateTransitions?.length || 0,
    calculations: logic.calculations?.length || 0,
    dataOperations: logic.dataOperations?.length || 0,
    exceptionHandling: logic.exceptionHandling?.length || 0,
    total: (logic.validationRules?.length || 0) +
           (logic.stateTransitions?.length || 0) +
           (logic.calculations?.length || 0) +
           (logic.dataOperations?.length || 0) +
           (logic.exceptionHandling?.length || 0)
  };
}
