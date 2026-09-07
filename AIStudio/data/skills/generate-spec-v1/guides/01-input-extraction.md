# 01 — 资料区解析指南

本指南覆盖 Phase 1 和 Phase 2 中共用的资料区解析操作，确保从历史需求 xlsx 和功能清单 md 中系统性地提取结构化素材。

---

## 1. 解析历史需求 xlsx

### 1.1 提取脚本使用

```bash
# 在临时目录安装依赖
mkdir _tmp_extract && cd _tmp_extract
npm init -y && npm install xlsx

# 运行提取脚本
node ../scripts/extract-requirements-xlsx.js "<xlsx文件路径>" > _extract_requirements.json

# 完成后回到工作目录，删除临时目录
cd .. && rm -rf _tmp_extract
```

提取后的 JSON 结构为数组，每条需求包含：`需求编号`、`标题`、`模块名称`、`需求分析`、`优先级`、`状态`、`客户名称`、`迭代路径` 等字段。

### 1.2 Phase 1：模块级广度扫描

**目标**：识别模块全部功能点，区分核心功能与基线能力。

**步骤**：
1. 按 `模块名称` 过滤本模块的全部需求
2. 逐条阅读 `需求分析` 字段，在脑中标注高频出现的主题词
3. 做**主题聚类**：将需求按功能主题分组（如"患者信息""诊断""手术""费用""质控""签名""归档""配置"）
4. 对每个主题：统计涉及的需求条数、归纳核心诉求、识别涉及的角色
5. 识别**非功能点需求**：属于字段级调整、界面微调、版本合并、基础查询、数据存储优化的需求，标记为基线能力候选

**输出**：主题聚类清单，每个主题一行，注明需求数量 + 代表需求编号。

### 1.3 Phase 2：功能点级深度过滤

**目标**：提取与当前功能点相关的全部需求细节。

**步骤**：
1. 从 Phase 1 的功能点名称提取关键词（如"患者信息管理" → `基本信息|住院信息|转科|新生儿|年龄|血型|联系人|地址|执业证书|同步|变更`）
2. 用关键词在需求数据中二次过滤
3. 对筛出的每条需求，**逐条完整阅读** `需求分析` 字段原文
4. 按六个维度**逐项摘录**：

| 维度 | 摘录方式 | 记录格式 |
|------|---------|---------|
| 业务规则 | 提取"XX情况下必须XX"类约束性描述 | `BR候选: <规则描述>（来源：需求XXXX）` |
| 场景 | 提取"用户XX操作→系统XX响应"的描述 | `SC候选: <场景描述>（来源：需求XXXX）` |
| 字段 | 提取明确出现的概念ID | `FLD: <字段名>（概念ID: XXXXX）` |
| 参数 | 提取参数名+路径+默认值 | `PARAM: <参数名>，路径 <路径>，默认值 <值>` |
| 数据表 | 提取表名 | `TBL: <表名>（<存储内容>）` |
| 边界 | 提取"XX情况下不适用/除外" | `EXCL: <边界说明>（来源：需求XXXX）` |

5. 每条记录标注需求编号作为溯源依据
6. **严禁将多条需求的信息混合后自行推断新规则**

---

## 2. 解析功能清单 md

### 2.1 Phase 1：模块级全量读取

**目标**：提取模块全部功能点定义和结构信息。

**步骤**：
1. 定位目标模块的功能清单 md（可能有多份，如 `WiNEX-病案首页_功能清单_*.md`）
2. 读取全文档，提取：
   - 所有功能点ID + 功能名称 + 功能描述（→ Phase 1 第5章）
   - 所有数据表清单（表名 + 存储内容 → Phase 1 第7章）
   - 所有参数配置说明表（参数名称/路径/默认值/说明 → 素材库）
   - 所有数据流向说明（内部模块间 + 外部系统间 → Phase 1 第7章）
3. 若多份清单间存在重叠/矛盾，记录差异并在功能点清单中统一口径

### 2.2 Phase 2：功能点级定位

