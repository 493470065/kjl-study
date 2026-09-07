# BLGL-05-HZGL-003 会诊答复与记录 - Spec

> **功能编号**：BLGL-05-HZGL-003
> **文档类型**：Spec（研发视角）
> **文档版本**：V1.0
> **编写时间**：2026-08-21
> **编写人**：RACC

---

## 文档索引

本节提供本文档的章节结构索引与关联文档索引，便于读者快速定位与检索。

#### 章节索引

**PM-Spec（业务视角）**

| 章节号 | 章节名称 | 内容说明 |
|--------|---------|---------|
| 一 | 目标 | 一句话描述功能目标 |
| 二 | 约束 | 业务约束、技术约束、非功能性约束 |
| 三 | 验收标准 | 验收标准与验证方法 |
| 四 | 排除范围 | 本次不做、明确边界 |
| 五 | 关键决策记录 | 方案决策、其他决议 |
| 六 | 优先级 | 需求优先级说明 |
| 附录 | 填写检查清单 | 检查项与完成状态 |

**Analyst-Spec（产品视角）**

| 章节号 | 章节名称 | 内容说明 |
|--------|---------|---------|
| 一 | 功能编号体系 | 带父子层级的编号树 |
| 二 | 核心业务流程 | Mermaid 流程图 |
| 三 | 功能规格说明 | 各子功能点的概述、用户角色、业务流程、验收标准 |
| 四 | 排除范围 | 本需求不包含的功能项 |
| 五 | 业务规则清单 | 规则ID、规则名称、规则描述、优先级 |
| 六 | 关联文档 | 文档类型、文档路径、说明 |
| 七 | 待确认问题清单 | 所有 ⏳ 待确认项的汇总 |
| - | 填写检查清单 | 检查项与完成状态 |

**Spec（研发视角）**

| 章节号 | 章节名称 | 内容说明 |
|--------|---------|---------|
| 第1章 | 文档概述 | 文档目的、文档范围、术语定义、阅读指南、参考文档 |
| 第2章 | 功能背景与定位 | 功能背景、功能定位、目标用户、核心价值 |
| 第3章 | 业务流程设计 | 主流程/异常流程/边界流程（Given/When/Then） |
| 第4章 | 数据模型设计 | 核心数据结构、状态定义、系统参数定义 |
| 第5章 | 接口契约设计 | API列表、接口详细设计、错误码定义 |
| 第6章 | 技术方案设计 | 页面路径、技术栈、关键技术点、部署方案 |
| 第7章 | 测试用例预设计 | 功能/边界/异常/性能测试用例 |
| 第8章 | 非功能性要求 | 性能、安全、可用性、兼容性 |
| 第9章 | 依赖与风险 | 外部依赖、风险项 |
| 第10章 | 附录 | 流程图、时序图、参考文档 |

#### 版本历史

| 版本 | 日期 | 变更说明 | 编写人 |
|------|------|---------|--------|
| V1.0 | 2026-08-21 | 初始版本 | RACC |

#### 关联文档索引

| 序号 | 文档名称 | 文档类型 | 版本 | 位置 |
|------|---------|---------|------|------|
| 1 | BLGL-05-HZGL-003_会诊答复与记录-Spec.md | Spec（研发视角）（本文档） | V1.0 | 本目录 |
| 2 | BLGL-05-HZGL-003_会诊答复与记录_PM-spec.md | PM-Spec（业务视角） | V0.1 | 本目录 |
| 3 | BLGL-05-HZGL-003_会诊答复与记录_Analyst-spec.md | Analyst-Spec（产品视角） | V1.0 | 本目录 |
| 4 | BLGL-05-HZGL 05会诊管理功能点Spec.md | 功能点Spec（模块级） | V1.0 | 上级目录 |
| 5 | 新会诊历史需求.xlsx | 历史需求（资料区） | - | 资料区 |

> 📌 第4项为 Phase 1 输出，必须引用。版本号与 Phase 1 功能点Spec 实际版本一致。

---

## 1、文档概述

### 1.1、文档目的

本文档旨在明确"会诊答复与记录"功能（BLGL-05-HZGL-003）的业务背景与设计方案，为需求分析、研发实现、测试验收及评审提供统一的业务上下文、设计口径与决策依据。

**具体目的包括**：

1. 梳理会诊答复与记录功能的业务由来与历史需求演进脉络，说明"为什么要做"；
2. 明确功能的定位边界、目标用户与核心价值，回答"做成什么"；
3. 描述功能的业务流程、数据模型、接口契约与技术方案，回答"怎么做"；
4. 预设计测试用例并明确非功能性要求、依赖与风险，为研发与验收提供依据；
5. 作为 SPEC（功能编号体系、功能详情、业务规则、验收标准等章节）的业务前提与设计输入，保证各层文档业务口径一致。

> 📌 第1~2点对应业务层，第3~5点对应设计层。资料区的需求分析原文作为业务层素材，历史需求中的设计描述作为设计层素材。

### 1.2、文档范围

#### 1.2.1 纳入范围

本文档覆盖会诊答复与记录功能的完整业务背景与设计，包括：

- 受邀医生查看患者病历信息，提交会诊答复（会诊意见/诊断/治疗建议）
- 会诊记录书写（编辑器支持，含模板加载、病历内容编辑与保存）
- 会诊记录签署（CA签名/电子签名，支持多人加签）
- 会诊记录PDF生成
- 会诊诊疗方案文书（MDT诊疗方案文书的创建、保存、提交、撤销）
- 会诊完成后生成会诊病程记录关联（参数控制）
- 会诊记录列表显示状态优化
- 会诊书写助手侧边栏拖拽宽度后支持记忆
- 会诊助手展示支持底部展示
- 会诊组件大字版改造
- 会诊记录单右键增加短语收藏功能
- 会诊记录大文本内容落库
- 会诊对接归档状态
- 会诊评价与反馈（基础能力BC-HZGL-001）
- 会诊附件管理（基础能力BC-HZGL-005）
- 会诊助手与智能提醒（基础能力BC-HZGL-006）
- 申请人答复会诊逆向流程（申请人可答复会诊）
- 会诊完成后是否支持答复人直接撤销答复

#### 1.2.2 排除范围

本文档不涉及以下内容（详见其他功能点或模块）：

- 会诊申请（BLGL-05-HZGL-001）：会诊申请的创建、提交、撤销、删除等
- 会诊审核（BLGL-05-HZGL-002）：审核流程、审核意见、多级审核等
- 会诊接收与指派（BLGL-05-HZGL-004）：会诊任务接收、指派具体医生等
- 会诊签到（BLGL-05-HZGL-005）：医生到场签到、撤销签到、代为签到等
- 会诊计费（BLGL-05-HZGL-006）：费用计算、医保校验、账单生成等
- 会诊配置管理（BC-HZGL-003）：参数配置、审核流程配置、科室配置等
- 会诊查询与统计（BC-HZGL-002）：统计报表、工作量统计等

### 1.3、术语定义

| 术语 | 定义 |
|------|------|
| 会诊答复 | 受邀医生完成会诊后，通过书写编辑器提交的会诊意见、诊断与治疗建议（来源：需求） |
| 会诊记录 | 会诊答复内容的正式病历文书，以EMR_CONSULT_SET为核心记录，包含会诊意见、诊断、治疗建议等（来源：代码） |
| 会诊记录签署 | 会诊医生通过CA签名或电子签名对会诊记录进行签署确认的操作（来源：需求） |
| 会诊诊疗方案文书 | MDT会诊场景下，多学科团队协作制定的诊疗方案正式文书，通过独立模板创建（来源：代码） |
| 会诊病程记录 | 会诊完成后，系统自动或手动在病程记录中生成会诊相关的病程记录（来源：需求） |
| 会诊进展 | 会诊流程中各环节的状态展示，包括申请、审核、接收、签到、答复、完成等（来源：代码） |
| 会诊评价与反馈 | 会诊完成后，申请医生对会诊过程和结果进行评价，受邀医生可对评价进行反馈（来源：需求） |
| 会诊附件 | 会诊过程中上传的辅助材料，如影像资料、检查报告等（来源：代码） |
| 会诊助手 | 会诊书写过程中的智能辅助工具，支持拖拽调整宽度、底部展示模式、短语收藏等（来源：需求） |
| 逆向流程 | 申请人答复会诊的流程，即申请医生可对会诊结果进行答复确认（来源：需求） |
| 会诊结论意见书 | 会诊结论的正式文书，通过v1接口`/consult/conclusion/add`创建（来源：代码） |
| 大文本落库 | 将会诊记录的大文本内容（Base64编码）直接写入EMR_CONSULT_SET_CONTENT表的EMR_CONTENT字段（byte[]）（来源：代码） |

