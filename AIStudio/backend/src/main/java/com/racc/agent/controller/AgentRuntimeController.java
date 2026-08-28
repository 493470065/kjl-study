package com.racc.agent.controller;

import com.racc.agent.service.AgentRuntimeService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

/**
 * Agent 运行时接口。
 * 路由前缀：/api/agents
 *
 * 端点列表：
 * - POST   /api/agents/{name}/chat             → 非流式对话
 * - POST   /api/agents/{name}/chat/stream      → SSE 流式对话
 * - GET    /api/agents/{name}/conversations     → 对话列表
 * - GET    /api/agents/conversations/{id}/history → 历史消息
 * - DELETE /api/agents/conversations/{id}       → 删除对话
 */
@RestController
@RequestMapping("/api/agents")
public class AgentRuntimeController {

    private final AgentRuntimeService runtimeService;

    public AgentRuntimeController(AgentRuntimeService runtimeService) {
        this.runtimeService = runtimeService;
    }

    /**
     * POST /api/agents/{name}/chat — 非流式对话
     */
    @PostMapping("/{name}/chat")
    public ResponseEntity<?> chat(@PathVariable String name, @RequestBody Map<String, Object> body) {
        String message = (String) body.getOrDefault("message", "");
        String conversationId = (String) body.get("conversationId");
        String username = currentUsername();
        return ResponseEntity.ok(runtimeService.chatWithAgent(name, message, conversationId, username));
    }

    /**
     * POST /api/agents/{name}/chat/stream — SSE 流式对话
     */
    @PostMapping(value = "/{name}/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChat(@PathVariable String name, @RequestBody Map<String, Object> body) {
        String message = (String) body.getOrDefault("message", "");
        String conversationId = (String) body.get("conversationId");
        String username = currentUsername();
        return runtimeService.streamChatWithAgent(name, message, conversationId, username);
    }

    /**
     * GET /api/agents/{name}/conversations — 对话列表
     */
    @GetMapping("/{name}/conversations")
    public ResponseEntity<?> getConversations(@PathVariable String name) {
        return ResponseEntity.ok(runtimeService.getConversations(name, currentUsername()));
    }

    /**
     * GET /api/agents/conversations/{id}/history — 历史消息
     */
    @GetMapping("/conversations/{id}/history")
    public ResponseEntity<?> getHistory(@PathVariable("id") String conversationId) {
        return ResponseEntity.ok(runtimeService.getHistory(conversationId));
    }

    /**
     * DELETE /api/agents/conversations/{id} — 删除对话
     */
    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<?> deleteConversation(@PathVariable("id") String conversationId) {
        runtimeService.deleteConversation(conversationId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ---------- helpers ----------

    private String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null || "anonymousUser".equals(auth.getPrincipal())) {
            return "anonymous";
        }
        return String.valueOf(auth.getPrincipal());
    }
}