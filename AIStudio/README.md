# 景磊的AI工作站

景磊的AI工作站，复刻参考平台「门急诊病历开发部 - 需求管理平台」的完整功能（28 个页面），用于病历片区管理。

## 📐 设计与体验规范

开发新功能/新页面前请先阅读（江南水墨视觉体系、组件与交互约定、上线自检清单）：

- **UED 规范**：`docs/design/UED-spec.md`（必读）
- UED 重设计提案与实施记录：`docs/design/2026-08-29-ued-redesign-proposal.md`

---

## 🚀 快速启动

### 方式一：一键启动（推荐）

双击运行 **`AIStudio\启动平台.bat`**（即本目录下的 `启动平台.bat`）

脚本会自动：
1. 启动 MySQL 8.0（`E:\KjlStudy\mysql`，端口 3306，库 `racc`）
2. **检测 `racc` 库不存在时自动导入 `db\` 初始化脚本**（建库 + 表结构 + 种子数据，日志见 `logs\db-init.log`）
3. 启动后端（Spring Boot，端口 8091）
4. 启动前端（Vue3 + Vite，端口 8090）
5. 等待后端就绪后自动打开浏览器

### 新电脑部署（从零开始）

1. 安装 Git 后 `git clone` 本仓库
2. 安装便携版 MySQL 8.0 到纯英文路径（如 `E:\KjlStudy\mysql`），路径不同时设置系统环境变量 `MYSQL_HOME`
3. 复制 `tools\env.cmd.example` 为 `tools\env.cmd`，填入本机 JDK/Maven/LLM Key（此文件含密钥，不入库）
4. 前端 `cd frontend && npm install`
5. 构建后端 jar：`mvn -f backend/pom.xml package -DskipTests`（或 `bash tools/start-backend.sh --build`）
6. 双击 `启动平台.bat` —— 首次运行会自动建库导表并写入种子数据（admin 账号、角色权限、自动化任务类型等）
7. 若拉取的代码较新、`db\03_migrations\` 下有增量脚本，按编号顺序手动执行

### 方式二：手动启动

```bash
# 1. 启动 MySQL（已初始化，账号 root / racc123）
E:\KjlStudy\mysql\bin\mysqld.exe --defaults-file=E:\KjlStudy\mysql\my.ini --console

# 2. 另开终端启动后端（需要 JDK17 + Maven，见下方工具链）
call E:\KjlStudy\AI\AIStudio\tools\env.cmd
cd E:\KjlStudy\AI\AIStudio\backend
mvn spring-boot:run -DskipTests

# 3. 再开终端启动前端
cd E:\KjlStudy\AI\AIStudio\frontend
npm run dev
```

## 🔑 登录

| 项 | 值 |
|----|----|
| 地址 | http://localhost:8090 |
| 账号 | `admin` |
| 密码 | `admin123` |

## 🛑 停止平台

双击运行 **`E:\KjlStudy\AI\AIStudio\停止平台.bat`**，或手动关闭两个服务窗口。

---

## 📁 目录结构

```
E:\KjlStudy\AI\AIStudio\
├── 启动平台.bat          # 一键启动（MySQL + 前后端）
├── 停止平台.bat          # 一键停止（含 MySQL 优雅关闭）
├── README.md             # 本文件
├── docs\design\          # 设计文档
├── frontend\             # 前端 Vue3 + TS + Element Plus
│   ├── src\views\        # 28 个页面
│   ├── src\api\          # API 客户端
│   └── package.json
├── backend\              # 后端 Spring Boot 3.4
│   ├── pom.xml
│   └── src\main\java\com\racc\  # 147 个 Java 文件
├── tools\                # 本地工具链
│   ├── jdk-17.0.20+8\    # JDK 17（本地，无需系统安装）
│   ├── apache-maven-3.9.16\  # Maven
│   ├── env.cmd           # Windows 环境脚本（含密钥，不入库，参考 env.cmd.example）
│   ├── env.sh            # Git Bash 环境脚本（同上，参考 env.sh.example）
│   └── migration\        # SQLite→MySQL 一次性迁移工具（已执行，留档）
├── db\                   # 数据库脚本（随 git 同步，新电脑可从零重建 racc 库）
│   ├── 00_init_database.sql  # 一键初始化：建库 + 导入 schema/seed
│   ├── 01_schema.sql         # 全量表结构（45 张表）
│   ├── 02_seed.sql           # 种子数据（账号/角色/自动化任务类型等）
│   └── 03_migrations\        # 增量迁移脚本目录（约定见其 README.md）
└── data\                 # 运行时数据
    ├── racc.db           # 旧 SQLite 库（2026-08-25 已全量迁移至 MySQL，留档备份）
    ├── uploads\          # 知识库上传文件
    ├── mcp\              # MCP server 包
    ├── skills\           # Skill 仓库
    └── pipeline\         # 自动化任务产物
