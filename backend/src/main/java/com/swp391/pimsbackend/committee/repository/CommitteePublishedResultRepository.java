package com.swp391.pimsbackend.committee.repository;

import com.swp391.pimsbackend.committee.model.CommitteePublishedResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CommitteePublishedResultRepository extends JpaRepository<CommitteePublishedResult, Long> {
    List<CommitteePublishedResult> findByCommitteeIdOrderByPublishedAtDesc(Long committeeId);
    Optional<CommitteePublishedResult> findByDefenseIdAndCommitteeId(Long defenseId, Long committeeId);
    Optional<CommitteePublishedResult> findByEvaluationId(Long evaluationId);
    List<CommitteePublishedResult> findByDefenseId(Long defenseId);
    long countByCommitteeId(Long committeeId);
}
