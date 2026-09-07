# 阶段4: 构建/lint/编译验证（完整细节）

本文件包含阶段4的所有步骤。**不随 skill 加载**，进入阶段4时由 agent 按需读取。

强制执行，验证命令动态检测不硬编码。

## 前端验证

```bash
# 依赖检查
test -d node_modules || (test -f package-lock.json && npm ci || npm install)
# 动态检测 scripts
node -e "const s=require('./package.json').scripts; console.log(Object.keys(s).join(' '))"
```

按检测结果执行：lint → 类型检查(tsconfig.json 存在时) → build → test:unit(可选)

## 后端验证

检测构建工具（pom.xml / build.gradle），执行 `mvn compile -q` 或 `gradle compileJava`。涉及 Service 层变更时可选跑单元测试。

构建失败不继续，必须先修复（参见 E-12）。超时保护：前端/后端构建超过 10 分钟时分析已输出错误并尝试修复（参见 E-32、E-33）。

## 输出

- 前端：lint + 类型检查 + build 通过
- 后端：compile 通过
- 构建错误已修复（如有）
