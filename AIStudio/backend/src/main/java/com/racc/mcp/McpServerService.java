package com.racc.mcp;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.racc.mcp.entity.McpServerEntity;
import com.racc.mcp.entity.McpToolInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * MCP Server 服务：CRUD、上传解压、ProcessBuilder 启停、工具列表
 */
@Service
public class McpServerService {

    private static final Logger log = LoggerFactory.getLogger(McpServerService.class);

    private final McpServerRepository repository;
    private final ObjectMapper objectMapper;

    @Value("${racc.mcp.dir:../data/mcp}")
    private String mcpDir;

    /** 运行中的进程快照（serverId -> Process） */
    private final ConcurrentHashMap<Long, Process> runningProcesses = new ConcurrentHashMap<>();

    public McpServerService(McpServerRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    // ========== CRUD ==========

    public List<McpServerEntity> listServers() {
        return repository.findAll();
    }

    public McpServerEntity getServer(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("MCP Server 不存在: " + id));
    }

    public McpServerEntity getServerByName(String name) {
        return repository.findByName(name)
                .orElseThrow(() -> new RuntimeException("MCP Server 不存在: " + name));
    }

    // ========== Agent 桥接：真实工具列表（带缓存） + 工具调用 ==========

    /** 工具列表缓存条目（避免每次生成都重新握手） */
    private record ToolsCache(long timestamp, List<JsonNode> tools) {}
    private final ConcurrentHashMap<Long, ToolsCache> toolsCache = new ConcurrentHashMap<>();
    private static final long TOOLS_CACHE_TTL_MS = 5 * 60 * 1000L;

    /**
     * 获取 MCP Server 的真实工具列表（临时进程握手 + tools/list），5 分钟缓存。
     * 返回 tools/list 响应中的 tools 数组节点。
     */
    public List<JsonNode> fetchTools(Long id) throws Exception {
        ToolsCache cached = toolsCache.get(id);
        if (cached != null && System.currentTimeMillis() - cached.timestamp < TOOLS_CACHE_TTL_MS) {
            return cached.tools;
        }
        McpServerEntity entity = getServer(id);
        Process process = null;
        try {
            process = buildProcess(entity);
            final Process proc = process;
            try (var writer = new java.io.BufferedWriter(
                    new java.io.OutputStreamWriter(proc.getOutputStream(), StandardCharsets.UTF_8))) {
                writer.write("{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{"
                        + "\"protocolVersion\":\"2024-11-05\",\"capabilities\":{},"
                        + "\"clientInfo\":{\"name\":\"racc-tool-bridge\",\"version\":\"1.0\"}}}");
                writer.newLine();
                writer.write("{\"jsonrpc\":\"2.0\",\"method\":\"notifications/initialized\"}");
                writer.newLine();
                writer.write("{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/list\"}");
                writer.newLine();
                writer.flush();
            }
            drainStderr(proc);
            JsonNode toolsResp = awaitResponse(proc, 2, 20000);
            List<JsonNode> tools = new ArrayList<>();
            JsonNode toolsNode = toolsResp.path("result").path("tools");
            if (toolsNode.isArray()) {
                toolsNode.forEach(tools::add);
            }
            toolsCache.put(id, new ToolsCache(System.currentTimeMillis(), tools));
            log.info("MCP [{}] 工具列表获取成功: {} 个工具", entity.getName(), tools.size());
            return tools;
        } finally {
            if (process != null && process.isAlive()) process.destroyForcibly();
        }
    }

