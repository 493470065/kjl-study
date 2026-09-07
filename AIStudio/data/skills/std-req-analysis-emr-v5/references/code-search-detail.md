# 代码搜索策略详细执行步骤

本文件为 [SKILL.md](../SKILL.md) 步骤 3 的详细执行参考。当执行代码搜索时，按以下流程操作。

## 策略A：Graphify 图谱查询

> ⚠️ **强制要求**：进入策略B（grep）之前**必须先执行本策略**，无论图谱是否存在。
> ⚠️ **中文关键词必须先映射**：Graphify 图谱节点均为英文代码标识符，中文关键词直接查询必然返回空结果。

### 步骤1：映射表查（快速路径）

> ⚡ 步骤1+步骤2 可并行启动

1. 读取 `config/codebase-paths.json` 中当前配置节点的 `chineseToEnglishMap` 字段
2. 从需求标题、描述和业务关键词中提取中文术语，逐一查映射表
3. 收集所有映射到的英文标识符，用空格拼接为一个查询字符串
4. 在 `notes.md` 记录映射过程，格式：
   ```
   中文关键词映射：病历→EmrRecord,Emr；会诊→Consultation,Consult
   ```
5. 无论映射表是否有结果，**都必须继续执行步骤2**，不得跳过

### 步骤2：Grep 桥接（必须执行，不可跳过）

> ⚠️ **强制要求**：本步骤必须执行，即使步骤1的映射表已命中。映射表只覆盖已知高频术语，grep 桥接能发现映射表未覆盖的关联标识符，两者互补。

目的：从代码中自动发现与中文关键词相关的英文标识符。

> ⚡ **并行优化**：前后端代码搜索独立，启动 2 个 subagent 并行执行。（如果前后端目录相同，只启动 1 个 subagent 搜索共同根目录。）

**执行流程**：

1. **启动 2 路并行 subagent**：
   - **Subagent A（后端）**：在 `codeBasePath` 下用中文关键词 grep 搜索，返回命中行列表
   - **Subagent B（前端）**：在 `frontendCodeBasePath` 下用中文关键词 grep 搜索，返回命中行列表
   - 两路 subagent 的搜索关键词、排除目录等参数保持一致

2. **搜索目录规则**：
   - 若当前使用含 `moduleFilter` 的配置节点，搜索目录限定在 `moduleFilter.backend.includeExplicit` 和 `moduleFilter.frontend.includeExplicit` 指定的子目录内，同时排除 `excludePattern`
   - 若无 `moduleFilter`，搜索目录使用 `codeBasePath`/`frontendCodeBasePath` 全目录

3. **汇总结果**：等待两路 subagent 完成后，合并前后端命中行

4. 从合并命中行中提取 CamelCase 英文标识符（Java 类名、Vue 组件名、方法名等）

5. **标识符归属过滤**（含 `moduleFilter` 时）：
   - 匹配 `includePattern`/`includeExplicit` 的文件 → "目标模块标识符"
   - 不匹配文件（如旧模块、通用工具类）→ "跨模块标识符"（仅作补充）

6. 去掉常见后缀（DTO、VO、PO、Controller、ServiceImpl、Service、Mapper、Repository、Component、Module），得到"基名"

7. 统计每个基名出现在多少个不同文件中

8. 取出现次数 ≥ 2 的基名作为主干词（降序排列，最多取3个）

9. 在 `notes.md` 记录桥接过程，格式：
   ```
   grep桥接：关键词'病历'→ 基名 EmrRecord(12文件), EmrConsult(8文件), PatientEmr(3文件)
   ```

10. **合并步骤1和步骤2的标识符**：将映射表命中的标识符与 grep 桥接发现的主干词去重合并，作为步骤3的输入

11. **步骤1和步骤2均无标识符** → 在 `notes.md` 记录"映射表和grep桥接均未发现有效标识符"，进入步骤4

### 步骤3：Graphify 关系追溯

目的：用步骤1和步骤2合并后的英文标识符，通过 Graphify 获取代码关系网络。

> ⚡ **并行优化**：分两轮执行。第一轮所有标识符的 `query_graph` 并行发起；第二轮 `get_neighbors` 和 `shortest_path` 并行发起。

**第一轮（并行）— query_graph**：

1. 对步骤1和步骤2合并后的每个主干词，同时发起 `query_graph` 查询
2. 所有 `query_graph` 调用互不依赖，通过 MCP 工具或 Bash CLI 并行执行
3. 收集所有查询结果中的关键节点（Controller、Service、核心 Entity 等）

