## 文件收集策略

### 首次审核（initial）

收集所有源码文件：

```bash
# 获取当前 commit
HEAD_COMMIT=$(git rev-parse HEAD)

# 收集所有源码文件
find . -type f \( -name "*.java" -o -name "*.py" -o -name "*.js" -o -name "*.vue" -o -name "*.ts" \) \
  ! -path "*/node_modules/*" ! -path "*/target/*" ! -path "*/test/*" \
  ! -name "*test*.py" ! -name "*Test.java" ! -name "*.test.ts" | sort
```

### 增量审核（incremental）

只收集变更文件：

```bash
# 获取上次扫描的 commit
BASE_COMMIT=$(cat .claude/scan-records/.../scan_record.json 2>/dev/null | jq -r '.last_scan_commit')

# 获取变更文件
git diff --name-only ${BASE_COMMIT} HEAD 2>/dev/null | grep -E '\.(java|py|js|vue|ts)$' | sort
```

### 文件过滤规则

**排除以下文件**：
- 测试文件：`*test*.py`, `*Test.java`, `*.test.ts`
- 依赖目录：`node_modules/`, `target/`, `test/`
- 配置文件：除 `.java`, `.yaml`, `.yml` 外的配置文件

**支持的语言**：
- 后端：`.java`, `.py`, `.go`, `.js`, `.ts`
- 前端：`.vue`, `.jsx`, `.tsx`
- 配置：`.yaml`, `.yml`
