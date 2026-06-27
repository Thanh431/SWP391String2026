package com.swp391.pimsbackend.committee.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "committee_published_results")
public class CommitteePublishedResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long evaluationId;

    @Column(nullable = false)
    private Long committeeId;

    @Column(nullable = false)
    private Long defenseId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime publishedAt;

    @PrePersist
    protected void onCreate() {
        publishedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEvaluationId() { return evaluationId; }
    public void setEvaluationId(Long evaluationId) { this.evaluationId = evaluationId; }
    public Long getCommitteeId() { return committeeId; }
    public void setCommitteeId(Long committeeId) { this.committeeId = committeeId; }
    public Long getDefenseId() { return defenseId; }
    public void setDefenseId(Long defenseId) { this.defenseId = defenseId; }
    public LocalDateTime getPublishedAt() { return publishedAt; }
}
