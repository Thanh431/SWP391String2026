package com.swp391.pimsbackend.repository;

import com.swp391.pimsbackend.model.Evaluation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {
    List<Evaluation> findByEvaluatorIdOrderByUpdatedAtDesc(Long evaluatorId);
    List<Evaluation> findAllByOrderByUpdatedAtDesc();
    List<Evaluation> findByDefenseId(Long defenseId);
    Optional<Evaluation> findByDefenseIdAndEvaluatorId(Long defenseId, Long evaluatorId);
    long countByEvaluatorId(Long evaluatorId);
}
