## Severity 映射规则

### 映射表

| review-rules.json | 输出 severity | 徽章 |
|------------------|-------------|------|
| 严重 | **critical/high**   | 🔴 高危 |
| 警告 | **medium**  | 🟡 中危 |
| 提示 | **low**     | 🔵 低危 |
| 信息 | **info**    | ℹ️  信息 |

### 重要规则

**优先使用检查点（checkpoint）的 severity，没有才使用规则的 severity。**

### 禁止行为

❌ **禁止**：
- 根据"关键业务代码"提高级别
- 将"警告"提高为"严重"
- 将"提示"提高为"警告"或"严重"

### 示例

- QUAL-B011-2（空catch块）→ 必须输出 `"severity": "low"`（定义：提示）
- PERF-B007-2（超时超过1分钟）→ 必须输出 `"severity": "medium"`（定义：警告）
