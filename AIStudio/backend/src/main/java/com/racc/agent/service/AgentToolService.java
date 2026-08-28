package com.racc.agent.service;

import com.racc.knowledge.service.KnowledgeService;
import com.racc.knowledge.service.ScanService;
import com.racc.skill.dto.SkillFileTreeNode;
import com.racc.skill.service.SkillService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Agent 工具执行器。
 * 不依赖 Spring AI 的 @Tool 注解（1.0.0-M5 不支持），
 * 由 AgentRuntimeService 通过 system prompt 描述工具，LLM 以 JSON 格式返回调用，
 * 本服务负责实际执行。
 */
@Component
public class AgentToolService {

    private static final Logger log = LoggerFactory.getLogger(AgentToolService.class);

    private final SkillService skillService;
    private final ScanService scanService;
    private final KnowledgeService knowledgeService;

    /** Agent 文件写入的根目录（write_file 相对路径写入该目录下的 agent-files 子目录） */
    @Value("${racc.data-dir:../data}")
    private String dataDir;

    /** write_file 绝对路径写入白名单（逗号分隔），沙箱目录之外的受控放行 */
    @Value("${racc.agent.write-allowed-dirs:}")
    private String writeAllowedDirsConfig;

    public AgentToolService(SkillService skillService,
                            ScanService scanService,
                            KnowledgeService knowledgeService) {
        this.skillService = skillService;
        this.scanService = scanService;
        this.knowledgeService = knowledgeService;
    }

    /**
     * 获取工具描述定义（JSON 格式，用于注入 system prompt）。
     */
    public String getToolDefinitions() {
        String defs = """
            【可用工具定义】
            你可以通过回复 JSON 格式的工具调用来使用以下工具。
            工具调用格式：{"tool":"工具名","args":{"参数名":"参数值"}}
            一次只能调用一个工具，工具执行结果会返回给你。

            1. code_scan_preview
               描述：预览代码扫描，列出指定目录中所有可导入的文件
               参数：{"directory": "string (目录路径)"}
               返回：文件列表（路径、类型、大小）

            2. code_scan_execute
               描述：执行代码扫描，扫描目录中的文件并导入知识库
               参数：{"directory": "string (目录路径)", "category": "string (分类名称，可选)"}
               返回：导入统计（总数、导入数、跳过数、错误）

            3. read_skill_file
               描述：读取技能（skill）的文件内容
               参数：{"skillName": "string (技能名称)", "filePath": "string (文件路径，如 SKILL.md、assets/template.md)"}
               返回：文件文本内容

            4. list_skill_files
               描述：列出技能目录中的文件树
               参数：{"skillName": "string (技能名称)"}
               返回：文件和目录列表

            5. search_knowledge
               描述：搜索知识库文档
               参数：{"query": "string (搜索关键词)", "topK": "number (返回数量，默认5)"}
               返回：匹配的文档片段列表

            6. read_directory
               描述：列出指定目录中的文件和子目录
               参数：{"path": "string (目录路径)"}
               返回：条目列表（名称、类型、大小）

            7. read_file
               描述：读取指定路径的文件内容（文本文件）
               参数：{"path": "string (文件路径)"}
               返回：文件文本内容

            8. write_file
               描述：将文本内容写入文件（生成交付物用，如分析报告稿）。
               相对路径写入平台工作目录；如果用户明确指定了输出目录且该目录在下方白名单内，应直接写入该绝对路径。
               参数：{"path": "string (相对子路径，如 需求分析_1753807/产品业务分析.md；或白名单目录内的绝对路径)", "content": "string (文件内容)"}
               返回：写入成功后的文件绝对路径（可作为 upload_attachment 的 filePath 或 MCP 工具的 "@file:" 引用）
            """;
        List<Path> extraDirs = extraAllowedWriteDirs();
        if (!extraDirs.isEmpty()) {
            defs = defs + "\n   【write_file 绝对路径白名单目录】" + extraDirs + "\n";
        }
        return defs;
    }

