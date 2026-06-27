package com.swp391.pimsbackend.repository;

import com.swp391.pimsbackend.model.TeamInvitation;
import com.swp391.pimsbackend.model.TopicGroup;
import com.swp391.pimsbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamInvitationRepository extends JpaRepository<TeamInvitation, Long> {
    List<TeamInvitation> findByTopicGroupAndStatusOrderByCreatedAtDesc(TopicGroup topicGroup, String status);
    List<TeamInvitation> findByInviteeAndStatusOrderByCreatedAtDesc(User invitee, String status);
    Optional<TeamInvitation> findByTopicGroupAndInvitee(TopicGroup topicGroup, User invitee);
    boolean existsByTopicGroupAndInviteeAndStatus(TopicGroup topicGroup, User invitee, String status);
}
