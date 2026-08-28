package com.racc.structured.service;

import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 结构化输出服务。LLM 未配置时返回模拟数据。
 */
@Service
public class StructuredOutputService {

    /**
     * 分析需求。
     */
    public Map<String, Object> analyzeRequirement(String requirement, String context) {
        Map<String, Object> result = new LinkedHashMap<>();

        // 模拟分析结果
        result.put("summary", "需求摘要（模拟分析）: " + truncate(requirement, 100));
        result.put("complexity", estimateComplexity(requirement));
        result.put("riskLevel", estimateRisk(requirement));
        result.put("estimatedEffort", estimateEffort(requirement));

        List<String> modules = new ArrayList<>();
        if (requirement != null) {
            if (requirement.contains("病历") || requirement.contains("emr")) modules.add("病历管理");
            if (requirement.contains("会诊") || requirement.contains("consultation")) modules.add("会诊管理");
            if (requirement.contains("审批") || requirement.contains("approval")) modules.add("审批流程");
            if (requirement.contains("报表") || requirement.contains("report")) modules.add("报表统计");
            if (requirement.contains("权限") || requirement.contains("auth")) modules.add("权限管理");
        }
        if (modules.isEmpty()) {
            modules.add("通用模块");
        }
        result.put("involvedModules", modules);

        List<String> modificationPoints = new ArrayList<>();
        modificationPoints.add("数据库表结构变更评估");
        modificationPoints.add("后端 API 接口调整");
        modificationPoints.add("前端页面适配");
        result.put("modificationPoints", modificationPoints);

        result.put("technicalSuggestion",
                "建议采用增量开发方式，优先实现核心业务逻辑，逐步完善外围功能。"
                + "（当前 LLM 未配置，此为模拟分析结果。）");

        return result;
    }

    /**
     * 分析代码。
     */
    public Map<String, Object> analyzeCode(String code, String fileName, String context) {
        Map<String, Object> result = new LinkedHashMap<>();

        int lineCount = code != null ? code.split("\n").length : 0;
        result.put("overview", "代码概况（模拟分析）: " + (fileName != null ? fileName : "未知文件")
                + "，共 " + lineCount + " 行");
        result.put("qualityScore", estimateQuality(code));

        List<Map<String, Object>> issues = new ArrayList<>();
        if (code != null) {
            if (code.contains("System.out")) {
                issues.add(createIssue("code_style", "medium", "使用了 System.out 打印日志，建议使用日志框架", 0, "替换为 Logger"));
            }
            if (code.contains("@Autowired")) {
                issues.add(createIssue("code_style", "low", "使用了字段注入 @Autowired，建议使用构造器注入", 0, "替换为构造器注入"));
            }
            if (code.contains("null")) {
                issues.add(createIssue("best_practice", "low", "代码中存在 null 引用，建议使用 Optional 或 @Nullable 注解", 0, "使用 Optional 或引入空安全检查"));
            }
        }
        if (issues.isEmpty()) {
            issues.add(createIssue("info", "info", "未发现明显问题", 0, ""));
        }
        result.put("issues", issues);

        List<String> improvements = new ArrayList<>();
        improvements.add("添加单元测试覆盖核心逻辑");
        improvements.add("补充方法级注释和 JavaDoc");
        improvements.add("考虑使用设计模式优化代码结构");
        result.put("improvements", improvements);

        List<String> dependencies = new ArrayList<>();
        if (code != null) {
            if (code.contains("import")) {
                String[] lines = code.split("\n");
                for (String line : lines) {
                    String trimmed = line.trim();
                    if (trimmed.startsWith("import ") && trimmed.endsWith(";")) {
                        String dep = trimmed.substring(7, trimmed.length() - 1);
                        if (!dep.startsWith("java.") && !dep.startsWith("org.springframework")) {
                            dependencies.add(dep);
                        }
                    }
                }
            }
        }
        if (dependencies.isEmpty()) {
            dependencies.add("未检测到外部依赖");
        }
        result.put("dependencies", dependencies);

        return result;
    }

