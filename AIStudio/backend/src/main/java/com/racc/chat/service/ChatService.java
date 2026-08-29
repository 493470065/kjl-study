package com.racc.chat.service;

import com.racc.agent.service.AgentConfigService;
import com.racc.chat.entity.ChatConversationEntity;
import com.racc.chat.entity.ChatMessageEntity;
import com.racc.chat.repository.ChatConversationRepository;
import com.racc.chat.repository.ChatMessageRepository;
import com.racc.knowledge.service.KnowledgeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 聊天服务。LLM 未配置时返回模拟数据。
 */
@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final ChatConversationRepository conversationRepo;
    private final ChatMessageRepository messageRepo;
    private final KnowledgeService knowledgeService;
    private final AgentConfigService agentConfigService;
    private final ExecutorService executor = Executors.newCachedThreadPool();

    @Value("${spring.ai.openai.chat.enabled:false}")
    private boolean llmEnabled;

    /**
     * Spring AI 自动配置的 ChatModel（chat.enabled=true 时存在）。
     * 用 Optional 承载，避免未配置时 Bean 缺失导致启动失败。
     */
    private final ChatModel chatModel;

    public ChatService(ChatConversationRepository conversationRepo,
                       ChatMessageRepository messageRepo,
                       KnowledgeService knowledgeService,
                       AgentConfigService agentConfigService,
                       ChatModel chatModel) {
        this.conversationRepo = conversationRepo;
        this.messageRepo = messageRepo;
        this.knowledgeService = knowledgeService;
        this.agentConfigService = agentConfigService;
        this.chatModel = chatModel;
    }

    /**
     * SSE 流式聊天。
     */
    public SseEmitter streamChat(String message, String projectId, String conversationId, String username, String agentName) {
        // timeout 5 分钟
        SseEmitter emitter = new SseEmitter(300000L);

        executor.execute(() -> {
            try {
                // 1. 创建或获取会话
                String convId = getOrCreateConversation(conversationId, message, projectId, username);

                // 2. 保存用户消息
                saveMessage(convId, "user", message, null);

                // 3. 生成回复（模拟或真实）
                String reply = generateReply(convId, message, agentName);

                // 4. 发送 SSE 事件（data 负载只放 JSON 本身，"data:" 前缀由 SseEmitter 自动添加，
                //    切勿再手动拼接，否则前端收到 "data:data:{...}" 双重前缀会解析失败）
                // content 块
                emitter.send(SseEmitter.event()
                        .name("message")
                        .data(toJson(Map.of("type", "content", "content", reply))));

                // done 块
                emitter.send(SseEmitter.event()
                        .name("message")
                        .data(toJson(Map.of("type", "done", "conversationId", convId))));

                // 5. 保存助手消息
                saveMessage(convId, "assistant", reply, null);

                // 6. 更新会话标题
                updateConversationTitle(convId, message);

                // 7. 发送完成信号
                emitter.send(SseEmitter.event().name("message").data("[DONE]"));
                emitter.complete();

            } catch (Exception e) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("message")
                            .data("[ERROR]" + e.getMessage()));
                } catch (IOException ignored) {}
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    /**
     * 非流式聊天。
     * 注意：知识库检索 + LLM 调用必须在事务之外执行（SQLite 单连接下，
     * 在写事务内执行 JPA/FTS 查询会返回空），故先无事务生成回复，再事务保存。
     */
    public Map<String, Object> sendMessage(String message, String projectId, String conversationId, String username, String agentName) {
        // 1. 先取/建会话与保存用户消息（短事务，由 repository 自带事务保证）
        String convId = getOrCreateConversation(conversationId, message, projectId, username);
        saveMessage(convId, "user", message, null);

        // 2. 生成回复（无事务：内部检索知识库 + 调 LLM，均不可处于写事务中）
        String reply = generateReply(convId, message, agentName);

        // 3. 保存助手消息与会话标题（短写事务）
        persistAssistantReply(convId, reply, message);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", reply);
        result.put("conversationId", convId);
        result.put("role", "assistant");
        return result;
    }

    @Transactional
    protected void persistAssistantReply(String convId, String reply, String message) {
        saveMessage(convId, "assistant", reply, null);
        updateConversationTitle(convId, message);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getConversations(String username) {
        List<ChatConversationEntity> list = conversationRepo.findByUsernameOrderByUpdatedAtDesc(username);
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

    // ---------- private helpers ----------

    private String getOrCreateConversation(String conversationId, String firstMessage,
                                           String projectId, String username) {
        if (conversationId != null && !conversationId.isBlank()) {
            Optional<ChatConversationEntity> existing = conversationRepo.findByConversationId(conversationId);
            if (existing.isPresent()) {
                existing.get().setUpdatedAt(LocalDateTime.now());
                conversationRepo.save(existing.get());
                return conversationId;
            }
        }
        // 创建新会话
        ChatConversationEntity conv = new ChatConversationEntity();
        String newId = UUID.randomUUID().toString().replace("-", "");
        conv.setConversationId(newId);
        conv.setTitle(truncateTitle(firstMessage));
        conv.setUsername(username);
        conv.setProjectId(projectId);
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
     * 读取指定 Agent 的 systemPrompt；Agent 不存在或未配置时返回 null（不影响正常对话）。
     */
    private String loadAgentSystemPrompt(String agentName) {
        if (agentName == null || agentName.isBlank()) return null;
        try {
            Map<String, Object> cfg = agentConfigService.getConfig(agentName);
            Object sp = cfg == null ? null : cfg.get("systemPrompt");
            if (sp instanceof String s && !s.isBlank()) return s;
        } catch (Exception e) {
            log.warn("读取 Agent[{}] 配置失败，按默认助手处理: {}", agentName, e.getMessage());
        }
        return null;
    }

    private String generateReply(String conversationId, String message, String agentName) {
        if (!llmEnabled || chatModel == null) {
            return mockReply(message);
        }
        try {
            // 0. 若指定了 Agent，读取其 systemPrompt 作为人设指令
            String agentPrompt = loadAgentSystemPrompt(agentName);

            // 1. 先检索知识库（全库 Top5，关键词+FTS5，自动降级 LIKE）
            List<Map<String, Object>> kbHits = retrieveFromKnowledgeBase(message);

            // 2. 组装对话历史
            List<Message> messages = new ArrayList<>();
            if (agentPrompt != null) {
                messages.add(new SystemMessage(agentPrompt));
            }
            List<ChatMessageEntity> history = messageRepo.findByConversationIdOrderByCreatedAtAsc(conversationId);
            for (ChatMessageEntity m : history) {
                if ("user".equals(m.getRole())) {
                    messages.add(new UserMessage(m.getContent()));
                } else if ("assistant".equals(m.getRole())) {
                    messages.add(new AssistantMessage(m.getContent()));
                }
            }
            if (messages.isEmpty()) {
                messages.add(new UserMessage(message));
            }

            // 3. 若有知识库命中，在系统层注入参考上下文 + 回答约束
            if (kbHits != null && !kbHits.isEmpty()) {
                String kbContext = buildKnowledgeContext(kbHits);
                boolean technical = isTechnicalQuery(message);
                String styleGuide = technical
                        ? "用户问题偏技术/代码向：可依据参考中的【代码】内容给出接口、类、方法等技术细节，" +
                          "必要时可输出简洁的代码片段或签名；同时结合【文书Spec】【SOP】说明业务背景。"
                        : "用户问题偏业务/流程向：优先依据参考中的【文书Spec】【SOP】，用通俗易懂的业务语言" +
                          "描述流程、规则与概念；不要输出代码片段、Java类名、接口签名、文件路径等技术细节，" +
                          "也不要照搬目录结构或表格样式堆砌。即使参考里混有【代码】条目，也应忽略其技术细节。";
                String sysInstruction = "你是病历片区知识库助手。知识库包含三类资料：【文书Spec】（业务规格）、" +
                        "【SOP】（标准操作流程）、【代码】（系统源码摘录）。请严格基于下方【知识库参考】中的内容回答用户问题，" +
                        "并优先选用与问题性质匹配的参考类型。若参考内容不足以回答，可结合你的通用知识补充，但必须明确区分。" +
                        "回答末尾用「参考文档：」列出你实际引用了的文档标题（仅列相关项）。\n" +
                        styleGuide + "\n\n【知识库参考】\n" + kbContext;
                // 知识库指令置于最前；若已有 Agent 人设，则保持人设在第 0 位、知识库紧随其后
                messages.add(agentPrompt != null ? 1 : 0, new SystemMessage(sysInstruction));
            }

            Prompt prompt = new Prompt(messages);
            String content = chatModel.call(prompt).getResult().getOutput().getText();
            if (content == null || content.isBlank()) {
                return mockReply(message);
            }
            // 4. 未命中时追加提示
            if (kbHits == null || kbHits.isEmpty()) {
                return content.trim() + "\n\n（提示：知识库未检索到与您问题直接相关的内容，以上为通用回答，仅供参考。）";
            }
            return content.trim();
        } catch (Exception e) {
            // 调用失败降级为模拟回复，保证对话不中断
            return mockReply(message) + "\n\n[LLM 调用失败：" + e.getMessage() + "]";
        }
    }

    /**
     * 检索知识库，返回 Top5 命中的文档片段（含标题/ID/片段/来源类型）。
     * 复用 KnowledgeService.searchDocuments（已验证在独立只读事务下工作正常），
     * 且本方法必须在事务之外调用（sendMessage/streamChat 已确保 generateReply 不在写事务中）。
     *
     * 中文场景下，用户问题通常是一整句话（如"门诊病历的必填项有哪些？"），
     * 直接整句做 LIKE 检索几乎无法命中。故提取候选关键词（去停用词/标点、取核心片段）
     * 分别检索并合并去重，保证召回率。
     *
     * 知识库覆盖三类内容：文书Spec（sourceType=upload）、SOP（sourceType=sop）、
     * 代码（sourceType=scan，约占 96%）。为兼顾"可查代码"与"业务回答不被代码污染"，
     * 采用双桶召回 + 按问题性质自适应取舍：
     *  - 技术类问题：代码优先（代码 3 + 业务 2）
     *  - 业务/通用问题：业务文档优先；仅当业务命中过少（<2，说明业务知识库缺这块内容）
     *    才用代码补齐，避免业务回答混入类名/源码。
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> retrieveFromKnowledgeBase(String query) {
        List<Map<String, Object>> businessHits = new ArrayList<>();
        List<Map<String, Object>> codeHits = new ArrayList<>();
        Set<Object> seenIds = new HashSet<>();
        for (String kw : extractKeywords(query)) {
            try {
                Map<String, Object> sr = knowledgeService.searchDocuments(kw, 15, "default",
                        null, null, null, null, null);
                Object results = sr.get("results");
                if (results instanceof List) {
                    for (Map<String, Object> hit : (List<Map<String, Object>>) results) {
                        Object id = hit.get("documentId");
                        if (id == null || !seenIds.add(id)) continue;
                        if ("scan".equals(hit.get("sourceType"))) {
                            if (codeHits.size() < 6) codeHits.add(hit);
                        } else {
                            if (businessHits.size() < 6) businessHits.add(hit);
                        }
                    }
                }
            } catch (Exception e) {
                // 单个候选词失败不影响其他词；记录异常便于排查召回问题
                log.warn("[RAG] 候选词检索失败: kw={}, error={}", kw, e.toString());
            }
            if (businessHits.size() >= 6 && codeHits.size() >= 6) break;
        }

        boolean technical = isTechnicalQuery(query);
        List<Map<String, Object>> merged = new ArrayList<>();
        if (technical) {
            // 技术问题：代码优先，辅以业务文档
            merged.addAll(codeHits.subList(0, Math.min(3, codeHits.size())));
            merged.addAll(businessHits.subList(0, Math.min(2, businessHits.size())));
        } else {
            // 业务/通用问题：业务文档（Spec/SOP）优先
            merged.addAll(businessHits.subList(0, Math.min(5, businessHits.size())));
            // 业务命中过少说明业务知识库未覆盖，用代码补齐以保留"可查代码"能力
            if (businessHits.size() < 2) {
                int need = 5 - merged.size();
                merged.addAll(codeHits.subList(0, Math.min(need, codeHits.size())));
            }
        }
        log.info("[RAG] 关键词{}个，业务命中{}条，代码命中{}条，technical={}，采用{}条 (query={})",
                extractKeywords(query).size(), businessHits.size(), codeHits.size(),
                technical, merged.size(), query);
        List<Map<String, Object>> top = merged.subList(0, Math.min(5, merged.size()));
        // 代码类命中的预览默认是文件头部（import 语句），信息量低；
        // 回取全文并截取关键词附近窗口，让技术回答能引用到有意义的代码片段
        List<String> kws = extractKeywords(query);
        for (Map<String, Object> hit : top) {
            if ("scan".equals(hit.get("sourceType"))) {
                enrichCodeSnippet(hit, kws);
            }
        }
        return top;
    }

    /**
     * 对代码类命中回取全文，截取首个候选关键词附近的窗口（前后各扩展），替换 content。
     * 失败时保留原预览，不影响整体流程。
     */
    private void enrichCodeSnippet(Map<String, Object> hit, List<String> keywords) {
        try {
            Object idObj = hit.get("documentId");
            if (idObj == null) return;
            long id = ((Number) idObj).longValue();
            Map<String, Object> doc = knowledgeService.getDocument(id);
            Object contentObj = doc.get("content");
            if (contentObj == null) return;
            String full = contentObj.toString();
            if (full.isEmpty()) return;
            int pos = -1;
            for (String kw : keywords) {
                if (kw == null || kw.isEmpty()) continue;
                int p = full.indexOf(kw);
                if (p >= 0) { pos = p; break; }
            }
            int start = Math.max(0, (pos >= 0 ? pos : 0) - 120);
            int end = Math.min(full.length(), start + 600);
            String snippet = full.substring(start, end);
            if (start > 0) snippet = "…" + snippet;
            if (end < full.length()) snippet = snippet + "…";
            hit.put("content", snippet);
        } catch (Exception e) {
            log.warn("[RAG] 代码片段回取失败: docId={}, error={}", hit.get("documentId"), e.toString());
        }
    }

    /**
     * 判断问题是否偏技术/代码向：含代码标识符（驼峰/帕斯卡/点分类名）、文件路径/扩展名，
     * 或接口/代码/类/方法等技术词汇。用于决定检索结果取舍与回答风格。
     */
    private boolean isTechnicalQuery(String query) {
        if (query == null || query.isBlank()) return false;
        // 源码文件扩展名（不含 .md，它是文档格式）
        if (query.matches(".*\\.(java|vue|ts|js|jsx|tsx|xml|json|yml|yaml|sql|py|html|css).*")) return true;
        // 包路径 / 目录特征
        if (query.contains("src/") || query.contains("com.")) return true;
        // 驼峰 / 帕斯卡命名（英文标识符特征）
        if (query.matches(".*[a-z]+[A-Z].*") || query.matches(".*[A-Z][a-z]+[A-Z].*")) return true;
        // 技术词汇
        String lower = query.toLowerCase();
        String[] techTerms = {"接口", "代码", "源码", "类名", "方法", "函数", "实现", "调用", "服务",
                "仓库", "repository", "service", "controller", "前端", "后端", "组件", "脚本", "配置类",
                "字段", "表结构", "实体", "接口定义", "api", "rpc", "sql", "路由", "入参", "出参", "返回值"};
        for (String t : techTerms) {
            if (lower.contains(t)) return true;
        }
        return false;
    }

    /**
     * 从自然语言问题中提取候选检索词（召回优先）。
     * 策略：清洗标点/空白 → 去常见疑问/虚词得到主检索词；再对较长的主检索词做
     * 滑动窗口（长 4→2，长词优先）补充子词，覆盖句中多个概念（如"查询会诊申请接口"
     * 需拆出"会诊申请/接口"才能命中），总量封顶避免组合爆炸。
     * 注意：检索词若残留"有/是"等虚词（如"业务有流程"），ngram 短语匹配与 LIKE 都
     * 无法命中文档真实词（"业务流程"），故虚词表须覆盖常见单字虚词；但不可移除
     * 中/会/用/能/上/下 等构词字（中医/会诊/用药/功能/上报）。
     * 候选词较多带来的"误命中"由 retrieveFromKnowledgeBase 的双桶选择负责过滤。
     */
    private List<String> extractKeywords(String query) {
        if (query == null || query.isBlank()) return Collections.emptyList();
        // 1. 去掉标点符号与空白
        String cleaned = query.replaceAll("[\\p{P}\\p{S}\\s]", "");
        // 2. 去常见疑问/停用助词与单字虚词（多字词在前，避免被单字规则先拆散）
        String[] stopChars = {"的", "了", "吗", "呢", "吧", "啊", "呀", "怎么", "什么", "哪些",
                "如何", "怎样", "是否", "有没有", "没有", "为什么", "请", "帮我", "告诉", "介绍", "说明", "解释",
                "一下", "我们", "你们", "他们",
                "有", "是", "与", "及", "或", "和", "在", "对", "之", "其", "该", "这", "那",
                "此", "且", "个", "些", "里", "还", "就", "都", "也"};
        String base = cleaned;
        for (String s : stopChars) {
            base = base.replace(s, "");
        }
        LinkedHashSet<String> candidates = new LinkedHashSet<>();
        // 3. 去虚词后的整体作为首选主检索词
        if (!base.isBlank()) candidates.add(base);
        // 4. 原文（仅去标点）作为兜底候选：保住"有效/有的"等含虚词字符的术语
        if (!cleaned.isBlank() && !cleaned.equals(base)) candidates.add(cleaned);
        // 5. 较长主检索词：滑动窗口补子词（长 4→2，长词优先、更精准），总量封顶
        if (base.length() > 4) {
            final int maxCandidates = 16;
            for (int len = 4; len >= 2 && candidates.size() < maxCandidates; len--) {
                for (int i = 0; i + len <= base.length() && candidates.size() < maxCandidates; i++) {
                    candidates.add(base.substring(i, i + len));
                }
            }
        }
        return new ArrayList<>(candidates);
    }

    /**
     * 把命中片段拼成可读的参考上下文，并标注每条来源类型（文书Spec / SOP / 代码 / 文档），
     * 便于模型按问题性质选择合适的参考。
     */
    private String buildKnowledgeContext(List<Map<String, Object>> hits) {
        StringBuilder sb = new StringBuilder();
        int idx = 1;
        for (Map<String, Object> hit : hits) {
            Object title = hit.get("title");
            Object content = hit.get("content");
            Object docId = hit.get("documentId");
            Object module = hit.get("module");
            Object sourceType = hit.get("sourceType");
            sb.append("【参考 ").append(idx++).append("】");
            sb.append("[").append(sourceLabel(sourceType)).append("] ");
            if (title != null) sb.append("标题：").append(title);
            if (module != null && !module.toString().isBlank()) sb.append("（模块：").append(module).append("）");
            if (docId != null) sb.append(" [文档ID:").append(docId).append("]");
            sb.append("\n内容：").append(content == null ? "" : content.toString()).append("\n\n");
        }
        return sb.toString();
    }

    /** sourceType → 参考来源可读标签 */
    private String sourceLabel(Object sourceType) {
        String st = sourceType == null ? "" : sourceType.toString();
        switch (st) {
            case "scan": return "代码";
            case "sop": return "SOP";
            case "upload": return "文书Spec";
            default: return "文档";
        }
    }

    private String mockReply(String message) {
        if (message == null || message.isBlank()) {
            return "您好，我是 AI 助手，请问有什么可以帮助您的？";
        }
        return "已收到您的消息：" + message + "\n\n（当前 LLM 未配置，此为模拟回复。请前往 LLM 配置页面设置 API Key 后即可使用智能回复。）";
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