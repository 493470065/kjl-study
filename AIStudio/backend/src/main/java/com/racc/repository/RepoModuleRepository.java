package com.racc.repository;

import com.racc.repository.entity.RepoModuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RepoModuleRepository extends JpaRepository<RepoModuleEntity, Long> {
    List<RepoModuleEntity> findByRepoId(Long repoId);
    void deleteByRepoId(Long repoId);
}