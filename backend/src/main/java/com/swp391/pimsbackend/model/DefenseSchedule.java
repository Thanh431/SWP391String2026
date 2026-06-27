package com.swp391.pimsbackend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "defense_schedules")
public class DefenseSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "semester_id")
    private Semester semester;

    @ManyToOne(optional = false)
    @JoinColumn(name = "student_group_id", nullable = false)
    private StudentGroup studentGroup;

    @Column(nullable = false)
    private LocalDateTime defenseDate;

    @Column(nullable = false)
    private String timeSlot;

    @Column(nullable = false)
    private String location;

    @ManyToOne
    @JoinColumn(name = "committee_id")
    private User committee;

    @Column(nullable = false)
    private String status;

    @Lob
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Semester getSemester() { return semester; }
    public void setSemester(Semester semester) { this.semester = semester; }
    public StudentGroup getStudentGroup() { return studentGroup; }
    public void setStudentGroup(StudentGroup studentGroup) { this.studentGroup = studentGroup; }
    public LocalDateTime getDefenseDate() { return defenseDate; }
    public void setDefenseDate(LocalDateTime defenseDate) { this.defenseDate = defenseDate; }
    public String getTimeSlot() { return timeSlot; }
    public void setTimeSlot(String timeSlot) { this.timeSlot = timeSlot; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public User getCommittee() { return committee; }
    public void setCommittee(User committee) { this.committee = committee; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