### 1.4、阅读指南

- **章节关系**：第1~2章为阅读铺垫与业务全貌（背景、定位、用户、价值）；第3~10章为设计实现层（流程、数据、接口、技术、测试、非功能、依赖风险、附录），可直接用于研发与测试。与 Analyst-Spec（产品视角）、PM-Spec（业务视角）的详细规则/验收口径互相引用，保持一致。
- **读者对象**：
  - 产品经理/需求分析师：阅读第1~2章了解业务全貌，据此维护 PM-Spec 与功能清单；
  - 研发：阅读第3~6章用于开发实现，第9~10章用于依赖评估与联调；
  - 测试：阅读第3章、第7~8章用于用例设计与验收；
  - 评审人员：以本文档为业务口径与设计基准，核对各层文档一致性。

### 1.5、参考文档

| 序号 | 文档名称 | 版本/日期 |
|------|---------|----------|
| 1 | 【历史需求】新会诊历史需求.xlsx（117条需求） | - |
| 2 | BLGL-05-HZGL-003_会诊答复与记录_PM-spec.md | V0.1 |
| 3 | BLGL-05-HZGL-003_会诊答复与记录_Analyst-spec.md | V1.0 |
| 4 | BLGL-05-HZGL 05会诊管理功能点Spec.md | V1.0 |
| 5 | 代码仓库扫描结果（sr-next/winning-emr-consultation-next） | 2026-08-21 |

---

## 2、功能背景与定位

### 2.1 功能背景

会诊答复与记录是会诊管理模块的核心输出环节，是受邀医生将会诊诊疗意见转化为正式病历文书的关键步骤，需满足：

- **管理要求**：会诊答复是跨科室协作诊疗的核心产出，需保证会诊意见的规范性、完整性和可追溯性。会诊记录作为正式病历文书，需满足病历书写规范、签署规范和归档要求。会诊病程记录需与患者病程记录体系关联。（来源：需求）
- **现状痛点**：
  - 会诊答复提交后，缺乏会诊记录书写的统一编辑器支持，模板加载和内容填充效率低
  - 会诊记录签署流程不完善，多人加签场景支持不足
  - 会诊完成后生成会诊病程记录缺乏参数控制，部分医院不需要自动生成
  - 会诊记录列表状态展示不清晰，用户无法快速定位待签署/待处理的记录
  - 会诊书写助手侧边栏宽度无法记忆，每次打开需重新调整
  - 会诊记录单右键缺乏短语收藏功能，常用短语重复录入效率低
  - 会诊大文本内容落库不完整，历史记录追溯困难
  - 会诊对接归档状态不明确，导致无纸化归档流程中断（来源：需求）
- **历史需求演进**：通过对资料区新会诊历史需求.xlsx中117条需求的梳理，会诊答复与记录功能经历了从基础的会诊意见提交到会诊记录书写编辑器、会诊记录签署、PDF生成、诊疗方案文书、病程记录关联、评价与反馈、附件管理、会诊助手等子功能的逐步演进过程。当前版本在v2架构（winning-emr-consultation-next）中采用独立书写模块（v2-write）实现，支持会诊答复的保存、提交、撤销全流程，并集成病历编辑器、签署组件、PDF生成组件等。（来源：需求 + 代码）

### 2.2 功能定位

"会诊答复与记录"是WiNEX病历管理（住院）-会诊管理模块的核心输出功能，定位为：

- **会诊意见标准化输出入口**：统一承载受邀医生提交会诊意见、诊断、治疗建议的书写与提交入口，是会诊流程的核心产出环节（来源：需求）
- **会诊记录全生命周期管理**：覆盖会诊记录的创建、编辑、保存（草稿）、提交、签署、撤销、归档全流程，与会诊申请、审核、接收、签到等环节形成完整闭环（来源：需求 + 代码）
- **病历文书生产能力**：集成病历编辑器，支持模板加载、内容填充、结构化录入、大文本落库，产出符合病历规范的会诊记录文书（来源：需求 + 代码）
- **智能辅助书写体验**：通过会诊助手（侧边栏/底部展示、宽度记忆、短语收藏）和智能提醒，提升会诊答复的书写效率和准确性（来源：需求）

### 2.3 目标用户

| 用户角色 | 主要使用场景 |
|---------|-------------|
| 受邀医生（会诊医生） | 查看患者病历信息，通过会诊书写编辑器提交会诊意见、诊断与治疗建议，完成会诊记录签署（来源：需求） |
| 申请医生（住院医生） | 在会诊完成后查看会诊记录，对会诊进行评价与反馈，申请人在逆向流程中答复会诊结果（来源：需求） |
| 科室主任/主治医师 | 审核会诊记录，进行会诊记录的加签或审核签署（来源：需求） |
| 院总/科室管理员 | 查看会诊进展，监控会诊完成状态，处理会诊记录归档（来源：需求） |

### 2.4 核心价值

| 价值维度 | 价值描述 |
|---------|---------|
| 诊疗质量保障 | 通过标准化会诊意见书写模板和结构化录入，保证会诊意见的完整性和规范性，避免遗漏关键诊疗信息（来源：需求） |
| 文书合规性 | 会诊记录作为正式病历文书，支持签署（CA签名/电子签名/患者签名）、PDF生成、归档对接，满足病历书写规范和法律法规要求（来源：需求） |
| 书写效率提升 | 通过会诊助手（侧边栏/底部展示、宽度记忆、短语收藏）、模板加载、智能填充等功能，显著提升会诊答复的书写效率（来源：需求） |
| 流程闭环 | 会诊答复创建会诊记录，完成会诊后生成会诊病程记录进行关联，评价与反馈形成会诊质量闭环，确保会诊流程的完整可追溯（来源：需求） |
| 团队协作 | 支持多人加签、MDT诊疗方案文书、申请人答复逆向流程，满足多学科协作场景下的会诊记录需求（来源：需求） |

---

## 3、业务流程设计（Given/When/Then）

> 📌 以下场景从资料区中的需求分析原文和代码仓库扫描结果提取。每个场景的 Given/When/Then 内容必须有需求原文或代码事实对应依据。

### 3.1 主流程

**Scenario 1: 受邀医生提交会诊答复并完成会诊记录**

```gherkin
Given:
  - 受邀医生已登录住院医生站，会诊任务已接收并签到（如配置为强制签到）
  - 会诊申请处于"待答复"阶段状态（STAGE_STATUS = SUBMIT / 已发送）
  - 系统已配置会诊答复模板（MRT_MONITOR_ID 区分申请单/答复单）
  - 患者有有效的ENCOUNTER_ID，病历信息可正常查询

When:
  - 受邀医生在会诊任务列表中选择"答复"操作
  - 系统通过 queryCanReplyConsultInvitationInfoList 查询可答复的会诊邀请列表
  - 系统通过 createConsultReply 创建会诊答复单（生成EMR_CONSULT_SET记录，mrtMonitorId为答复单模板ID）
  - 系统加载会诊答复模板，通过 queryEmrConsultSetContentView 查询会诊病历内容列表
  - 受邀医生在病历编辑器中填写会诊意见、诊断、治疗建议
  - 受邀医生通过 saveConsultationApply（保存）或 submitConsultationApply（提交）保存或提交会诊答复
  - 所有受邀医生均完成答复后，申请医生或院总执行 completedConsultation 完成会诊
  - 系统根据参数配置判断是否自动生成会诊病程记录

Then:
  - 会诊答复单创建成功，EMR_CONSULT_SET 记录状态为 DRAFT（草稿）或 SUBMIT（已提交）
  - 会诊答复内容写入 EMR_CONSULT_SET_CONTENT 表（EMR_CONTENT 字段为 byte[] 大文本，来源：代码）
  - 会诊邀请记录（EMR_CONSULT_INVITATION）的 CONSULT_STATUS_CODE 变更为已答复
  - 会诊进展列表（queryProgressView）展示答复状态
  - 如配置为自动生成会诊病程记录，系统创建病程记录并关联会诊
  - 会诊记录列表状态更新显示为"已答复"
  - 系统记录操作日志（EMR_SET_ACTION_LOG）
```

