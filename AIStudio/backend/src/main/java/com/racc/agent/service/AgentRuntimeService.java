package com.racc.agent.service;

import com.racc.agent.entity.AgentConfigDetailEntity;
import com.racc.agent.repository.AgentConfigDetailRepository;
import com.racc.chat.entity.ChatConversationEntity;
import com.racc.chat.entity.ChatMessageEntity;
import com.racc.chat.repository.ChatConversationRepository;
import com.racc.chat.repository.ChatMessageRepository;
import com.racc.llm.entity.LlmProviderEntity;
import com.racc.llm.repository.LlmProviderRepository;
import com.racc.mcp.McpServerService;
import com.racc.mcp.entity.McpServerEntity;
import com.racc.monitor.AgentConfigRepository;
import com.racc.monitor.entity.AgentConfigEntity;
import com.racc.skill.dto.SkillDetail;
import com.racc.skill.service.SkillService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import javax.sql.DataSource;
import java.io.IOException;
import java.sql.Connection;
import java.sql.Statement;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Agent 运行时服务。
 * 读取 Agent 配置 → 组装 system prompt（含技能内容）→ 调用 LLM（含工具调用）→ 保存对话。
 */
@Service
public class AgentRuntimeService {

    private static final Logger log = LoggerFactory.getLogger(AgentRuntimeService.class);

    private final AgentConfigDetailRepository agentConfigRepo;
    private final AgentConfigRepository monitorAgentRepo;
    private final ChatConversationRepository conversationRepo;
    private final ChatMessageRepository messageRepo;
    private final ChatModel chatModel;
    private final DataSource dataSource;
    private final SkillService skillService;
    private final AgentToolService agentToolService;
    private final LlmProviderRepository providerRepo;
    private final ObjectMapper objectMapper;
    private final McpServerService mcpServerService;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    /** 直连 LLM Provider 的 HTTP 客户端（OpenAI 兼容协议），读超时放宽以适配慢速模型 */
    private final RestClient providerRestClient;

    @Value("${spring.ai.openai.chat.enabled:false}")
    private boolean llmEnabled;

