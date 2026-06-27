package com.swp391.pimsbackend.repository;

import com.swp391.pimsbackend.model.MentorRequest;
import com.swp391.pimsbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MentorRequestRepository extends JpaRepository<MentorRequest, Long> {
    List<MentorRequest> findByMentorOrderByCreatedAtDesc(User mentor);
    List<MentorRequest> findByStudentOrderByCreatedAtDesc(User student);
    long countByMentorAndStatus(User mentor, String status);
    long countByMentor(User mentor);
}
