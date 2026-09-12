# 03_migrations — 数据库增量迁移脚本目录

## 约定

1. 每次修改表结构 / 增加索引 / 变更种子数据，在本地导出或手写对应 SQL，命名为 `NNN_动作_对象.sql`（如 `001_add_wiki_tags.sql`），编号递增不重复。
2. 迁移 SQL 必须与对应的代码改动放在**同一个 commit** 中提交，保证两台电脑代码与库结构同步。
3. 迁移脚本要求幂等（可重复执行），常用手法：
   - 建表用 `CREATE TABLE IF NOT EXISTS`
   - 加列先查 `information_schema.COLUMNS`（或接受报错继续）
4. 已执行到哪个脚本由各机器自行记录；新机器从零部署时先执行 `db/00_init_database.sql`，再按编号顺序执行本目录下的脚本。

## 当前基线

- 2026-09-12：从 racc 库全量导出 `01_schema.sql`（45 张表）+ `02_seed.sql`（users/role_permissions/seed_state/automate_task_types/system_configs/product_lines），作为迁移基线，此前变更无需单独脚本。