**目标**：定位当前功能点在功能清单中的详细描述。

**步骤**：
1. 在功能清单 md 中搜索当前功能点名称或编号
2. 读取对应章节全文
3. 重点捕获：
   - 功能点ID、功能描述、状态、来源
   - **参数配置说明表**（该功能点涉及的参数）
   - **数据表清单**（该功能点涉及的数据表）
   - **数据流向说明**（该功能点的上下游联动）

### 2.3 字段摘录原则

- **直接原样摘录**：不修改字段命名、不合并字段、不拆分字段
- **保留原文格式**：概念ID、参数路径、表名保持资料区原文格式
- **标注出处**：每条摘录注明来自功能清单的哪个章节

---

## 3. 跨线/关联识别

**仅在资料区明确提及时记录**，不自行推断联动关系。

**识别方法**：
- 外部系统名称出现在功能清单的"数据流向说明"中
- 需求原文中出现"联动XX系统""对接XX""从XX获取""同步到XX"等表述
- 功能清单中出现"接口对接""监听同步""数据同步"等对接方式描述

**记录格式**：
```
关联：<源系统> → <目标系统>
  方式：<接口对接/监听同步/数据同步>
  数据：<传输的核心数据>
  来源：<功能清单XX章节 / 需求XXXX>
```

---

## 4. 解析产出物管理

### 4.1 临时文件清理

- xlsx 提取的 `_extract_requirements.json`：Phase 1 完成后保留（供 Phase 2 复用），全部 Phase 2 完成后删除
- 临时 npm 目录 `_tmp_extract`：xlsx 提取后立即删除

### 4.2 素材索引表（推荐）

为便于溯源，建议在解析过程中维护一张素材索引表：

| 素材编号 | 类型 | 来源文件 | 来源章节/需求编号 | 内容摘要 | 关联功能点 |
|---------|------|---------|-----------------|---------|-----------|
| M-001 | 业务规则 | 需求.xlsx | 需求 239730 | 患者转科后原科室不得修改医嘱 | BLGL-13-BASY-001 |
| M-002 | 字段 | 功能清单.md | 数据表清单 | PAT_ADMISSION_INFO 表 | BLGL-13-BASY-001 |

此表非强制产出，但便于后续溯源审查。

---

## 5. 解析代码仓库

本节覆盖从代码仓库中系统性提取结构化信息的操作。**本节是本技能的强制前置步骤**——生成任何 Spec 前必须执行。代码仓库提供三类客观信息：API端点、数据实体、模块结构。这些信息可以直接填入Spec，**但必须标注来源为"代码"**，与来自文档的信息区分。

### 5.1 启动条件与前置检查

**触发条件**：**每次生成 Spec 前强制触发**。代码仓库默认地址 `E:\39EMR\sr-next`（用户未另行指定时使用）。

**前置检查**：
```bash
# 1. 验证路径可读（默认 E:\39EMR\sr-next，或用户指定路径）
ls <代码仓库路径>/ 2>/dev/null || echo "PATH_NOT_READABLE"

# 2. 列出项目结构
ls -d <代码仓库路径>/*/ 2>/dev/null
```

**失败处理**：
- 路径不可读 → 记录原因（`⏳ 待确认：代码仓库 <路径> 不可读，原因：<...>`），Phase 1 第8章代码架构、Phase 2 接口契约/数据模型/技术方案章节标记 `⏳ 待确认`。**不得以需求文本中的零散代码线索替代代码扫描。**
- 空目录 → 同上
- 权限不足 → 同上，提示用户检查权限

### 5.2 后端代码扫描

#### 5.2.1 项目发现与模块识别

```bash
# 列出所有项目根目录
ls -d <代码仓库路径>/*/ 2>/dev/null
```

**识别规则**：
- 目录下存在 `pom.xml` 的为 Maven 项目
- 子目录中含有 `src/main/java` 且有 `*Application.java` 或 `*Server.java` 的为独立服务模块
- `*-model` 子模块：存放 PO/DO 实体（数据对象）
- `*-common` 子模块：存放通用工具、Bridge 服务接口
- `*-provider` 子模块：存放 Controller（REST端点）和 Provider 实现
- `*-server` 子模块：存放启动类
- `*-application` 子模块：存放应用服务编排层