### 3.2 异常流程

**Scenario 2: 会诊答复提交时病历版本冲突（业务异常）**

```gherkin
Given:
  - 受邀医生已打开会诊答复编辑器，正在编辑会诊意见
  - 会诊记录已被其他用户（如加签医生）修改并提交，EMR_SET_VERSION 已递增
  - 受邀医生编辑完成后点击提交

When:
  - 系统校验 emrSetVersion 与数据库当前版本不一致
  - 后端提交校验失败

Then:
  - 系统提示"会诊记录已被修改，请刷新后重新编辑提交"
  - 提交操作被拒绝，数据不写入
  - 用户需刷新页面获取最新版本后重新编辑
  - 系统记录版本冲突的操作日志
```

**Scenario 3: 会诊完成时仍有未答复的受邀医生（数据异常）**

```gherkin
Given:
  - 会诊申请包含多个受邀科室/医生
  - 部分受邀医生尚未提交会诊答复
  - 申请医生或院总尝试执行 completedConsultation 完成会诊

When:
  - 系统校验所有受邀医生的答复状态
  - 检测到存在未答复的受邀医生

Then:
  - 系统提示"存在未答复的会诊医生，请等待所有医生完成答复后再完成会诊"
  - 完成会诊操作失败，会诊状态保持不变
  - 前端展示未答复医生列表，供用户联系确认
```

**Scenario 4: PDF生成失败（系统异常）**

```gherkin
Given:
  - 会诊记录已签署完成，状态为已提交
  - 用户点击"生成PDF"按钮
  - PDF生成服务（内部或第三方组件）响应异常或超时

When:
  - 前端调用 generatePdf 接口（consult_patient_sign/generatePdf）
  - 后端PDF生成服务处理失败

Then:
  - 系统提示"PDF生成失败，请稍后重试或联系管理员"
  - 前端不阻塞，PDF生成失败不影响会诊记录的已提交状态
  - 系统记录PDF生成失败的异常日志
  - 提供重试按钮供用户再次尝试
```

### 3.3 边界流程

**Scenario 5: 会诊完成后答复人直接撤销答复（边界场景）**

```gherkin
Given:
  - 会诊已完成（COMPLETED），会诊记录已提交
  - 系统参数配置允许答复人直接撤销答复（来源：需求）
  - 答复人（受邀医生）具有撤销权限

When:
  - 答复人点击"撤销答复"按钮
  - 系统调用 undoCompletedConsultation 或 cancelConsultReply 接口
  - 系统校验撤销条件（是否允许已完成会诊撤销答复）

Then:
  - 如允许撤销：会诊答复记录回退至草稿状态，会诊阶段状态回退至"待答复"或"会诊中"
  - 如不允许撤销：系统提示"会诊已完成，不支持撤销答复，请联系管理员"
  - 撤销操作记录操作日志
  - 会诊进展列表更新状态
```

**Scenario 6: 申请人答复会诊逆向流程（边界场景）**

```gherkin
Given:
  - 会诊已由受邀医生完成答复
  - 系统参数配置支持申请人答复会诊逆向流程（来源：需求）
  - 申请医生具有答复权限

When:
  - 申请医生在会诊详情页选择"申请人答复"操作
  - 系统通过逆向流程创建工作流（autoCompleteConsultByApplicantWorkFlow）
  - 申请医生填写会诊确认意见或补充意见
  - 申请医生提交答复

Then:
  - 逆向流程的会诊答复记录创建成功
  - 会诊阶段状态根据配置自动完成或保持
  - 会诊进展列表展示逆向流程的答复记录
  - 受邀医生可查看申请人的答复意见
  - 系统记录逆向流程操作日志
```

---

## 4、数据模型设计

> 📌 以下数据模型信息来自代码仓库扫描结果（来源：代码）和资料区需求描述。

### 4.1 核心数据结构

#### 4.1.1 核心保存请求

会诊答复保存/提交请求参数结构（来源：代码，ConsultReplyBasicService.SaveConsultReplyParam / SubmitConsultReplyParam）：

| 字段名 | 类型 | 必填 | 备注 |
|--------|------|------|------|
| replyConsultEmrSetId | Long | 是 | 会诊答复单病历标识（EMR_CONSULT_SET_ID） |
| emrContentBase64 | String | 是 | 病历内容（Base64编码） |
| emrSetVersion | Long | 是 | 病历当前版本（乐观锁） |
| hospitalSOID | String | 是 | 医院SOID |
| ipAddress | String | 否 | IP地址 |
| macAddress | String | 否 | MAC地址 |

会诊答复创建请求参数（来源：代码，ConsultReplyBasicService.ReplyConsultParam）：

| 字段名 | 类型 | 必填 | 备注 |
|--------|------|------|------|
| emrConsultApplyId | Long | 是 | 会诊申请ID |
| emrConsultInvitationId | Long | 是 | 会诊邀请ID |
| currentDeptId | Long | 是 | 当前科室ID |

#### 4.1.2 核心表/实体

| 表/实体 | 关键字段 | 说明 |
|---------|---------|------|
| EMR_CONSULT_SET (EmrConsultSetV2PO) | EMR_CONSULT_SET_ID, EMR_CLASS_ID, MRT_ID, EMR_STATUS, EMR_SET_TITLE, EMR_SET_AT, MRT_MONITOR_ID, EMR_SET_SUBMIT_BY, EMR_SET_SUBMIT_AT, EMR_SET_SUBMIT_NAME, PRINTED_STATUS, ENCOUNTER_ID, EMR_SET_VERSION, EMR_SET_PRINTED_BY, EMR_SET_PRINTED_NAME, EMR_SET_PRINTED_AT, EMR_SET_CHECKED_BY, EMR_SET_CHECKED_NAME, EMR_SET_CHECKED_AT, SOURCE_CODE, PRINTED_COUNT 共21个字段 | 会诊病历记录主表，存储会诊记录（申请单/答复单/诊疗方案文书）的元数据。MRT_MONITOR_ID区分文书类型（申请单/答复单/诊疗方案）。EMR_STATUS控制文书状态（草稿/已提交/已签署等）。来源：代码 |
| EMR_CONSULT_SET_CONTENT (EmrConsultSetContentV2PO) | EMR_CONSULT_SET_CONTENT_ID, EMR_CONSULT_SET_ID, EMR_CONTENT_PLAIN_TEXT, EMR_CONTENT(byte[]) 共4个字段 | 会诊病历内容表，存储大文本病历内容。EMR_CONTENT为byte[]大字段，存储压缩后的内容。来源：代码 |
| EMR_CONSULT_FEEDBACK (ConsultFeedbackV2PO) | EMR_CONSULT_FEEDBACK_ID, EMR_CONSULT_INVITATION_ID, EMR_CONSULT_APPLY_ID, FEEDBACK_TYPE_FLAG, FEEDBACK_AT, FEEDBACK_BY, FEEDBACK_STATUS 共7个字段 | 会诊评价与反馈表，记录评价与反馈的状态和类型。来源：代码 |
| EMR_CONSULT_FEEDBACK_CONTENT (EmrConsultFeedbackContentV2PO) | EMR_CONSULT_FEEDBACK_ID, EMR_CONTENT, EMR_CONTENT_PLAIN_TEXT 共3个字段 | 会诊评价与反馈内容表，存储评价/反馈的详细内容。来源：代码 |
| EMR_CONSULT_ATTACHMENT (EmrConsultAttachmentV2PO) | EMR_CONSULT_ATTACHMENT_ID, EMR_CONSULT_APPLY_ID, ATTACHMENT_NAME, ATTACHMENT_PATH, ATTACHMENT_TYPE_NAME 共5个字段 | 会诊附件表，存储会诊过程中上传的附件信息。来源：代码 |
| EMR_CONSULT_ACTION_LOG (ConsultActionLogV2PO) | 操作日志相关字段，10个字段 | 会诊操作日志表，记录答复、提交、撤销、签署等操作。来源：代码 |
| EMR_HISTORY (EmrHistoryV2PO) | EMR_HISTORY_ID, EMR_CONTENT, EMR_SET_VERSION, EMR_CONSULT_SET_ID 共4个字段 | 病历历史记录表，存储会诊记录的版本历史。来源：代码 |

### 4.2 状态定义

#### 会诊记录状态（EMR_STATUS）