**第二轮（并行）— get_neighbors + shortest_path**：

4. **get_neighbors**：对第一轮结果中发现的每个关键节点，同时发起邻居查询，展开调用链
5. **shortest_path**：当需求涉及多个概念时（如"会诊"+"计费"），对每个概念对同时发起最短路径追溯。此步骤与 get_neighbors 互不依赖，可并行执行

**图谱结果模块归属过滤**（含 `moduleFilter` 时）：

1. 遍历每个节点的 `src` 路径
2. 匹配 `includePattern`/`includeExplicit` → "目标模块命中"
3. 匹配 `excludePattern` → "旧模块命中"（记录到 `notes.md`，不可作为当前模块分析依据）
4. 过滤后无有效节点 → 记录"图谱过滤后无目标模块命中"，进入步骤4

**汇总**：

5. 将查询结果记录到 `notes.md`，标注使用方式（MCP/CLI）
6. Graphify 调用异常时在 `notes.md` 记录异常信息，不阻塞流程，进入步骤4

**Graphify 调用方式**：

- **MCP 工具**（常驻模式，查询 ~0.5s）：
  - `mcp__graphify__query_graph`
  - `mcp__graphify__get_neighbors`
  - `mcp__graphify__shortest_path`
  - `mcp__graphify__get_node`

- **降级 Bash CLI**（MCP server 未启动时，查询 ~8-10s）：
  ```bash
  PYTHONIOENCODING=utf-8 python -m graphify query "<英文标识符>"
  ```

### 步骤4：降级兜底

Graphify 查不到有效节点或关系不足时，用 grep 全量搜索结果继续分析：

- 在 `notes.md` 记录"Graphify 未返回有效结果，降级使用grep全量搜索"
- 进入策略B，但 grep 搜索可复用步骤2已收集的命中行

---

## 策略B：Grep 搜索

> ⚡ **并行优化**：前后端代码库独立，启动 2 路并行 subagent，搜索结束后统一汇总结果。（如果前后端目录相同，只启动 1 个 subagent 搜索共同根目录。）

**后端搜索范围**（指定搜索目录为 `codeBasePath`）：
- Controller、Service、ServiceImpl、DTO、VO、Entity/PO、Mapper、Repository
- 参数/配置常量/枚举、字典、SQL/MyBatis XML
- 与需求关键词相关的业务逻辑代码

**前端搜索范围**（指定搜索目录为 `frontendCodeBasePath`）：
- 菜单配置、路由定义、页面组件
- 表格列定义、按钮/操作项、状态变量
- 接口调用（API service）、文案/国际化 key
- 共享组件的入参（如 `menuflag`、`activeType`、`traceRecoveryTypeCode` 等）

**搜索目录规则**（与策略A步骤2一致）：
- 含 `moduleFilter` 时，限定在 `includeExplicit` 子目录内，排除 `excludePattern`
- 无 `moduleFilter` 时，使用全目录

### 代码归属检查（`moduleFilter` 场景后置验证）

> **触发条件**：仅当当前配置节点含 `moduleFilter` 时执行。

1. 遍历汇总结果中每个命中文件的路径
2. 匹配 `includePattern`/`includeExplicit` → 保留为有效结果
3. 匹配 `excludePattern` → 标记为"旧模块命中"，移出有效结果集
4. 不匹配任何规则 → 保留但标注"未匹配过滤规则，需人工确认"
5. **实现状态判断仅基于有效结果**

### 新旧模块混淆兜底检测

当代码搜索汇总结果中同时出现以下特征时，提示用户确认：

1. **检测信号**：命中文件中，同时存在路径含新模块特征（如 `*-v2-*`）和路径含旧模块特征（如 `*-application`、`*-common`）的文件

2. **处理方式**：
   - 在 `notes.md` 记录"检测到新旧模块混合命中"
   - 向用户提示确认本需求应基于哪个版本
   - 用户确认后调整后续分析范围

3. **不阻塞流程**：若用户未明确回应，继续按当前配置节点规则执行，但在分析正文中注明"存在新旧模块混合命中，建议复核"

---

## 策略C：Mock 数据与实体类补充搜索

> ⚠️ **触发条件**：仅当需求涉及参数路径、配置分类、字典项、枚举值时执行。

策略A/B 完成后，如果仍无法确认参数/配置的具体路径或分类层级，执行以下补充搜索：

### 步骤1：搜索前端 mock 数据（优先）

