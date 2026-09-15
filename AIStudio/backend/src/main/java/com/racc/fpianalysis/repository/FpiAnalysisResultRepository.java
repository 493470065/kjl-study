package com.racc.fpianalysis.repository;

import com.racc.fpianalysis.entity.FpiAnalysisResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FpiAnalysisResultRepository extends JpaRepository<FpiAnalysisResultEntity, Long> {
    Optional<FpiAnalysisResultEntity> findByUserIdAndLineKeyAndFpCode(Long userId, String lineKey, String fpCode);

    void deleteByUserIdAndLineKeyAndFpCode(Long userId, String lineKey, String fpCode);
}