| 状态码 | 状态名称 | 说明 |
|--------|---------|------|
| ⏳ 待确认 | DRAFT（草稿） | 会诊记录已创建但未提交，可编辑修改（来源：代码） |
| ⏳ 待确认 | SUBMIT（已提交） | 会诊记录已提交，等待签署或已完成签署（来源：代码） |
| ⏳ 待确认 | SIGNED（已签署） | 会诊记录已完成签署 |

#### 会诊阶段状态（STAGE_STATUS）

| 状态码 | 状态名称 | 说明 |
|--------|---------|------|
| ⏳ 待确认 | 未发送 | 会诊申请未发送 |
| ⏳ 待确认 | 已发送 | 会诊申请已发送，等待处理 |
| ⏳ 待确认 | 会诊中 | 会诊流程进行中（接收/签到/答复） |
| ⏳ 待确认 | CONSULT_COMPLETE（会诊完成） | 会诊已完成（来源：代码，StageStatusEnum.CONSULT_COMPLETE） |
| ⏳ 待确认 | 会诊取消 | 会诊已取消 |

#### 会诊邀请状态（CONSULT_STATUS_CODE）

| 状态码 | 状态名称 | 说明 |
|--------|---------|------|
| ⏳ 待确认 | 待接收 | 受邀科室/医生尚未接收会诊邀请 |
| ⏳ 待确认 | 已接收 | 受邀科室/医生已接收会诊邀请 |
| ⏳ 待确认 | 已签到 | 会诊医生已签到 |
| ⏳ 待确认 | 已答复 | 会诊医生已提交会诊答复 |
| ⏳ 待确认 | 已拒绝 | 受邀科室/医生拒绝会诊邀请 |

> 📌 部分状态码和编码值待从代码PO实体中的枚举定义或常量类中确认具体值。状态流转逻辑见第10章流程图。

### 4.3 系统参数定义

| 参数编码 | 参数名称 | 说明 |
|---------|---------|------|
| ⏳ 待确认 | 会诊完成后生成病程记录参数 | 控制会诊完成后是否自动生成会诊病程记录。增加参数控制，支持按医院/科室配置是否自动生成（来源：需求） |
| ⏳ 待确认 | 会诊完成后支持答复人撤销答复参数 | 控制会诊完成后是否允许答复人直接撤销答复（来源：需求） |
| ⏳ 待确认 | 会诊助手侧边栏宽度记忆参数 | 会诊书写助手侧边栏拖拽宽度后是否支持记忆，存储宽度值（来源：需求） |
| ⏳ 待确认 | 会诊回复模板配置 | 配置会诊答复单使用的病历模板（MRT_MONITOR_ID区分）（来源：代码） |
| ⏳ 待确认 | 会诊组件大字版模式参数 | 控制会诊组件是否启用大字版改造（来源：需求） |

> 📌 系统参数的具体编码和参数路径待从代码中 EMR_CONSULT_PARAM 实体或前端的参数配置页面确认。

---

## 5、接口契约设计

> 📌 接口列表和详细设计来自代码仓库扫描结果（来源：代码）。

### 5.1 API列表

| 序号 | API名称（代码函数） | 路径 | 方法 | 说明 |
|:----:|---------|------|:----:|------|
| 1 | queryCanReplyConsultInvitationInfoList | /api/v1/app_record_consult_v2/consult_write/queryCanReplyConsultInvitationInfoList | POST | 会诊答复列表查询（来源：代码） |
| 2 | createConsultReply | /api/v1/app_record_consult_v2/consult_write/createConsultReply | POST | 会诊答复创建（来源：代码） |
| 3 | saveConsultationApply | /api/v1/app_record_consult_v2/consult_write/saveConsultationApply | POST | 会诊申请保存/答复保存（来源：代码） |
| 4 | submitConsultationApply | /api/v1/app_record_consult_v2/consult_write/submitConsultationApply | POST | 会诊申请提交/答复提交（来源：代码） |
| 5 | cancelConsultReply | /api/v1/app_record_consult_v2/consult_write/cancelConsultReply | POST | 会诊撤销答复（来源：代码） |
| 6 | undoConsultationApply | /api/v1/app_record_consult_v2/consult_write/undoConsultationApply | POST | 会诊申请撤销/答复撤销（来源：代码） |
| 7 | queryEmrConsultSetContentView | /api/v1/app_record_consult_v2/consult_write/queryEmrConsultSetContentView | POST | 查询会诊病历内容列表（来源：代码） |
| 8 | queryProgressView | /api/v1/app_record_consult_v2/consult_write/queryProgressView | POST | 查询会诊进展列表（来源：代码） |
| 9 | completedConsultation | /api/v1/app_record_consult_v2/consult_write/completedConsultation | POST | 完成会诊（来源：代码） |
| 10 | undoCompletedConsultation | /api/v1/app_record_consult_v2/consult_write/undoCompletedConsultation | POST | 撤销完成会诊（来源：代码） |
| 11 | saveFeedBack | /api/v1/app_record_consult_v2/consult_write/saveFeedBack | POST | 提交评价（来源：代码） |
| 12 | queryConsultFeedBackList | /api/v1/app_record_consult_v2/consult_write/queryConsultFeedBackList | POST | 查询会诊评价接口（来源：代码） |
| 13 | undoFeedBack | /api/v1/app_record_consult_v2/consult_write/undoFeedBack | POST | 撤销评价/反馈提交（来源：代码） |
| 14 | initConsultFeedBack | /api/v1/app_record_consult_v2/consult_write/initConsultFeedBack | POST | 查询会诊评价初始化接口（来源：代码） |
| 15 | queryEmrDocumentPermission | /api/v1/app_record_consult_v2/consult_write/queryEmrDocumentPermission | POST | 查询会诊病历权限接口（来源：代码） |
| 16 | consult_attachment_queryConsultAttachmentList | /api/v1/app_record_consult_v2/consult_attachment/queryConsultAttachmentList | POST | 查询会诊附件列表（来源：代码） |
| 17 | consult_attachment_deleteAttachment | /api/v1/app_record_consult_v2/consult_attachment/deleteAttachment | POST | 附件删除（来源：代码） |
| 18 | saveCaSignatureRecordInfo | /api/v1/app_record_consult_v2/consult_write/saveCaSignatureRecordInfo | POST | 保存CA签名信息（来源：代码） |
| 19 | saveCounterSignRecord | /api/v1/app_record_consult_v2/consult_write/saveCounterSignRecord | POST | 会诊加签/撤销统一落库（来源：代码） |
| 20 | generatePdf | /api/v1/app_record_consult_v2/consult_patient_sign/generatePdf | POST | 根据XML生成PDF并返回Base64（来源：代码） |
| 21 | CONSULT_CONCLUSION_ADD_V1 | /api/v1/app_record_consult/v1/consult/conclusion/add | POST | 新增会诊结论意见书（来源：代码，v1接口） |
| 22 | CONSULT_CONCLUSION_EMR_SET_ID_GET_V1 | /api/v1/app_record_consult/v1/consult_conclusion/emr_set_id/get | POST | 查询会诊结论意见书的病历标识（来源：代码，v1接口） |
| 23 | mdt_treatment_plan_createDocument | /api/v1/app_record_consult_v2/mdt_treatment_plan/document/create | POST | 创建/获取诊疗方案文书（来源：代码） |
| 24 | mdt_treatment_plan_saveContent | /api/v1/app_record_consult_v2/mdt_treatment_plan/document/content/save | POST | 保存诊疗方案文书内容（来源：代码） |
| 25 | mdt_treatment_plan_submitDocument | /api/v1/app_record_consult_v2/mdt_treatment_plan/document/submit | POST | 提交诊疗方案文书（来源：代码） |
| 26 | mdt_treatment_plan_undoSubmit | /api/v1/app_record_consult_v2/mdt_treatment_plan/document/undo | POST | 撤销诊疗方案文书提交（来源：代码） |
| 27 | mdt_treatment_plan_queryContent | /api/v1/app_record_consult_v2/mdt_treatment_plan/document/content/query | POST | 查询诊疗方案文书内容（来源：代码） |
| 28 | mdt_treatment_plan_queryDefaultValue | /api/v1/app_record_consult_v2/mdt_treatment_plan/document/defaultValue | POST | 查询诊疗方案文书缺省值（来源：代码） |

### 5.2 接口详细设计

#### 5.2.1 createConsultReply — 会诊答复创建