#### 5.2.2 Controller 扫描（提取 API 端点）

**查找命令**：
```bash
find <代码仓库路径> -name "*Controller.java" -type f -not -path "*/target/*"
```

**提取内容**（读取每个 Controller 文件的关键注解和方法签名）：
1. **类级别**：
   - 类名（如 `ConsultApplyController`）
   - `@Api(tags=...)` → 业务模块标签（用于模块映射）
   - `@RequestMapping` 的基路径（如果有）
2. **方法级别**（逐个 `public` 方法）：
   - 方法名
   - `@ApiOperation(value=...)` → 业务含义描述
   - `@PostMapping` / `@GetMapping` 的路径或引用的 `*ApiPathConstant.XXX` 常量
   - 输入参数类型（`@RequestBody` 的 DTO 类型名）
   - 返回类型（`WinMvcResponse<XxxDTO>` 中的 `XxxDTO`）
3. **ApiPathConstant 常量文件**：搜索对应的 `*ApiPathConstant.java` 文件，提取所有 `public static final String XXX = "/api/..."` 常量定义

**输出格式**（每个 Controller 一个条目）：

```
[控制器] ConsultApplyController (@Api: "业务态：新版本-会诊申请业务")
  [端点] POST /api/v2/consult_apply/add → 会诊申请新增 (入参: CreateConsultationApplyParam, 出参: QueryConsultationDTO)
  [端点] POST /api/v2/consult_apply/query_list → 会诊申请查询 (入参: QueryConsulApplyInfoParam, 出参: QueryApplyConsultationDTO[])
  ...
```

**特殊处理**：
- 如果路径引用的是常量（如 `ConsultApplyApiPathConstant.ADD_CONSULTATION_APPLY`），需从对应的 `*ApiPathConstant.java` 文件中解析出实际路径
- 如果 ApiPathConstant 文件位于另一个模块（跨模块引用），先搜索本模块的 `src/main/java`，再搜索 `*-common` 模块
- 常量无法解析时，保留常量名并标注 `（来源：代码，常量引用未解析: <常量全限定名>）`

#### 5.2.3 实体扫描（提取数据表与字段）

**查找命令**：
```bash
find <代码仓库路径> -name "*PO.java" -o -name "*DO.java" | grep -v "/target/"
```

**提取内容**（读取每个 PO/DO 文件）：
1. **类级别**：
   - 类名（如 `ConsultApplyV2PO`）
   - `@Table(name="xxx")` → 数据库表名
   - `@Entity` 注解确认是 JPA 实体
2. **字段级别**：
   - 字段名（如 `private String emrConsultApplyId;`）
   - 字段类型（String / Integer / Long / Date / BigDecimal 等）
   - `@Column(name="xxx")` → 数据库列名

**输出格式**：

```
[实体] ConsultApplyV2PO → 表: consult_apply_v2
  [字段] emrConsultApplyId: String（会诊申请ID）
  [字段] patientId: String（患者ID）
  [字段] applyDeptId: String（申请科室ID）
  ...
```

**推则**：
- 实体类名通常映射为蛇形表名（如 `ConsultApplyV2PO` → `consult_apply_v2`），**不编造映射关系**——仅当 `@Table` 注解提供确切表名时才确认
- 无 `@Table` 注解时，记录类名并标注 `⏳ 待确认：未找到 @Table 注解，表名无法从代码确定`
- DO（非JPA实体，可能是纯数据传输对象）不提取表名，仅提取字段名

#### 5.2.4 Service 接口扫描

**查找命令**：
```bash
find <代码仓库路径> -name "*Service.java" -type f -not -path "*/target/*" | grep -v "Impl"
```

**提取内容**：
- 接口名
- 主要方法签名（只提取 public 方法，忽略 getter/setter）

