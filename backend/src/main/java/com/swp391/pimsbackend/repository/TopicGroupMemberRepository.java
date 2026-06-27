package com.swp391.pimsbackend.repository;

import com.swp391.pimsbackend.model.MentorClass;
import com.swp391.pimsbackend.model.TopicGroup;
import com.swp391.pimsbackend.model.TopicGroupMember;
import com.swp391.pimsbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TopicGroupMemberRepository extends JpaRepository<TopicGroupMember, Long> {
    long countByTopicGroup(TopicGroup topicGroup);
    List<TopicGroupMember> findByTopicGroupOrderByJoinedAtAsc(TopicGroup topicGroup);
    boolean existsByStudentAndTopicGroup(User student, TopicGroup topicGroup);

    @Query("SELECT m FROM TopicGroupMember m WHERE m.student = :student AND m.topicGroup.mentorClass = :mentorClass")
    Optional<TopicGroupMember> findByStudentAndMentorClass(@Param("student") User student,
                                                           @Param("mentorClass") MentorClass mentorClass);

    List<TopicGroupMember> findByStudentOrderByJoinedAtDesc(User student);
}
