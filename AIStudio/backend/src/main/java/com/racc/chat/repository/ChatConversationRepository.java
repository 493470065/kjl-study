package com.racc.chat.repository;

import com.racc.chat.entity.ChatConversationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatConversationRepository extends JpaRepository<ChatConversationEntity, Long> {

    List<ChatConversationEntity> findByUsernameOrderByUpdatedAtDesc(String username);

    List<ChatConversationEntity> findByAgentNameAndUsernameOrderByUpdatedAtDesc(String agentName, String username);

    Optional<ChatConversationEntity> findByConversationId(String conversationId);

    void deleteByConversationId(String conversationId);
}