**输出格式**：
```
[服务] ConsultationApplyService
  [方法] createConsultationApply → (CreateConsultationApplyParam) → QueryConsultationDTO
  [方法] queryConsultationApplyList → (QueryConsulApplyInfoParam) → WinPagedList<QueryApplyConsultationDTO>
```

#### 5.2.5 配置文件扫描

**查找命令**：
```bash
find <代码仓库路径> -name "application.yml" -o -name "application.properties" -o -name "pom.xml" | grep -v "/target/"
```

**提取内容**：
- `pom.xml`：`<artifactId>`、`<name>`、`<dependencies>`（识别跨模块依赖）、Spring Boot 版本
- `application.yml`：`spring.application.name`、`server.port`、数据源配置

**输出格式**：
```
[配置] winning-emr-consultation → Spring Boot, artifactId: winning-emr-consultation
  [依赖] winning-emr-consultation-v2-common
  [依赖] winning-emr-consultation-v2-dto
```

### 5.3 前端代码扫描

#### 5.3.1 路由扫描

**查找命令**：
```bash
find <前端项目路径> -path "*/router/modules/*.js" -type f
# 或
find <前端项目路径> -path "*/router/index.js" -type f
```

**提取内容**：
- 路由路径（`path` 字段）
- 页面组件引用（`component` 字段）
- 路由名称/标题（`name`、`meta.title` 字段）

**输出格式**：
```
[路由] /consultation/apply → ConsultationConfiguration/Apply（会诊申请）
[路由] /consultation/audit → ConsultationConfiguration/Audit（会诊审核）
[路由] /consultation/calendar → consultationCalendar（会诊日历）
```

#### 5.3.2 API 调用扫描

**查找命令**：
```bash
find <前端项目路径> -path "*/api/modules/*.js" -type f
```

**提取内容**：
- API 名称（export 的 key）
- URL 路径
- Domain（微服务域名，如 `@/inpatient-clinicalnote`）

**输出格式**：
```
[前端API] queryOutpatientEncounter → /api/v1/app_record_inpatient/emr_consult/outpatient_encounter/query (@ /inpatient-clinicalnote)
```

#### 5.3.3 页面目录扫描

**查找命令**：
```bash
ls <前端项目路径>/src/pages/    # 或 src/views/
```

**提取内容**：
- 页面目录名 → 对应业务模块

**输出格式**：
```
[页面] ConsultationConfiguration → 会诊配置管理
[页面] MedicalRecordConsultation → 病历会诊
[页面] ConsultantExpense → 会诊费用
```

### 5.4 模块映射

将代码扫描结果与 `references/module-checklist.md` 的业务模块清单进行映射。

**映射逻辑**（按优先级尝试）：
1. Controller 的 `@Api(tags=...)` 值中的关键词与模块名称匹配（最高置信度）
2. 前端页面目录名称与模块名称的关键词匹配
3. Maven 模块名称（artifactId）与模块名称关键词匹配
4. 以上都无法匹配时，保留代码模块名，标注 `⏳ 待确认`

**输出格式**（生成临时映射表）：

| 业务模块编码 | 业务模块名称 | 后端代码模块 | 前端页面 | 匹配方式 | 置信度 |
|-------------|-------------|-------------|---------|---------|--------|
| BLGL-05-HZGL | 会诊管理 | winning-emr-consultation (v2-apply/v2-audit/v2-task/v2-write/v2-setting) | winning-webui-emr-consultation (ConsultationConfiguration, MedicalRecordConsultation) | @Api tags 匹配"会诊" | 高 |
| BLGL-12-MBGL | 模板管理 | winning-mds-emr-template | winning-webui-emr-template | artifactId 匹配"template" | 中 |
| BLGL-13-BASY | 病案首页 | winning-emr-ipt (emrset) | — | 待确认 | 低 ⏳ |

**置信度为低的行**：在映射表中标注 `⏳ 待确认：需人工确认 <代码模块> 与 <业务模块> 的对应关系`。

### 5.5 扫描结果汇总与输出

