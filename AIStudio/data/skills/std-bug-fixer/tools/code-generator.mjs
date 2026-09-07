#!/usr/bin/env node
/**
 * Code Generator
 * AI 代码生成器 - 使用 Claude AI 生成修复代码
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 编程语言配置
 */
const LANGUAGE_CONFIG = {
  java: {
    extensions: ['.java'],
    comment: '//',
    keywords: ['class', 'public', 'private', 'protected', 'static', 'void', 'return', 'if', 'else', 'for', 'while'],
    templates: {
      nullPointer: `// 修复空指针异常
// 问题：对象在使用前未进行空值检查

// ❌ 原始代码（可能存在问题）
public void processUser(User user) {
    String name = user.getName();  // 如果 user 为 null 则抛出 NPE
    System.out.println(name);
}

// ✅ 修复后代码
public void processUser(User user) {
    // 添加空值检查
    if (user == null) {
        throw new IllegalArgumentException("User cannot be null");
    }
    String name = user.getName();
    System.out.println(name);
}

// 或者使用 Optional（Java 8+）
public void processUser(User user) {
    String name = Optional.ofNullable(user)
        .map(User::getName)
        .orElse("Unknown");
    System.out.println(name);
}`,

      sqlInjection: `// 修复 SQL 注入漏洞
// 问题：直接拼接 SQL 字符串

// ❌ 原始代码（存在 SQL 注入风险）
public User getUser(String username) {
    String sql = "SELECT * FROM users WHERE username = '" + username + "'";
    return jdbcTemplate.queryForObject(sql, userRowMapper);
}

// ✅ 修复后代码：使用参数化查询
public User getUser(String username) {
    String sql = "SELECT * FROM users WHERE username = ?";
    return jdbcTemplate.queryForObject(sql, userRowMapper, username);
}

// ✅ 或者使用 PreparedStatement
public User getUser(String username) throws SQLException {
    String sql = "SELECT * FROM users WHERE username = ?";
    try (PreparedStatement stmt = connection.prepareStatement(sql)) {
        stmt.setString(1, username);
        ResultSet rs = stmt.executeQuery();
        // ... 处理结果
    }
}`,

      indexOutOfBounds: `// 修复数组越界异常
// 问题：访问数组/列表前未检查索引

// ❌ 原始代码
public String getItem(List<String> items, int index) {
    return items.get(index);  // 可能抛出 IndexOutOfBoundsException
}

// ✅ 修复后代码
public String getItem(List<String> items, int index) {
    if (items == null || items.isEmpty()) {
        throw new IllegalArgumentException("Items list is null or empty");
    }
    if (index < 0 || index >= items.size()) {
        throw new IndexOutOfBoundsException(
            "Index " + index + " out of bounds for size " + items.size()
        );
    }
    return items.get(index);
}

// ✅ 或者使用 Optional 返回
public Optional<String> getItem(List<String> items, int index) {
    if (items != null && index >= 0 && index < items.size()) {
        return Optional.of(items.get(index));
    }
    return Optional.empty();
}`,

      uiDisplay: `// 修复 UI 显示问题
// 问题：数据为空时页面空白或显示错误

// ❌ 原始代码
<template>
  <div v-for="item in items" :key="item.id">
    {{ item.name }}
  </div>
</template>

// ✅ 修复后代码：添加空状态处理
<template>
  <!-- 空状态 -->
  <div v-if="!items || items.length === 0" class="empty-state">
    <p>暂无数据</p>
  </div>

  <!-- 加载状态 -->
  <div v-else-if="loading" class="loading-state">
    <p>加载中...</p>
  </div>

  <!-- 错误状态 -->
  <div v-else-if="error" class="error-state">
    <p>加载失败：{{ error }}</p>
  </div>

  <!-- 正常显示 -->
  <div v-else>
    <div v-for="item in items" :key="item.id" class="item">
      {{ item.name }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [],
      loading: false,
      error: null
    }
  },
  async mounted() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      this.loading = true;
      this.error = null;
      try {
        this.items = await fetchItems();
      } catch (e) {
        this.error = e.message;
        console.error('Failed to load items:', e);
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.empty-state, .loading-state, .error-state {
  padding: 20px;
  text-align: center;
  color: #666;
}

.error-state {
  color: #f56c6c;
}
</style>`
    }
  },

  javascript: {
    extensions: ['.js'],
    comment: '//',
    keywords: ['const', 'let', 'var', 'function', 'class', 'async', 'await', 'return', 'if', 'else'],
    templates: {
      nullPointer: `// 修复空指针异常
// 问题：对象在使用前未进行空值检查

// ❌ 原始代码
function getUserName(user) {
    return user.name;  // 如果 user 为 null/undefined 则报错
}

// ✅ 修复后代码
function getUserName(user) {
    if (!user) {
        throw new Error('User is required');
    }
    return user.name;
}

// ✅ 或者使用可选链（ES2020+）
function getUserName(user) {
    return user?.name ?? 'Unknown';
}

// ✅ 或者使用默认值
function getUserName(user = {}) {
    return user.name || 'Unknown';
}`,

      asyncError: `// 修复异步错误处理
// 问题：未正确处理 Promise 错误

// ❌ 原始代码
async function fetchData() {
    const response = await fetch(url);  // 可能失败
    const data = await response.json();
    return data;
}

// ✅ 修复后代码：添加 try-catch
async function fetchData() {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(\`HTTP error! status: \${response.status}\`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch data:', error);
        throw error;  // 重新抛出让调用者处理
    }
}

// ✅ 使用 .catch() 处理
async function fetchData() {
    const response = await fetch(url).catch(err => {
        console.error('Network error:', err);
        throw err;
    });
    // ... 处理响应
}`
    }
  },

  typescript: {
    extensions: ['.ts'],
    comment: '//',
    keywords: ['interface', 'type', 'enum', 'const', 'let', 'function', 'class', 'async', 'await'],
    templates: {
      typeSafety: `// 使用 TypeScript 增强类型安全

// ❌ 原始代码（类型不安全）
function processUser(user: any) {
    return user.name + ' - ' + user.email;
}

// ✅ 修复后代码：定义类型
interface User {
    id: number;
    name: string;
    email: string;
    age?: number;  // 可选属性
}

function processUser(user: User): string {
    if (!user.name || !user.email) {
        throw new Error('Invalid user: missing required fields');
    }
    return \`\${user.name} - \${user.email}\`;
}

// ✅ 使用泛型增强类型安全性
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

async function fetchUser(id: number): Promise<ApiResponse<User>> {
    try {
        const response = await fetch(\`/api/users/\${id}\`);
        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}`
    }
  },

  vue: {
    extensions: ['.vue'],
    comment: '//',
    keywords: ['template', 'script', 'style', 'data', 'methods', 'computed', 'watch'],
    templates: {
      reactiveData: `// 修复 Vue 响应式数据问题
// 问题：直接修改数组/对象不触发更新

// ❌ 原始代码
export default {
  methods: {
    addItem(item) {
      this.items[this.items.length] = item;  // 不会触发视图更新
    },
    updateItem(index, value) {
      this.items[index] = value;  // 不会触发视图更新
    }
  }
}

// ✅ 修复后代码
export default {
  methods: {
    addItem(item) {
      // 使用 Vue.set 或数组方法
      this.$set(this.items, this.items.length, item);
      // 或
      this.items.push(item);
    },
    updateItem(index, value) {
      // 使用 Vue.set
      this.$set(this.items, index, value);
      // 或使用展开运算符（Vue 3）
      this.items = [...this.items.slice(0, index), value, ...this.items.slice(index + 1)];
    }
  }
}`
    }
  },

  python: {
    extensions: ['.py'],
    comment: '#',
    keywords: ['def', 'class', 'if', 'else', 'for', 'while', 'return', 'import', 'from'],
    templates: {
      nullPointer: `# 修复空指针异常（NoneType）
# 问题：未检查 None 值

# ❌ 原始代码
def get_user_name(user):
    return user['name']  # 如果 user 为 None 则报错

# ✅ 修复后代码
def get_user_name(user):
    if user is None:
        raise ValueError('User cannot be None')
    return user.get('name', 'Unknown')

# ✅ 使用类型注解和 Optional
from typing import Optional, Dict

def get_user_name(user: Optional[Dict]) -> str:
    if not user:
        return 'Unknown'
    return user.get('name') or 'Unknown'`,

      sqlInjection: `# 修复 SQL 注入漏洞
# 问题：直接拼接 SQL 字符串

# ❌ 原始代码（存在 SQL 注入风险）
def get_user(username):
    sql = f"SELECT * FROM users WHERE username = '{username}'"
    return cursor.execute(sql).fetchall()

# ✅ 修复后代码：使用参数化查询
def get_user(username):
    sql = "SELECT * FROM users WHERE username = ?"
    cursor.execute(sql, (username,))
    return cursor.fetchall()

# ✅ 使用 SQLAlchemy ORM
def get_user(username: str):
    return session.query(User).filter(User.username == username).first()`
    }
  },

  go: {
    extensions: ['.go'],
    comment: '//',
    keywords: ['package', 'import', 'func', 'type', 'struct', 'interface', 'return', 'if', 'else', 'for'],
    templates: {
      errorHandling: `// 修复错误处理
// 问题：忽略错误返回值

// ❌ 原始代码
func processFile(filename string) string {
    data, _ := ioutil.ReadFile(filename)  // 忽略错误
    return string(data)
}

// ✅ 修复后代码：正确处理错误
func processFile(filename string) (string, error) {
    data, err := ioutil.ReadFile(filename)
    if err != nil {
        return "", fmt.Errorf("failed to read file %s: %w", filename, err)
    }
    return string(data), nil
}

// ✅ 使用自定义错误类型
type FileProcessingError struct {
    Filename string
    Err      error
}

func (e *FileProcessingError) Error() string {
    return fmt.Sprintf("failed to process file %s: %v", e.Filename, e.Err)
}

func (e *FileProcessingError) Unwrap() error {
    return e.Err
}`
    }
  },

  sql: {
    extensions: ['.sql'],
    comment: '--',
    keywords: ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP'],
    templates: {
      performance: `-- 修复 SQL 性能问题
-- 问题：缺少索引导致查询慢

-- ❌ 原始查询（全表扫描）
SELECT * FROM orders
WHERE user_id = 123
  AND status = 'pending'
  AND created_at >= '2024-01-01';

-- ✅ 添加索引优化
CREATE INDEX idx_orders_user_status_date
ON orders(user_id, status, created_at);

-- ✅ 优化查询（只查询需要的列）
SELECT id, amount, created_at
FROM orders
WHERE user_id = 123
  AND status = 'pending'
  AND created_at >= '2024-01-01'
LIMIT 100;

-- ✅ 使用 EXPLAIN 分析查询
EXPLAIN SELECT * FROM orders WHERE user_id = 123;`
    }
  }
};

