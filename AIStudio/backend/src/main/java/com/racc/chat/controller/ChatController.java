package com.racc.chat.controller;

import com.racc.chat.service.ChatService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

/**
 * 聊天接口。
 * 路由前缀：/api/chat
 *
 * 端点列表：
 * - POST   /api/chat/stream                          → SSE 流式响应
 * - POST   /api/chat/message                         → 非流式
 * - GET    /api/chat/conversations                    → 会话列表
 * - GET    /api/chat/conversations/{id}/history       → 历史消息
 * - DELETE /api/chat/conversations/{id}               → 删除会话
 */
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    /**
     * POST /api/chat/stream — SSE 流式响应
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestBody Map<String, Object> body) {
        String message = (String) body.getOrDefault("message", "");
        String projectId = (String) body.get("projectId");
        String conversationId = (String) body.get("conversationId");
        String agentName = (String) body.get("agentName");
        String username = currentUsername();
        return chatService.streamChat(message, projectId, conversationId, username, agentName);
    }

    /**
     * POST /api/chat/message — 非流式
     */
    @PostMapping("/message")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, Object> body) {
        String message = (String) body.getOrDefault("message", "");
        String projectId = (String) body.get("projectId");
        String conversationId = (String) body.get("conversationId");
        String agentName = (String) body.get("agentName");
        String username = currentUsername();
        return ResponseEntity.ok(chatService.sendMessage(message, projectId, conversationId, username, agentName));
    }

    /**
     * GET /api/chat/conversations — 会话列表
     */
    @GetMapping("/conversations")
    public ResponseEntity<?> getConversations() {
        return ResponseEntity.ok(chatService.getConversations(currentUsername()));
    }

    /**
     * GET /api/chat/conversations/{id}/history — 历史消息
     */
    @GetMapping("/conversations/{id}/history")
    public ResponseEntity<?> getHistory(@PathVariable("id") String conversationId) {
        return ResponseEntity.ok(chatService.getHistory(conversationId));
    }

    /**
     * DELETE /api/chat/conversations/{id} — 删除会话
     */
    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<?> deleteConversation(@PathVariable("id") String conversationId) {
        chatService.deleteConversation(conversationId);
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