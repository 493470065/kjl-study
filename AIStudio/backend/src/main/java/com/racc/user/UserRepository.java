package com.racc.user;

import com.racc.user.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByUsername(String username);
    boolean existsByUsername(String username);
    /** 统计某角色下的用户数（删除角色前校验） */
    long countByRole(String role);
}