    /** 沙箱之外的绝对路径写入白名单（配置 racc.agent.write-allowed-dirs，逗号分隔） */
    private List<Path> extraAllowedWriteDirs() {
        List<Path> dirs = new ArrayList<>();
        if (writeAllowedDirsConfig == null || writeAllowedDirsConfig.isBlank()) return dirs;
        for (String dir : writeAllowedDirsConfig.split(",")) {
            String d = dir.trim();
            if (d.isEmpty()) continue;
            try {
                dirs.add(Paths.get(d).toAbsolutePath().normalize());
            } catch (Exception e) {
                log.warn("写入白名单目录非法，忽略: {}", d);
            }
        }
        return dirs;
    }

    /** write_file 全部允许的写入根目录 = 平台沙箱 + 白名单目录 */
    private List<Path> allowedWriteRoots() {
        List<Path> roots = new ArrayList<>();
        roots.add(Paths.get(dataDir, "agent-files").toAbsolutePath().normalize());
        roots.addAll(extraAllowedWriteDirs());
        return roots;
    }

    /**
     * 执行工具调用。
     * @param toolName 工具名
     * @param argsJson 参数字典
     * @return 执行结果字符串
     */
    public String executeTool(String toolName, Map<String, Object> argsJson) {
        log.info("[AgentTool] 执行: {} args={}", toolName, argsJson);
        try {
            return switch (toolName) {
                case "code_scan_preview" -> executeCodeScanPreview(argsJson);
                case "code_scan_execute" -> executeCodeScanExecute(argsJson);
                case "read_skill_file" -> executeReadSkillFile(argsJson);
                case "list_skill_files" -> executeListSkillFiles(argsJson);
                case "search_knowledge" -> executeSearchKnowledge(argsJson);
                case "read_directory" -> executeReadDirectory(argsJson);
                case "read_file" -> executeReadFile(argsJson);
                case "write_file" -> executeWriteFile(argsJson);
                default -> "未知工具: " + toolName;
            };
        } catch (Exception e) {
            log.warn("工具 {} 执行失败: {}", toolName, e.getMessage());
            return "执行失败: " + e.getMessage();
        }
    }

    private String executeCodeScanPreview(Map<String, Object> args) {
        String dir = getStringArg(args, "directory");
        Map<String, Object> result = scanService.previewScan(dir);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> files = (List<Map<String, Object>>) result.get("files");
        if (files == null || files.isEmpty()) return "未找到可扫描的文件";
        StringBuilder sb = new StringBuilder("共发现 ").append(files.size()).append(" 个文件：\n");
        for (Map<String, Object> f : files) {
            sb.append("- ").append(f.get("path"))
              .append(" (").append(f.get("extension"))
              .append(", ").append(f.get("size")).append(" bytes)\n");
        }
        return sb.toString();
    }

    private String executeCodeScanExecute(Map<String, Object> args) {
        String dir = getStringArg(args, "directory");
        String category = getStringArg(args, "category");
        Map<String, Object> result = scanService.executeScan(dir, category);
        return String.format("扫描完成：共 %d 个文件，导入 %d 个，跳过 %d 个",
                result.get("totalFiles"), result.get("importedFiles"), result.get("skippedFiles"));
    }

    private String executeReadSkillFile(Map<String, Object> args) {
        String skillName = getStringArg(args, "skillName");
        String filePath = getStringArg(args, "filePath");
        var content = skillService.readFile(skillName, filePath);
        return content.getContent();
    }

    private String executeListSkillFiles(Map<String, Object> args) {
        String skillName = getStringArg(args, "skillName");
        var detail = skillService.getSkillDetail(skillName);
        var tree = detail.getFileTree();
        if (tree == null || tree.isEmpty()) return "技能目录为空";
        StringBuilder sb = new StringBuilder("技能 ").append(skillName).append(" 的文件：\n");
        flattenTree(tree, "", sb);
        return sb.toString();
    }

