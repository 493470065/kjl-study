package com.racc.tfs;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.racc.mcp.McpServerService;
import com.racc.mcp.entity.McpServerEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

/**
 * TFS 桥接服务：HTTP API → tfs-query-winex（stdio MCP）工具调用。
 * 复用 McpServerService.callTool：临时进程握手 + tools/call，120s 超时。
 */
@Service
public class TfsBridgeService {

    private static final Logger log = LoggerFactory.getLogger(TfsBridgeService.class);
    /** 与 McpServerService L174 完全一致（右括号后有空格） */
    private static final String ERROR_PREFIX = "[工具返回错误] ";

    private final McpServerService mcpServerService;
    private final ObjectMapper objectMapper;

    @Value("${racc.tfs.mcp-server:tfs-query-winex}")
    private String mcpServerName;

    public TfsBridgeService(McpServerService mcpServerService, ObjectMapper objectMapper) {
        this.mcpServerService = mcpServerService;
        this.objectMapper = objectMapper;
    }

    /** 调用 MCP 工具并解析为 JSON；失败抛 TfsBridgeException（message 可透传前端） */
    public JsonNode callToolJson(String toolName, Map<String, Object> args) {
        McpServerEntity server;
        try {
            server = mcpServerService.getServerByName(mcpServerName);
        } catch (RuntimeException e) {
            // getServerByName 找不到时抛异常（不是返回 null）
            throw new TfsBridgeException("TFS 桥接未就绪：未找到 MCP Server [" + mcpServerName
                    + "]，请在 MCP 管理中注册", e);
        }
        String raw;
        try {
            raw = mcpServerService.callTool(server.getId(), toolName, args);
        } catch (Exception e) {
            throw new TfsBridgeException("TFS 工具调用失败(" + toolName + "): " + e.getMessage(), e);
        }
        if (raw == null || raw.isBlank()) {
            throw new TfsBridgeException("TFS 工具无响应: " + toolName);
        }
        if (raw.startsWith(ERROR_PREFIX)) {
            throw new TfsBridgeException(raw.substring(ERROR_PREFIX.length()));
        }
        try {
            return objectMapper.readTree(raw);
        } catch (Exception e) {
            throw new TfsBridgeException("TFS 工具返回非 JSON(" + toolName + "): "
                    + raw.substring(0, Math.min(raw.length(), 200)));
        }
    }

    /** 读取 {workDir}/config.json 的 serverUrl + pat（附件代理鉴权用；不写日志、不回传前端） */
    public TfsConnection readConnection() {
        McpServerEntity server;
        try {
            server = mcpServerService.getServerByName(mcpServerName);
        } catch (RuntimeException e) {
            throw new TfsBridgeException("TFS 桥接未就绪：未找到 MCP Server [" + mcpServerName + "]", e);
        }
        Path cfg = Paths.get(server.getWorkDir(), "config.json");
        try {
            JsonNode node = objectMapper.readTree(Files.readString(cfg, StandardCharsets.UTF_8));
            String serverUrl = node.path("serverUrl").asText("");
            String pat = node.path("pat").asText("");
            if (serverUrl.isBlank() || pat.isBlank()) {
                throw new TfsBridgeException("config.json 配置不完整（缺 serverUrl 或 pat）");
            }
            return new TfsConnection(serverUrl, pat);
        } catch (TfsBridgeException e) {
            throw e;
        } catch (Exception e) {
            throw new TfsBridgeException("无法读取 MCP Server 的 config.json: " + e.getMessage(), e);
        }
    }

    public record TfsConnection(String serverUrl, String pat) {}
}
