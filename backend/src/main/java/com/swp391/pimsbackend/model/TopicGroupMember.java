package com.swp391.pimsbackend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "topic_group_members", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"topic_group_id", "student_id"})
})
public class TopicGroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "topic_group_id", nullable = false)
    private TopicGroup topicGroup;

    @ManyToOne(optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public TopicGroup getTopicGroup() { return topicGroup; }
    public void setTopicGroup(TopicGroup topicGroup) { this.topicGroup = topicGroup; }
    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }
    public LocalDateTime getJoinedAt() { return joinedAt; }
}