**请求参数**:
```json
{
  "emrConsultApplyId": "CA2026082100001",
  "emrConsultInvitationId": "INV2026082100001",
  "currentDeptId": "DEPT005",
  "hospitalSOID": "HOSP001",
  "ipAddress": "192.168.1.100",
  "macAddress": "00-1A-2B-3C-4D-5E"
}
```

**返回值（成功）**:
```json
{
  "success": true,
  "data": {
    "emrConsultSetId": "CS2026082100001",
    "emrSetTitle": "会诊答复单",
    "emrSetVersion": 1,
    "emrStatus": "DRAFT",
    "mrtMonitorId": 1005,
    "emrSetAt": "2026-08-21 14:30:00",
    "encounterId": "ENC202608210001"
  }
}
```

**返回值（失败）**:
```json
{
  "success": false,
  "message": "会诊答复创建失败：会诊邀请状态不正确",
  "data": null
}
```

#### 5.2.2 submitConsultationApply — 会诊答复提交

**请求参数**:
```json
{
  "emrConsultSetId": "CS2026082100001",
  "emrContentBase64": "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48Um9vdD48L1Jvb3Q+",
  "emrSetVersion": 1,
  "hospitalSOID": "HOSP001",
  "ipAddress": "192.168.1.100",
  "macAddress": "00-1A-2B-3C-4D-5E"
}
```

**返回值（成功）**:
```json
{
  "success": true,
  "data": {
    "emrConsultApplyId": "CA2026082100001",
    "emrConsultSetId": "CS2026082100001",
    "emrSetVersion": 2,
    "auditStatus": 1,
    "stageStatus": "CONSULT_COMPLETE",
    "message": "会诊答复提交成功"
  }
}
```

**返回值（失败）**:
```json
{
  "success": false,
  "message": "会诊答复提交失败：病历版本已变更，请刷新后重新提交",
  "data": null
}
```

#### 5.2.3 completedConsultation — 完成会诊

**请求参数**:
```json
{
  "emrConsultApplyId": "CA2026082100001",
  "stageStatus": "CONSULT_COMPLETE",
  "hospitalSOID": "HOSP001",
  "ipAddress": "192.168.1.100",
  "macAddress": "00-1A-2B-3C-4D-5E"
}
```

**返回值（成功）**:
```json
{
  "success": true,
  "data": true,
  "message": "会诊已完成"
}
```

**返回值（失败）**:
```json
{
  "success": false,
  "message": "完成会诊失败：存在未答复的会诊医生",
  "data": null
}
```

#### 5.2.4 queryEmrConsultSetContentView — 查询会诊病历内容列表

**请求参数**:
```json
{
  "emrConsultApplyId": "CA2026082100001",
  "hospitalSOID": "HOSP001",
  "ipAddress": "192.168.1.100",
  "macAddress": "00-1A-2B-3C-4D-5E"
}
```

**返回值（成功）**:
```json
{
  "success": true,
  "data": {
    "consultationInfo": {
      "emrConsultApplyId": "CA2026082100001",
      "consultTypeCode": "DEPT_CONSULT",
      "consultPurpose": "患者反复咳嗽、发热3周...",
      "applyConsultEmployeeName": "李医生",
      "deptName": "呼吸内科"
    },
    "documentList": [
      {
        "emrConsultSetId": "CS2026082100001",
        "emrSetTitle": "会诊答复单",
        "emrStatus": "SUBMIT",
        "emrSetVersion": 2,
        "emrContentBase64": "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48Um9vdD48L1Jvb3Q+",
        "editFlag": "1",
        "createdName": "王主任",
        "createdAt": "2026-08-21 14:30:00"
      }
    ],
    "documentFillList": [
      {
        "conceptId": "CONCEPT001",
        "value": "张三"
      }
    ],
    "consultInvitationList": [
      {
        "emrConsultInvitationId": "INV2026082100001",
        "invitedDeptName": "感染科",
        "invitedEmployeeName": "王主任",
        "consultStatusCode": "REPLIED",
        "replyConsultEmrSetId": "CS2026082100001"
      }
    ]
  }
}
```

#### 5.2.5 generatePdf — 会诊记录PDF生成

**请求参数**:
```json
{
  "xmlBase64": "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48Um9vdD48L1Jvb3Q+",
  "fileName": "会诊记录_20260821.pdf",
  "emrSetId": 1001,
  "xidKeywordList": [
    {
      "xid": "SIGN_POSITION_001",
      "keyword": "患签"
    }
  ]
}
```

**返回值（成功）**:
```json
{
  "success": true,
  "data": {
    "pdfBase64": "JVBERi0xLjcNJeLjz9MNCjIw...",
    "pdfUrl": "/pdf/20260821/会诊记录_20260821.pdf",
    "fileName": "会诊记录_20260821.pdf",
    "pageCount": 3,
    "xidKeywordIndexList": [
      {
        "xid": "SIGN_POSITION_001",
        "keyword": "患签",
        "pageIndex": 1,
        "keywordIndex": 1
      }
    ]
  }
}
```

### 5.3 错误码定义

| 错误码 | 错误信息 | 处理方式 |
|--------|---------|---------|
| ⏳ 待确认 | 会诊答复创建失败：会诊邀请状态不正确 | 前端提示用户，阻止创建 |
| ⏳ 待确认 | 会诊答复提交失败：病历版本已变更，请刷新后重新提交 | 前端提示用户，引导刷新页面 |
| ⏳ 待确认 | 会诊答复提交失败：会诊已撤销 | 前端提示用户，返回列表 |
| ⏳ 待确认 | 完成会诊失败：存在未答复的会诊医生 | 前端提示用户，展示未答复医生列表 |
| ⏳ 待确认 | 完成会诊失败：会诊记录未签署 | 前端提示用户，引导完成签署 |
| ⏳ 待确认 | 撤销完成会诊失败：会诊状态不允许撤销 | 前端提示用户，阻止操作 |
| ⏳ 待确认 | 撤销答复失败：会诊已完成，不支持撤销答复 | 前端提示用户 |
| ⏳ 待确认 | 会诊记录权限不足 | 前端提示用户无权限 |
| ⏳ 待确认 | PDF生成失败，请稍后重试 | 前端提示用户，提供重试按钮 |
| ⏳ 待确认 | 参数校验失败：必填字段缺失 | 前端提示具体字段，聚焦到对应输入框 |
| ⏳ 待确认 | 系统繁忙，请稍后重试 | 前端提示用户重试，记录系统日志 |

> 📌 具体错误码编码值待从代码中的常量类或枚举定义中确认。上述为业务错误描述，编码值待补充。

---

## 6、技术方案设计

### 6.1 页面路径

- **前端页面路径（新版v2）**: winning-webui-consultation-next/src/pages/write/（来源：代码）
  - /write — 会诊书写主页面（来源：代码）
  - /write/content/index.vue — 会诊书写内容区（来源：代码）
  - /write/external/inpatient/index.vue — 住院会诊书写（外部组件）（来源：代码）
  - /write/external/emergency/index.vue — 急诊会诊书写（外部组件）（来源：代码）
  - /write/assistant/index.vue — 会诊助手（来源：代码）
  - /write/content/components/record/index.vue — 会诊记录主组件（来源：代码）
  - /write/content/components/progress/index.vue — 会诊进展组件（来源：代码）
  - /write/content/components/evaluation/index.vue — 会诊评价组件（来源：代码）
  - /write/content/components/attachment/index.vue — 会诊附件组件（来源：代码）
  - /write/content/components/treatment-plan/index.vue — 会诊诊疗方案文书组件（来源：代码）
  - /write/content/components/patient-sign/floatingPanel.vue — 患者签名浮层面板（来源：代码）
- **后端模块路径**: winning-emr-consultation-next/winning-emr-consultation-v2-write/（来源：代码）
  - Controller: EmrConsultWriteController（来源：代码）
  - Service: ConsultationWriteService, ConsultReplyService, EmrSetService, EmrSetContentService, EmrSetLogService（来源：代码）
  - Repository: EmrSetServiceRepository, EmrSetContentServiceRepository, EmrConsultFeedbackServiceRepository（来源：代码）
- **数据模型模块**: winning-emr-consultation-next/winning-emr-consultation-v2-model/（来源：代码）
  - EmrConsultSetV2PO（21个字段）
  - EmrConsultSetContentV2PO（4个字段，含byte[]大字段）
  - ConsultFeedbackV2PO（7个字段）
  - EmrConsultFeedbackContentV2PO（3个字段）

