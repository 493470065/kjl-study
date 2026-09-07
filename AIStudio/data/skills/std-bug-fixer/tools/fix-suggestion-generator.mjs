#!/usr/bin/env node
/**
 * Fix Suggestion Generator
 * 基于Bug类型和代码内容生成智能修复建议
 */

import { CodeSearcher } from './code-searcher.mjs';

/**
 * Bug类型分类
 */
const BUG_TYPES = {
  NULL_POINTER: {
    name: '空指针异常',
    severity: 'HIGH',
    keywords: ['NullPointerException', 'null pointer', 'Cannot read property', 'undefined', 'null'],
    patterns: [/NullPointerException/i, /Cannot read props? of null/i, /undefined is not an object/i]
  },
  INDEX_OUT_OF_BOUNDS: {
    name: '数组越界',
    severity: 'HIGH',
    keywords: ['IndexOutOfBounds', 'ArrayIndex', 'out of bounds', 'range error'],
    patterns: [/IndexOutOfBounds/i, /ArrayIndexOutOfBounds/i, /out of bounds/i]
  },
  SQL_INJECTION: {
    name: 'SQL注入',
    severity: 'CRITICAL',
    keywords: ['SQL injection', 'SQL syntax', 'ORA-01756', 'MySQL syntax'],
    patterns: [/SQL injection/i, /SQL syntax/i, /quoted string not properly terminated/i]
  },
  XSS_VULNERABILITY: {
    name: 'XSS跨站脚本',
    severity: 'CRITICAL',
    keywords: ['XSS', 'cross-site scripting', 'script injection'],
    patterns: [/XSS/i, /cross-site scripting/i, /<script/i]
  },
  CONCURRENCY: {
    name: '并发问题',
    severity: 'HIGH',
    keywords: ['ConcurrentModification', 'race condition', 'deadlock', 'thread'],
    patterns: [/ConcurrentModification/i, /race condition/i, /deadlock/i]
  },
  RESOURCE_LEAK: {
    name: '资源泄漏',
    severity: 'HIGH',
    keywords: ['resource leak', 'file not closed', 'connection leak', 'stream not closed'],
    patterns: [/resource leak/i, /not closed/i, /Connection.*leak/i]
  },
  TYPE_CONVERSION: {
    name: '类型转换错误',
    severity: 'MEDIUM',
    keywords: ['ClassCastException', 'type conversion', 'cannot convert'],
    patterns: [/ClassCastException/i, /cannot convert/i, /type mismatch/i]
  },
  PERFORMANCE: {
    name: '性能问题',
    severity: 'MEDIUM',
    keywords: ['slow', 'timeout', 'performance', 'optimize', 'inefficient'],
    patterns: [/timeout/i, /slow query/i, /performance/i]
  },
  UI_DISPLAY: {
    name: 'UI显示问题',
    severity: 'MEDIUM',
    keywords: ['显示', '页面', '空白', '布局', '样式', '不显示'],
    patterns: [/空白/i, /不显示/i, /布局/i, /样式/i]
  },
  DATA_INCONSISTENCY: {
    name: '数据不一致',
    severity: 'MEDIUM',
    keywords: ['数据不一致', '数据错误', '保存失败', '同步失败'],
    patterns: [/数据不一致/i, /保存失败/i, /同步失败/i]
  }
};

/**
 * FixSuggestionGenerator 类
 */
class FixSuggestionGenerator {
  constructor(options = {}) {
    this.codeSearcher = options.codeSearcher || new CodeSearcher();
    this.suggestionTemplates = this._initTemplates();
  }

