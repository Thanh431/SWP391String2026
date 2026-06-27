package com.swp391.pimsbackend.repository;

import com.swp391.pimsbackend.model.MentorClass;
import com.swp391.pimsbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MentorClassRepository extends JpaRepository<MentorClass, Long> {
    List<MentorClass> findByMentor(User mentor);
    List<MentorClass> findAllByOrderByNameAsc();
    Optional<MentorClass> findBySlug(String slug);
    Optional<MentorClass> findBySlugAndMentor(String slug, User mentor);
    Optional<MentorClass> findByCodeIgnoreCase(String code);
    boolean existsBySlug(String slug);
}
