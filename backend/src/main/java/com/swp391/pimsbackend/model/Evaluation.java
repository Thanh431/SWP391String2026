package com.swp391.pimsbackend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "evaluations")
public class Evaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "defense_id", nullable = false)
    private DefenseSchedule defense;

    @ManyToOne(optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private StudentGroup studentGroup;

    @ManyToOne(optional = false)
    @JoinColumn(name = "evaluator_id", nullable = false)
    private User evaluator;

    private Double technicalScore;
    private Double presentationScore;
    private Double innovationScore;
    private Double overallScore;

    @Lob
    private String feedback;

    private String recommendation;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public DefenseSchedule getDefense() { return defense; }
    public void setDefense(DefenseSchedule defense) { this.defense = defense; }
    public StudentGroup getStudentGroup() { return studentGroup; }
    public void setStudentGroup(StudentGroup studentGroup) { this.studentGroup = studentGroup; }
    public User getEvaluator() { return evaluator; }
    public void setEvaluator(User evaluator) { this.evaluator = evaluator; }
    public Double getTechnicalScore() { return technicalScore; }
    public void setTechnicalScore(Double technicalScore) { this.technicalScore = technicalScore; }
    public Double getPresentationScore() { return presentationScore; }
    public void setPresentationScore(Double presentationScore) { this.presentationScore = presentationScore; }
    public Double getInnovationScore() { return innovationScore; }
    public void setInnovationScore(Double innovationScore) { this.innovationScore = innovationScore; }
    public Double getOverallScore() { return overallScore; }
    public void setOverallScore(Double overallScore) { this.overallScore = overallScore; }
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
