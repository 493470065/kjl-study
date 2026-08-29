# kjl-study

kjl 的学习仓库。

## 目录结构

- `AIStudio/` —— 景磊的AI工作站（Vue3 + Spring Boot + MySQL 全栈项目）

## AIStudio 使用说明

- 启动：双击 `AIStudio/启动平台.bat`（前端 8090 / 后端 8091 / MySQL 3306）
- 停止：双击 `AIStudio/停止平台.bat`
- 环境变量：`tools/env.cmd` / `tools/env.sh` 含密钥**不入库**，新机器克隆后请复制
  `tools/env.cmd.example` 为 `tools/env.cmd` 并填入自己的 API 密钥
- 运行时数据在 `AIStudio/data/`（不入库），JDK/Maven 在 `tools/` 下（不入库，需自行下载）
- MySQL 位置：启动/停止脚本默认读 `E:\KjlStudy\mysql`，路径不同请设置系统环境变量
  `MYSQL_HOME` 指向 MySQL 安装目录（脚本会自动使用它）

## 新电脑部署步骤

仓库只含**源代码**，运行环境需在新电脑上准备一次：

1. **安装基础软件**：Git、[Node.js](https://nodejs.org/)（前端需要）
2. **克隆仓库**：`git clone git@github.com:493470065/kjl-study.git`（需先配好 SSH 密钥）
3. **安装 MySQL 8.0**：建库 `racc`（表结构首次启动自动创建）
   - 账号密码默认 `root` / `racc123`（见 `application.yml`，可自行修改）
   - MySQL 不在 `E:\KjlStudy\mysql` 时，设置系统环境变量 `MYSQL_HOME=<MySQL安装目录>`
4. **迁移旧数据（可选）**：
   ```bash
   # 旧电脑导出
   mysqldump -u root -pracc123 racc > racc_backup.sql
   # 新电脑导入
   mysql -u root -pracc123 racc < racc_backup.sql
   ```
5. **准备 JDK + Maven**：下载 [JDK 17](https://adoptium.net/) 和
   [Maven](https://maven.apache.org/) 解压到 `AIStudio/tools/` 下，目录名保持
   `jdk-17.0.20+8` 和 `apache-maven-3.9.16`（或改 `env.cmd` 指向系统安装的版本）
6. **配置密钥**：复制 `AIStudio/tools/env.cmd.example` 为 `env.cmd`，填入 LLM API 密钥
7. **安装前端依赖**：在 `AIStudio/frontend/` 下执行 `npm install`
8. **启动**：双击 `AIStudio/启动平台.bat`，访问 http://localhost:8090