1. 在 `mock/` 目录下搜索与参数/配置/字典相关的接口 mock 数据
   - 重点关注：`mock/**/param/`、`mock/**/config/`、`mock/**/dict/`、`mock/**/setting/` 等子目录
   - 搜索关键词：`paramClass`、`paramType`、`dict`、`config`、`category`、`enum`

2. 查看 mock 数据中是否包含参数分类树、字典列表、枚举值的示例

3. 如找到参数分类树，提取完整的分类路径（大类 → 子类）

> ✅ **经验**：前端 mock 数据经常包含完整的参数分类树示例（如 `getParamType.ts`），是定位精确路径的最快途径。

### 步骤2：检查参数表实体类（JPA/MyBatis）

1. 搜索 `Entity/PO` 目录下与参数相关的实体类：
   ```bash
   grep -r "class.*Param.*PO\|class.*Config.*PO\|class.*Dict.*PO"
   ```

2. 检查实体类中是否有以下分类字段：
   - `CLASS_NAME` / `SUB_CLASS_NAME`
   - `CATEGORY_NAME` / `CATEGORY_CODE`
   - `PARAM_CLASS_NAME` / `PARAM_SUB_CLASS_NAME`

3. 如存在上述字段 → 标记 `"参数分类名称为数据驱动，存储在数据库中，需结合 mock 数据或产品确认具体路径"`

4. 记录到 `notes.md`：参数表名、分类字段名、数据驱动状态

### 步骤3：处理不确定项

- mock 和实体类搜索后仍无法确认具体路径 → 在 `notes.md` 记录 `"【待确认】参数分类路径"`
- 在需求分析正文中标注：`[待确认：具体参数子分类]`
- **回写 TFS 前必须向用户确认**

---

## 分阶段搜索策略（回退 `rg` 时使用）

回退 `rg` 时必须分阶段搜索，避免无边界全仓库扫描：

1. **文件名/路径优先**：先用菜单名、页面名、字段名查文件名或路径，命中后只读取少量关键文件
2. **精确内容搜索**：再搜索带业务特征的中文词、字段英文名、接口名或参数名
3. **局部扩展**：只在已命中模块附近继续搜索相关 Controller/Service/组件/路由/Mapper

单个关键词搜索结果过多时，立即换更精确关键词或限定文件类型/目录，不要继续读取大批结果。

---

## 推荐 rg 命令格式

```bash
rg -n --hidden \
  --glob '!**/.git/**' \
  --glob '!**/node_modules/**' \
  --glob '!**/dist/**' \
  --glob '!**/build/**' \
  --glob '!**/target/**' \
  --glob '!**/.gradle/**' \
  --glob '!**/logs/**' \
  --max-count 80 \
  "<关键词>" <代码目录>
```

如需按文件类型收窄，可追加：
- `--glob '*.java'`
- `--glob '*.vue'`
- `--glob '*.ts'`
- `--glob '*.js'`
- `--glob '*.xml'`
- `--glob '*.sql'`

Claude Code 环境中也应遵守同样原则：先用受限搜索定位候选文件，再读取关键片段，避免让工具自动做全仓库深度探索。

---

## 实现状态判断详细依据

| 状态 | 判断依据 | 后续动作 |
|------|---------|---------|
| 已完整实现 | 代码中已有需求描述的全部功能，且经反向追溯确认为活代码 | 停止分析，报告已实现 |
| 死代码（仅定义未使用） | 命中文件存在但无 import 或调用方 | 记录死代码位置，按"未实现"处理 |
| 参数配置可解决 | 发现现有参数可控制该行为 | 标注参数方案，停止分析 |
| 部分实现 | 实现了部分功能 | 标注已完成部分，分析增量 |
| 未实现 | 未找到相关代码 | 继续后续分析 |
| 未实现（旧模块有参考实现） | 目标模块无实现，但旧模块有相同/相似功能 | 标注旧模块实现位置作为参考，继续分析目标模块的增量实现方案 |

**如果代码中已存在该功能**，记录以下信息并向用户报告：

```
⚠️ 需求XXX已在以下代码位置实现：
- 后端：[文件路径]:[行号]
- 前端：[文件路径]:[行号]
- 实现方式：[代码实现/参数配置]
- 对应任务号：[如有]
```

---

## 参数路径新增推导规则

新增参数路径必须按系统现有参数路径格式推导：

1. 先查代码常量、参数表/CSV、历史分析文档和同类参数
2. 优先复用既有路径层级与命名格式
3. **不得按业务模块归属、菜单名称或个人理解直接编造参数路径**

新增参数编码按系统内置规则生成；除非现有参数资料或代码已明确给出，不要自行编造参数编码。