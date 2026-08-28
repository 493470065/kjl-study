package com.racc.config;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 种子数据执行状态仓库。
 */
public interface SeedStateRepository extends JpaRepository<SeedStateEntity, String> {
}