    /**
     * 通过 MCP 协议调用工具（临时进程：握手 + tools/call），返回文本结果。
     * 供 Agent 运行时路由使用；120 秒超时（外部系统查询可能较慢）。
     */
    public String callTool(Long id, String toolName, Map<String, Object> args) throws Exception {
        McpServerEntity entity = getServer(id);
        // 参数清洗：纯数字字符串转数值（MCP 侧 schema 常要求 number）
        Map<String, Object> cleanArgs = new LinkedHashMap<>();
        if (args != null) {
            for (Map.Entry<String, Object> e : args.entrySet()) {
                Object v = e.getValue();
                if (v instanceof String s && s.matches("-?\\d+")) {
                    cleanArgs.put(e.getKey(), Long.parseLong(s));
                } else {
                    cleanArgs.put(e.getKey(), v);
                }
            }
        }

        Process process = null;
        try {
            process = buildProcess(entity);
            final Process proc = process;
            Map<String, Object> callMsg = new LinkedHashMap<>();
            callMsg.put("jsonrpc", "2.0");
            callMsg.put("id", 3);
            callMsg.put("method", "tools/call");
            callMsg.put("params", Map.of("name", toolName, "arguments", cleanArgs));

            try (var writer = new java.io.BufferedWriter(
                    new java.io.OutputStreamWriter(proc.getOutputStream(), StandardCharsets.UTF_8))) {
                writer.write("{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{"
                        + "\"protocolVersion\":\"2024-11-05\",\"capabilities\":{},"
                        + "\"clientInfo\":{\"name\":\"racc-tool-bridge\",\"version\":\"1.0\"}}}");
                writer.newLine();
                writer.write("{\"jsonrpc\":\"2.0\",\"method\":\"notifications/initialized\"}");
                writer.newLine();
                writer.write(objectMapper.writeValueAsString(callMsg));
                writer.newLine();
                writer.flush();
            }
            drainStderr(proc);
            JsonNode callResp = awaitResponse(proc, 3, 120000);

            JsonNode result = callResp.path("result");
            StringBuilder text = new StringBuilder();
            JsonNode content = result.path("content");
            if (content.isArray()) {
                for (JsonNode c : content) {
                    if ("text".equals(c.path("type").asText())) {
                        if (text.length() > 0) text.append('\n');
                        text.append(c.path("text").asText(""));
                    }
                }
            }
            boolean isError = result.path("isError").asBoolean(false);
            log.info("MCP [{}] 工具 {} 调用{}", entity.getName(), toolName, isError ? "失败" : "成功");
            return isError ? "[工具返回错误] " + text : text.toString();
        } finally {
            if (process != null && process.isAlive()) process.destroyForcibly();
        }
    }

    /** 按配置构建临时进程（与 startServer 同一套命令/工作目录/环境变量解析） */
    private Process buildProcess(McpServerEntity entity) throws IOException {
        ProcessBuilder pb = new ProcessBuilder();
        List<String> commandParts = new ArrayList<>();
        commandParts.add(entity.getCommand());
        if (entity.getArgs() != null && !entity.getArgs().isBlank()) {
            String argsStr = entity.getArgs().trim();
            if (argsStr.startsWith("[")) {
                commandParts.addAll(objectMapper.readValue(argsStr, new TypeReference<List<String>>() {}));
            } else {
                commandParts.addAll(Arrays.asList(argsStr.split("\\s+")));
            }
        }
        pb.command(commandParts);
        if (entity.getWorkDir() != null && !entity.getWorkDir().isBlank()) {
            pb.directory(new File(entity.getWorkDir()));
        }
        if (entity.getEnvVars() != null && !entity.getEnvVars().isBlank()) {
            Map<String, String> env = objectMapper.readValue(entity.getEnvVars(),
                    new TypeReference<Map<String, String>>() {});
            pb.environment().putAll(env);
        }
        return pb.start();
    }

    /** 后台抽干 stderr，防止缓冲区阻塞 */
    private void drainStderr(Process proc) {
        Thread t = new Thread(() -> {
            try (var r = new java.io.BufferedReader(
                    new java.io.InputStreamReader(proc.getErrorStream(), StandardCharsets.UTF_8))) {
                while (r.readLine() != null) { /* discard */ }
            } catch (IOException ignored) {
            }
        });
        t.setDaemon(true);
        t.start();
    }

    /** 按行读取 stdout JSON-RPC，直到收到指定 id 的响应或超时 */
    private JsonNode awaitResponse(Process proc, long targetId, long timeoutMs) throws Exception {
        CompletableFuture<JsonNode> future = new CompletableFuture<>();
        Thread reader = new Thread(() -> {
            try (var r = new java.io.BufferedReader(
                    new java.io.InputStreamReader(proc.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = r.readLine()) != null) {
                    String t = line.trim();
                    if (t.isEmpty() || !t.startsWith("{")) continue;
                    try {
                        JsonNode node = objectMapper.readTree(t);
                        if (node.path("id").asLong(-1) == targetId) {
                            future.complete(node);
                            return;
                        }
                    } catch (Exception ignored) {
                    }
                }
            } catch (IOException ignored) {
            }
        });
        reader.setDaemon(true);
        reader.start();
        try {
            return future.get(timeoutMs, TimeUnit.MILLISECONDS);
        } catch (java.util.concurrent.TimeoutException e) {
            throw new RuntimeException("等待 MCP 响应超时（" + timeoutMs / 1000 + "s）");
        }
    }

