# 景磊的AI乐园管理平台 — 设计文档

> 版本 v1.0 | 日期 2026-08-21 | 状态：已确认
> 参考平台：http://192.168.26.54:5888（门急诊病历开发部 - 需求管理平台，Agent OS）
> 复刻范围：完整复刻 28 个页面

---

## 0. 项目参数（用户确认）

| 项 | 值 |
|----|----|
| 项目目录 | `F:\AI管理平台` |
| 端口 | 前端 8090 / 后端 8091 |
| 后端 | Java 17 + Spring Boot 3.4 + Spring AI |
| 前端 | Vue 3 + TypeScript + Element Plus（复用参考平台源码） |
| 存储 | SQLite + Neo4j（图/向量）+ Redis（可选，缺失降级） |
| LLM | 留配置位（application.yml + Provider 页面），未配置时优雅降级 |
| 初始账号 | admin / admin123 |
| 品牌文案 | 「景磊的AI工作站」（登录页标题、侧边栏 Logo、浏览器标题、启动/停止脚本等），其余 UI 忠实复刻 |

---

## 1. 总体架构

```
F:\AI管理平台\
├── frontend\                    # 前端（复用参考平台源码）
│   ├── src\views\...\           # 28 个页面
│   ├── src\api\                 # 32 个 API 模块（axios, baseURL=/api）
│   └── vite.config.ts           # 端口 8090，/api 代理到后端 8091
├── backend\                     # 后端
│   └── src\main\java\com\racc\
│       ├── config\              # JWT/Neo4j/Redis/SpringAI 配置
│       ├── auth\                # /api/auth/*（登录/令牌/改密）
│       ├── user\                # 用户/角色权限/个人配置
│       ├── tfs\                 # TFS 集成 + 统计看板
│       ├── knowledge\           # 知识库 + GraphRAG + Wiki
│       ├── agent\               # Agent/Chat(SSE)/Skill/MCP/Pipeline
│       ├── workflow\            # 工作流编排
│       ├── ops\                 # 运营看板（WxP 代理）
│       ├── devenv\              # 开发环境 SQL/Consul
│       ├── platform\            # 监控/审计/定时任务/Webhook/沙箱/算力
│       └── repository\          # 仓库/产品线/团队协作
├── data\                        # SQLite + uploads + mcp + skills + pipeline
├── 启动平台.bat
└── README.md
```

启动：`启动平台.bat` → 后端 8091 + 前端 8090 → http://localhost:8090

关键决策：
- 前端 95% 复用（改标题/logo 文案），UI 与参考平台一致
- TFS 真实对接公司 TFS（tfs2018-web.winning.com.cn），PAT 走系统配置
- WxP/运营平台走可配置 HTTP 代理
- LLM 统一经 `LlmGateway`（Spring AI ChatClient），未配置返回友好提示

## 2. 数据存储

**SQLite（data/racc.db，~35 表，JPA 自动建表，seed admin）**

| 域 | 表 |
|----|----|
| 认证/用户 | users, role_permissions, user_llm_config, user_tfs_config, api_tokens |
| 知识库 | knowledge_documents(+FTS5), wiki_pages, scan_jobs |
| Agent 域 | agent_configs, chat_conversations, chat_messages, mcp_servers, pipeline_tasks/steps/changes/artifacts/logs, skills |
| 协作/仓库 | workspaces, team_members, projects, code_repositories, repo_modules, product_lines |
| 平台 | system_configs, scheduled_tasks, task_logs, webhook_configs, webhook_logs, audit_llm_calls, audit_tool_invocations, audit_task_executions, llm_providers, dev_env_configs, frequent_sqls, compute_nodes, compute_tasks, evaluation_results, evaluation_datasets |

**Neo4j**：GraphEntity（9 类节点）/ GraphRelationship；支撑图谱页与 GraphRAG；向量用 Neo4j vector index，LLM 未配置降级关键词。
**Redis**：`@ConditionalOnProperty`，缓存会话/TFS 查询/限流；缺失自动内存缓存。

降级策略：Neo4j/Redis 不可用不阻塞启动——图谱页占位提示，检索退回 FTS。

## 3. API 实现策略（180+ 端点四档）

- **A 档 真实实现**：认证/用户/角色/系统配置/审计/知识库文档/团队/仓库/产品线/定时任务/Webhook/监控/开发环境/LLM Provider CRUD
- **B 档 外部对接**：TFS（REST+PAT，未配时页面引导）、运营平台（代理转发+解包 code==20000）、Skill（本地 git）、MCP（ProcessBuilder 进程管理）
- **C 档 LLM 依赖**：Chat SSE/Agent/Pipeline/Wiki/图谱抽取/评估/结构化输出——调用链完整，LlmGateway 未配置时结构化提示，页面不报错；Pipeline 状态机/日志无 LLM 也全可用
- **D 档 占位**：沙箱（Docker 存在才真实）、本地算力（WebSocket 协议完整，无节点显示连接指引）

依赖：spring-boot web/data-jpa/security/validation/websocket、spring-ai-starter-model-openai、sqlite-jdbc、neo4j-driver、data-redis(conditional)、jjwt、oshi。

## 4. 实施里程碑

| # | 里程碑 | 验证标准 |
|---|--------|---------|
| M1 | 骨架可登录 | localhost:8090 登录成功，28 菜单齐全可点 |
| M2 | 管理域全通 | 用户/配置/审计/团队/仓库/产品线/定时/Webhook/监控/个人配置 CRUD 真实可用 |
| M3 | 知识库域 | 知识库 4 tab 可用，图谱无 Neo4j 优雅降级 |
| M4 | TFS+运营域 | 配 PAT 后看板出真实数据；WxP 代理可配 |
| M5 | AI 域 | 未配 LLM 全部优雅提示；配 Ollama 后对话真实可用 |

## 5. 复刻要点（源码探查结论）

- 认证：POST /api/auth/login → {token,user}；storage 键 `auth`（JSON{token,user,remember}），记住我→localStorage 否则 sessionStorage；路由守卫校验 allowedMenus
- Chat SSE：原生 fetch 读流，解析 `data:` 行，事件 content/tool_call/tool_result/error/done，[DONE]/[ERROR] 标记
- TFS 链接：`{tfs.serverUrl}/_workitems/edit/{id}`，默认 http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0
- Excel 导出：前端拼 HTML table 存 .xls
- 图谱可视化：echarts graph 力导，节点 9 类型着色（GraphVisualization.vue）
- 工作流画布：VueFlow，节点 START/END/AGENT/CONDITION/PARALLEL/MERGE
- 侧边栏内联在 App.vue（无独立 Sidebar 组件），含「运营平台」「开发环境」分组与「系统配置」子菜单
- 全局弹窗：修改密码 / 个人 API 令牌（GET /auth/token、POST /auth/token/regenerate、PUT /auth/password）
