
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

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` (`id`, `allowed_menus`, `created_at`, `display_name`, `emp_no`, `enabled`, `password`, `role`, `updated_at`, `username`) VALUES (1,'*','2026-08-21 17:02:44.000000','管理员','admin',_binary '','$2a$10$fWzcxtViCnjIELbPUtx2CeqBL1oVKSgVWYFD53NoUYCT7j0x1UnOG','ADMIN','2026-08-21 17:02:44.000000','admin');
INSERT INTO `users` (`id`, `allowed_menus`, `created_at`, `display_name`, `emp_no`, `enabled`, `password`, `role`, `updated_at`, `username`) VALUES (3,'*','2026-09-10 10:24:22.078348','康景磊','001',_binary '','$2a$10$Qu8c9yu09L/uSvj3f0PYnOCdXb3qxJuJL8IwzZcS48R.rWVMYwn1u','USER','2026-09-10 10:24:22.078348','kjl');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` (`id`, `allowed_menus`, `role`, `builtin`, `description`, `label`, `sort_order`) VALUES (1,'[\"/chat\",\"/todos\",\"/requirements\",\"/req-collect\",\"/i18n-special\",\"/work-report\",\"/knowledge\",\"/skills\",\"/agents\",\"/workflows\",\"/automate\",\"/scheduled-tasks\",\"/providers\",\"/mcp\",\"/sandbox\",\"/i18n-translate\",\"/users\"]','ADMIN',_binary '','内置角色，可配置菜单权限','管理员',2);
INSERT INTO `role_permissions` (`id`, `allowed_menus`, `role`, `builtin`, `description`, `label`, `sort_order`) VALUES (2,'[\"/chat\",\"/todos\",\"/requirements\",\"/req-collect\",\"/i18n-special\",\"/work-report\",\"/knowledge\",\"/skills\",\"/agents\",\"/workflows\",\"/automate\",\"/scheduled-tasks\"]','USER',_binary '','内置角色，可配置菜单权限','普通用户',3);
INSERT INTO `role_permissions` (`id`, `allowed_menus`, `role`, `builtin`, `description`, `label`, `sort_order`) VALUES (3,'*','SUPER_ADMIN',_binary '','内置角色，固定拥有全部菜单，不可删除','超级管理员',1);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `seed_state` WRITE;
/*!40000 ALTER TABLE `seed_state` DISABLE KEYS */;
INSERT INTO `seed_state` (`seed_key`, `seed_value`, `seeded_at`) VALUES ('automate_task_types_seeded','true','2026-08-28 11:41:40.302592');
INSERT INTO `seed_state` (`seed_key`, `seed_value`, `seeded_at`) VALUES ('llm_providers_seeded','true','2026-08-27 10:32:18.880944');
/*!40000 ALTER TABLE `seed_state` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `automate_task_types` WRITE;
/*!40000 ALTER TABLE `automate_task_types` DISABLE KEYS */;
INSERT INTO `automate_task_types` (`id`, `code`, `created_at`, `description`, `enabled`, `form_schema`, `icon`, `name`, `skill_name`, `sort_order`, `updated_at`, `workflow_definition_id`, `model`) VALUES (1,'req-analysis','2026-08-28 11:41:39.104237','对 TFS 需求进行正式需求分析：产品业务分析、深度分析，回写 Winning.Demand.Analysis',_binary '','[{\"key\":\"tfsWorkItemId\",\"label\":\"TFS 需求号\",\"type\":\"number\",\"required\":true,\"placeholder\":\"输入 TFS 需求号\"}]','🔍','需求分析',NULL,1,'2026-09-06 20:22:40.314029',4,NULL);
INSERT INTO `automate_task_types` (`id`, `code`, `created_at`, `description`, `enabled`, `form_schema`, `icon`, `name`, `skill_name`, `sort_order`, `updated_at`, `workflow_definition_id`, `model`) VALUES (2,'spec-generation','2026-08-28 11:41:39.441318','基于资料区 + 代码仓库 + 方法论文档，为指定功能模块生成功能点 Spec 文档',_binary '','[{\"key\":\"moduleName\",\"label\":\"功能模块名称\",\"type\":\"text\",\"required\":true,\"placeholder\":\"如：WiNEX 病历管理（住院）\"},{\"key\":\"materialDir\",\"label\":\"资料区路径\",\"type\":\"text\",\"placeholder\":\"默认 E:\\\\37结构性问题治理\\\\01WiNEX 病历管理\\\\资料区\"},{\"key\":\"methodologyDoc\",\"label\":\"方法论文档路径\",\"type\":\"text\",\"placeholder\":\"功能点划分方法论文档路径（可选）\"},{\"key\":\"outputDir\",\"label\":\"输出目录\",\"type\":\"text\",\"placeholder\":\"按模块编码前缀自动确定（可选）\"}]','📝','生成Spec',NULL,2,'2026-09-06 20:22:29.386241',2,NULL);
INSERT INTO `automate_task_types` (`id`, `code`, `created_at`, `description`, `enabled`, `form_schema`, `icon`, `name`, `skill_name`, `sort_order`, `updated_at`, `workflow_definition_id`, `model`) VALUES (3,'req-consolidation','2026-08-28 11:41:39.823039','从 TFS 查询获取需求清单，按 Spec 知识库功能点结构归集，并输出功能点健康度基线',_binary '','[{\"key\":\"queryUrl\",\"label\":\"TFS 查询 URL\",\"type\":\"text\",\"placeholder\":\"留空=默认「病历条线新增需求」查询；如需切换，粘贴 TFS 网页查询地址（需包含 id=xxx）\"},{\"key\":\"outputDir\",\"label\":\"输出路径\",\"type\":\"text\",\"default\":\"E:\\\\37结构性问题治理\\\\07病历条线需求聚拢\\\\\",\"placeholder\":\"默认 E:\\\\37结构性问题治理\\\\07病历条线需求聚拢\\\\\"}]','🗂️','需求归集','consolidate-requirements-v1',3,'2026-08-31 17:11:55.735090',NULL,'glm-5');
INSERT INTO `automate_task_types` (`id`, `code`, `created_at`, `description`, `enabled`, `form_schema`, `icon`, `name`, `skill_name`, `sort_order`, `updated_at`, `workflow_definition_id`, `model`) VALUES (4,'fp-health','2026-08-28 11:41:40.097913','五维评分 + 一票否决的功能点健康度 / 设计合理性分析，输出含优先级建议的完整报告',_binary '','[{\"key\":\"moduleName\",\"label\":\"模块名称\",\"type\":\"text\",\"required\":true,\"placeholder\":\"如：病历归档\"},{\"key\":\"refDocDir\",\"label\":\"对照文档目录\",\"type\":\"text\",\"placeholder\":\"默认 E:\\\\37结构性问题治理\\\\04参考资料\\\\{模块名}\\\\\"},{\"key\":\"requirementsSource\",\"label\":\"需求问题点来源\",\"type\":\"textarea\",\"placeholder\":\"需求清单/问题点来源说明（可选）\"}]','🩺','功能点健康度','rational-design-v1',4,'2026-09-06 20:23:17.019917',NULL,'glm-5');
INSERT INTO `automate_task_types` (`id`, `code`, `created_at`, `description`, `enabled`, `form_schema`, `icon`, `name`, `skill_name`, `sort_order`, `updated_at`, `workflow_definition_id`, `model`) VALUES (5,'Taikang-crc','2026-09-06 20:25:03.984498','获取泰康仙林项目的WXP底稿、TFS数据、WBS等数据，分析客户的项目风险情况',_binary '','[]',NULL,'泰康仙林crc','customer-radar-monitor',5,'2026-09-06 21:50:03.814240',NULL,NULL);
INSERT INTO `automate_task_types` (`id`, `code`, `created_at`, `description`, `enabled`, `form_schema`, `icon`, `name`, `skill_name`, `sort_order`, `updated_at`, `workflow_definition_id`, `model`) VALUES (6,'Suzhouzhongyiyuan-crc','2026-09-06 20:27:43.460637','获取中国科学院西苑医院苏州分院的WXP底稿、TFS数据、WBS等数据，分析客户的项目风险情况',_binary '','[]',NULL,'苏州西苑CRC',NULL,6,'2026-09-06 20:27:43.460637',6,NULL);
INSERT INTO `automate_task_types` (`id`, `code`, `created_at`, `description`, `enabled`, `form_schema`, `icon`, `name`, `skill_name`, `sort_order`, `updated_at`, `workflow_definition_id`, `model`) VALUES (7,'Xinchang-crc','2026-09-06 20:46:27.422767','获取新昌中医院项目WXP底稿、TFS数据、WBS等信息，分析项目风险情况',_binary '','[]',NULL,'新昌中医院crc',NULL,7,'2026-09-06 20:46:27.422767',6,NULL);
INSERT INTO `automate_task_types` (`id`, `code`, `created_at`, `description`, `enabled`, `form_schema`, `icon`, `name`, `skill_name`, `sort_order`, `updated_at`, `workflow_definition_id`, `model`) VALUES (8,'AIFlow','2026-09-07 14:35:35.313933','获取TFS需求号，从需求分析设计、代码实现和代码审查的全流程auto-dev',_binary '','[]',NULL,'自动化开发AIFlow',NULL,8,'2026-09-07 14:35:35.313933',7,NULL);
/*!40000 ALTER TABLE `automate_task_types` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `system_configs` WRITE;
/*!40000 ALTER TABLE `system_configs` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_configs` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `product_lines` WRITE;
/*!40000 ALTER TABLE `product_lines` DISABLE KEYS */;
INSERT INTO `product_lines` (`id`, `claude_md`, `created_at`, `description`, `display_name`, `docs_path`, `name`, `updated_at`) VALUES (1,NULL,'2026-08-22 11:36:53.000000','住院病历产品线，涵盖入院记录、病程记录、手术记录、出院小结等','住院病历',NULL,'inpatient-emr','2026-08-22 11:36:53.000000');
INSERT INTO `product_lines` (`id`, `claude_md`, `created_at`, `description`, `display_name`, `docs_path`, `name`, `updated_at`) VALUES (2,NULL,'2026-08-22 11:36:53.000000','门诊病历产品线，涵盖门诊初诊、复诊、急诊门诊、专科门诊病历等','门诊病历',NULL,'outpatient-emr','2026-08-22 11:36:53.000000');
INSERT INTO `product_lines` (`id`, `claude_md`, `created_at`, `description`, `display_name`, `docs_path`, `name`, `updated_at`) VALUES (3,NULL,'2026-08-22 11:36:53.000000','急诊病历产品线，涵盖急诊登记、急诊留观病历、抢救记录等','急诊病历',NULL,'emergency-emr','2026-08-22 11:36:53.000000');
/*!40000 ALTER TABLE `product_lines` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

