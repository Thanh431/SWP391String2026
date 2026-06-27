package com.swp391.pimsbackend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "admin_published_grades")
public class AdminPublishedGrade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String groupCode;

    private Long semesterId;

    private Double mentorPhase1Score;
    private Double mentorPhase2Score;
    private Double mentorPhase3Score;
    private Double committeeScore;
    private Double mentorSubtotal;
    private Double finalScore;
    private String result;
    private String letterGrade;

    private Long publishedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime publishedAt;

    @PrePersist
    protected void onCreate() {
        publishedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getGroupCode() { return groupCode; }
    public void setGroupCode(String groupCode) { this.groupCode = groupCode; }
    public Long getSemesterId() { return semesterId; }
    public void setSemesterId(Long semesterId) { this.semesterId = semesterId; }
    public Double getMentorPhase1Score() { return mentorPhase1Score; }
    public void setMentorPhase1Score(Double mentorPhase1Score) { this.mentorPhase1Score = mentorPhase1Score; }
    public Double getMentorPhase2Score() { return mentorPhase2Score; }
    public void setMentorPhase2Score(Double mentorPhase2Score) { this.mentorPhase2Score = mentorPhase2Score; }
    public Double getMentorPhase3Score() { return mentorPhase3Score; }
    public void setMentorPhase3Score(Double mentorPhase3Score) { this.mentorPhase3Score = mentorPhase3Score; }
    public Double getCommitteeScore() { return committeeScore; }
    public void setCommitteeScore(Double committeeScore) { this.committeeScore = committeeScore; }
    public Double getMentorSubtotal() { return mentorSubtotal; }
    public void setMentorSubtotal(Double mentorSubtotal) { this.mentorSubtotal = mentorSubtotal; }
    public Double getFinalScore() { return finalScore; }
    public void setFinalScore(Double finalScore) { this.finalScore = finalScore; }
    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
    public String getLetterGrade() { return letterGrade; }
    public void setLetterGrade(String letterGrade) { this.letterGrade = letterGrade; }
    public Long getPublishedBy() { return publishedBy; }
    public void setPublishedBy(Long publishedBy) { this.publishedBy = publishedBy; }
    public LocalDateTime getPublishedAt() { return publishedAt; }
}
