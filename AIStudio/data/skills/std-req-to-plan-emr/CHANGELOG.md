# Changelog

## 2.2.2 (2026-06-05)

### P0/P1 优化（基于技能评审）

- **步骤编号修正**: stage3~6 内部编号与文件名阶段号对齐（3.x/4.x/5.x/6.x）
- **标题层级统一**: 定义 H1-H5 规范，stage5 的 `## 4.x` 降为 `#### 5.x`
- **统一模板结构**: 所有 stage 文件补充 `### 元信息` 节（前置条件/触发条件/预计耗时）
- **脚本 HTTPS 支持**: upload-analysis.cjs 和 cleanup-attachments.cjs 自动检测协议
- **脚本清理**: create-tasks.cjs 删除未使用的 `require('http')`
- **复杂度锁定机制**: state.json 新增 `complexityLocked` 字段，一经确认不可覆盖

## 2.2.1 (2026-05-13)

### 核心改进（基于 skill 评审报告）

- **SKILL.md description**: 补充 anti-trigger 定义，明确不适用于纯开发执行、Bug 修复、代码审查场景，减少误触发
- **SKILL.md description**: 增加触发词"做个方案"、"帮我拆解需求"，扩大正向触发覆盖
- **阶段输出数据契约**: 6个 stage 文件的"输出"章节均补充显式字段契约，约束后续阶段依赖的关键字段名和类型，消除隐式约定
- **stage4-design-docs.md**: 删除废弃文件 `references/win-design-next-docs.md.bak`（1.3MB），将"严禁读取"指令改为"已删除"说明
- **stage6-delivery.md**: 修复 `CURRENT_USER="huang_yf"` 硬编码，改为从 `git config user.username` 动态获取，兼容不同开发者
- **stage4-design-docs.md**: 补充文档与阶段5/6的依赖关系表，明确每个设计文档的哪些章节被后续阶段消费
- **stage5-plans.md**: 补充 std-plan-execute 解析依赖的字段契约说明

## 2.2.0 (2026-05-06)

### 改进1+4: Plan 格式与 std-plan-execute 契约对齐

- **stage5-plans.md**: 计划标题 `### 步骤 N:` → `### Task N:`，完全对齐 std-plan-execute 的解析器正则 `/^#{2,3}\s+Task\s+\d+/i`
- **stage5-plans.md**: checkbox 从独立末行移到每个字段前（`- [ ] **文件**: ...`）
- **stage5-plans.md**: 每个 Task 新增依赖关系、风险评估、回滚策略元数据
- **stage5-plans.md**: 新增 5.1 格式自检节（标题检测、checkbox完整性、字段完整性、依赖链完整性、格式合同校验）
- **stage5-plans.md**: 复杂需求模式增加格式覆盖指令，确保 writing-plans 输出对齐
- **SKILL.md**: 两种模式对比表阶段5行标注 `### Task N:` 格式

### 改进2: 复杂度两阶段前置判定

- **stage1-fetch-requirement.md**: 新增 1.6 初步复杂度预判（文本长度/模块数/关键词规则）
- **stage1-fetch-requirement.md**: state.json 增加 `preliminaryComplexity` + `preliminaryComplexityReason` 字段
- **stage2-read-code.md**: 2.6 节增加预判优化，简单需求跳过细扫节省约 40% 扫描时间
- **stage2-read-code.md**: 2.8 节改为确认/重评估机制，有预判时展示结果而非从零询问
- **SKILL.md**: 复杂度判定说明更新为两阶段判定，state.json 示例增加新字段

### 改进3: Brainstorm 结构化模板

- **新建 references/brainstorm-notes-template.md**: 7章节模板（改动范围/技术决策/架构影响/数据模型/风险/API清单/协作点）
- **stage3-brainstorm.md**: 3.4 节重写，引用模板填充各章节，简单模式自动推断规则明确

### 改进5: 脚本安全加固

- **scripts/upload-analysis.cjs**: 硬编码路径改用 `os.homedir()` + `PATHS_CONFIG` 环境变量覆盖；`marked` require 移到路径校验之后；新增配置文件存在性检查；新增 TFS_CLIENT_DIR + WORK_ITEM_ID 输入校验；错误处理中 PAT token 防泄露
- **scripts/create-tasks.cjs**: 新增 `fs`/`path` 导入；新增 TFS_CLIENT_DIR 路径校验（空值+文件存在性）；新增 WORK_ITEM_ID 数字校验；错误处理中 PAT token 防泄露
- **scripts/cleanup-attachments.cjs**: 新增 TFS_CLIENT_DIR + WORK_ITEM_ID 输入校验；错误处理中 PAT token 防泄露

### 规范符合性修复

- **SKILL.md description**: 改为标准 3 句话格式（用途/触发词/场景），补充"需求号"、"分析需求"等触发词
- **SKILL.md**: 新增 6 个标准阶段标题 `## 阶段N: 名称`（格式A），符合 skill-template scanner 规范
- **stages/stage1~6**: 每个阶段文件统一添加 `### 输入` / `### 执行步骤` / `### 输出` 标准标题结构

## 2.1.0 (2026-04-23)

- 初始版本，6阶段工作流
- API-First 设计文档生成
- 简单/复杂双模式分支
- TFS 集成（获取需求、上传附件、标签、子任务）
- 增量代码扫描 + 断点续跑
- WinDesign 3.0 按需加载策略