  /**
   * 分类Bug类型
   */
  classifyBug(bug) {
    const text = [
      bug.title || '',
      bug.description || '',
      bug.stackTrace || ''
    ].join('\n').toLowerCase();

    const matchedTypes = [];

    for (const [type, config] of Object.entries(BUG_TYPES)) {
      // 检查关键词
      for (const keyword of config.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          matchedTypes.push({ type, score: 10, reason: `关键词匹配: ${keyword}` });
          break;
        }
      }

      // 检查正则模式
      for (const pattern of config.patterns) {
        if (pattern.test(text)) {
          matchedTypes.push({ type, score: 8, reason: `模式匹配` });
        }
      }
    }

    // 按分数排序
    matchedTypes.sort((a, b) => b.score - a.score);

    return matchedTypes.length > 0 ? matchedTypes[0].type : 'OTHER';
  }

  /**
   * 生成修复建议
   */
  async generateFixSuggestion(bug, repository, codeContext = null) {
    const bugType = this.classifyBug(bug);
    const template = this.suggestionTemplates[bugType];

    if (!template) {
      return this._generateGenericSuggestion(bug);
    }

    const suggestion = {
      bugType,
      bugTypeName: BUG_TYPES[bugType]?.name || bugType,
      severity: BUG_TYPES[bugType]?.severity || 'MEDIUM',
      summary: template.summary(bug),
      causes: template.causes(bug),
      solutions: template.solutions(bug),
      codeExamples: [],
      testing: template.testing,
      prevention: template.prevention
    };

    // 如果模板有代码示例生成器，总是生成代码示例
    // 对于 TFS Git 仓库，可能没有代码上下文，但仍然应该显示通用示例
    if (template.generateCodeExample) {
      suggestion.codeExamples = await template.generateCodeExample(bug, codeContext, repository);
    }

    return suggestion;
  }

  /**
   * 初始化修复模板
   */
  _initTemplates() {
    return {
      NULL_POINTER: {
        summary: (bug) => '检测到空指针异常，可能是在使用对象前未进行空值检查',
        causes: (bug) => [
          '对象引用未初始化',
          '方法返回了null值但未检查',
          '集合或数组为空但未判断',
          '可选参数未提供默认值'
        ],
        solutions: (bug) => [
          '在使用对象前进行空值检查（Objects.requireNonNull 或 if 判断）',
          '使用 Optional 类包装可能为null的返回值',
          '为参数提供合理的默认值',
          '使用 @Nullable 和 @NonNull 注解标记参数'
        ],
        generateCodeExample: async (bug, context, repo) => {
          const examples = [];

          // 问题代码示例
          examples.push({
            title: '问题代码',
            code: `public void processUser(User user) {
    // ❌ 没有空值检查
    String name = user.getName();  // 可能抛出 NPE
    System.out.println(name.length());
}`
          });

          // 修复代码示例
          examples.push({
            title: '修复方案1：显式空值检查',
            code: `public void processUser(User user) {
    // ✅ 添加空值检查
    if (user == null) {
        throw new IllegalArgumentException("用户不能为空");
    }
    String name = user.getName();
    if (name == null || name.isEmpty()) {
        return;  // 或设置默认值
    }
    System.out.println(name.length());
}`
          });

          examples.push({
            title: '修复方案2：使用 Optional',
            code: `public void processUser(User user) {
    // ✅ 使用 Optional
    String name = Optional.ofNullable(user)
        .map(User::getName)
        .filter(n -> !n.isEmpty())
        .orElse("匿名用户");

    System.out.println(name.length());
}`
          });

          return examples;
        },
        testing: [
          '测试对象为null的场景',
          '测试对象属性为null的场景',
          '测试空字符串的场景',
          '验证异常消息的准确性'
        ],
        prevention: [
          '使用IDE的空值分析注解',
          '启用SonarQube等代码质量检测工具',
          '编写单元测试覆盖空值场景',
          '代码审查时重点关注空值处理'
        ]
      },

      SQL_INJECTION: {
        summary: (bug) => '检测到SQL注入漏洞，用户输入未正确过滤直接拼接SQL语句',
        causes: (bug) => [
          '使用字符串拼接构建SQL语句',
          '未对用户输入进行参数化处理',
          '动态SQL未使用预编译语句'
        ],
        solutions: (bug) => [
          '使用预编译语句（PreparedStatement）',
          '使用ORM框架（如MyBatis、Hibernate）',
          '对用户输入进行白名单验证',
          '使用存储过程并参数化'
        ],
        generateCodeExample: async (bug, context, repo) => {
          return [
            {
              title: '问题代码',
              code: `// ❌ SQL注入漏洞
public User login(String username, String password) {
    String sql = "SELECT * FROM users WHERE username='" +
                 username + "' AND password='" + password + "'";
    return jdbcTemplate.queryForObject(sql, User.class);
}`
            },
            {
              title: '修复方案：使用预编译语句',
              code: `// ✅ 使用参数化查询
public User login(String username, String password) {
    String sql = "SELECT * FROM users WHERE username=? AND password=?";
    return jdbcTemplate.queryForObject(
        sql,
        new Object[]{username, password},
        User.class
    );
}`
            },
            {
              title: '修复方案：使用命名参数',
              code: `// ✅ 使用命名参数（推荐）
public User login(String username, String password) {
    String sql = "SELECT * FROM users WHERE username=:username " +
                 "AND password=:password";
    MapSqlParameterSource params = new MapSqlParameterSource()
        .addValue("username", username)
        .addValue("password", password);

    return namedParameterJdbcTemplate.queryForObject(
        sql,
        params,
        User.class
    );
}`
            }
          ];
        },
        testing: [
          '测试包含单引号的输入',
          '测试SQL注释符（--）',
          '测试UNION查询注入',
          '验证所有输入都经过参数化处理'
        ],
        prevention: [
          '强制使用预编译语句',
          '配置SQL注入检测规则',
          '定期使用安全扫描工具检测',
          '代码审查时检查所有SQL构建代码'
        ]
      },

      XSS_VULNERABILITY: {
        summary: (bug) => '检测到XSS跨站脚本漏洞，用户输出未进行HTML转义',
        causes: (bug) => [
          '直接输出用户输入到HTML页面',
          '未对特殊字符进行HTML转义',
          '使用dangerouslySetInnerHTML等不安全API'
        ],
        solutions: (bug) => [
          '使用模板引擎的自动转义功能',
          '对用户输入进行HTML实体编码',
          '设置Content-Security-Policy响应头',
          '使用DOMPurify等库过滤HTML'
        ],
        generateCodeExample: async (bug, context, repo) => {
          return [
            {
              title: '问题代码（Vue/JavaScript）',
              code: `<!-- ❌ XSS漏洞 -->
<template>
  <div v-html="userInput"></div>
</template>

<script>
export default {
  data() {
    return {
      userInput: ''  // 直接渲染用户输入
    }
  }
}
</script>`
            },
            {
              title: '修复方案1：使用文本插值（自动转义）',
              code: `<!-- ✅ 使用文本插值，Vue自动转义 -->
<template>
  <div>{{ userInput }}</div>
</template>`
            },
            {
              title: '修复方案2：使用DOMPurify过滤',
              code: `<!-- ✅ 使用DOMPurify过滤HTML -->
<template>
  <div v-html="sanitizedInput"></div>
</template>

<script>
import DOMPurify from 'dompurify';

export default {
  computed: {
    sanitizedInput() {
      return DOMPurify.sanitize(this.userInput);
    }
  }
}
</script>`
            }
          ];
        },
        testing: [
          '测试包含<script>标签的输入',
          '测试包含事件处理器的输入',
          '测试包含HTML实体编码的输入',
          '验证CSP策略是否正确配置'
        ],
        prevention: [
          '默认使用模板引擎的自动转义',
          '禁用v-html等不安全指令',
          '配置CSP策略限制脚本来源',
          '使用XSS过滤器中间件'
        ]
      },

      INDEX_OUT_OF_BOUNDS: {
        summary: (bug) => '检测到数组/列表越界异常，访问了超出范围的索引',
        causes: (bug) => [
          '索引计算错误',
          '未检查集合大小',
          '循环条件设置不当',
          '并发修改导致索引失效'
        ],
        solutions: (bug) => [
          '在访问前检查索引范围',
          '使用for-each循环代替索引访问',
          '使用边界安全的API（如getOrDefault）',
          '使用try-catch捕获异常'
        ],
        generateCodeExample: async (bug, context, repo) => {
          return [
            {
              title: '问题代码',
              code: `// ❌ 数组越界
public String getFirstItem(List<String> list) {
    return list.get(0);  // 空列表会抛出异常
}

public String getLastItem(List<String> list) {
    return list.get(list.size());  // 索引越界
}`
            },
            {
              title: '修复方案',
              code: `// ✅ 边界检查
public String getFirstItem(List<String> list) {
    if (list == null || list.isEmpty()) {
        return null;  // 或抛出有意义的异常
    }
    return list.get(0);
}

public String getLastItem(List<String> list) {
    if (list == null || list.isEmpty()) {
        return null;
    }
    return list.get(list.size() - 1);
}

// 或者使用 Optional
public Optional<String> findFirst(List<String> list) {
    return Optional.ofNullable(list)
        .filter(l -> !l.isEmpty())
        .map(l -> l.get(0));
}`
            }
          ];
        },
        testing: [
          '测试空集合',
          '测试单元素集合',
          '测试边界值（index=0和index=size-1）',
          '测试负数索引'
        ],
        prevention: [
          '使用增强for循环',
          '使用Stream API代替传统循环',
          '配置静态分析工具检测潜在越界'
        ]
      },

      RESOURCE_LEAK: {
        summary: (bug) => '检测到资源泄漏，文件、数据库连接等资源未正确关闭',
        causes: (bug) => [
          '文件流、数据库连接等未调用close()',
          '异常发生时资源未释放',
          '未使用try-with-resources语句'
        ],
        solutions: (bug) => [
          '使用try-with-resources自动关闭资源',
          '在finally块中关闭资源',
          '使用连接池管理数据库连接',
          '使用RAII模式的工具类'
        ],
        generateCodeExample: async (bug, context, repo) => {
          return [
            {
              title: '问题代码',
              code: `// ❌ 资源泄漏
public void readFile(String path) throws IOException {
    FileInputStream fis = new FileInputStream(path);
    // 如果这里抛出异常，流不会被关闭
    byte[] data = new byte[fis.available()];
    fis.read(data);
    fis.close();
}`
            },
            {
              title: '修复方案：try-with-resources',
              code: `// ✅ 使用 try-with-resources
public void readFile(String path) throws IOException {
    try (FileInputStream fis = new FileInputStream(path)) {
        byte[] data = new byte[fis.available()];
        fis.read(data);
    }  // 自动关闭，即使发生异常
}`
            },
            {
              title: '修复方案：传统方式',
              code: `// ✅ 手动关闭（try-finally）
public void readFile(String path) throws IOException {
    FileInputStream fis = null;
    try {
        fis = new FileInputStream(path);
        byte[] data = new byte[fis.available()];
        fis.read(data);
    } finally {
        if (fis != null) {
            try {
                fis.close();
            } catch (IOException e) {
                // 忽略关闭异常
            }
        }
    }
}`
            }
          ];
        },
        testing: [
          '测试正常关闭场景',
          '测试异常发生时的资源释放',
          '使用资源监控工具检测泄漏',
          '验证连接池的正常运行'
        ],
        prevention: [
          '强制使用try-with-resources',
          '配置SonarQube检测资源泄漏',
          '使用FindBugs等静态分析工具',
          '代码审查时检查资源使用'
        ]
      },

      UI_DISPLAY: {
        summary: (bug) => '检测到UI显示问题，可能是页面渲染、数据绑定或样式问题',
        causes: (bug) => [
          '数据未正确加载或为空',
          'CSS样式冲突',
          '组件未正确挂载',
          '响应式布局适配问题'
        ],
        solutions: (bug) => [
          '检查数据加载和状态管理',
          '使用浏览器开发者工具检查DOM',
          '验证CSS选择器优先级',
          '添加加载状态和错误处理'
        ],
        generateCodeExample: async (bug, context, repo) => {
          return [
            {
              title: '常见问题1：数据未渲染',
              code: `<!-- 问题：数据为空时页面空白 -->
<template>
  <div v-for="item in items" :key="item.id">
    {{ item.name }}
  </div>
</template>

<!-- 解决：添加空状态处理 -->
<template>
  <div v-if="items.length === 0">
    <p>暂无数据</p>
  </div>
  <div v-else>
    <div v-for="item in items" :key="item.id">
      {{ item.name }}
    </div>
  </div>
</template>`
            },
            {
              title: '常见问题2：加载状态',
              code: `<!-- 解决：添加加载状态 -->
<template>
  <div v-if="loading" class="loading">
    <p>加载中...</p>
  </div>
  <div v-else-if="error" class="error">
    <p>加载失败：{{ error }}</p>
  </div>
  <div v-else>
    <!-- 正常内容 -->
  </div>
</template>

<script>
export default {
  data() {
    return {
      loading: false,
      error: null,
      items: []
    }
  },
  async mounted() {
    this.loading = true;
    try {
      this.items = await fetchData();
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  }
}
</script>`
            }
          ];
        },
        testing: [
          '测试空数据场景',
          '测试加载状态显示',
          '测试不同屏幕尺寸',
          '验证数据更新后的视图刷新'
        ],
        prevention: [
          '添加空状态和加载状态',
          '使用TypeScript增强类型检查',
          '编写E2E测试覆盖UI场景',
          '使用样式隔离避免冲突'
        ]
      },

      PERFORMANCE: {
        summary: (bug) => '检测到性能问题，可能存在慢查询、N+1查询或不必要的计算',
        causes: (bug) => [
          'SQL查询未优化或缺少索引',
          'N+1查询问题',
          '不必要的数据传输',
          '未使用缓存'
        ],
        solutions: (bug) => [
          '分析并优化SQL查询',
          '添加适当的数据库索引',
          '使用JOIN或批量查询避免N+1',
          '实现缓存机制'
        ],
        generateCodeExample: async (bug, context, repo) => {
          return [
            {
              title: '问题：N+1查询',
              code: `// ❌ N+1查询问题
public List<OrderDTO> getOrdersWithUser(List<Long> orderIds) {
    List<OrderDTO> result = new ArrayList<>();
    for (Long orderId : orderIds) {
        Order order = orderRepository.findById(orderId);  // N次查询
        User user = userRepository.findById(order.getUserId());  // N次查询
        result.add(new OrderDTO(order, user));
    }
    return result;
}`
            },
            {
              title: '修复方案：批量查询',
              code: `// ✅ 批量查询
public List<OrderDTO> getOrdersWithUser(List<Long> orderIds) {
    // 1次查询获取所有订单
    List<Order> orders = orderRepository.findAllById(orderIds);

    // 1次查询获取所有用户
    Set<Long> userIds = orders.stream()
        .map(Order::getUserId)
        .collect(Collectors.toSet());
    Map<Long, User> userMap = userRepository.findAllById(userIds)
        .stream()
        .collect(Collectors.toMap(User::getId, u -> u));

    // 组装结果
    return orders.stream()
        .map(order -> new OrderDTO(order, userMap.get(order.getUserId())))
        .collect(Collectors.toList());
}`
            }
          ];
        },
        testing: [
          '使用性能分析工具检测慢查询',
          '测试大数据量场景',
          '验证缓存命中率',
          '监控API响应时间'
        ],
        prevention: [
          '配置慢查询日志',
          '使用APM工具监控性能',
          '代码审查时关注查询效率',
          '进行性能压测'
        ]
      },

      CONCURRENCY: {
        summary: (bug) => '检测到并发问题，可能存在竞态条件、死锁或数据不一致',
        causes: (bug) => [
          '多个线程同时修改共享数据',
          '锁使用不当导致死锁',
          '未使用线程安全的数据结构',
          '可见性问题（未使用volatile）'
        ],
        solutions: (bug) => [
          '使用同步锁或并发集合',
          '使用原子类（AtomicInteger等）',
          '避免嵌套锁防止死锁',
          '使用不可变对象'
        ],
        generateCodeExample: async (bug, context, repo) => {
          return [
            {
              title: '问题：竞态条件',
              code: `// ❌ 竞态条件
public class Counter {
    private int count = 0;

    public void increment() {
        count++;  // 非原子操作，存在竞态条件
    }

    public int getCount() {
        return count;
    }
}`
            },
            {
              title: '修复方案1：使用synchronized',
              code: `// ✅ 使用 synchronized
public class Counter {
    private int count = 0;

    public synchronized void increment() {
        count++;
    }

    public synchronized int getCount() {
        return count;
    }
}`
            },
            {
              title: '修复方案2：使用原子类',
              code: `// ✅ 使用 AtomicInteger（推荐）
public class Counter {
    private final AtomicInteger count = new AtomicInteger(0);

    public void increment() {
        count.incrementAndGet();  // 原子操作
    }

    public int getCount() {
        return count.get();
    }
}`
            }
          ];
        },
        testing: [
          '使用多线程并发测试',
          '使用静态分析工具检测并发问题',
          '进行压力测试',
          '验证线程安全性'
        ],
        prevention: [
          '优先使用不可变对象',
          '使用线程安全的并发集合',
          '避免在同步块中调用外部方法',
          '使用findbugs等工具检测并发问题'
        ]
      },

      TYPE_CONVERSION: {
        summary: (bug) => '检测到类型转换错误，可能是类型不匹配或强制转换失败',
        causes: (bug) => [
          '未进行类型检查直接强制转换',
          '泛型类型擦除导致的问题',
          'JSON反序列化类型不匹配',
          'API返回类型与预期不符'
        ],
        solutions: (bug) => [
          '使用instanceof检查类型',
          '使用try-catch处理ClassCastException',
          '定义明确的类型转换方法',
          '使用泛型避免类型转换'
        ],
        generateCodeExample: async (bug, context, repo) => {
          return [
            {
              title: '问题代码',
              code: `// ❌ 直接强制转换
public void process(Object obj) {
    List<String> list = (List<String>) obj;  // 可能抛出ClassCastException
    for (String item : list) {
        System.out.println(item);
    }
}`
            },
            {
              title: '修复方案',
              code: `// ✅ 类型检查 + 安全转换
public void process(Object obj) {
    if (obj instanceof List) {
        List<?> rawList = (List<?>) obj;
        for (Object item : rawList) {
            if (item instanceof String) {
                System.out.println((String) item);
            }
        }
    } else {
        System.out.println("参数不是List类型");
    }
}

// 或者使用泛型
public void process(List<String> list) {
    if (list != null) {
        for (String item : list) {
            System.out.println(item);
        }
    }
}`
            }
          ];
        },
        testing: [
          '测试类型不匹配场景',
          '测试null值',
          '测试集合元素的类型混合',
          '验证类型转换的安全性'
        ],
        prevention: [
          '使用泛型减少类型转换',
          '配置编译器进行类型检查',
          '使用@SupressWarning抑制前先检查',
          '代码审查时关注类型转换'
        ]
      },

      DATA_INCONSISTENCY: {
        summary: (bug) => '检测到数据不一致问题，可能是保存失败、同步失败或数据校验不严格',
        causes: (bug) => [
          '事务管理不当',
          '数据校验不严格',
          '并发修改导致数据覆盖',
          '缓存与数据库不一致'
        ],
        solutions: (bug) => [
          '使用事务保证数据一致性',
          '添加数据校验和约束',
          '使用乐观锁或悲观锁',
          '实现缓存更新策略'
        ],
        generateCodeExample: async (bug, context, repo) => {
          return [
            {
              title: '问题：缺少事务',
              code: `// ❌ 缺少事务，可能导致数据不一致
public void transfer(Long fromId, Long toId, BigDecimal amount) {
    Account from = accountRepository.findById(fromId);
    Account to = accountRepository.findById(toId);

    from.setBalance(from.getBalance().subtract(amount));
    accountRepository.save(from);  // 如果这里失败...

    to.setBalance(to.getBalance().add(amount));
    accountRepository.save(to);  // ...这里还是会执行
}`
            },
            {
              title: '修复方案：添加事务',
              code: `// ✅ 使用事务保证一致性
@Transactional
public void transfer(Long fromId, Long toId, BigDecimal amount) {
    Account from = accountRepository.findById(fromId);
    Account to = accountRepository.findById(toId);

    // 校验
    if (from.getBalance().compareTo(amount) < 0) {
        throw new InsufficientBalanceException();
    }

    from.setBalance(from.getBalance().subtract(amount));
    to.setBalance(to.getBalance().add(amount));

    accountRepository.save(from);
    accountRepository.save(to);
    // 任何异常都会回滚整个事务
}`
            },
            {
              title: '修复方案：乐观锁',
              code: `// ✅ 使用乐观锁防止并发修改
@Entity
public class Account {
    // ...
    @Version
    private Long version;  // JPA乐观锁
}

// 使用时，JPA会自动检查version
@Transactional
public void updateAccount(Long id, BigDecimal newBalance) {
    Account account = accountRepository.findById(id);
    account.setBalance(newBalance);
    accountRepository.save(account);
    // 如果version不匹配，会抛出OptimisticLockException
}`
            }
          ];
        },
        testing: [
          '测试事务回滚场景',
          '测试并发修改',
          '验证数据校验规则',
          '检查缓存一致性'
        ],
        prevention: [
          '使用@Transactional注解',
          '配置数据库约束',
          '使用乐观锁版本控制',
          '实现幂等性操作'
        ]
      }
    };
  }

  /**
   * 生成通用建议（未知类型）
   */
  _generateGenericSuggestion(bug) {
    return {
      bugType: 'OTHER',
      bugTypeName: '其他',
      severity: 'MEDIUM',
      summary: '需要进一步分析Bug的具体原因',
      causes: [
        '堆栈跟踪信息不完整',
        'Bug描述不够详细',
        '可能是环境配置问题',
        '可能是第三方库问题'
      ],
      solutions: [
        '收集更详细的错误信息和堆栈跟踪',
        '复现Bug并记录重现步骤',
        '检查日志文件获取更多上下文',
        '联系相关人员了解更多信息'
      ],
      codeExamples: [],
      testing: [
        '尝试复现Bug',
        '收集环境信息',
        '检查相关配置'
      ],
      prevention: [
        '完善日志记录',
        '添加错误处理',
        '编写单元测试'
      ]
    };
  }

  /**
   * 生成批量修复建议
   */
  async generateBatchSuggestions(bugs, repository) {
    const suggestions = [];

    for (const bug of bugs) {
      const suggestion = await this.generateFixSuggestion(bug, repository);
      suggestions.push({
        bugId: bug.id,
        bugTitle: bug.title,
        ...suggestion
      });
    }

    return suggestions;
  }
}

/**
 * 创建修复建议生成器实例
 */
function createFixSuggestionGenerator(options) {
  return new FixSuggestionGenerator(options);
}

export {
  FixSuggestionGenerator,
  createFixSuggestionGenerator,
  BUG_TYPES
};

export default FixSuggestionGenerator;