/**
 * 代码生成器类
 */
class CodeGenerator {
  constructor(options = {}) {
    this.aiClient = options.aiClient || null;
    this.config = options.config || {};
    this.model = options.model || 'claude-opus-4-6';
    this.maxTokens = options.maxTokens || 4000;
    this.temperature = options.temperature || 0.2;
  }

  /**
   * 生成修复代码
   * @param {object} context - 上下文信息
   * @param {string} language - 编程语言
   * @returns {Promise<object>} 修复方案
   */
  async generateFix(context, language) {
    const { bug, analysis, fileInfo, codeContext } = context;

    // 1. 尝试使用模板生成
    const templateFix = this._generateFromTemplate(bug, analysis, language);
    if (templateFix) {
      return {
        filePath: fileInfo.path,
        language,
        bugId: bug.id,
        originalCode: templateFix.originalCode,
        modifiedCode: templateFix.modifiedCode,
        newCode: templateFix.newCode,
        description: templateFix.description,
        changes: templateFix.changes,
        generatedBy: 'template'
      };
    }

    // 2. 使用 AI 生成
    if (this.aiClient) {
      return await this._generateWithAI(context, language);
    }

    // 3. 返回基础修复方案
    return this._generateBasicFix(context, language);
  }

  /**
   * 从模板生成修复
   */
  _generateFromTemplate(bug, analysis, language) {
    const langConfig = LANGUAGE_CONFIG[language];
    if (!langConfig) return null;

    const bugType = analysis.category || analysis.type;
    const template = langConfig.templates[bugType];

    if (!template) {
      // 检查更通用的模板
      const genericType = this._getGenericBugType(analysis);
      return langConfig.templates[genericType] ? {
        originalCode: this._extractOriginalFromTemplate(template),
        modifiedCode: template,
        newCode: template,
        description: `基于${bugType}类型的标准修复模板`,
        changes: [`应用${bugType}标准修复模式`]
      } : null;
    }

    return {
      originalCode: this._extractOriginalFromTemplate(template),
      modifiedCode: template,
      newCode: template,
      description: `基于${bugType}类型的标准修复模板`,
      changes: [`应用${bugType}标准修复模式`]
    };
  }

