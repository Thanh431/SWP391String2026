package com.swp391.pimsbackend.repository;

import com.swp391.pimsbackend.model.AdminPublishedGrade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AdminPublishedGradeRepository extends JpaRepository<AdminPublishedGrade, Long> {
    Optional<AdminPublishedGrade> findByGroupCode(String groupCode);
    List<AdminPublishedGrade> findBySemesterId(Long semesterId);
    boolean existsByGroupCode(String groupCode);
}