### 6.2 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架（新版） | spark（WiNEX自研前端框架） | ⏳ 待确认 |
| 前端框架（旧版） | umi | ⏳ 待确认 |
| 后端框架 | Spring Boot | ⏳ 待确认 |
| ORM框架 | JPA (Hibernate) | ⏳ 待确认 |
| 数据库 | ⏳ 待确认 | ⏳ 待确认 |
| 消息中间件 | ⏳ 待确认（消息中心对接） | ⏳ 待确认 |
| PDF生成组件 | ⏳ 待确认（基于XML转PDF） | ⏳ 待确认 |

> 📌 具体版本号待从项目pom.xml或package.json中确认。

### 6.3 关键技术点

1. **MRT_MONITOR_ID区分文书类型**：通过EMR_CONSULT_SET表中的MRT_MONITOR_ID字段区分申请单、答复单、诊疗方案文书等不同类型的会诊文书。在saveConsultationApply和submitConsultationApply中，根据MRT_MONITOR_ID判断走申请单流程（CONSULT_APPLY_MRT_MONITOR_ID）还是答复单流程（ConsultReplyBasicService）。来源：代码

2. **大文本内容落库**：会诊记录内容以Base64编码的XML格式存储在EMR_CONSULT_SET_CONTENT表的EMR_CONTENT字段（byte[]类型），支持大文本内容压缩存储。通过EmrSetContentServiceImpl实现内容的创建、更新、查询。来源：代码

3. **乐观锁版本控制**：通过EMR_SET_VERSION字段实现乐观锁机制，在保存和提交时校验版本号，防止并发修改导致的数据冲突。来源：代码

4. **会诊完成/撤销完成工作流**：completedConsultation将阶段状态设置为CONSULT_COMPLETE，undoCompletedConsultation将阶段状态回退至SUBMIT。通过工作流组件（completeConsultWorkFlow、cancelCompleteStatusWorkFlow、undoCompleteConsultByApplicantWorkFlow）触发后续操作（如自动生成病程记录、通知等）。来源：代码

5. **PDF生成**：通过consult_patient_sign/generatePdf接口，将XML内容（Base64编码）转换为PDF文件，返回PDF的Base64编码、URL地址和分页信息。支持CA签名定位（xidKeywordList）。来源：代码

6. **会诊加签/撤销**：通过saveCounterSignRecord统一落库接口，支持会诊记录的加签和撤销加签操作，记录CA签名信息。来源：代码

7. **会诊助手侧边栏宽度记忆**：会诊书写助手侧边栏支持拖拽调整宽度，拖拽后宽度值通过前端存储（localStorage或配置参数）进行记忆，下次打开自动恢复上次宽度。来源：需求

8. **会诊组件大字版改造**：针对老年医生或特殊场景，会诊组件支持大字版模式，通过参数控制切换字体大小和布局。来源：需求

9. **会诊记录单右键短语收藏**：会诊记录书写编辑器中，右键选中文本支持添加到短语收藏，方便后续快速录入常用短语。PhraseDrawer组件实现短语管理。来源：代码 + 需求

10. **会诊完成后生成病程记录参数控制**：通过系统参数配置，控制会诊完成后是否自动生成会诊病程记录，支持按医院/科室维度配置。来源：需求

### 6.4 部署方案

⏳ 待确认：部署方案信息未在资料区中详细描述。会诊管理模块作为WiNEX病历管理系统的一部分，通常随主应用一起部署，建议采用以下常规方式：

- 前后端分离部署，前端静态资源部署至Nginx/CDN
- 后端服务以JAR包形式部署至应用服务器集群
- 数据库采用Oracle/MySQL，使用独立schema存储会诊相关表
- 消息中心对接独立的消息中间件服务

---

## 7、测试用例预设计

> 📌 测试用例从第3章业务流程和资料区需求分析的场景归纳。Given/When/Then 与第3章保持一致。

### 7.1 功能测试

| 用例编号 | 测试场景 | Given | When | Then |
|---------|---------|-------|------|------|
| TC-F-001 | 会诊答复成功创建 | 受邀医生已登录，会诊任务已接收，状态为待答复 | 选择答复操作→系统创建答复单→填写会诊意见→保存 | 会诊答复单创建成功，状态为DRAFT，内容写入EMR_CONSULT_SET_CONTENT |
| TC-F-002 | 会诊答复提交 | 会诊答复单已创建（草稿状态） | 填写完成会诊意见→点击提交 | 会诊答复提交成功，状态变更为SUBMIT，邀请状态变更为已答复 |
| TC-F-003 | 会诊完成（所有医生已答复） | 所有受邀医生均已提交会诊答复 | 申请医生或院总点击完成会诊 | 会诊阶段状态变更为CONSULT_COMPLETE，会诊完成 |
| TC-F-004 | 会诊记录签署（CA签名） | 会诊记录已提交，未签署 | 用户点击签署→CA签名验证→确认签署 | 签署成功，记录签署信息，EMR_STATUS更新 |
| TC-F-005 | 会诊记录PDF生成 | 会诊记录已签署完成 | 点击生成PDF | PDF生成成功，返回PDF的Base64和URL，页面可预览/下载 |
| TC-F-006 | 会诊记录撤销（草稿状态） | 会诊答复单为草稿状态 | 点击撤销 | 会诊答复单撤销成功，状态回退至可编辑 |
| TC-F-007 | 会诊评价提交 | 会诊已完成 | 申请医生在会诊评价页面填写评价→提交 | 评价保存成功，EMR_CONSULT_FEEDBACK创建 |
| TC-F-008 | 会诊附件上传 | 会诊答复单已创建 | 用户选择文件→上传附件 | 附件上传成功，EMR_CONSULT_ATTACHMENT创建 |
| TC-F-009 | 会诊进展列表查询 | 会诊申请已创建，有多条进展记录 | 在会诊详情页查看进展 | 进展列表展示申请、审核、接收、签到、答复、完成等各环节状态 |
| TC-F-010 | 会诊内容查询 | 会诊已创建答复记录 | 查看会诊病历内容 | 正确展示会诊申请信息和所有会诊记录文书列表 |

### 7.2 边界测试

| 用例编号 | 测试场景 | Given | When | Then |
|---------|---------|-------|------|------|
| TC-B-001 | 会诊完成后撤销答复 | 会诊已完成，参数允许撤销答复 | 答复人点击撤销答复 | 会诊答复回退至草稿，阶段状态回退至会诊中 |
| TC-B-002 | 会诊完成后不允许撤销答复 | 会诊已完成，参数不允许撤销答复 | 答复人点击撤销答复 | 提示"会诊已完成，不支持撤销答复" |
| TC-B-003 | 申请人答复会诊逆向流程 | 会诊已完成，参数允许逆向流程 | 申请医生选择申请人答复→填写意见→提交 | 逆向流程答复记录创建成功 |
| TC-B-004 | 会诊助手侧边栏宽度记忆 | 会诊书写页面，侧边栏宽度已调整 | 拖拽调整宽度→关闭页面→重新打开 | 侧边栏宽度恢复为上次调整后的宽度 |
| TC-B-005 | 会诊内容为空提交 | 会诊答复单已创建，内容为空 | 不填写任何内容直接点击提交 | 提示"会诊意见不能为空"，阻止提交 |
| TC-B-006 | 会诊记录超长文本内容 | 会诊内容包含大量文本（如10万字符） | 提交会诊答复 | 内容正常写入EMR_CONSULT_SET_CONTENT，大文本存储正常 |
| TC-B-007 | 会诊组件大字版模式 | 系统参数启用大字版模式 | 进入会诊书写页面 | 字体大小和布局按大字版模式展示 |
| TC-B-008 | 会诊记录右键短语收藏 | 会诊书写编辑器已打开 | 选中文本→右键→添加到短语收藏 | 短语收藏成功，可在短语列表中查看和使用 |

### 7.3 异常测试