E:\KjlStudy\mysql\           # MySQL 8.0.29 服务端（便携版，置于纯英文路径）
├── my.ini                # utf8mb4 / ngram_token_size=2 / 端口 3306
└── data\                 # MySQL 数据目录
```

## 🛠 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Java 17 + Spring Boot 3.4 + Spring AI |
| 前端 | Vue 3 + TypeScript + Element Plus + Vite |
| 存储 | MySQL 8.0（主库，本地 F:\mysql）+ Neo4j（图谱，可选）+ Redis（可选） |
| LLM | 配置位（application.yml + LLM Provider 页面，未配置时优雅降级） |

## ⚙️ 配置说明

### 数据库（MySQL）

本地便携版 MySQL 8.0.29，安装于 `E:\KjlStudy\mysql`（**注意：必须纯英文路径**，MySQL 对中文路径的 errmsg/ICU 资源加载有兼容问题；2026-08-27 由 Claude 从华为镜像下载重建，原 F:\mysql 已不存在，同日从 E:\mysql 平移至此），数据目录 `E:\KjlStudy\mysql\data`。

| 项 | 值 |
|----|----|
| 地址 | `localhost:3306` |
| 库名 | `racc`（utf8mb4） |
| 账号 | `root` |
| 密码 | `racc123` |
| 全文索引 | `knowledge_documents` 上 FULLTEXT + ngram 分词（中文检索） |

连接参数支持环境变量覆盖：`MYSQL_HOST` / `MYSQL_PORT` / `MYSQL_DB` / `MYSQL_USER` / `MYSQL_PASSWORD`（见 `application.yml`）。
表结构由 Hibernate `ddl-auto: update` 维护，同时 `db\` 目录保存了全量 DDL 与种子数据快照用于新机部署；**每次修改表结构/种子数据，请在 `db\03_migrations\` 追加编号迁移脚本，并随代码同一 commit 提交**。

### LLM（大模型）

编辑 `backend\src\main\resources\application.yml`，设置：
```yaml
spring:
  ai:
    openai:
      api-key: ${LLM_API_KEY:你的Key}
      base-url: ${LLM_BASE_URL:https://api.openai.com/v1}
      chat:
        options:
          model: ${LLM_MODEL:gpt-4o}
        enabled: ${LLM_ENABLED:true}
```
或在平台「LLM Provider」页面添加 Provider。未配置时 AI 页面（对话/评估/结构化输出）返回模拟数据。

### TFS 对接

登录后在「个人配置」或「系统配置」填入 TFS Server URL + PAT，看板即可拉取真实数据。

### Neo4j / Redis

可选。未配置时知识图谱降级为空数据、缓存降级为内存实现，平台照常运行。

## 🧩 功能模块

28 个页面：首页看板、运行时监控、AI对话、需求看板、知识库（文档/扫描/Wiki/图谱）、MCP管理、自动化管理、Agent配置、Skill管理、沙箱、个人配置、审计日志、AI评估、结构化输出、本地算力、团队协作、LLM Provider、工作流编排、运营平台、开发环境、系统配置、定时任务、Webhook、产品线、仓库、账户管理等。