    /**
     * 获取 JSON schema。
     */
    public Map<String, Object> getSchemas() {
        Map<String, Object> schemas = new LinkedHashMap<>();

        // RequirementAnalysis schema
        Map<String, Object> reqSchema = new LinkedHashMap<>();
        reqSchema.put("type", "object");
        reqSchema.put("title", "需求分析结果");

        Map<String, Object> reqProperties = new LinkedHashMap<>();
        reqProperties.put("summary", Map.of("type", "string", "description", "需求摘要"));
        reqProperties.put("complexity", Map.of("type", "string", "enum", List.of("低", "中", "高"), "description", "复杂度"));
        reqProperties.put("riskLevel", Map.of("type", "string", "enum", List.of("低", "中", "高"), "description", "风险等级"));
        reqProperties.put("estimatedEffort", Map.of("type", "number", "description", "预估人天"));
        reqProperties.put("involvedModules", Map.of("type", "array", "items", Map.of("type", "string"), "description", "涉及模块"));
        reqProperties.put("modificationPoints", Map.of("type", "array", "items", Map.of("type", "string"), "description", "改造点"));
        reqProperties.put("technicalSuggestion", Map.of("type", "string", "description", "技术建议"));
        reqSchema.put("properties", reqProperties);
        schemas.put("requirementAnalysis", reqSchema);

        // CodeAnalysis schema
        Map<String, Object> codeSchema = new LinkedHashMap<>();
        codeSchema.put("type", "object");
        codeSchema.put("title", "代码分析结果");

        Map<String, Object> codeProperties = new LinkedHashMap<>();
        codeProperties.put("overview", Map.of("type", "string", "description", "代码概况"));
        codeProperties.put("qualityScore", Map.of("type", "number", "description", "质量评分 (0-100)"));
        codeProperties.put("issues", Map.of("type", "array", "items", Map.of("type", "object"), "description", "问题列表"));
        codeProperties.put("improvements", Map.of("type", "array", "items", Map.of("type", "string"), "description", "改进建议"));
        codeProperties.put("dependencies", Map.of("type", "array", "items", Map.of("type", "string"), "description", "依赖列表"));
        codeSchema.put("properties", codeProperties);
        schemas.put("codeAnalysis", codeSchema);

        return schemas;
    }

    // ---------- helpers ----------

    private String estimateComplexity(String requirement) {
        if (requirement == null) return "中";
        int len = requirement.length();
        if (len > 500) return "高";
        if (len > 100) return "中";
        return "低";
    }

    private String estimateRisk(String requirement) {
        if (requirement == null) return "中";
        String lower = requirement.toLowerCase();
        if (lower.contains("数据库") || lower.contains("重构") || lower.contains("迁移")) return "高";
        if (lower.contains("新增") || lower.contains("修改")) return "中";
        return "低";
    }

    private int estimateEffort(String requirement) {
        if (requirement == null) return 3;
        int len = requirement.length();
        if (len > 500) return 10;
        if (len > 100) return 5;
        return 3;
    }

    private double estimateQuality(String code) {
        if (code == null || code.isBlank()) return 0;
        int score = 85;
        if (code.contains("System.out")) score -= 10;
        if (code.contains("@Autowired")) score -= 5;
        if (code.contains("TODO")) score -= 5;
        if (code.contains("try") && !code.contains("catch")) score -= 5;
        if (code.contains("@Override")) score += 5;
        if (code.contains("private final")) score += 5;
        if (code.contains("interface")) score += 5;
        return Math.max(0, Math.min(100, score));
    }

    private Map<String, Object> createIssue(String type, String severity, String description,
                                            int lineNumber, String suggestion) {
        Map<String, Object> issue = new LinkedHashMap<>();
        issue.put("type", type);
        issue.put("severity", severity);
        issue.put("description", description);
        issue.put("lineNumber", lineNumber);
        issue.put("suggestion", suggestion);
        return issue;
    }

    private String truncate(String text, int maxLen) {
        if (text == null) return "";
        return text.length() > maxLen ? text.substring(0, maxLen) + "..." : text;
    }
}