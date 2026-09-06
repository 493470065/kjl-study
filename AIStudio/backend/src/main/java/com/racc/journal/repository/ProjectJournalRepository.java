package com.racc.journal.repository;

import com.racc.journal.entity.ProjectJournalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectJournalRepository extends JpaRepository<ProjectJournalEntity, Long> {

    Optional<ProjectJournalEntity> findByScopeAndBucket(String scope, String bucket);

    List<ProjectJournalEntity> findByScope(String scope);
}
