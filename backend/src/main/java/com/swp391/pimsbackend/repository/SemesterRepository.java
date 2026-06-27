package com.swp391.pimsbackend.repository;

import com.swp391.pimsbackend.model.Semester;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SemesterRepository extends JpaRepository<Semester, Long> {
    Optional<Semester> findByCode(String code);
    List<Semester> findAllByOrderByStartDateDesc();
}
