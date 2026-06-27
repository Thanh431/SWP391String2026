package com.swp391.pimsbackend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "topic_groups")
public class TopicGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "mentor_class_id", nullable = false)
    private MentorClass mentorClass;

    @ManyToOne(optional = false)
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;

    @Column(nullable = false)
    private int groupNumber;

    @Column(nullable = false)
    private String groupCode;

    @Column(nullable = false)
    private String title;

    @Lob
    private String description;

    @Column(nullable = false)
    private int maxMembers;

    @Column(nullable = false)
    private String status;

    @ManyToOne
    @JoinColumn(name = "student_group_id")
    private StudentGroup studentGroup;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "Open";
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public MentorClass getMentorClass() { return mentorClass; }
    public void setMentorClass(MentorClass mentorClass) { this.mentorClass = mentorClass; }
    public User getMentor() { return mentor; }
    public void setMentor(User mentor) { this.mentor = mentor; }
    public int getGroupNumber() { return groupNumber; }
    public void setGroupNumber(int groupNumber) { this.groupNumber = groupNumber; }
    public String getGroupCode() { return groupCode; }
    public void setGroupCode(String groupCode) { this.groupCode = groupCode; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public int getMaxMembers() { return maxMembers; }
    public void setMaxMembers(int maxMembers) { this.maxMembers = maxMembers; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public StudentGroup getStudentGroup() { return studentGroup; }
    public void setStudentGroup(StudentGroup studentGroup) { this.studentGroup = studentGroup; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
