package com.racc.userpref.repository;

import com.racc.userpref.entity.UserPreferenceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserPreferenceRepository extends JpaRepository<UserPreferenceEntity, Long> {
    Optional<UserPreferenceEntity> findByUserIdAndPrefKey(Long userId, String prefKey);
}
