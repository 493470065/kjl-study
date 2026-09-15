-- 001: 合理性设计分析结果缓存表（每用户每条线每功能点仅存最近一次，覆盖式 upsert）
-- 对应设计: docs/superpowers/specs/2026-09-15-fpi-analysis-cache-design.md
CREATE TABLE IF NOT EXISTS `fpi_analysis_result` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL COMMENT '所属用户（跨设备跟随用户）',
  `line_key` varchar(32) NOT NULL COMMENT '条线：inpatient/outpatient/emergency',
  `fp_code` varchar(128) NOT NULL COMMENT '功能点编码',
  `fp_name` varchar(255) DEFAULT NULL COMMENT '功能点名称（展示用快照）',
  `skill_name` varchar(128) DEFAULT NULL COMMENT '执行的分析技能名',
  `result_md` longtext COMMENT '分析结果 Markdown 原文（stdout）',
  `data_fingerprint` varchar(255) DEFAULT NULL COMMENT '分析时归集数据指纹',
  `fp_snapshot` longtext COMMENT '分析时功能点统计快照 JSON（fp 字段原样）',
  `exec_duration_ms` bigint DEFAULT NULL COMMENT '技能执行耗时',
  `created_at` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_fpi_result` (`user_id`,`line_key`,`fp_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