    public AgentRuntimeService(AgentConfigDetailRepository agentConfigRepo,
                               AgentConfigRepository monitorAgentRepo,
                               ChatConversationRepository conversationRepo,
                               ChatMessageRepository messageRepo,
                               ChatModel chatModel,
                               DataSource dataSource,
                               SkillService skillService,
                               AgentToolService agentToolService,
                               LlmProviderRepository providerRepo,
                               ObjectMapper objectMapper,
                               McpServerService mcpServerService) {
        this.agentConfigRepo = agentConfigRepo;
        this.monitorAgentRepo = monitorAgentRepo;
        this.conversationRepo = conversationRepo;
        this.messageRepo = messageRepo;
        this.chatModel = chatModel;
        this.dataSource = dataSource;
        this.skillService = skillService;
        this.agentToolService = agentToolService;
        this.providerRepo = providerRepo;
        this.objectMapper = objectMapper;
        this.mcpServerService = mcpServerService;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(15));
        // 长分析回复生成可能超过 3 分钟，读超时放宽到 300s
        requestFactory.setReadTimeout(Duration.ofSeconds(300));
        this.providerRestClient = RestClient.builder().requestFactory(requestFactory).build();
    }

    @PostConstruct
    public void init() {
        runMigration();
        log.info("Agent 运行时已初始化");
    }

    private void runMigration() {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("ALTER TABLE chat_conversations ADD COLUMN agent_name VARCHAR(64)");
            log.info("[迁移] chat_conversations.agent_name 列已添加");
        } catch (Exception e) {
            log.debug("[迁移] chat_conversations.agent_name 列已存在或添加失败: {}", e.getMessage());
        }
    }

    // ==================== 非流式 ====================

    public Map<String, Object> chatWithAgent(String agentName, String message,
                                              String conversationId, String username) {
        AgentConfigDetailEntity config = getAgentConfig(agentName);
        if (config == null) {
            return Map.of("error", "Agent 不存在: " + agentName);
        }

        String convId = getOrCreateConversation(conversationId, message, agentName, username);
        saveMessage(convId, "user", message, null);

        // 生成回复（含工具调用）
        GenerationResult result = generateReply(config, convId, message, username, null, null, true);

        // 保存助手消息（含工具调用 JSON）
        saveMessage(convId, "assistant", result.text, result.toolCallsJson);

        updateConversationTitle(convId, message);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", result.text);
        response.put("conversationId", convId);
        response.put("role", "assistant");
        if (result.toolCallsJson != null) {
            response.put("toolCalls", result.toolCallsJson);
        }
        return response;
    }

    // ==================== Headless 技能执行（自动化任务用） ====================

    /** LLM 是否可用（配置开启且 ChatModel 就绪） */
    public boolean isLlmEnabled() {
        return llmEnabled && chatModel != null;
    }

    /**
     * Headless 技能执行：不依赖数据库中的 Agent 配置、不保存会话。
     * 构造临时 Agent 配置（preferredSkills 注入 SKILL.md + 工具集），调用 LLM 并返回最终文本。
     * 失败直接抛异常（绝不降级为模拟回复，避免自动化任务假成功）。
     *
     * @param skillName         技能名（data/skills 下的目录名）
     * @param extraSystemPrompt 追加的系统提示词（说明执行器角色）
     * @param userMessage       用户消息（启动参数 + 任务说明）
     * @param username          发起人（用于监控指标）
     * @param model             指定 LLM 模型（对应 llm_providers.model_name；null=全局模型）
     */
    public String executeSkillHeadless(String skillName, String extraSystemPrompt,
                                       String userMessage, String username, String model) {
        AgentConfigDetailEntity config = new AgentConfigDetailEntity();
        config.setName("自动化任务执行器");
        config.setSystemPrompt(extraSystemPrompt);
        config.setEnabled(true);
        config.setModel(model);
        try {
            config.setPreferredSkills(objectMapper.writeValueAsString(List.of(skillName)));
        } catch (Exception e) {
            throw new RuntimeException("技能名序列化失败: " + e.getMessage(), e);
        }
        GenerationResult result = generateReply(config, null, userMessage, username, null, null, false);
        return result.text();
    }

    // ==================== 流式 SSE ====================

    public SseEmitter streamChatWithAgent(String agentName, String message,
                                          String conversationId, String username) {
        // 完整需求分析等长任务可能超过 10 分钟：超时放宽到 30 分钟，并配合心跳保活
        SseEmitter emitter = new SseEmitter(1800000L);

        // 心跳调度器：每 20 秒发送注释帧，防止浏览器/代理因空闲断开长任务连接
        java.util.concurrent.ScheduledExecutorService heartbeat =
                java.util.concurrent.Executors.newSingleThreadScheduledExecutor(r -> {
                    Thread t = new Thread(r, "sse-heartbeat-" + agentName);
                    t.setDaemon(true);
                    return t;
                });

        executor.execute(() -> {
            try {
                heartbeat.scheduleAtFixedRate(() ->
                        safeSend(emitter, SseEmitter.event().comment("hb")),
                        20, 20, java.util.concurrent.TimeUnit.SECONDS);

                AgentConfigDetailEntity config = getAgentConfig(agentName);
                if (config == null) {
                    safeSend(emitter, SseEmitter.event().name("message")
                            .data(toJson(Map.of("type", "error", "content", "Agent 不存在: " + agentName)) + "\n"));
                    try { emitter.complete(); } catch (Exception ignored) {}
                    return;
                }

                // 定义进度回调：连接已断开时静默放弃发送，绝不中断生成流程
                java.util.function.Consumer<ProgressInfo> progressCallback = progress ->
                    safeSend(emitter, SseEmitter.event().name("message")
                            .data(toJson(Map.of(
                                "type", "progress",
                                "step", String.valueOf(progress.step()),
                                "total", String.valueOf(progress.total()),
                                "label", progress.label(),
                                "status", progress.status()
                            )) + "\n"));

                sendProgress(progressCallback, 1, 5, "准备中", "running");
                String convId = getOrCreateConversation(conversationId, message, agentName, username);
                saveMessage(convId, "user", message, null);

                // 过程事件推送：每轮模型调用/工具调用/工具结果实时发给前端展示
                java.util.function.Consumer<Map<String, Object>> processEvent = evt -> {
                    Map<String, Object> payload = new LinkedHashMap<>(evt);
                    payload.put("type", "process");
                    safeSend(emitter, SseEmitter.event().name("message").data(toJson(payload) + "\n"));
                };

                // 生成回复（含工具调用），传入进度回调与过程事件
                sendProgress(progressCallback, 2, 5, "思考中", "running");
                GenerationResult result = generateReply(config, convId, message, username, progressCallback, processEvent, true);

                // 先落库再推送：即使前端已断开，结果也已持久化，可在历史对话中查看
                saveMessage(convId, "assistant", result.text, result.toolCallsJson);
                updateConversationTitle(convId, message);

                // 发送 SSE 内容事件
                sendProgress(progressCallback, 3, 5, "生成回复", "running");
                safeSend(emitter, SseEmitter.event().name("message")
                        .data(toJson(Map.of("type", "content", "content", result.text)) + "\n"));

                // 如果有工具调用，发送工具调用事件
                if (result.toolCallsJson != null) {
                    sendProgress(progressCallback, 4, 5, "执行工具调用", "running");
                    safeSend(emitter, SseEmitter.event().name("message")
                            .data(toJson(Map.of("type", "tool_call", "toolCalls", result.toolCallsJson)) + "\n"));
                }

                sendProgress(progressCallback, 5, 5, "完成", "done");
                safeSend(emitter, SseEmitter.event().name("message")
                        .data(toJson(Map.of("type", "done", "conversationId", convId)) + "\n"));

                safeSend(emitter, SseEmitter.event().name("message").data("[DONE]\n"));
                try { emitter.complete(); } catch (Exception ignored) {}

            } catch (Exception e) {
                log.warn("Agent 流式生成异常: {}", e.getMessage());
                safeSend(emitter, SseEmitter.event().name("message")
                        .data("[ERROR]" + e.getMessage() + "\n"));
                try { emitter.completeWithError(e); } catch (Exception ignored) {}
            } finally {
                heartbeat.shutdownNow();
            }
        });

        return emitter;
    }

    /** SSE 发送：失败仅静默忽略（前端断连不应影响生成与落库） */
    private void safeSend(SseEmitter emitter, SseEmitter.SseEventBuilder event) {
        try {
            emitter.send(event);
        } catch (Exception ignored) {
        }
    }

    // ==================== 会话管理 ====================

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getConversations(String agentName, String username) {
        List<ChatConversationEntity> list = conversationRepo
                .findByAgentNameAndUsernameOrderByUpdatedAtDesc(agentName, username);
        List<Map<String, Object>> result = new ArrayList<>();
        for (ChatConversationEntity c : list) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("conversationId", c.getConversationId());
            item.put("title", c.getTitle());
            item.put("createdAt", c.getCreatedAt() != null ? c.getCreatedAt().toString() : null);
            result.add(item);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getHistory(String conversationId) {
        List<ChatMessageEntity> messages = messageRepo.findByConversationIdOrderByCreatedAtAsc(conversationId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (ChatMessageEntity m : messages) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("role", m.getRole());
            item.put("content", m.getContent());
            if (m.getToolCallsJson() != null && !m.getToolCallsJson().isBlank()) {
                item.put("toolCalls", m.getToolCallsJson());
            }
            item.put("createdAt", m.getCreatedAt() != null ? m.getCreatedAt().toString() : null);
            result.add(item);
        }
        return result;
    }

    @Transactional
    public void deleteConversation(String conversationId) {
        messageRepo.deleteByConversationId(conversationId);
        conversationRepo.deleteByConversationId(conversationId);
    }

    // ==================== 私有方法 ====================

    /**
     * 按 Agent 配置的模型名解析实际调用的 LLM Provider。
     * 规则：模型名为空 → 回退全局模型；按模型名匹配启用且已配置 API Key 的 Provider；
     * 匹配不到（或未配 Key）→ 记录警告并回退全局模型。
     */
    private LlmProviderEntity resolveProvider(String modelName) {
        if (modelName == null || modelName.isBlank()) return null;
        List<LlmProviderEntity> candidates = providerRepo.findByModelNameAndEnabledTrue(modelName.trim());
        for (LlmProviderEntity p : candidates) {
            if (p.getApiKey() != null && !p.getApiKey().isBlank()) {
                log.info("Agent 使用 LLM Provider [{}] / 模型 [{}]", p.getDisplayName(), p.getModelName());
                return p;
            }
        }
        log.warn("Agent 配置的模型 [{}] 未找到已配置 API Key 的启用 Provider，回退全局模型", modelName);
        return null;
    }

    /**
     * 使用 Provider 的 baseUrl/apiKey/model 直接发起 OpenAI 兼容请求。
     * 失败返回 null（由调用方回退全局模型），不抛异常。
     */
    private String callProviderModel(LlmProviderEntity provider, List<Message> messages) {
        try {
            List<Map<String, Object>> msgs = new ArrayList<>();
            for (Message m : messages) {
                String role = (m instanceof SystemMessage) ? "system"
                        : (m instanceof AssistantMessage) ? "assistant" : "user";
                msgs.add(Map.of("role", role, "content", String.valueOf(m.getText())));
            }
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", provider.getModelName());
            body.put("messages", msgs);

            String url = provider.getBaseUrl() == null ? "" : provider.getBaseUrl().trim();
            if (url.endsWith("/")) url = url.substring(0, url.length() - 1);
            if (!url.endsWith("/chat/completions")) url = url + "/chat/completions";

            // 请求（最多重试 1 次，应对长回复偶发读超时/网络抖动）
            String responseJson = null;
            for (int attempt = 1; attempt <= 2; attempt++) {
                try {
                    responseJson = providerRestClient.post()
                            .uri(url)
                            .header("Authorization", "Bearer " + provider.getApiKey())
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(body)
                            .retrieve()
                            .body(String.class);
                    break;
                } catch (Exception e) {
                    log.warn("Provider [{}] 请求失败（第 {} 次）: {}", provider.getDisplayName(), attempt, e.getMessage());
                    if (attempt < 2) {
                        try { Thread.sleep(3000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; }
                    }
                }
            }
            if (responseJson == null) {
                log.warn("Provider [{}] 两次请求均失败，回退全局模型", provider.getDisplayName());
                return null;
            }

            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode contentNode = root.path("choices").path(0).path("message").path("content");
            if (contentNode.isMissingNode() || contentNode.isNull()) {
                log.warn("Provider [{}] 响应缺少 choices[0].message.content: {}", provider.getDisplayName(),
                        responseJson.length() > 500 ? responseJson.substring(0, 500) : responseJson);
                return null;
            }
            return contentNode.asText();
        } catch (Exception e) {
            log.warn("Provider [{}] ({}) 调用失败，回退全局模型: {}",
                    provider.getDisplayName(), provider.getModelName(), e.getMessage());
            return null;
        }
    }

    private AgentConfigDetailEntity getAgentConfig(String agentName) {
        return agentConfigRepo.findByName(agentName).orElse(null);
    }

    private String getOrCreateConversation(String conversationId, String firstMessage,
                                           String agentName, String username) {
        if (conversationId != null && !conversationId.isBlank()) {
            Optional<ChatConversationEntity> existing = conversationRepo.findByConversationId(conversationId);
            if (existing.isPresent()) {
                existing.get().setUpdatedAt(LocalDateTime.now());
                conversationRepo.save(existing.get());
                return conversationId;
            }
        }
        ChatConversationEntity conv = new ChatConversationEntity();
        String newId = UUID.randomUUID().toString().replace("-", "");
        conv.setConversationId(newId);
        conv.setTitle(truncateTitle(firstMessage));
        conv.setUsername(username);
        conv.setAgentName(agentName);
        conv.setCreatedAt(LocalDateTime.now());
        conv.setUpdatedAt(LocalDateTime.now());
        conversationRepo.save(conv);
        return newId;
    }

    private void saveMessage(String conversationId, String role, String content, String toolCallsJson) {
        ChatMessageEntity msg = new ChatMessageEntity();
        msg.setConversationId(conversationId);
        msg.setRole(role);
        msg.setContent(content);
        msg.setToolCallsJson(toolCallsJson);
        msg.setCreatedAt(LocalDateTime.now());
        messageRepo.save(msg);
    }

    private void updateConversationTitle(String conversationId, String message) {
        conversationRepo.findByConversationId(conversationId).ifPresent(conv -> {
            conv.setTitle(truncateTitle(message));
            conv.setUpdatedAt(LocalDateTime.now());
            conversationRepo.save(conv);
        });
    }

    /**
     * 生成 Agent 回复，支持技能内容注入和工具调用。
     * 工具调用流程：LLM 返回 JSON 工具调用 → 执行工具 → 结果回传 → 继续 LLM 调用。
     *
     * @param degradeToMock true=LLM 不可用/失败时降级为模拟回复（交互式对话用）；
     *                      false=直接抛异常（自动化任务执行用，避免假成功）
     */
    private GenerationResult generateReply(AgentConfigDetailEntity config, String conversationId,
                                            String message, String username,
                                            java.util.function.Consumer<ProgressInfo> progressCallback,
                                            java.util.function.Consumer<Map<String, Object>> processEvent,
                                            boolean degradeToMock) {
        if (!llmEnabled || chatModel == null) {
            if (!degradeToMock) {
                throw new IllegalStateException("LLM 未启用（spring.ai.openai.chat.enabled=false 或 ChatModel 未就绪）");
            }
            String mockText = mockReply(config, message);
            return new GenerationResult(mockText, null);
        }
        try {
            // 1. 组装系统提示词（含技能内容 + 工具定义）
            if (progressCallback != null) progressCallback.accept(new ProgressInfo(1, 4, "正在组装系统提示词", "running"));

            // 关联 MCP：拉取已关联 MCP 服务的真实工具清单，构建 工具名→服务ID 路由
            Map<String, Long> mcpToolRouting = new LinkedHashMap<>();
            String mcpToolDefs = buildMcpToolContext(config, mcpToolRouting);

            String systemPrompt = buildSystemPrompt(config, mcpToolDefs);

            // 2. 加载对话历史（headless 调用无会话，跳过）
            if (progressCallback != null) progressCallback.accept(new ProgressInfo(2, 4, "正在加载对话历史", "running"));
            List<Message> messages = new ArrayList<>();
            if (conversationId != null) {
                List<ChatMessageEntity> history = messageRepo
                        .findByConversationIdOrderByCreatedAtAsc(conversationId);
                for (ChatMessageEntity m : history) {
                    if ("user".equals(m.getRole())) {
                        messages.add(new UserMessage(m.getContent()));
                    } else if ("assistant".equals(m.getRole())) {
                        messages.add(new AssistantMessage(m.getContent()));
                    }
                }
            }
            if (messages.isEmpty()) {
                messages.add(new UserMessage(message));
            }

            // 3. 注入系统提示词
            messages.add(0, new SystemMessage(systemPrompt));

            // 4. 工具调用循环（最多 50 轮，以解决完问题为止）
            int maxToolRounds = 50;
            String finalText = null;
            StringBuilder toolCallsLog = new StringBuilder();
            boolean hasToolCalls = false;

            // 解析 Agent 配置的模型 → 对应 LLM Provider；未配置则回退全局模型
            LlmProviderEntity provider = resolveProvider(config.getModel());

            for (int round = 0; round < maxToolRounds; round++) {
                if (progressCallback != null) {
                    String toolLabel = round == 0 ? "正在调用 AI 模型" : "正在执行工具调用（第 " + round + " 轮）";
                    progressCallback.accept(new ProgressInfo(3, 4, toolLabel, "running"));
                }
                emitProcess(processEvent, Map.of("kind", "model_call", "round", round + 1));
                String content = null;
                if (provider != null) {
                    // 使用 Agent 所选 Provider 的 baseUrl/apiKey/model 直连（OpenAI 兼容协议）
                    content = callProviderModel(provider, messages);
                }
                if (content == null) {
                    // 未配置 Provider 或 Provider 调用失败 → 回退全局 ChatModel（env LLM_MODEL）
                    Prompt prompt = new Prompt(messages);
                    var response = chatModel.call(prompt);
                    content = response.getResult().getOutput().getText();
                }

                if (content == null || content.isBlank()) {
                    if (!degradeToMock) {
                        throw new RuntimeException("LLM 返回空内容");
                    }
                    finalText = mockReply(config, message);
                    break;
                }

                // 检查 LLM 是否返回了工具调用（JSON 格式）
                ParsedToolCall call = parseToolCall(content.trim());
                if (call == null && looksLikeMalformedToolCall(content)) {
                    // 形似工具调用但无法解析：要求模型纠正，避免把半成品当成最终成果物
                    messages.add(new AssistantMessage(content.trim()));
                    messages.add(new UserMessage("你上一条回复像工具调用但格式不正确。请严格按照规定格式返回："
                            + "{\"tool\":\"工具名\",\"args\":{\"参数名\":\"参数值\"}}；如无需调用工具，请直接输出最终回答正文。"));
                    continue;
                }
                if (call == null) {
                    // 没有工具调用，这就是最终回复
                    finalText = content.trim();
                    break;
                }

                // 有工具调用：推送过程事件 → 执行 → 推送结果
                hasToolCalls = true;
                emitProcess(processEvent, Map.of(
                        "kind", "tool_invoke",
                        "round", round + 1,
                        "tool", call.toolName(),
                        "args", briefArgs(call.args())));

                String toolCallResult;
                if (mcpToolRouting != null && mcpToolRouting.containsKey(call.toolName())) {
                    try {
                        log.info("[AgentTool] 路由到 MCP: {} args={}", call.toolName(), briefArgs(call.args()));
                        toolCallResult = mcpServerService.callTool(mcpToolRouting.get(call.toolName()), call.toolName(), call.args());
                    } catch (Exception e) {
                        log.warn("MCP 工具 {} 调用失败: {}", call.toolName(), e.getMessage());
                        toolCallResult = "MCP 工具调用失败: " + e.getMessage();
                    }
                } else {
                    toolCallResult = agentToolService.executeTool(call.toolName(), call.args());
                }
                if (toolCallResult == null) toolCallResult = "";
                // 截断超长工具结果，防止单次大文件读取撑爆上下文窗口（LLM 输入超限 400）
                toolCallResult = truncateToolResult(toolCallResult);

                boolean toolOk = !toolCallResult.startsWith("MCP 工具调用失败")
                        && !toolCallResult.startsWith("执行失败")
                        && !toolCallResult.startsWith("未知工具")
                        && !toolCallResult.startsWith("参数错误")
                        && !toolCallResult.startsWith("非法路径");
                emitProcess(processEvent, Map.of(
                        "kind", "tool_result",
                        "round", round + 1,
                        "tool", call.toolName(),
                        "ok", toolOk,
                        "output", truncate(toolCallResult, 500)));

                // 记录日志
                if (toolCallsLog.length() > 0) toolCallsLog.append("; ");
                toolCallsLog.append("[").append(round + 1).append("]").append(truncate(toolCallResult, 800));

                // 将工具调用结果追加到消息中，继续下一轮
                messages.add(new AssistantMessage(content.trim()));
                messages.add(new UserMessage("工具执行结果：\n" + toolCallResult + "\n\n请根据工具执行结果继续回答。如果还需调用其他工具，请返回工具调用 JSON；如果已完成，请给出最终回答。"));
            }

            if (finalText == null) {
                finalText = "工具调用达到最大轮数，请简化任务或重试。";
            }

            // 5. 更新监控指标
            if (progressCallback != null) progressCallback.accept(new ProgressInfo(4, 4, "保存结果", "running"));
            updateMonitorMetrics(config, username, finalText.length());

            return new GenerationResult(finalText, hasToolCalls ? toolCallsLog.toString() : null);

        } catch (Exception e) {
            if (!degradeToMock) {
                throw new RuntimeException("LLM 调用失败: " + e.getMessage(), e);
            }
            log.warn("Agent LLM 调用失败，降级为 mock: {}", e.getMessage());
            if (progressCallback != null) progressCallback.accept(new ProgressInfo(1, 1, "LLM 调用失败，使用模拟回复", "error"));
            return new GenerationResult(
                mockReply(config, message) + "\n\n[LLM 调用失败：" + e.getMessage() + "]", null);
        }
    }

    /** 工具调用解析结果 */
    private record ParsedToolCall(String toolName, Map<String, Object> args) {}

    /**
     * 从 LLM 回复中提取工具调用（只解析，不执行）。
     * 格式一（平台约定）：{"tool":"工具名","args":{...}}，支持正文内嵌；
     * 格式二（部分模型自带习惯）：tool_call XML 标签包裹 {"name","arguments"} JSON。
     * 未找到返回 null。
     */
    private ParsedToolCall parseToolCall(String text) {
        ParsedToolCall standard = parseToolCallByKeys(text, "{\"tool\"", "tool", "args");
        if (standard != null) return standard;
        return parseWrappedToolCall(text);
    }

    private ParsedToolCall parseToolCallByKeys(String text, String marker, String toolKey, String argsKey) {
        int from = 0;
        while (true) {
            int startIdx = text.indexOf(marker, from);
            if (startIdx < 0) return null;
            from = startIdx + 1;
            try {
                // readTree 只读取第一个完整 JSON 值，忽略其后内容，天然兼容"正文+JSON"混排
                JsonNode root = objectMapper.readTree(text.substring(startIdx));
                if (root == null || !root.isObject()) continue;
                String toolName = root.path(toolKey).asText("").trim();
                if (toolName.isEmpty()) continue;

                Map<String, Object> args = new LinkedHashMap<>();
                JsonNode argsNode = root.path(argsKey);
                if (argsNode.isObject()) {
                    args = objectMapper.convertValue(argsNode,
                            new com.fasterxml.jackson.core.type.TypeReference<LinkedHashMap<String, Object>>() {});
                }
                return new ParsedToolCall(toolName, args);
            } catch (Exception e) {
                // 该位置解析失败（如截断/格式错误），继续找下一处
                log.debug("工具调用 JSON 解析失败，尝试下一处: {}", e.getMessage());
            }
        }
    }

    /** 解析 tool_call 标签包裹的工具调用，兼容多种模型习惯格式 */
    private ParsedToolCall parseWrappedToolCall(String text) {
        final String OPEN = "<" + "tool_call" + ">";
        final String CLOSE = "<" + "/tool_call" + ">";
        int from = 0;
        while (true) {
            int start = text.indexOf(OPEN, from);
            if (start < 0) return null;
            int end = text.indexOf(CLOSE, start);
            String inner;
            if (end > start) {
                inner = text.substring(start + OPEN.length(), end).trim();
                from = end + CLOSE.length();
            } else {
                inner = text.substring(start + OPEN.length()).trim();
                from = text.length();
            }
            if (inner.isEmpty()) {
                if (end < 0) return null;
                continue;
            }
            // 形态1：直接 JSON —— {"name","arguments"} 或 {"tool","args"}
            try {
                JsonNode root = objectMapper.readTree(inner);
                if (root != null && root.isObject()) {
                    String toolName = root.path("name").asText("").trim();
                    if (toolName.isEmpty()) toolName = root.path("tool").asText("").trim();
                    if (!toolName.isEmpty()) {
                        JsonNode argsNode = root.path("arguments").isObject() ? root.path("arguments") : root.path("args");
                        return new ParsedToolCall(toolName, convertArgs(argsNode));
                    }
                }
            } catch (Exception ignored) {
            }
            // 形态2：「调用工具：xxx」+ 参数 JSON 的文本格式
            int callIdx = inner.indexOf("调用工具");
            if (callIdx >= 0) {
                String after = inner.substring(callIdx + "调用工具".length())
                        .replaceFirst("^[：:\\s]+", "");
                String toolName = after.split("[\\s,，{：:]", 2)[0].trim();
                int jsonStart = after.indexOf('{');
                if (!toolName.isEmpty() && jsonStart > 0) {
                    try {
                        JsonNode root = objectMapper.readTree(after.substring(jsonStart));
                        if (root != null && root.isObject()) {
                            return new ParsedToolCall(toolName, convertArgs(root));
                        }
                    } catch (Exception ignored) {
                    }
                }
            }
            log.debug("tool_call 包裹内容无法解析，尝试下一处: {}", truncate(inner, 100));
        }
    }

    private Map<String, Object> convertArgs(JsonNode argsNode) {
        if (argsNode == null || !argsNode.isObject()) return new LinkedHashMap<>();
        return objectMapper.convertValue(argsNode,
                new com.fasterxml.jackson.core.type.TypeReference<LinkedHashMap<String, Object>>() {});
    }

    /** 内容看起来像（格式不正确的）工具调用，不应作为最终回答 */
    private boolean looksLikeMalformedToolCall(String content) {
        String c = content == null ? "" : content;
        return c.contains("<" + "tool_call") || c.contains("{\"name\"");
    }

    /** 推送过程事件（前端实时展示）；无推送通道时静默忽略 */
    private void emitProcess(java.util.function.Consumer<Map<String, Object>> sink, Map<String, Object> event) {
        if (sink == null) return;
        try {
            Map<String, Object> payload = new LinkedHashMap<>(event);
            payload.put("time", java.time.LocalTime.now().withNano(0).toString());
            sink.accept(payload);
        } catch (Exception ignored) {
        }
    }

    /** 文本截断（过程事件与日志用，避免超长内容） */
    private String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max) + "...(截断)";
    }

    /** 单个工具结果的上下文注入上限（字符）：过大会导致 LLM 输入超限 400 */
    private static final int MAX_TOOL_RESULT_CHARS = 30000;

    /**
     * 工具结果截断：读取大文件等场景下，工具返回可能达数 MB，
     * 原样注入对话会撑爆模型上下文窗口。截断并附提示，让模型基于已有内容继续。
     */
    private String truncateToolResult(String result) {
        if (result == null || result.length() <= MAX_TOOL_RESULT_CHARS) return result;
        return result.substring(0, MAX_TOOL_RESULT_CHARS)
                + "\n\n【工具返回内容过长（原始 " + result.length() + " 字符），已截断为前 " + MAX_TOOL_RESULT_CHARS
                + " 字符。请基于已有内容继续任务，不要重复读取同一文件；如需其余内容，请改用更精确的查询或更小范围。】";
    }

    /** 日志用的参数摘要：避免把超长参数（如回写正文）完整打进日志 */
    private String briefArgs(Map<String, Object> args) {
        try {
            String json = objectMapper.writeValueAsString(args);
            return json.length() > 300 ? json.substring(0, 300) + "...(截断)" : json;
        } catch (Exception e) {
            return String.valueOf(args.keySet());
        }
    }

    /**
     * 构建关联 MCP 服务的工具上下文：
     * - 按 Agent 配置的 mcpServers 名称逐个解析服务并拉取真实工具清单（带缓存）
     * - 生成注入提示词的工具定义文本
     * - 填充 工具名 → MCP Server ID 路由表
     * 单个服务不可用时仅告警跳过，不影响整体生成。
     */
    private String buildMcpToolContext(AgentConfigDetailEntity config, Map<String, Long> mcpToolRouting) {
        String mcpJson = config.getMcpServers();
        if (mcpJson == null || mcpJson.isBlank() || "[]".equals(mcpJson.trim())) return "";

        List<String> serverNames = parseJsonStringList(mcpJson);
        if (serverNames.isEmpty()) return "";

        StringBuilder sb = new StringBuilder();
        for (String serverName : serverNames) {
            try {
                McpServerEntity server = mcpServerService.getServerByName(serverName);
                List<JsonNode> tools = mcpServerService.fetchTools(server.getId());
                if (tools.isEmpty()) continue;

                sb.append("===== MCP 服务「").append(server.getDisplayName() != null ? server.getDisplayName() : server.getName())
                  .append("」提供的工具 =====\n");
                sb.append("调用方式与其他工具相同：返回 {\"tool\":\"工具名\",\"args\":{...}}。\n");
                for (JsonNode tool : tools) {
                    String toolName = tool.path("name").asText("");
                    if (toolName.isEmpty()) continue;
                    mcpToolRouting.putIfAbsent(toolName, server.getId());
                    sb.append("- ").append(toolName);
                    String desc = tool.path("description").asText("");
                    if (!desc.isBlank()) sb.append("：").append(desc.replaceAll("\\s+", " "));
                    // 参数 schema 摘要（仅属性名与说明，控制提示词体积）
                    JsonNode props = tool.path("inputSchema").path("properties");
                    if (props.isObject() && props.size() > 0) {
                        sb.append("（参数：");
                        List<String> parts = new ArrayList<>();
                        var fields = props.fields();
                        while (fields.hasNext()) {
                            var f = fields.next();
                            String pDesc = f.getValue().path("description").asText("");
                            parts.add(f.getKey() + (pDesc.isBlank() ? "" : "（" + pDesc.replaceAll("\\s+", " ") + "）"));
                        }
                        sb.append(String.join("、", parts)).append("）");
                    }
                    sb.append("\n");
                }
                log.info("Agent [{}] 注入 MCP [{}] 工具 {} 个", config.getName(), server.getName(), tools.size());
            } catch (Exception e) {
                log.warn("Agent [{}] 关联的 MCP [{}] 工具加载失败，跳过: {}", config.getName(), serverName, e.getMessage());
            }
        }
        return sb.toString();
    }

    /**
     * 组装 Agent 系统提示词（含技能内容注入）。
     */
    private String buildSystemPrompt(AgentConfigDetailEntity config, String mcpToolDefs) {
        StringBuilder sb = new StringBuilder();

        // 基础系统提示词
        if (config.getSystemPrompt() != null && !config.getSystemPrompt().isBlank()) {
            sb.append(config.getSystemPrompt());
        } else {
            sb.append("你是一个 AI 助手，名为 ").append(config.getName()).append("。");
        }

        // 附加能力描述
        String caps = config.getCapabilities();
        if (caps != null && !caps.isBlank() && !"[]".equals(caps.trim())) {
            sb.append("\n\n【能力】\n").append(formatJsonArray(caps, "、"));
        }

        // 附加工具列表
        String tools = config.getTools();
        if (tools != null && !tools.isBlank() && !"[]".equals(tools.trim())) {
            sb.append("\n\n【可用工具】\n").append(formatJsonArray(tools, "、"));
        }

        // 技能内容注入：读取 preferredSkills 对应的技能文件
        String preferredSkills = config.getPreferredSkills();
        if (preferredSkills != null && !preferredSkills.isBlank() && !"[]".equals(preferredSkills.trim())) {
            List<String> skillNames = parseJsonStringList(preferredSkills);
            for (String skillName : skillNames) {
                try {
                    SkillDetail detail = skillService.getSkillDetail(skillName);
                    if (detail != null) {
                        // 注入 SKILL.md 内容
                        if (detail.getContent() != null && !detail.getContent().isBlank()) {
                            sb.append("\n\n===== 技能：").append(skillName).append(" =====\n");
                            // 去掉 YAML frontmatter
                            String content = detail.getContent();
                            int fmEnd = content.indexOf("---", 3);
                            if (content.startsWith("---") && fmEnd > 0) {
                                content = content.substring(fmEnd + 3).trim();
                            }
                            sb.append(content);
                        }

                        // 注入资产文件路径提示
                        if (detail.getFileTree() != null && !detail.getFileTree().isEmpty()) {
                            sb.append("\n\n【技能 ").append(skillName).append(" 可用文件】\n");
                            sb.append("可通过 read_skill_file 工具读取技能文件。\n");
                            sb.append("技能目录下的文件：");
                            for (var node : detail.getFileTree()) {
                                if ("file".equals(node.getType())) {
                                    sb.append("\n- ").append(node.getPath());
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    log.warn("读取技能 [{}] 失败: {}", skillName, e.getMessage());
                }
            }
        }

        // 注入工具定义
        sb.append("\n\n").append(agentToolService.getToolDefinitions());

        // 注入关联 MCP 服务的工具定义
        if (mcpToolDefs != null && !mcpToolDefs.isBlank()) {
            sb.append("\n\n").append(mcpToolDefs);
        }

        // 注入工具调用说明
        sb.append("""

            【工具调用规则】
            1. 如果需要使用工具，必须严格返回如下 JSON 格式（不要使用任何 XML 标签包裹，不要使用 name/arguments 键名）：
               {"tool":"工具名","args":{"参数名":"参数值"}}
            2. 一次只能调用一个工具
            3. 工具执行结果会返回给你，请根据结果继续回答
            4. 如果不需要调用工具，直接给出最终回答
            5. 如果工具调用失败，请尝试其他方式或告知用户
            6. 最终回答中不得包含任何工具调用格式的内容
            """);

        return sb.toString();
    }

    private String mockReply(AgentConfigDetailEntity config, String message) {
        return "【Agent: " + config.getName() + "】\n\n" +
                "已收到您的消息：" + message + "\n\n" +
                "（当前 LLM 未配置，此为模拟回复。请前往 LLM 配置页面设置 API Key 后即可使用智能回复。）";
    }

    private void updateMonitorMetrics(AgentConfigDetailEntity config, String username, int tokenEstimate) {
        try {
            Optional<AgentConfigEntity> existing = monitorAgentRepo.findByName(config.getName());
            AgentConfigEntity monitor;
            if (existing.isPresent()) {
                monitor = existing.get();
                monitor.setTokenUsed((monitor.getTokenUsed() != null ? monitor.getTokenUsed() : 0) + tokenEstimate);
                monitor.setStatus("idle");
                monitor.setUpdatedAt(LocalDateTime.now());
            } else {
                monitor = new AgentConfigEntity();
                monitor.setName(config.getName());
                monitor.setStatus("idle");
                monitor.setTokenUsed((long) tokenEstimate);
                monitor.setErrorCount(0);
                monitor.setCreatedAt(LocalDateTime.now());
                monitor.setUpdatedAt(LocalDateTime.now());
            }
            monitorAgentRepo.save(monitor);
        } catch (Exception e) {
            log.warn("更新 Agent 监控指标失败: {}", e.getMessage());
        }
    }

    // ==================== 内部数据类 ====================

    private record GenerationResult(String text, String toolCallsJson) {}
    private record ProgressInfo(int step, int total, String label, String status) {}

    // ==================== 工具方法 ====================

    private String formatJsonArray(String json, String delimiter) {
        try {
            String trimmed = json.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                String inner = trimmed.substring(1, trimmed.length() - 1);
                if (inner.isBlank()) return "";
                String[] parts = inner.split(",");
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < parts.length; i++) {
                    if (i > 0) sb.append(delimiter);
                    String p = parts[i].trim();
                    if (p.startsWith("\"") && p.endsWith("\"")) {
                        p = p.substring(1, p.length() - 1);
                    }
                    sb.append(p);
                }
                return sb.toString();
            }
        } catch (Exception ignored) {}
        return json;
    }

    /**
     * 发送进度事件到 SSE 流。
     */
    private void sendProgress(java.util.function.Consumer<ProgressInfo> callback, int step, int total, String label, String status) {
        if (callback != null) {
            callback.accept(new ProgressInfo(step, total, label, status));
        }
    }

    private List<String> parseJsonStringList(String json) {
        List<String> result = new ArrayList<>();
        try {
            String trimmed = json.trim();
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                String inner = trimmed.substring(1, trimmed.length() - 1);
                if (inner.isBlank()) return result;
                String[] parts = inner.split(",");
                for (String part : parts) {
                    String p = part.trim();
                    if (p.startsWith("\"") && p.endsWith("\"")) {
                        p = p.substring(1, p.length() - 1);
                    }
                    if (!p.isEmpty()) result.add(p);
                }
            }
        } catch (Exception ignored) {}
        return result;
    }

    private String truncateTitle(String text) {
        if (text == null || text.isBlank()) return "新对话";
        return text.length() > 50 ? text.substring(0, 50) + "..." : text;
    }

    private String toJson(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (!first) sb.append(",");
            first = false;
            sb.append("\"").append(entry.getKey()).append("\":");
            Object value = entry.getValue();
            if (value instanceof String) {
                sb.append("\"").append(escapeJson((String) value)).append("\"");
            } else if (value instanceof Number || value instanceof Boolean) {
                sb.append(value);
            } else {
                sb.append("\"").append(value).append("\"");
            }
        }
        sb.append("}");
        return sb.toString();
    }

    private String escapeJson(String s) {
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}