package com.swp391.pimsbackend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "team_invitations", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"topic_group_id", "invitee_id"})
})
public class TeamInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "topic_group_id", nullable = false)
    private TopicGroup topicGroup;

    @ManyToOne(optional = false)
    @JoinColumn(name = "inviter_id", nullable = false)
    private User inviter;

    @ManyToOne(optional = false)
    @JoinColumn(name = "invitee_id", nullable = false)
    private User invitee;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "Pending";
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public TopicGroup getTopicGroup() { return topicGroup; }
    public void setTopicGroup(TopicGroup topicGroup) { this.topicGroup = topicGroup; }
    public User getInviter() { return inviter; }
    public void setInviter(User inviter) { this.inviter = inviter; }
    public User getInvitee() { return invitee; }
    public void setInvitee(User invitee) { this.invitee = invitee; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