| 用例编号 | 测试场景 | Given | When | Then |
|---------|---------|-------|------|------|
| TC-E-001 | 病历版本冲突提交 | 会诊记录版本已被其他用户修改递增 | 提交当前版本（旧版本号） | 提示"病历版本已变更，请刷新后重新提交" |
| TC-E-002 | 完成会诊时有未答复医生 | 多名受邀医生，部分未答复 | 执行完成会诊 | 提示"存在未答复的会诊医生"，展示未答复列表 |
| TC-E-003 | PDF生成失败 | 会诊记录已签署，PDF服务异常 | 点击生成PDF | 提示"PDF生成失败，请稍后重试"，不影响会诊记录状态 |
| TC-E-004 | 会诊记录权限不足 | 无权限的用户查看会诊记录 | 访问会诊记录内容 | 提示"权限不足"或隐藏编辑按钮 |
| TC-E-005 | 接口超时 | 网络异常或服务端响应慢 | 提交会诊答复 | 前端提示"系统繁忙，请稍后重试"，记录异常日志 |
| TC-E-006 | 会诊邀请状态异常 | 会诊邀请已被撤销 | 尝试创建会诊答复 | 提示"会诊邀请状态不正确，无法创建答复" |
| TC-E-007 | 会诊内容丢失 | EMR_CONSULT_SET_CONTENT数据异常 | 查询会诊病历内容 | 提示"会诊病历内容未找到"，记录异常日志 |
| TC-E-008 | 会诊完成时记录未签署 | 会诊记录已提交但未签署 | 执行完成会诊 | 提示"会诊记录未签署，请先完成签署"（如配置为强制签署） |

### 7.4 性能测试

| 用例编号 | 测试场景 | 指标 |
|---------|---------|------|
| TC-P-001 | 会诊答复提交响应时间 | ⏳ 待确认（建议：99%的请求在3秒内完成） |
| TC-P-002 | 会诊病历内容查询响应时间 | ⏳ 待确认（建议：分页查询99%在2秒内完成） |
| TC-P-003 | PDF生成响应时间 | ⏳ 待确认（建议：99%的PDF在5秒内生成完成） |
| TC-P-004 | 大文本内容读取性能 | ⏳ 待确认（建议：100KB以上内容在2秒内加载完成） |
| TC-P-005 | 并发提交会诊答复 | ⏳ 待确认（建议：支持50用户同时提交会诊答复） |

---

## 8、非功能性要求

> 📌 指标数值待从资料区或性能测试标准中确认。下述为基于行业实践的合理建议值，标注为⏳待确认。

### 8.1 性能要求

| 指标 | 要求 |
|------|------|
| 会诊答复提交响应时间（P99） | ⏳ 待确认 |
| 会诊病历内容查询响应时间（P99） | ⏳ 待确认 |
| PDF生成响应时间（P99） | ⏳ 待确认 |
| 大文本内容加载时间 | ⏳ 待确认 |
| 并发用户数 | ⏳ 待确认 |
| 系统可用性 | ⏳ 待确认 |

### 8.2 安全要求

| 要求 | 说明 |
|------|------|
| 权限控制 | 会诊记录的查看、编辑、签署、撤销等操作必须受权限控制，未经授权的用户无法操作（来源：需求 - queryEmrDocumentPermission） |
| 数据隔离 | 不同科室的医生只能查看和操作本科室相关的会诊记录（来源：需求） |
| 操作日志 | 会诊记录的创建、保存、提交、签署、撤销、PDF生成等关键操作必须记录操作日志，支持审计追溯（来源：代码 - EMR_SET_ACTION_LOG） |
| 乐观锁 | 通过EMR_SET_VERSION实现乐观锁，防止并发修改导致的数据冲突（来源：代码） |
| CA签名 | 会诊记录签署支持CA签名，满足电子签名法的法律效力要求（来源：代码 - saveCaSignatureRecordInfo） |

**医疗行业特殊要求**

| 要求 | 说明 |
|------|------|
| 患者信息安全 | 会诊记录涉及患者诊疗信息，需符合HIPAA/《个人信息保护法》等相关法规要求，对敏感信息进行脱敏或权限控制 |
| 诊疗可追溯 | 会诊记录作为诊疗过程的重要记录，需保留完整的修改历史和审计轨迹，满足医疗纠纷举证要求（EMR_HISTORY记录版本历史） |
| 病历真实性 | 会诊记录提交后需保证内容的真实性和完整性，通过CA签名/电子签名和版本历史记录确保不可篡改 |
| 数据一致性 | 会诊记录与会诊申请（EMR_CONSULT_APPLY）、会诊邀请（EMR_CONSULT_INVITATION）之间需保持数据一致性 |
| 归档合规 | 会诊记录需对接无纸化归档系统，确保病历归档的完整性和合规性 |

### 8.3 可用性要求

| 指标 | 要求值 |
|------|--------|
| 系统可用性 | ⏳ 待确认（建议：99.9%以上，排除计划内维护） |
| 会诊助手宽度记忆 | 会诊书写助手侧边栏拖拽宽度后，下次打开自动恢复上次宽度（来源：需求） |
| 会诊组件大字版模式 | 支持参数控制切换大字版模式，提升老年医生使用体验（来源：需求） |
| 短语收藏 | 右键支持短语收藏，提升常用短语录入效率（来源：需求） |
| 操作容错 | 关键操作（提交、完成会诊、撤销）需提供二次确认，防止误操作（来源：需求） |

### 8.4 兼容性要求

| 类型 | 要求 |
|------|------|
| 浏览器兼容性 | ⏳ 待确认（建议：支持Chrome/Firefox/Edge最新版本） |
| 旧版兼容 | 需兼容v1版会诊系统的数据接口，已存在的会诊记录数据可正常查询（来源：代码 - v2与v1并存） |
| 外部系统兼容 | 需兼容无纸化归档系统、HIS、消息中心等外部系统的接口变化（来源：需求） |
| PDF生成兼容 | 生成的PDF需兼容主流PDF阅读器，支持打印和归档（来源：需求） |

---

## 9、依赖与风险

### 9.1 外部依赖

| 依赖项 | 说明 |
|--------|------|
| 病历编辑器 | 会诊记录书写依赖病历编辑器组件，提供模板加载、结构化录入、内容编辑等能力（来源：需求） |
| CA签名系统 | 会诊记录签署依赖CA签名系统，提供电子签名服务（来源：代码 - saveCaSignatureRecordInfo） |
| PDF生成服务 | 会诊记录PDF生成依赖PDF生成服务（内部或第三方组件）（来源：代码 - generatePdf） |
| 无纸化归档系统 | 会诊记录归档依赖无纸化系统对接（来源：模块级功能点Spec） |
| 消息中心 | 会诊完成后的通知推送依赖消息中心（来源：需求） |
| 住院医生站 | 会诊书写功能需嵌入住院医生站，依赖医生站提供患者上下文和入口（来源：代码 - external/inpatient） |
| 主数据系统（MDM） | 依赖MDM同步科室信息、员工信息（来源：需求） |
| 数据库 | 依赖数据库存储会诊记录数据，需支持大字段（byte[]）存储（来源：代码） |
| 模板管理系统 | 会诊答复单模板依赖模板管理系统的模板配置（来源：代码 - MRT_ID） |

### 9.2 风险项

| 风险项 | 等级 | 说明 | 应对方案 |
|--------|------|------|---------|
| CA签名系统不稳定 | 高 | CA签名服务异常导致会诊记录无法签署，影响会诊完成流程 | 提供降级方案（电子签名替代CA签名），增加签名超时重试机制 |
| 大文本内容存储性能 | 中 | 会诊记录内容（Base64编码XML）可能较大，EMR_CONTENT字段为byte[]，大量并发读写可能影响数据库性能 | 考虑内容压缩存储，增加缓存层，分页查询，监控大字段性能 |
| 并发版本冲突 | 中 | 多人同时编辑同一会诊记录（如加签场景），版本冲突导致提交失败 | 乐观锁机制（EMR_SET_VERSION），前端提示刷新重试，减少冲突概率 |
| PDF生成服务异常 | 中 | PDF生成服务不可用，影响会诊记录打印和归档 | 增加重试机制，提供降级方案（直接打印XML），监控服务可用性 |
| 会诊完成后撤销答复风险 | 中 | 会诊完成后答复人撤销答复，可能导致已完成的会诊流程回退，影响后续流程（计费、归档等） | 通过参数控制是否允许撤销，撤销时校验关联流程状态，记录完整操作日志 |
| 逆向流程数据一致性 | 中 | 申请人答复会诊逆向流程中，会诊状态和记录更新可能不一致 | 采用工作流组件（工作流事务管理），确保逆向流程的原子性操作 |
| 短语收藏数据持久化 | 低 | 会诊记录右键短语收藏数据存储策略（本地/服务端）未明确 | 明确短语收藏的存储策略和同步机制，确保不同设备间数据一致性 |

