package com.swp391.pimsbackend.model;

import com.swp391.pimsbackend.config.StudentGroupEntityListener;
import jakarta.persistence.*;

@Entity
@Table(name = "student_groups")
@EntityListeners(StudentGroupEntityListener.class)
public class StudentGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String groupCode;

    @Column(nullable = false)
    private String groupName;

    private String major;

    @Lob
    private String memberNames;

    @Column(nullable = false)
    private int progress;

    @Column(nullable = false)
    private int milestoneDone;

    @Column(nullable = false)
    private int milestoneTotal;

    private String lastActive;

    @ManyToOne
    @JoinColumn(name = "semester_id")
    private Semester semester;

    @Column(nullable = false)
    private String status;

    @ManyToOne
    @JoinColumn(name = "mentor_class_id")
    private MentorClass mentorClass;

    @ManyToOne
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;

    @PrePersist
    protected void onCreate() {
        if (status == null || status.isBlank()) {
            status = "Recruiting";
        }
    }

    public StudentGroup() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getGroupCode() { return groupCode; }
    public void setGroupCode(String groupCode) { this.groupCode = groupCode; }
    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public String getMajor() { return major; }
    public void setMajor(String major) { this.major = major; }
    public String getMemberNames() { return memberNames; }
    public void setMemberNames(String memberNames) { this.memberNames = memberNames; }
    public int getProgress() { return progress; }
    public void setProgress(int progress) { this.progress = progress; }
    public int getMilestoneDone() { return milestoneDone; }
    public void setMilestoneDone(int milestoneDone) { this.milestoneDone = milestoneDone; }
    public int getMilestoneTotal() { return milestoneTotal; }
    public void setMilestoneTotal(int milestoneTotal) { this.milestoneTotal = milestoneTotal; }
    public String getLastActive() { return lastActive; }
    public void setLastActive(String lastActive) { this.lastActive = lastActive; }
    public Semester getSemester() { return semester; }
    public void setSemester(Semester semester) { this.semester = semester; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public MentorClass getMentorClass() { return mentorClass; }
    public void setMentorClass(MentorClass mentorClass) { this.mentorClass = mentorClass; }
    public User getMentor() { return mentor; }
    public void setMentor(User mentor) { this.mentor = mentor; }
}
