
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `agent_config_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agent_config_details` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `capabilities` longtext,
  `created_at` datetime(6) NOT NULL,
  `description` longtext,
  `directory` varchar(256) DEFAULT NULL,
  `enabled` bit(1) NOT NULL,
  `model` varchar(128) DEFAULT NULL,
  `name` varchar(64) NOT NULL,
  `preferred_skills` longtext,
  `skills` longtext,
  `status` varchar(32) DEFAULT NULL,
  `system_prompt` longtext,
  `tools` longtext,
  `updated_at` datetime(6) DEFAULT NULL,
  `mcp_servers` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKkkklbj9ky4p6u57bno68b27w0` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `agent_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agent_configs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `current_task_id` varchar(64) DEFAULT NULL,
  `error_count` int DEFAULT NULL,
  `name` varchar(64) NOT NULL,
  `running_time` bigint DEFAULT NULL,
  `status` varchar(64) DEFAULT NULL,
  `token_used` bigint DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKfbu64vpj5veqr3nr1tufoleb2` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `audit_llm_calls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_llm_calls` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `completion_tokens` int DEFAULT NULL,
  `conversation_id` varchar(64) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `latency_ms` bigint DEFAULT NULL,
  `model` varchar(64) DEFAULT NULL,
  `prompt_tokens` int DEFAULT NULL,
  `success` bit(1) NOT NULL,
  `total_tokens` int DEFAULT NULL,
  `username` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `audit_task_executions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_task_executions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `latency_ms` bigint DEFAULT NULL,
  `project_id` varchar(64) DEFAULT NULL,
  `status` varchar(32) NOT NULL,
  `task_type` varchar(64) NOT NULL,
  `username` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `audit_tool_invocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_tool_invocations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `conversation_id` varchar(64) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `latency_ms` bigint DEFAULT NULL,
  `success` bit(1) NOT NULL,
  `tool_input` longtext,
  `tool_name` varchar(128) NOT NULL,
  `username` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `automate_task_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `automate_task_types` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(64) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `enabled` bit(1) NOT NULL,
  `form_schema` longtext,
  `icon` varchar(32) DEFAULT NULL,
  `name` varchar(128) NOT NULL,
  `skill_name` varchar(128) DEFAULT NULL,
  `sort_order` int NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `workflow_definition_id` bigint DEFAULT NULL,
  `model` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK54l1c2r8x2anuxqu5x2v3tp34` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `chat_conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_conversations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `agent_name` varchar(64) DEFAULT NULL,
  `conversation_id` varchar(64) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `project_id` varchar(64) DEFAULT NULL,
  `title` varchar(256) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `username` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKgdjh17rrglr81k72nhl09golv` (`conversation_id`)
) ENGINE=InnoDB AUTO_INCREMENT=204 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content` longtext NOT NULL,
  `conversation_id` varchar(64) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `role` varchar(16) NOT NULL,
  `tool_calls_json` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=519 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `code_repositories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `code_repositories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `branch` varchar(64) DEFAULT NULL,
  `business_tags` varchar(500) DEFAULT NULL,
  `claude_md` longtext,
  `created_at` datetime(6) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `display_name` varchar(128) NOT NULL,
  `docs_path` varchar(500) DEFAULT NULL,
  `last_scanned_at` datetime(6) DEFAULT NULL,
  `last_scanned_commit_id` varchar(64) DEFAULT NULL,
  `name` varchar(128) NOT NULL,
  `ops_app_id` varchar(64) DEFAULT NULL,
  `product_line` varchar(128) DEFAULT NULL,
  `product_line_id` bigint DEFAULT NULL,
  `product_line_ids` varchar(500) DEFAULT NULL,
  `product_line_name` varchar(128) DEFAULT NULL,
  `product_line_names` varchar(500) DEFAULT NULL,
  `project_name` varchar(128) DEFAULT NULL,
  `repo_id` varchar(64) DEFAULT NULL,
  `scan_enabled` bit(1) DEFAULT NULL,
  `tfs_path` varchar(500) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKewpl0pjxdtlp94q0kljgkg7yp` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `evaluation_datasets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_datasets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `description` longtext,
  `items` longtext NOT NULL,
  `name` varchar(128) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `evaluation_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_results` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `answer` longtext NOT NULL,
  `context` longtext,
  `created_at` datetime(6) NOT NULL,
  `details` longtext,
  `evaluator_name` varchar(64) NOT NULL,
  `explanation` longtext NOT NULL,
  `ground_truth` longtext,
  `passed` bit(1) NOT NULL,
  `question` longtext NOT NULL,
  `score` double NOT NULL,
  `threshold` double NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `knowledge_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knowledge_documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(100) DEFAULT NULL,
  `content` longtext,
  `content_preview` varchar(500) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `embedding` longtext,
  `extra_fields` longtext,
  `file_name` varchar(255) DEFAULT NULL,
  `function_point` varchar(100) DEFAULT NULL,
  `module` varchar(100) DEFAULT NULL,
  `product_line` varchar(100) DEFAULT NULL,
  `source_type` varchar(50) DEFAULT NULL,
  `source_url` varchar(1024) DEFAULT NULL,
  `tags` varchar(500) DEFAULT NULL,
  `title` varchar(500) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_kd_source_updated` (`source_type`,`updated_at` DESC),
  KEY `idx_kd_source_category` (`source_type`,`category`),
  KEY `idx_kd_source_module` (`source_type`,`module`),
  KEY `idx_kd_source_fp` (`source_type`,`function_point`),
  KEY `idx_kd_source_pl` (`source_type`,`product_line`),
  FULLTEXT KEY `ft_knowledge_documents` (`title`,`content`,`module`,`function_point`,`tags`) /*!50100 WITH PARSER `ngram` */ 
) ENGINE=InnoDB AUTO_INCREMENT=23985 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `knowledge_link_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knowledge_link_configs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(100) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `enabled` bit(1) NOT NULL,
  `fetch_mode` varchar(20) DEFAULT NULL,
  `function_point` varchar(100) DEFAULT NULL,
  `last_fetched_at` datetime(6) DEFAULT NULL,
  `last_message` varchar(500) DEFAULT NULL,
  `last_status` varchar(20) DEFAULT NULL,
  `module` varchar(100) DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `product_line` varchar(100) DEFAULT NULL,
  `tags` varchar(500) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `url` varchar(2048) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `llm_provider_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `llm_provider_users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `display_name` varchar(128) DEFAULT NULL,
  `enabled` bit(1) NOT NULL,
  `model_name` varchar(128) DEFAULT NULL,
  `username` varchar(64) NOT NULL,
  `provider_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKrgce7f2k3892vo1ffd0oyn2u6` (`provider_id`),
  CONSTRAINT `FKrgce7f2k3892vo1ffd0oyn2u6` FOREIGN KEY (`provider_id`) REFERENCES `llm_providers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `llm_providers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `llm_providers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `base_url` varchar(512) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `display_name` varchar(128) DEFAULT NULL,
  `enabled` bit(1) NOT NULL,
  `is_default` bit(1) NOT NULL,
  `model_name` varchar(128) DEFAULT NULL,
  `name` varchar(64) NOT NULL,
  `provider_type` varchar(32) NOT NULL,
  `api_key` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK3bllcd3dtf32sggohflpk4ttq` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `mcp_servers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mcp_servers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `args` varchar(2000) DEFAULT NULL,
  `command` varchar(500) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `display_name` varchar(128) DEFAULT NULL,
  `env_vars` varchar(2000) DEFAULT NULL,
  `name` varchar(128) NOT NULL,
  `status` varchar(32) NOT NULL,
  `tool_count` int NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `work_dir` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKtdan0087ys2dsfvl2ebugl227` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `pipeline_artifacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pipeline_artifacts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `artifact_type` varchar(64) NOT NULL,
  `branch` varchar(128) DEFAULT NULL,
  `content` longtext,
  `created_at` datetime(6) NOT NULL,
  `file_path` varchar(1000) NOT NULL,
  `pipeline_id` bigint NOT NULL,
  `repo_id` bigint DEFAULT NULL,
  `summary` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `pipeline_file_changes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pipeline_file_changes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `branch` varchar(128) DEFAULT NULL,
  `change_type` varchar(32) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `file_path` varchar(1000) NOT NULL,
  `new_content` longtext,
  `old_content` longtext,
  `pipeline_id` bigint NOT NULL,
  `repo_id` bigint DEFAULT NULL,
  `summary` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `pipeline_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pipeline_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `level` varchar(16) NOT NULL,
  `message` varchar(2000) NOT NULL,
  `pipeline_id` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=113 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `pipeline_steps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pipeline_steps` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `completed_at` datetime(6) DEFAULT NULL,
  `detail` longtext,
  `metadata` longtext,
  `pipeline_id` bigint NOT NULL,
  `seq_no` int NOT NULL,
  `started_at` datetime(6) DEFAULT NULL,
  `status` varchar(32) NOT NULL,
  `title` varchar(256) NOT NULL,
  `type` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `pipeline_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pipeline_tasks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `confirm_message` varchar(500) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `created_by` varchar(64) DEFAULT NULL,
  `current_stage` varchar(64) DEFAULT NULL,
  `error` longtext,
  `execution_log` longtext,
  `interactive` bit(1) DEFAULT NULL,
  `product_line_id` bigint DEFAULT NULL,
  `project_id` varchar(64) DEFAULT NULL,
  `repo_ids` varchar(500) DEFAULT NULL,
  `retry_count` int NOT NULL,
  `skill_name` varchar(128) DEFAULT NULL,
  `status` varchar(32) NOT NULL,
  `tfs_title` varchar(500) DEFAULT NULL,
  `tfs_work_item_id` bigint DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `workflow_definition_id` bigint DEFAULT NULL,
  `workflow_execution_id` bigint DEFAULT NULL,
  `workflow_pause_mode` varchar(64) DEFAULT NULL,
  `params_json` longtext,
  `task_type` varchar(64) DEFAULT NULL,
  `model` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `product_lines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_lines` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `claude_md` longtext,
  `created_at` datetime(6) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `display_name` varchar(128) NOT NULL,
  `docs_path` varchar(500) DEFAULT NULL,
  `name` varchar(128) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK3p630b63mbek153t2e23tpgv1` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `project_journal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_journal` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `bucket` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_general_ci NOT NULL,
  `scope` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_journal_scope_bucket` (`scope`,`bucket`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `projects` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `created_by` varchar(64) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `name` varchar(128) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `workspace_id` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `repo_modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `repo_modules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `enabled` bit(1) NOT NULL,
  `iteration` varchar(64) DEFAULT NULL,
  `module_name` varchar(128) NOT NULL,
  `module_type` varchar(64) NOT NULL,
  `parent_module` varchar(128) DEFAULT NULL,
  `repo_id` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `allowed_menus` varchar(4000) DEFAULT NULL,
  `role` varchar(32) NOT NULL,
  `builtin` bit(1) NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  `label` varchar(32) DEFAULT NULL,
  `sort_order` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKd64nnsmfmr8csibcdgg29wc5t` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sandbox_executions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sandbox_executions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `command` longtext COLLATE utf8mb4_general_ci,
  `created_at` datetime(6) NOT NULL,
  `created_by` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `duration_ms` bigint DEFAULT NULL,
  `exit_code` int DEFAULT NULL,
  `finished_at` datetime(6) DEFAULT NULL,
  `output` longtext COLLATE utf8mb4_general_ci,
  `sandbox_id` bigint NOT NULL,
  `seq_no` int NOT NULL,
  `started_at` datetime(6) DEFAULT NULL,
  `status` varchar(32) COLLATE utf8mb4_general_ci NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sandboxes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sandboxes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `created_by` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `mode` varchar(16) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(128) COLLATE utf8mb4_general_ci NOT NULL,
  `status` varchar(32) COLLATE utf8mb4_general_ci NOT NULL,
  `task_id` varchar(64) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `timeout_seconds` int NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `workdir` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKybjcatsw0ftmyvm2do22f9qe` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `scheduled_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scheduled_tasks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `cron_expression` varchar(64) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `enabled` bit(1) NOT NULL,
  `last_message` varchar(500) DEFAULT NULL,
  `last_run_time` datetime(6) DEFAULT NULL,
  `last_status` varchar(32) DEFAULT NULL,
  `name` varchar(128) NOT NULL,
  `task_key` varchar(128) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `params_json` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `seed_state`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seed_state` (
  `seed_key` varchar(100) NOT NULL,
  `seed_value` varchar(255) DEFAULT NULL,
  `seeded_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`seed_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `system_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_configs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `config_group` varchar(64) DEFAULT NULL,
  `config_key` varchar(128) NOT NULL,
  `config_value` longtext,
  `created_at` datetime(6) DEFAULT NULL,
  `description` varchar(512) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `task_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `duration_ms` bigint DEFAULT NULL,
  `end_time` datetime(6) DEFAULT NULL,
  `message` varchar(1000) DEFAULT NULL,
  `start_time` datetime(6) NOT NULL,
  `status` varchar(32) NOT NULL,
  `task_id` bigint NOT NULL,
  `task_key` varchar(128) NOT NULL,
  `task_name` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `team_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `team_members` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `display_name` varchar(64) DEFAULT NULL,
  `joined_at` datetime(6) DEFAULT NULL,
  `role` varchar(16) NOT NULL,
  `username` varchar(64) NOT NULL,
  `workspace_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKj72xsgomfno4p5gr3eorrg0ol` (`workspace_id`,`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `todos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `todos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `completed_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` varchar(2000) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `due_date` datetime(6) DEFAULT NULL,
  `priority` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_todos_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_llm_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_llm_config` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `api_key` varchar(512) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `enabled` bit(1) NOT NULL,
  `model_name` varchar(128) DEFAULT NULL,
  `provider_id` bigint DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_preference`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_preference` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `pref_key` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `pref_value` longtext COLLATE utf8mb4_general_ci,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKqkn7wwg98q9d6ifwxv7mysukj` (`user_id`,`pref_key`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_tfs_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_tfs_config` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `enabled` bit(1) NOT NULL,
  `git_password` varchar(512) DEFAULT NULL,
  `git_username` varchar(128) DEFAULT NULL,
  `personal_access_token` varchar(512) DEFAULT NULL,
  `tfs_server_url` varchar(512) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` bigint NOT NULL,
  `wxp_password` varchar(512) DEFAULT NULL,
  `wxp_usercode` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `allowed_menus` varchar(2000) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `display_name` varchar(64) DEFAULT NULL,
  `emp_no` varchar(32) DEFAULT NULL,
  `enabled` bit(1) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(16) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `username` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKr43af9ap4edm43mmtq01oddj6` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `webhook_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `webhook_configs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `created_by` varchar(64) DEFAULT NULL,
  `enabled` bit(1) NOT NULL,
  `events` varchar(500) NOT NULL,
  `name` varchar(128) NOT NULL,
  `retry_count` int NOT NULL,
  `secret` varchar(256) DEFAULT NULL,
  `timeout_ms` int NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `url` varchar(500) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `webhook_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `webhook_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `error_message` longtext,
  `event_type` varchar(64) DEFAULT NULL,
  `payload` longtext,
  `response_body` longtext,
  `response_code` int DEFAULT NULL,
  `retry_count` int DEFAULT NULL,
  `sent_at` datetime(6) DEFAULT NULL,
  `status` varchar(32) NOT NULL,
  `webhook_config_id` bigint NOT NULL,
  `webhook_name` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `wiki_pages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wiki_pages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `key_concepts` varchar(2000) DEFAULT NULL,
  `sections` longtext,
  `source_document_id` bigint NOT NULL,
  `status` varchar(32) DEFAULT NULL,
  `summary` longtext,
  `title` varchar(500) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `workflow_executions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflow_executions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `completed_at` datetime(6) DEFAULT NULL,
  `context` longtext,
  `result` longtext,
  `started_at` datetime(6) DEFAULT NULL,
  `status` varchar(32) NOT NULL,
  `workflow_id` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `workflow_nodes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflow_nodes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `completed_at` datetime(6) DEFAULT NULL,
  `error` varchar(2000) DEFAULT NULL,
  `execution_id` bigint NOT NULL,
  `input` longtext,
  `node_id` varchar(128) NOT NULL,
  `output` longtext,
  `started_at` datetime(6) DEFAULT NULL,
  `status` varchar(32) NOT NULL,
  `type` varchar(32) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `workflows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflows` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `definition_json` longtext,
  `description` varchar(500) DEFAULT NULL,
  `enabled` bit(1) NOT NULL,
  `name` varchar(128) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `workspaces`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workspaces` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `created_by` varchar(64) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `name` varchar(128) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

