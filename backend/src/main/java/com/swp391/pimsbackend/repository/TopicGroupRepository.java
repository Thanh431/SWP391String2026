package com.swp391.pimsbackend.repository;

import com.swp391.pimsbackend.model.MentorClass;
import com.swp391.pimsbackend.model.StudentGroup;
import com.swp391.pimsbackend.model.TopicGroup;
import com.swp391.pimsbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TopicGroupRepository extends JpaRepository<TopicGroup, Long> {
    List<TopicGroup> findByMentorClassOrderByGroupNumberAsc(MentorClass mentorClass);
    Optional<TopicGroup> findByIdAndMentor(Long id, User mentor);
    Optional<TopicGroup> findByGroupCode(String groupCode);
    Optional<TopicGroup> findByStudentGroup(StudentGroup studentGroup);
    int countByMentorClass(MentorClass mentorClass);
}