---

## 10、附录

### 10.1 流程图

#### 会诊答复与记录核心流程

```mermaid
flowchart TD
    A[受邀医生进入会诊书写] --> B[查询可答复会诊列表<br/>queryCanReplyConsultInvitationInfoList]
    B --> C{校验会诊邀请状态}
    C -->|有效| D[创建会诊答复单<br/>createConsultReply]
    C -->|无效| E[提示邀请状态异常]
    E --> A
    D --> F[加载会诊答复模板<br/>queryEmrConsultSetContentView]
    F --> G[会诊书写编辑器内填写<br/>会诊意见/诊断/治疗建议]
    G --> H{用户操作选择}
    H -->|保存草稿| I[保存会诊答复<br/>saveConsultationApply]
    H -->|提交会诊| J[提交会诊答复<br/>submitConsultationApply]
    I --> G
    J --> K{校验版本号}
    K -->|版本一致| L[会诊邀请状态更新为已答复]
    K -->|版本冲突| M[提示刷新重试]
    M --> G
    L --> N{是否所有受邀医生已答复}
    N -->|是| O[申请医生/院总完成会诊<br/>completedConsultation]
    N -->|否| P[等待其他医生答复]
    P --> G
    O --> Q{校验签署状态}
    Q -->|已签署| R[会诊阶段状态更新为CONSULT_COMPLETE]
    Q -->|未签署| S[提示先完成签署]
    S --> T[执行会诊记录签署]
    T --> Q
    R --> U{是否自动生成病程记录}
    U -->|是| V[创建会诊病程记录并关联]
    U -->|否| W[结束]
    V --> W
```

#### 会诊记录状态流转

```mermaid
flowchart LR
    A[创建答复单] --> B[草稿-DRAFT]
    B -->|保存草稿| B
    B -->|提交| C[已提交-SUBMIT]
    C -->|签署| D[已签署-SIGNED]
    D -->|完成会诊| E[已完成-CONSULT_COMPLETE]
    C -->|撤销| B
    B -->|撤销答复| F[已撤销]
    E -->|撤销完成| C
    D -->|PDF生成| G[PDF已生成]
```

### 10.2 时序图

#### 会诊答复提交时序

```mermaid
sequenceDiagram
    participant 受邀医生 as 受邀医生（前端）
    participant 会诊书写服务 as 会诊书写Service
    participant 数据层 as 数据层（DB）
    participant 病历编辑器 as 病历编辑器
    participant CA签名 as CA签名系统
    participant PDF服务 as PDF生成服务

    受邀医生->>会诊书写服务: 创建会诊答复单(createConsultReply)
    会诊书写服务->>数据层: 创建EMR_CONSULT_SET记录（mrtMonitorId=答复单）
    数据层-->>会诊书写服务: 返回答复单ID
    会诊书写服务-->>受邀医生: 返回答复单创建成功
    受邀医生->>会诊书写服务: 查询病历内容(queryEmrConsultSetContentView)
    会诊书写服务->>数据层: 查询EMR_CONSULT_SET_CONTENT
    数据层-->>会诊书写服务: 返回病历内容列表
    会诊书写服务-->>受邀医生: 返回病历内容和模板数据
    受邀医生->>病历编辑器: 加载模板，编辑会诊意见
    病历编辑器-->>受邀医生: 编辑完成，获取内容Base64
    受邀医生->>会诊书写服务: 保存会诊答复(saveConsultationApply/草稿)
    会诊书写服务->>数据层: 写入EMR_CONSULT_SET_CONTENT(byte[])
    数据层-->>会诊书写服务: 保存成功
    会诊书写服务-->>受邀医生: 返回保存成功
    受邀医生->>会诊书写服务: 提交会诊答复(submitConsultationApply)
    会诊书写服务->>会诊书写服务: 校验EMR_SET_VERSION乐观锁
    会诊书写服务->>数据层: 更新EMR_CONSULT_SET状态为SUBMIT
    数据层-->>会诊书写服务: 更新成功
    会诊书写服务->>数据层: 更新EMR_CONSULT_INVITATION状态为已答复
    数据层-->>会诊书写服务: 更新成功
    会诊书写服务-->>受邀医生: 返回提交成功
    opt 会诊记录签署
        受邀医生->>CA签名: CA签名验证
        CA签名-->>受邀医生: 签名验证通过
        受邀医生->>会诊书写服务: 保存签署记录(saveCaSignatureRecordInfo)
        会诊书写服务->>数据层: 更新签署状态
        数据层-->>会诊书写服务: 更新成功
    end
    opt PDF生成
        受邀医生->>PDF服务: 生成PDF(generatePdf)
        PDF服务-->>受邀医生: 返回PDF Base64/URL
    end
```

### 10.3 参考文档

- BLGL-05-HZGL 05会诊管理功能点Spec.md（V1.0）— 第5章功能点清单、第8章代码架构
- 【历史需求】新会诊历史需求.xlsx（涉及本功能点的需求编号列表：以会诊答复、会诊记录、会诊签署、会诊PDF、会诊病程、会诊评价、会诊附件、会诊助手等关键词命中的需求）
- 关联Spec: BLGL-05-HZGL-001_会诊申请-Spec.md（V1.0）— 会诊申请前置流程
- 关联Spec: BLGL-05-HZGL-002_会诊审核-Spec.md（V1.0）— 会诊审核前置流程
- 关联Spec: BLGL-05-HZGL-004_会诊接收与指派-Spec.md（V1.0）— 会诊接收前置流程
- 关联Spec: BLGL-05-HZGL-005_会诊签到-Spec.md（V1.0）— 会诊签到前置流程
- 关联Spec: BLGL-05-HZGL-006_会诊计费-Spec.md（V1.0）— 会诊完成后触发计费

---

## 填写检查清单

| 序号 | 检查项 | 是否完成 |
|:----:|--------|:--------:|
| 1 | 章节索引与正文章节一致 | ✅ |
| 2 | 版本历史记录完整 | ✅ |
| 3 | 关联文档索引已登记全部Spec | ✅ |
| 4 | 文档目的明确回答"为什么做/做成什么/怎么做" | ✅ |
| 5 | 纳入范围/排除范围清晰 | ✅ |
| 6 | 术语定义覆盖关键概念，从资料区可溯源 | ✅ |
| 7 | 参考文档已登记 | ✅ |
| 8 | 功能背景基于法规/规范/需求来源组织 | ✅ |
| 9 | 功能定位体现业务价值（3~5个定位点） | ✅ |
| 10 | 目标用户角色覆盖完整，在需求原文中有出处 | ✅ |
| 11 | 核心价值可陈述，与 Phase 1 口径一致 | ✅ |
| 12 | 业务流程：主流程≥1、异常≥3、边界≥2，Given/When/Then 具体 | ✅（1主+3异常+2边界） |
| 13 | 数据模型：字段/表/状态/参数可溯源（概念ID/表名/参数编码） | ✅（部分状态码/参数编码⏳待确认） |
| 14 | 接口契约：API列表+详细设计+错误码齐全（资料区有信息时）或标记待确认 | ✅（28个API列表+5个详细设计+11个错误码） |
| 15 | 技术方案：页面路径/技术栈/关键点/部署方案（资料区有信息时）或标记待确认 | ✅（12个页面路径+10个关键点+技术栈⏳待确认） |
| 16 | 测试用例：功能/边界/异常/性能覆盖，与第3章场景对应 | ✅（10功能+8边界+8异常+5性能） |
| 17 | 非功能性要求：性能/安全/可用性/兼容性指标可量化或标记待确认 | ✅（安全要求具体，性能指标⏳待确认） |
| 18 | 依赖与风险：外部依赖登记完整，风险有具体应对方案或标记待确认 | ✅（9个依赖+7个风险） |
| 19 | 附录：流程图/时序图与正文流程一致 | ✅（2个流程图+1个时序图） |
| 20 | 全文无占位符 `< >` 残留 | ✅ |
| 21 | 全文陈述可溯源至资料区，无来源的已标记 ⏳ | ✅ |
| 22 | 人工审核确认完成 | ⏳ 待确认 |

---

**文档状态**：⬜ 待审核
**维护责任**：RACC
**下次更新**：根据评审反馈优化