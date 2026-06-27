package com.swp391.pimsbackend.repository;

import com.swp391.pimsbackend.model.Submission;
import com.swp391.pimsbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByMentorOrderBySubmittedAtDesc(User mentor);
    List<Submission> findByStatusOrderBySubmittedAtDesc(String status);
    List<Submission> findByGroupCodeOrderBySubmittedAtDesc(String groupCode);
}
