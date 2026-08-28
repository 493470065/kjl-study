package com.racc.automate.repository;

import com.racc.automate.entity.AutomateTaskTypeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AutomateTaskTypeRepository extends JpaRepository<AutomateTaskTypeEntity, Long> {

    Optional<AutomateTaskTypeEntity> findByCode(String code);

    boolean existsByCode(String code);

    List<AutomateTaskTypeEntity> findAllByOrderBySortOrderAsc();

    List<AutomateTaskTypeEntity> findByEnabledTrueOrderBySortOrderAsc();
}
