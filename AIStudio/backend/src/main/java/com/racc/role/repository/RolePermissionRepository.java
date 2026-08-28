package com.racc.role.repository;

import com.racc.role.entity.RolePermissionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RolePermissionRepository extends JpaRepository<RolePermissionEntity, Long> {
    Optional<RolePermissionEntity> findByRole(String role);
    boolean existsByRole(String role);
}