  /**
   * 使用 AI 生成修复
   */
  async _generateWithAI(context, language) {
    const prompt = this._buildPrompt(context, language);

    try {
      const response = await this._callAI(prompt);
      return this._parseAIResponse(response, context, language);
    } catch (error) {
      console.error(`AI生成失败: ${error.message}`);
      return this._generateBasicFix(context, language);
    }
  }

  /**
   * 构建提示词
   */
  _buildPrompt(context, language) {
    const { bug, analysis, fileInfo, codeContext } = context;

    return `你是一个专业的代码修复助手。请根据以下Bug信息生成修复代码。

## Bug信息
- ID: ${bug.id}
- 标题: ${bug.title}
- 描述: ${bug.description || '无'}

## 分析结果
- 类型: ${analysis.category}
- 严重程度: ${analysis.severity}
- 风险等级: ${analysis.riskLevel}

## 文件信息
- 路径: ${fileInfo.path}
- 语言: ${language}

${codeContext ? `
## 当前代码
\`\`\`${language}
${codeContext}
\`\`\`
` : ''}

## 要求
1. 分析问题原因
2. 提供修复后的代码
3. 说明修改内容
4. 确保修复符合${language}最佳实践
5. 添加必要的错误处理和边界检查

请按以下格式回复：
\`\`\`${language}
// 修复后的代码
...
\`\`\`

**修改说明**：
- ...

**修复原因**：
- ...`;
  }

  /**
   * 调用 AI API
   */
  async _callAI(prompt) {
    // 这里应该调用实际的 AI API
    // 暂时返回模拟响应
    return {
      choices: [{
        message: {
          content: `// AI生成的修复代码\n// （需要集成实际的AI API）`
        }
      }]
    };
  }

  /**
   * 解析 AI 响应
   */
  _parseAIResponse(response, context, language) {
    const content = response.choices?.[0]?.message?.content || '';
    const codeMatch = content.match(/```[\w]*\n([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1] : content;

    return {
      filePath: context.fileInfo.path,
      language,
      bugId: context.bug.id,
      originalCode: context.codeContext || '',
      modifiedCode: code,
      newCode: code,
      description: 'AI生成的修复代码',
      changes: ['AI自动生成的修复'],
      generatedBy: 'ai'
    };
  }

  /**
   * 生成基础修复方案
   */
  _generateBasicFix(context, language) {
    const { bug, analysis, fileInfo } = context;

    return {
      filePath: fileInfo.path,
      language,
      bugId: bug.id,
      originalCode: '// 待生成',
      modifiedCode: '// 需要人工审核并生成修复代码',
      newCode: '// 需要人工审核并生成修复代码',
      description: `需要人工审核：${analysis.category}类型的Bug`,
      changes: [],
      generatedBy: 'manual',
      requiresManualReview: true
    };
  }

  /**
   * 从模板中提取原始代码
   */
  _extractOriginalFromTemplate(template) {
    const parts = template.split(/✅|修复后/);
    return parts[0] || '';
  }

  /**
   * 获取通用Bug类型
   */
  _getGenericBugType(analysis) {
    const type = analysis.category?.toLowerCase() || '';
    const typeMap = {
      'null': 'nullPointer',
      'sql': 'sqlInjection',
      'xss': 'xss',
      'index': 'indexOutOfBounds',
      'ui': 'uiDisplay',
      'async': 'asyncError',
      'type': 'typeSafety',
      'reactive': 'reactiveData'
    };

    for (const [key, value] of Object.entries(typeMap)) {
      if (type.includes(key)) {
        return value;
      }
    }

    return 'nullPointer'; // 默认
  }

  /**
   * 验证生成的代码
   */
  validateGeneratedCode(code, language) {
    const errors = [];

    // 检查是否为空
    if (!code || code.trim().length === 0) {
      errors.push('生成的代码为空');
    }

    // 检查基本语法
    const langConfig = LANGUAGE_CONFIG[language];
    if (langConfig) {
      // 检查是否有基本的代码结构
      const hasCodeStructure = langConfig.keywords.some(keyword =>
        code.includes(keyword)
      );

      if (!hasCodeStructure && code.length > 100) {
        errors.push(`代码可能缺少${language}的基本语法结构`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 获取支持的语言列表
   */
  static getSupportedLanguages() {
    return Object.keys(LANGUAGE_CONFIG);
  }

  /**
   * 检测文件语言
   */
  static detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    for (const [lang, config] of Object.entries(LANGUAGE_CONFIG)) {
      if (config.extensions.includes(ext)) {
        return lang;
      }
    }
    return 'text';
  }
}

/**
 * 创建代码生成器实例
 */
function createCodeGenerator(options) {
  return new CodeGenerator(options);
}

export {
  CodeGenerator,
  createCodeGenerator,
  LANGUAGE_CONFIG
};

export default CodeGenerator;
