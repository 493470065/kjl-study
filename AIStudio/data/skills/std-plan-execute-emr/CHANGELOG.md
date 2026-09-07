# Changelog

## 3.4.0 (2026-06-05)

### 分支保护升级: pre-push hook

- **phase-2-git.md 阶段2.4**: 新增 `pre-push` hook 安装步骤，在创建 worktree 时自动在仓库 `.git/hooks/pre-push` 安装拦截脚本
- **SKILL.md 安全规范**: 分支保护章节升级为「阶段2 + 阶段7」双重保护，补充 hook 说明
- **std-auto-dev-emr 阶段7.5**: 同步新增 pre-push hook 安装步骤
- **std-auto-dev-emr 阶段11**: 补充双重分支保护说明
- 受保护分支列表: `sr-next, sr-rc, master, main, release`
- 支持紧急绕行: `BYPASS_HOOK=1 git push ...`
- 覆盖所有推送方式: 命令行、IDEA、技能执行

## 3.3.0 (2026-06-05)

### 优化1: 主文件拆分

- **SKILL.md**: 从 604 行精简至 130 行（减少 78%），保留概览、Headless 规则、安全规范、模板变量
- **新增 `references/phases/`**: 7 个阶段文件按需加载（phase-1-plan ~ phase-7-commit），共 530 行
- 版本号升级至 3.3.0，主文件阶段概览表增加「详情文件」列指向对应 phase 文件

### 优化2: 补充阶段3开发细节

- **phase-3-dev.md**: 新增「Task 依赖处理」子节（显式/隐式/跨前后端依赖策略）
- **phase-3-dev.md**: 新增「代码片段适配策略」子节（import 差异、方法签名变更、上下文缺失等 5 种场景处理表）
- **phase-3-dev.md**: 新增「并行汇聚冲突检测」子节（同仓库串行冲突检测、多 Agent 失败汇聚策略）

### 优化3: 异常处理去重

- **exception-handling.md**: 新增编号体系（E-01 ~ E-33），作为唯一 source of truth
- **exception-handling.md**: 新增「约定」章节说明引用规则
- 各阶段文件异常描述改为编号引用（如"参见 E-01"），消除与异常表的重复维护

### 优化4: 补充超时策略

- **exception-handling.md**: 新增「超时异常」分类（E-31 单 Task 5分钟、E-32 前端构建 10分钟、E-33 后端编译 10分钟）
- **phase-3-dev.md / phase-4-build.md**: 添加超时引用

### 优化5: 同步并行 Agent SQL 规则

- **agent-templates.md**: 后端 Agent prompt SQL 规则与阶段6.1同步，补全「禁止循环内数据库查询」规则

### 其他

- **SKILL.md 阶段6.1**: 新增「禁止循环内数据库查询（🔴 最高风险）」规则
- **SKILL.md 阶段7.1/7.3**: 新增分支保护检查，禁止直接提交/推送到基准分支
- **SKILL.md**: 新增「安全规范（全阶段适用）」章节，集中 SQL 规范 + 分支保护 + 代码暂存规范

## 3.2.0 (2026-05-06)

### 改进1: 脚本安全加固

- **scripts/get-child-tasks.cjs**: 新增 `fs`/`path` 导入；新增 `TFS_CLIENT_DIR` 空值检查 + 路径存在性校验 + `tfs-client.mjs` 文件存在性检查；新增 `WORK_ITEM_ID` 非空 + 数字校验；错误处理中 PAT token 防泄露（`redactSensitive` 函数替换 `Basic xxx`）

### 改进2: description 格式标准化

- **SKILL.md description**: 改为标准 3 句话格式（用途/触发词/场景），触发词精简为 6 个代表性关键词
- **SKILL.md 触发条件**: 精简关键词列表，移除冗余同义词

### 改进3: git reset --hard 安全防护

- **SKILL.md 2.2 节**: 新增 `git reset --hard` 前的安全保护流程（`git status --porcelain` 检查未提交变更 → `git stash` 保护 → reset 后 `git stash pop` 恢复）

### 改进4: 模板变量文档 + 阶段输出契约

- **SKILL.md**: 新增「模板变量」章节，定义 8 个模板变量的来源和说明，明确 `{skillDir}` 解析为 `~/.claude/skills/std-plan-execute`
- **SKILL.md**: 新增「依赖」章节，声明 `std-code-paths` 和 `code-review` 两个外部依赖
- **SKILL.md**: 阶段1/2/3/4/6/7 各补充 `### 输出` 节，明确每个阶段的产出物

### 改进5: CHANGELOG + 状态恢复校验

- **SKILL.md 1.6 节**: 恢复流程新增步骤3「校验 completedTasks 完整性」——通过 `git diff --name-only` 交叉验证已记录 Task 的文件是否确实有变更，失效的 Task 自动标记为需重做

## 3.1.0 (2026-04-23)

- 阶段重排序：用户验证（阶段5）移到代码审查（阶段6）之前
- Headless 无值守模式
- 并行 Agent 执行支持
- Worktree 隔离开发
- SQL 规范强制检查
- 状态机断点续跑
- 版本感知配置（defaults 继承机制）

## 3.0.0 (2026-04-15)

- 初始版本，7 阶段工作流
- Git Worktree 隔离
- TFS 任务关联
