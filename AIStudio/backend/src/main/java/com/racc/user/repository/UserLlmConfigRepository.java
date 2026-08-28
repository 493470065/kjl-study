package com.racc.user.repository;

import com.racc.user.entity.UserLlmConfigEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserLlmConfigRepository extends JpaRepository<UserLlmConfigEntity, Long> {
    Optional<UserLlmConfigEntity> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}