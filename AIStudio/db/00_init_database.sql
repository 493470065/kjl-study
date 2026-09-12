-- racc 平台一键初始化：建库 + 全量表结构 + 基础种子数据
-- 用法：mysql -uroot -p < 00_init_database.sql
CREATE DATABASE IF NOT EXISTS racc DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE racc;
SOURCE 01_schema.sql;
SOURCE 02_seed.sql;