所有扫描结果汇总为一个结构化对象（内部使用，不生成持久化文件）：

```
{
  "repoRoot": "E:/39EMR/sr-next",
  "scanTimestamp": "2026-08-11T10:00:00",
  "backendProjects": [
    {
      "name": "winning-emr-consultation",
      "type": "maven-multi-module",
      "modules": [
        {
          "name": "v2-apply",
          "controllers": [{ "className": "ConsultApplyController", ... }],
          "entities": [{ "className": "ConsultApplyV2PO", ... }],
          "services": [{ "className": "ConsultationApplyService", ... }]
        },
        ...
      ]
    },
    ...
  ],
  "frontendProjects": [
    {
      "name": "winning-webui-emr-consultation",
      "routes": [...],
      "apiCalls": [...],
      "pages": [...]
    },
    ...
  ],
  "moduleMapping": [
    { "businessCode": "BLGL-05-HZGL", "backendModule": "winning-emr-consultation", ... },
    ...
  ],
  "scanErrors": []
}
```

### 5.6 扫描错误与降级处理

| 错误场景 | 处理 |
|---------|------|
| 某 Controller 文件无法读取（编码问题） | 跳过该文件，记录到 scanErrors，继续扫描其他文件 |
| ApiPathConstant 引用无法解析（常量文件不存在） | URL 标注为"常量引用未解析"，记录到 scanErrors |
| @Table 注解缺失 | 实体标注"表名未确认"，记录到 scanErrors |
| 前端 router 目录结构不符合预期 | 跳过路由扫描，只做页面目录扫描 |
| 整个后端目录扫描超时（单项目扫描 >60s） | 降级为"文件名列表模式"：只记录 Controller/PO/Service 文件名而不解析内容 |
| 代码仓库过大（>300个Controller 或 >500个PO） | 降级为"项目名列表模式"：只扫描顶层目录结构 + 各模块的 Controller 文件名列表，不深入解析方法 |
| 代码仓库结构与 module-checklist.md 不匹配 | 不停止。扫描结果按实际目录结构输出，模块映射表标记 `⏳ 待确认：需人工确认代码与业务模块的对应关系` |

### 5.7 扫描信息注入 Spec 的规则

代码扫描信息作为**补充素材**，与资料区文档并列使用。遵循以下优先级矩阵：

| Spec 章节 | 优先来源 | 代码来源使用方式 |
|----------|---------|----------------|
| API端点列表 | 接口文档 > 代码 Controller + ApiPathConstant | 直接填入，标注 `（来源：代码）` |
| 数据实体与表名 | 功能清单数据表清单 > 代码 PO @Table | 直接填入，标注 `（来源：代码）` |
| 数据字段定义 | 历史需求 xlsx 概念ID > 代码 PO 字段 | 填入字段名和类型，概念ID标注 `⏳ 待确认` |
| 页面路径 | 代码 router 配置 | 直接填入 -Spec 第6章，标注 `（来源：代码）` |
| 技术栈信息 | 代码 pom.xml + application.yml | 直接填入，标注 `（来源：代码）` |
| 模块架构 | 代码目录结构 | 直接填入 Phase 1 第8章，标注 `（来源：代码）` |
| 业务规则 (BR) | 历史需求 xlsx（不可替代） | **代码不能提供 BR**——BR 必须来自需求文档 |
| Given/When/Then 场景 | 历史需求 xlsx（不可替代） | **代码不能提供场景**——场景必须来自需求文档 |
| 性能/安全指标 | 历史需求 xlsx + 功能清单 md（不可替代） | **代码不能提供指标**——指标必须来自需求文档 |
| C-DARHS 判定 | 功能清单 md + 历史需求 xlsx（主要依据） | Controller @ApiOperation 标签辅助确认功能是否涉及 Action/Decision；**不作为分级的主要依据** |

**核心原则**：代码是客观事实的可靠来源（API 路径、表名、字段名、技术栈），但**不是业务逻辑的来源**（规则、场景、验收标准）。两类信息在 Spec 中通过来源标注明确区分。
