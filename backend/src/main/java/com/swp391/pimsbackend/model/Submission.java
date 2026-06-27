package com.swp391.pimsbackend.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "submissions")
public class Submission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String groupCode;

    @Column(nullable = false)
    private String groupName;

    @Column(nullable = false)
    private String projectTitle;

    @ManyToOne
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String milestone;

    private String fileUrl;

    @Column(nullable = false)
    private String status;

    private LocalDate dueDate;

    @Column(nullable = false)
    private LocalDateTime submittedAt;

    @Lob
    private String feedback;

    private String rating;

    private Double mentorScore;

    private String studentName;

    public Submission() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getGroupCode() { return groupCode; }
    public void setGroupCode(String groupCode) { this.groupCode = groupCode; }
    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public String getProjectTitle() { return projectTitle; }
    public void setProjectTitle(String projectTitle) { this.projectTitle = projectTitle; }
    public User getMentor() { return mentor; }
    public void setMentor(User mentor) { this.mentor = mentor; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMilestone() { return milestone; }
    public void setMilestone(String milestone) { this.milestone = milestone; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    public String getRating() { return rating; }
    public void setRating(String rating) { this.rating = rating; }
    public Double getMentorScore() { return mentorScore; }
    public void setMentorScore(Double mentorScore) { this.mentorScore = mentorScore; }
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
}
