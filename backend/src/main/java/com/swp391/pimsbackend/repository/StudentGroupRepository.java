package com.swp391.pimsbackend.repository;

import com.swp391.pimsbackend.model.MentorClass;
import com.swp391.pimsbackend.model.StudentGroup;
import com.swp391.pimsbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentGroupRepository extends JpaRepository<StudentGroup, Long> {
    List<StudentGroup> findByMentor(User mentor);
    List<StudentGroup> findByMentorClass(MentorClass mentorClass);
    long countByMentorClass(MentorClass mentorClass);
    Optional<StudentGroup> findByGroupCode(String groupCode);
    long countByMentorAndMentorClassIsNotNull(User mentor);
}
