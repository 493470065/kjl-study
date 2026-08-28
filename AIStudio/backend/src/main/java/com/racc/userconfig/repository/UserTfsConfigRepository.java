package com.racc.userconfig.repository;

import com.racc.userconfig.entity.UserTfsConfigEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserTfsConfigRepository extends JpaRepository<UserTfsConfigEntity, Long> {
    Optional<UserTfsConfigEntity> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}