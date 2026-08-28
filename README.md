# kjl-study

kjl 的学习仓库。

## 目录结构

- `AIStudio/` —— 景磊的AI乐园站（Vue3 + Spring Boot + MySQL 全栈项目）

## AIStudio 使用说明

- 启动：双击 `AIStudio/启动平台.bat`（前端 8090 / 后端 8091 / MySQL 3306）
- 停止：双击 `AIStudio/停止平台.bat`
- 环境变量：`tools/env.cmd` / `tools/env.sh` 含密钥**不入库**，新机器克隆后请复制
  `tools/env.cmd.example` 为 `tools/env.cmd` 并填入自己的 API 密钥
- 运行时数据在 `AIStudio/data/`（不入库），JDK/Maven 在 `tools/` 下（不入库，需自行下载）
