package com.swp391.pimsbackend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "class_enrollments", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"student_id", "mentor_class_id"})
})
public class ClassEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(optional = false)
    @JoinColumn(name = "mentor_class_id", nullable = false)
    private MentorClass mentorClass;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime enrolledAt;

    @PrePersist
    protected void onCreate() {
        enrolledAt = LocalDateTime.now();
        if (status == null) {
            status = "Active";
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }
    public MentorClass getMentorClass() { return mentorClass; }
    public void setMentorClass(MentorClass mentorClass) { this.mentorClass = mentorClass; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getEnrolledAt() { return enrolledAt; }
}