    @Transactional
    public McpServerEntity createServer(McpServerEntity entity) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() != null
                && !"anonymousUser".equals(auth.getPrincipal())) {
            // 可记录创建人，当前实体无此字段，预留
        }
        entity.setStatus("STOPPED");
        entity.setToolCount(0);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        return repository.save(entity);
    }

    /**
     * 更新 MCP Server 配置（name/status/toolCount 不可改）。
     * 仅覆盖请求中非 null 的白名单字段；运行中的服务需重启后生效。
     */
    @Transactional
    public McpServerEntity updateServer(Long id, McpServerEntity patch) {
        McpServerEntity entity = getServer(id);
        if (patch.getDisplayName() != null) entity.setDisplayName(patch.getDisplayName());
        if (patch.getDescription() != null) entity.setDescription(patch.getDescription());
        if (patch.getCommand() != null && !patch.getCommand().isBlank()) entity.setCommand(patch.getCommand().trim());
        if (patch.getArgs() != null) entity.setArgs(patch.getArgs());
        if (patch.getWorkDir() != null && !patch.getWorkDir().isBlank()) entity.setWorkDir(patch.getWorkDir().trim());
        if (patch.getEnvVars() != null) entity.setEnvVars(patch.getEnvVars());
        entity.setUpdatedAt(LocalDateTime.now());
        return repository.save(entity);
    }

    @Transactional
    public McpServerEntity uploadServer(String name, MultipartFile file, String displayName, String description) {
        // 解压到 mcp 目录
        String baseDir = mcpDir + File.separator + name;
        File targetDir = new File(baseDir);
        if (!targetDir.exists()) {
            targetDir.mkdirs();
        }

        try (ZipInputStream zis = new ZipInputStream(file.getInputStream())) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                Path entryPath = targetDir.toPath().resolve(entry.getName()).normalize();
                if (!entryPath.startsWith(targetDir.toPath())) {
                    throw new RuntimeException("ZIP 路径越界: " + entry.getName());
                }
                if (entry.isDirectory()) {
                    entryPath.toFile().mkdirs();
                } else {
                    entryPath.getParent().toFile().mkdirs();
                    Files.copy(zis, entryPath);
                }
                zis.closeEntry();
            }
        } catch (IOException e) {
            throw new RuntimeException("解压 ZIP 失败: " + e.getMessage(), e);
        }

        // 查找可执行入口（优先 package.json / index.js / server.py / main.py）
        String command = detectCommand(targetDir);
        String args = "";

        McpServerEntity entity = new McpServerEntity();
        entity.setName(name);
        entity.setDisplayName(displayName != null ? displayName : name);
        entity.setDescription(description);
        entity.setCommand(command);
        entity.setArgs(args);
        entity.setWorkDir(targetDir.getAbsolutePath());
        entity.setStatus("STOPPED");
        entity.setToolCount(0);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        return repository.save(entity);
    }

    @Transactional
    public McpServerEntity loadFromFile(String filePath) {
        File file = new File(filePath);
        if (!file.exists() || !file.isFile()) {
            throw new RuntimeException("文件不存在: " + filePath);
        }

        String name = file.getName();
        // 去掉扩展名作为 name
        if (name.contains(".")) {
            name = name.substring(0, name.lastIndexOf('.'));
        }

        McpServerEntity entity = new McpServerEntity();
        entity.setName(name);
        entity.setDisplayName(name);
        entity.setCommand(file.getAbsolutePath());
        entity.setWorkDir(file.getParent());
        entity.setStatus("STOPPED");
        entity.setToolCount(0);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        return repository.save(entity);
    }

    @Transactional
    public void deleteServer(Long id) {
        McpServerEntity entity = getServer(id);
        // 如果正在运行，先停止
        stopProcess(id);
        repository.deleteById(id);
        log.info("MCP Server [{}] 已删除", entity.getName());
    }

    // ========== 进程管理 ==========

    @Transactional
    public McpServerEntity startServer(Long id) {
        McpServerEntity entity = getServer(id);

        if ("RUNNING".equals(entity.getStatus())) {
            throw new RuntimeException("MCP Server 已在运行中: " + entity.getName());
        }

        try {
            ProcessBuilder pb = new ProcessBuilder();

            // 命令和参数
            List<String> commandParts = new ArrayList<>();
            commandParts.add(entity.getCommand());
            if (entity.getArgs() != null && !entity.getArgs().isBlank()) {
                // 支持空格分隔或 JSON 数组格式
                String argsStr = entity.getArgs().trim();
                if (argsStr.startsWith("[")) {
                    List<String> parsed = objectMapper.readValue(argsStr, new TypeReference<List<String>>() {});
                    commandParts.addAll(parsed);
                } else {
                    commandParts.addAll(Arrays.asList(argsStr.split("\\s+")));
                }
            }
            pb.command(commandParts);

            // 工作目录
            if (entity.getWorkDir() != null && !entity.getWorkDir().isBlank()) {
                pb.directory(new File(entity.getWorkDir()));
            }

            // 环境变量
            if (entity.getEnvVars() != null && !entity.getEnvVars().isBlank()) {
                Map<String, String> env = objectMapper.readValue(entity.getEnvVars(),
                        new TypeReference<Map<String, String>>() {});
                pb.environment().putAll(env);
            }

            // 合并输出流
            pb.redirectErrorStream(true);

            Process process = pb.start();
            runningProcesses.put(id, process);

            // 异步消费输出，防止缓冲区满阻塞
            Thread outputReader = new Thread(() -> {
                try (var reader = new java.io.BufferedReader(
                        new java.io.InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        log.debug("MCP [{}] stdout: {}", entity.getName(), line);
                    }
                } catch (IOException e) {
                    log.warn("MCP [{}] 输出流读取结束: {}", entity.getName(), e.getMessage());
                }
            }, "mcp-stdout-" + id);
            outputReader.setDaemon(true);
            outputReader.start();

            // 等待进程退出，清理状态
            Thread exitWatcher = new Thread(() -> {
                try {
                    int exitCode = process.waitFor();
                    log.info("MCP [{}] 进程退出, exitCode={}", entity.getName(), exitCode);
                    runningProcesses.remove(id);
                    // 更新 DB 状态
                    McpServerEntity current = repository.findById(id).orElse(null);
                    if (current != null && "RUNNING".equals(current.getStatus())) {
                        current.setStatus(exitCode == 0 ? "STOPPED" : "ERROR");
                        current.setUpdatedAt(LocalDateTime.now());
                        repository.save(current);
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }, "mcp-exit-" + id);
            exitWatcher.setDaemon(true);
            exitWatcher.start();

            entity.setStatus("RUNNING");
            entity.setUpdatedAt(LocalDateTime.now());
            log.info("MCP Server [{}] 已启动, command={}", entity.getName(), commandParts);
            return repository.save(entity);

        } catch (Exception e) {
            entity.setStatus("ERROR");
            entity.setUpdatedAt(LocalDateTime.now());
            repository.save(entity);
            log.error("MCP Server [{}] 启动失败: {}", entity.getName(), e.getMessage(), e);
            throw new RuntimeException("MCP Server 启动失败: " + e.getMessage(), e);
        }
    }

    @Transactional
    public McpServerEntity stopServer(Long id) {
        McpServerEntity entity = getServer(id);
        stopProcess(id);
        entity.setStatus("STOPPED");
        entity.setUpdatedAt(LocalDateTime.now());
        log.info("MCP Server [{}] 已停止", entity.getName());
        return repository.save(entity);
    }

    /** 停止进程（不更新 DB） */
    private void stopProcess(Long id) {
        Process process = runningProcesses.remove(id);
        if (process != null && process.isAlive()) {
            process.destroy();
            try {
                process.waitFor(5, java.util.concurrent.TimeUnit.SECONDS);
                if (process.isAlive()) {
                    process.destroyForcibly();
                }
            } catch (InterruptedException e) {
                process.destroyForcibly();
                Thread.currentThread().interrupt();
            }
        }
    }

    // ========== 工具列表 ==========

    public List<McpToolInfo> getServerTools(Long id) {
        McpServerEntity entity = getServer(id);
        // 当前返回模拟数据，后续可扩展为从 MCP 协议获取
        // 通过读取服务器进程的 stdio 交互获取工具列表
        List<McpToolInfo> tools = new ArrayList<>();
        tools.add(new McpToolInfo("execute", "执行 MCP 工具调用", Map.of(
                "type", "object",
                "properties", Map.of(
                        "action", Map.of("type", "string", "description", "操作名称"),
                        "params", Map.of("type", "object", "description", "操作参数")
                )
        )));
        entity.setToolCount(tools.size());
        entity.setUpdatedAt(LocalDateTime.now());
        repository.save(entity);
        return tools;
    }

    // ========== 连通性测试 ==========

    /**
     * 测试连接：拉起临时进程执行真实 MCP 握手（initialize）+ tools/list。
     * 返回 { success, serverName, protocolVersion, mcpServerName, mcpServerVersion,
     *        toolCount, tools[], elapsedMs, error?, stderr? }
     */
    public Map<String, Object> testConnection(Long id) {
        McpServerEntity entity = getServer(id);
        long startMs = System.currentTimeMillis();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("serverId", id);
        result.put("serverName", entity.getName());

        Process process = null;
        try {
            // ---- 按配置构建进程（与 startServer 同一套解析逻辑） ----
            ProcessBuilder pb = new ProcessBuilder();
            List<String> commandParts = new ArrayList<>();
            commandParts.add(entity.getCommand());
            if (entity.getArgs() != null && !entity.getArgs().isBlank()) {
                String argsStr = entity.getArgs().trim();
                if (argsStr.startsWith("[")) {
                    commandParts.addAll(objectMapper.readValue(argsStr, new TypeReference<List<String>>() {}));
                } else {
                    commandParts.addAll(Arrays.asList(argsStr.split("\\s+")));
                }
            }
            pb.command(commandParts);
            if (entity.getWorkDir() != null && !entity.getWorkDir().isBlank()) {
                pb.directory(new File(entity.getWorkDir()));
            }
            if (entity.getEnvVars() != null && !entity.getEnvVars().isBlank()) {
                Map<String, String> env = objectMapper.readValue(entity.getEnvVars(),
                        new TypeReference<Map<String, String>>() {});
                pb.environment().putAll(env);
            }

            process = pb.start();
            final Process proc = process;

            // ---- 发送握手报文：initialize → initialized → tools/list ----
            try (var writer = new java.io.BufferedWriter(
                    new java.io.OutputStreamWriter(proc.getOutputStream(), StandardCharsets.UTF_8))) {
                writer.write("{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{"
                        + "\"protocolVersion\":\"2024-11-05\",\"capabilities\":{},"
                        + "\"clientInfo\":{\"name\":\"racc-conn-test\",\"version\":\"1.0\"}}}");
                writer.newLine();
                writer.write("{\"jsonrpc\":\"2.0\",\"method\":\"notifications/initialized\"}");
                writer.newLine();
                writer.write("{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/list\"}");
                writer.newLine();
                writer.flush();
            }

            // ---- stderr 收集（失败时辅助定位） ----
            StringBuilder stderrTail = new StringBuilder();
            Thread errDrainer = new Thread(() -> {
                try (var r = new java.io.BufferedReader(
                        new java.io.InputStreamReader(proc.getErrorStream(), StandardCharsets.UTF_8))) {
                    String l;
                    while ((l = r.readLine()) != null) {
                        synchronized (stderrTail) {
                            if (stderrTail.length() < 2000) stderrTail.append(l).append('\n');
                        }
                    }
                } catch (IOException ignored) {
                }
            }, "mcp-test-stderr-" + id);
            errDrainer.setDaemon(true);
            errDrainer.start();

            // ---- stdout 按行解析，id=1/id=2 的响应分别收集 ----
            CompletableFuture<JsonNode> initFuture = new CompletableFuture<>();
            CompletableFuture<JsonNode> toolsFuture = new CompletableFuture<>();
            Thread reader = new Thread(() -> {
                try (var r = new java.io.BufferedReader(
                        new java.io.InputStreamReader(proc.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = r.readLine()) != null) {
                        String t = line.trim();
                        if (t.isEmpty() || !t.startsWith("{")) continue;
                        try {
                            JsonNode node = objectMapper.readTree(t);
                            long rid = node.path("id").asLong(-1);
                            if (rid == 1) initFuture.complete(node);
                            else if (rid == 2) toolsFuture.complete(node);
                        } catch (Exception ignored) {
                            // 非 JSON 行（如启动日志）忽略
                        }
                    }
                } catch (IOException ignored) {
                }
            }, "mcp-test-stdout-" + id);
            reader.setDaemon(true);
            reader.start();

            // ---- 等待两个响应，总超时 20 秒 ----
            JsonNode initResp = initFuture.get(20, TimeUnit.SECONDS);
            long remain = Math.max(1, 20000 - (System.currentTimeMillis() - startMs));
            JsonNode toolsResp = toolsFuture.get(remain, TimeUnit.MILLISECONDS);

            // ---- 组装成功结果 ----
            JsonNode initResult = initResp.path("result");
            result.put("success", true);
            result.put("protocolVersion", initResult.path("protocolVersion").asText(""));
            result.put("mcpServerName", initResult.path("serverInfo").path("name").asText(""));
            result.put("mcpServerVersion", initResult.path("serverInfo").path("version").asText(""));

            List<Map<String, Object>> toolList = new ArrayList<>();
            JsonNode toolsNode = toolsResp.path("result").path("tools");
            if (toolsNode.isArray()) {
                for (JsonNode t : toolsNode) {
                    Map<String, Object> tm = new LinkedHashMap<>();
                    tm.put("name", t.path("name").asText(""));
                    tm.put("description", t.path("description").asText(""));
                    toolList.add(tm);
                }
            }
            result.put("toolCount", toolList.size());
            result.put("tools", toolList);
            result.put("elapsedMs", System.currentTimeMillis() - startMs);
            log.info("MCP [{}] 连接测试成功: {} 个工具, {}ms", entity.getName(), toolList.size(), result.get("elapsedMs"));
            return result;

        } catch (java.util.concurrent.TimeoutException e) {
            result.put("success", false);
            result.put("error", "响应超时（20 秒）：进程已启动但未返回 MCP 握手/工具列表");
            result.put("elapsedMs", System.currentTimeMillis() - startMs);
        } catch (IOException e) {
            result.put("success", false);
            result.put("error", "进程启动失败：" + e.getMessage());
            result.put("elapsedMs", System.currentTimeMillis() - startMs);
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", "测试失败：" + e.getMessage());
            result.put("elapsedMs", System.currentTimeMillis() - startMs);
        } finally {
            if (process != null && process.isAlive()) {
                process.destroyForcibly();
            }
        }
        log.warn("MCP [{}] 连接测试失败: {}", entity.getName(), result.get("error"));
        return result;
    }

    // ========== 内部辅助 ==========

    /** 检测可执行入口文件 */
    private String detectCommand(File dir) {
        // 优先检测常见入口
        File packageJson = new File(dir, "package.json");
        if (packageJson.exists()) {
            return "node " + packageJson.getAbsolutePath();
        }
        File indexJs = new File(dir, "index.js");
        if (indexJs.exists()) {
            return "node " + indexJs.getAbsolutePath();
        }
        File serverJs = new File(dir, "server.js");
        if (serverJs.exists()) {
            return "node " + serverJs.getAbsolutePath();
        }
        File mainPy = new File(dir, "main.py");
        if (mainPy.exists()) {
            return "python " + mainPy.getAbsolutePath();
        }
        File serverPy = new File(dir, "server.py");
        if (serverPy.exists()) {
            return "python " + serverPy.getAbsolutePath();
        }
        // 查找唯一可执行文件
        File[] files = dir.listFiles((f, name) -> {
            File candidate = new File(f, name);
            return candidate.isFile() && candidate.canExecute()
                    && !name.startsWith(".");
        });
        if (files != null && files.length == 1) {
            return files[0].getAbsolutePath();
        }
        // 兜底：返回目录下的第一个 .js 或 .py 文件
        File[] jsFiles = dir.listFiles((f, name) -> name.endsWith(".js"));
        if (jsFiles != null && jsFiles.length > 0) {
            return "node " + jsFiles[0].getAbsolutePath();
        }
        File[] pyFiles = dir.listFiles((f, name) -> name.endsWith(".py"));
        if (pyFiles != null && pyFiles.length > 0) {
            return "python " + pyFiles[0].getAbsolutePath();
        }
        return "node index.js";
    }
}