    private String executeSearchKnowledge(Map<String, Object> args) {
        String query = getStringArg(args, "query");
        int topK = getIntArg(args, "topK", 5);
        @SuppressWarnings("unchecked")
        Map<String, Object> result = knowledgeService.searchDocuments(query, topK, "default",
                null, null, null, null, null);
        Object results = result.get("results");
        if (results instanceof List) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> hits = (List<Map<String, Object>>) results;
            if (hits.isEmpty()) return "未找到匹配的文档";
            StringBuilder sb = new StringBuilder("找到 ").append(hits.size()).append(" 条结果：\n\n");
            int i = 1;
            for (Map<String, Object> hit : hits) {
                sb.append("【").append(i++).append("】").append(hit.get("title")).append("\n");
                sb.append(hit.get("content")).append("\n\n");
            }
            return sb.toString();
        }
        return "未找到匹配的文档";
    }

    private String executeReadDirectory(Map<String, Object> args) {
        String path = getStringArg(args, "path");
        List<Map<String, Object>> result = new ArrayList<>();
        try (Stream<Path> stream = Files.list(Paths.get(path))) {
            stream.sorted().forEach(p -> {
                try {
                    result.add(Map.of(
                        "name", p.getFileName().toString(),
                        "type", Files.isDirectory(p) ? "directory" : "file",
                        "size", Files.size(p)
                    ));
                } catch (IOException ignored) {}
            });
        } catch (Exception e) {
            return "读取目录失败: " + e.getMessage();
        }
        if (result.isEmpty()) return "目录为空";
        StringBuilder sb = new StringBuilder("目录 ").append(path).append("：\n");
        for (Map<String, Object> entry : result) {
            sb.append("- ").append(entry.get("name"))
              .append(" (").append(entry.get("type")).append(")\n");
        }
        return sb.toString();
    }

    private String executeReadFile(Map<String, Object> args) {
        String path = getStringArg(args, "path");
        try {
            return Files.readString(Paths.get(path));
        } catch (Exception e) {
            return "读取文件失败: " + e.getMessage();
        }
    }

    /**
     * 写入文件：仅限 {data-dir}/agent-files 目录（防路径穿越）。
     * 用于 Agent 生成交付物（如分析报告稿），返回的绝对路径可继续用于
     * upload_attachment 的 filePath 参数或 MCP 工具的 "@file:" 长文本回写。
     */
    private String executeWriteFile(Map<String, Object> args) {
        String path = getStringArg(args, "path");
        String content = getStringArg(args, "content");
        if (path == null || path.isBlank()) {
            return "参数错误: path 不能为空";
        }
        if (content == null || content.isEmpty()) {
            return "参数错误: content 不能为空";
        }
        try {
            Path requested = Paths.get(path);
            Path target;
            if (requested.isAbsolute()) {
                // 绝对路径：必须落在白名单目录内（沙箱或配置的允许目录）
                target = requested.normalize();
                boolean allowed = allowedWriteRoots().stream().anyMatch(target::startsWith);
                if (!allowed) {
                    return "非法路径: 绝对路径仅允许写入以下白名单目录: " + allowedWriteRoots();
                }
            } else {
                // 相对路径：写入平台沙箱目录
                Path baseDir = Paths.get(dataDir, "agent-files").toAbsolutePath().normalize();
                Files.createDirectories(baseDir);
                target = baseDir.resolve(path).normalize();
                if (!target.startsWith(baseDir)) {
                    return "非法路径: 只能写入平台工作目录（agent-files）内";
                }
            }
            if (target.getParent() != null) {
                Files.createDirectories(target.getParent());
            }
            Files.writeString(target, content, java.nio.charset.StandardCharsets.UTF_8);
            log.info("[AgentTool] write_file: {} ({} 字符)", target, content.length());
            return "写入成功: " + target + "（" + content.length() + " 字符）。"
                    + "该绝对路径可用于 upload_attachment 的 filePath 参数，或作为 MCP 工具字段值的 \"@file:" + target + "\" 引用。";
        } catch (IOException e) {
            return "写入文件失败: " + e.getMessage();
        }
    }

    // ==================== 辅助 ====================

    private String getStringArg(Map<String, Object> args, String key) {
        Object val = args.get(key);
        return val != null ? val.toString() : "";
    }

    private int getIntArg(Map<String, Object> args, String key, int defaultValue) {
        Object val = args.get(key);
        if (val instanceof Number) return ((Number) val).intValue();
        if (val instanceof String) {
            try { return Integer.parseInt((String) val); } catch (NumberFormatException ignored) {}
        }
        return defaultValue;
    }

    private void flattenTree(List<SkillFileTreeNode> tree, String prefix, StringBuilder sb) {
        for (var node : tree) {
            sb.append("- ").append(prefix).append(node.getPath());
            if ("directory".equals(node.getType())) {
                sb.append("/\n");
                if (node.getChildren() != null) {
                    flattenTree(node.getChildren(), prefix + node.getName() + "/", sb);
                }
            } else {
                sb.append("\n");
            }
        }
    }
}