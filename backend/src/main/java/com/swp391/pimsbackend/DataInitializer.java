package com.swp391.pimsbackend;

import com.swp391.pimsbackend.committee.model.CommitteePublishedResult;
import com.swp391.pimsbackend.committee.repository.CommitteePublishedResultRepository;
import com.swp391.pimsbackend.model.*;
import com.swp391.pimsbackend.repository.*;
import com.swp391.pimsbackend.service.SemesterLookupService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@Order(1)
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MentorClassRepository mentorClassRepository;
    private final StudentGroupRepository studentGroupRepository;
    private final MentorRequestRepository mentorRequestRepository;
    private final SubmissionRepository submissionRepository;
    private final ProjectRepository projectRepository;
    private final SemesterRepository semesterRepository;
    private final DefenseScheduleRepository defenseScheduleRepository;
    private final EvaluationRepository evaluationRepository;
    private final CommitteePublishedResultRepository publishedResultRepository;
    private final SemesterLookupService semesterLookupService;

    public DataInitializer(UserRepository userRepository,
                           MentorClassRepository mentorClassRepository,
                           StudentGroupRepository studentGroupRepository,
                           MentorRequestRepository mentorRequestRepository,
                           SubmissionRepository submissionRepository,
                           ProjectRepository projectRepository,
                           SemesterRepository semesterRepository,
                           DefenseScheduleRepository defenseScheduleRepository,
                           EvaluationRepository evaluationRepository,
                           CommitteePublishedResultRepository publishedResultRepository,
                           SemesterLookupService semesterLookupService) {
        this.userRepository = userRepository;
        this.mentorClassRepository = mentorClassRepository;
        this.studentGroupRepository = studentGroupRepository;
        this.mentorRequestRepository = mentorRequestRepository;
        this.submissionRepository = submissionRepository;
        this.projectRepository = projectRepository;
        this.semesterRepository = semesterRepository;
        this.defenseScheduleRepository = defenseScheduleRepository;
        this.evaluationRepository = evaluationRepository;
        this.publishedResultRepository = publishedResultRepository;
        this.semesterLookupService = semesterLookupService;
    }

    @Override
    public void run(String... args) {
        User admin = seedUser("admin@fpt.edu.vn", "admin123", "Admin", true, true,
                "Admin User", "0394436546", "IT");
        User student = seedUser("student@fpt.edu.vn", "student123", "Student", true, true,
                "Nguyễn Văn A", "0987654321", "IT");
        User student2 = seedUser("student2@fpt.edu.vn", "student123", "Student", true, true,
                "Trần Thị B", "0987654322", "IT");
        User mentor = seedUser("mentor@fpt.edu.vn", "mentor123", "Mentor", true, true,
                "Dr. Mentor One", "0901234567", "Software Engineering");
        User mentor2 = seedUser("mentor2@fpt.edu.vn", "mentor123", "Mentor", true, true,
                "Dr. Mentor Two", "0901234568", "Software Engineering");
        User committee = seedUser("committee@fpt.edu.vn", "committee123", "Committee", true, true,
                "Committee Member", "0909876543", "Academic Affairs");
        User committee2 = seedUser("committee2@fpt.edu.vn", "committee123", "Committee", true, true,
                "Committee Member 2", "0909876544", "Academic Affairs");

        if (mentorClassRepository.count() == 0) {
            seedMentorData(mentor, mentor2, student, student2);
        }

        if (semesterRepository.count() == 0) {
            seedSemesterAndDefense(committee, committee2);
        }
        ensureSpring2026Semester(committee, committee2);

        userRepository.findByUsername("mentor@fpt.edu.vn").ifPresent(this::ensureRealisticSubmissionData);
        userRepository.findByUsername("committee@fpt.edu.vn").ifPresent(this::ensureCommitteeGradeData);
        ensureMentorScoresFromRatings();
    }

    private void ensureMentorScoresFromRatings() {
        submissionRepository.findByStatusOrderBySubmittedAtDesc("Graded").forEach(submission -> {
            if (submission.getMentorScore() == null && submission.getRating() != null) {
                submission.setMentorScore(scoreFromRating(submission.getRating()));
                submissionRepository.save(submission);
            }
        });
    }

    private static Double scoreFromRating(String rating) {
        if (rating == null) {
            return null;
        }
        return switch (rating) {
            case "Excellent" -> 9.5;
            case "Good" -> 8.5;
            case "Needs Improvement" -> 6.5;
            case "At Risk" -> 5.0;
            default -> null;
        };
    }

    private void seedMentorData(User mentor, User mentor2, User student, User student2) {
        MentorClass capstone = mentorClassRepository.save(new MentorClass(
                "capstone-fa24", "Capstone Project", "FA24_CAP391", "Fall 2024", "Hà Nội", mentor));
        MentorClass software = mentorClassRepository.save(new MentorClass(
                "software-fa24", "Software Project", "FA24_SW391", "Fall 2024", "Hà Nội", mentor));

        StudentGroup alpha = saveGroup("SE1701", "Team Alpha", "Software Engineering",
                "Nguyễn Văn A, Trần Thị B, Lê Văn C, Phạm Thị D",
                85, 3, 4, "2 giờ trước", capstone, mentor);
        StudentGroup api = saveGroup("SE1703", "Team API", "Software Engineering",
                "Hoàng Văn E, Vũ Thị F, Đặng Văn G",
                43, 1, 5, "6 ngày trước", capstone, mentor);
        StudentGroup vision = saveGroup("AI1604", "Team Vision", "Artificial Intelligence",
                "Vũ Văn H, Lý Thị I",
                62, 2, 5, "1 ngày trước", capstone, mentor);
        saveGroup("SE1802", "Team Delta", "Software Engineering",
                "Phạm Văn K, Ngô Thị L, Bùi Văn M, Đinh Thị N",
                55, 2, 4, "3 giờ trước", software, mentor);

        saveProject("SmartTeam PIMS", "Hệ thống quản lý dự án học thuật", "In Progress", "SE1701", mentor, 78);
        saveProject("EcoTrack Mobile", "Ứng dụng theo dõi môi trường", "In Progress", "SE1704", mentor, 65);
        saveProject("EduChain Ledger", "Blockchain cho chứng chỉ số", "On Hold", "AI1604", mentor, 42);
        saveProject("E-Commerce API", "API thương mại điện tử", "In Progress", "SE1703", mentor, 43);
        saveProject("Fleet Management System", "Quản lý đội xe", "In Progress", "SE1802", mentor, 55);

        if (mentorRequestRepository.count() == 0) {
            saveRequest(mentor, student2, "SE1705", "Team Nexus", "IoT Smart Home Hub", 4,
                    "Software Engineering",
                    "Chúng em xây dựng hệ thống smart home phi tập trung và rất mong được thầy hướng dẫn.",
                    "https://docs.google.com/document/d/proposal-nexus", "Pending");
            saveRequest(mentor, student, "AI1702", "Team Apex", "FinTech Mobile App", 3,
                    "Artificial Intelligence",
                    "Nhóm em tập trung vào fraud detection cho ví điện tử sinh viên.",
                    "https://docs.google.com/document/d/proposal-apex", "Pending");
            saveRequest(mentor, student2, "SE1708", "Team Orion", "Campus Event Manager", 4,
                    "Software Engineering",
                    "Đề tài quản lý sự kiện campus, đã có wireframe và backlog sprint 1.",
                    "https://docs.google.com/document/d/proposal-orion", "Accepted");
        }

        if (submissionRepository.count() == 0) {
            seedDefaultSubmissions(mentor);
        }
    }

    private void seedDefaultSubmissions(User mentor) {
        seedPhaseSubmission("SE1701", "Team Alpha", "SmartTeam PIMS", mentor, 1, false,
                "Milestone 1: Requirement Analysis & Design",
                "Assessment 1 (Week 3) — Milestone 1: Requirement Analysis & Design",
                "Graded", LocalDate.now().minusDays(45), "Nguyễn Văn A",
                "https://github.com/team-alpha/smartteam-pims",
                "https://drive.google.com/file/d/m1-srs-alpha",
                "SRS ≥15 trang, ERD và weekly reports.",
                "SRS và thiết kế đạt yêu cầu cơ bản.", "Good");
        seedPhaseSubmission("SE1701", "Team Alpha", "SmartTeam PIMS", mentor, 2, false,
                "Milestone 2: Workflow Implementation",
                "Assessment 2 (Week 8) — Milestone 2: Workflow 1 & 2 Implementation",
                "Graded", LocalDate.now().minusDays(20), "Trần Thị B",
                "https://github.com/team-alpha/smartteam-pims/tree/milestone-2",
                "https://drive.google.com/file/d/m2-workflow-alpha",
                "Workflow 0+1+2 và database script.",
                "Workflow 2 cần bổ sung exception paths.", "Needs Improvement");
        seedPhaseSubmission("SE1701", "Team Alpha", "SmartTeam PIMS", mentor, 3, false,
                "Milestone 3: System Completion & Testing",
                "Assessment 3 (Week 10) — Milestone 3: Full System Completion & Testing",
                "Graded", LocalDate.now().minusDays(5), "Nguyễn Văn A",
                "https://github.com/team-alpha/smartteam-pims/releases/tag/m3",
                "https://drive.google.com/file/d/m3-testing-alpha",
                "25 test cases và 3 milestone reports.",
                "Test coverage tốt, demo ổn.", "Good");
        seedPhaseSubmission("SE1701", "Team Alpha", "SmartTeam PIMS", mentor, 4, true,
                "Final Project Presentation",
                "Final Project Presentation",
                "Pending", LocalDate.now().plusDays(14), "Nguyễn Văn A",
                "https://github.com/team-alpha/smartteam-pims/releases/tag/final",
                "https://drive.google.com/file/d/final-report-alpha",
                "Báo cáo cuối kỳ, slide và video demo bảo vệ.",
                null, null);
    }

    private void ensureRealisticSubmissionData(User mentor) {
        upsertPhaseSubmission("SE1701", "Team Alpha", "SmartTeam PIMS", mentor, 1, false,
                "Assessment 1 (Week 3) — Milestone 1: Requirement Analysis & Design",
                "Milestone 1: Requirement Analysis & Design",
                List.of("giai đoạn 1", "milestone 1", "requirement analysis", "proposal", "srs"),
                "Graded", "Nguyễn Văn A",
                "https://github.com/team-alpha/smartteam-pims",
                "https://drive.google.com/file/d/m1-srs-alpha",
                "SRS ≥15 trang, ERD và weekly reports.",
                "SRS và thiết kế đạt yêu cầu cơ bản.", "Good",
                LocalDate.now().minusDays(45));
        upsertPhaseSubmission("SE1701", "Team Alpha", "SmartTeam PIMS", mentor, 2, false,
                "Assessment 2 (Week 8) — Milestone 2: Workflow 1 & 2 Implementation",
                "Milestone 2: Workflow Implementation",
                List.of("giai đoạn 2", "milestone 2", "workflow", "implementation", "srs", "thiết kế"),
                "Graded", "Trần Thị B",
                "https://github.com/team-alpha/smartteam-pims/tree/milestone-2",
                "https://drive.google.com/file/d/m2-workflow-alpha",
                "Workflow 0+1+2 và database script.",
                "Workflow 2 cần bổ sung exception paths.", "Needs Improvement",
                LocalDate.now().minusDays(20));
        upsertPhaseSubmission("SE1701", "Team Alpha", "SmartTeam PIMS", mentor, 3, false,
                "Assessment 3 (Week 10) — Milestone 3: Full System Completion & Testing",
                "Milestone 3: System Completion & Testing",
                List.of("giai đoạn 3", "milestone 3", "midterm", "testing", "completion"),
                "Graded", "Nguyễn Văn A",
                "https://github.com/team-alpha/smartteam-pims/releases/tag/m3",
                "https://drive.google.com/file/d/m3-testing-alpha",
                "25 test cases và 3 milestone reports.",
                "Test coverage tốt, demo ổn.", "Good",
                LocalDate.now().minusDays(5));
        upsertPhaseSubmission("SE1701", "Team Alpha", "SmartTeam PIMS", mentor, 4, true,
                "Final Project Presentation",
                "Final Project Presentation",
                List.of("giai đoạn 4", "milestone 4", "final", "final project", "presentation"),
                "Pending", "Nguyễn Văn A",
                "https://github.com/team-alpha/smartteam-pims/releases/tag/final",
                "https://drive.google.com/file/d/final-report-alpha",
                "Báo cáo cuối kỳ, slide và video demo bảo vệ.",
                null, null,
                LocalDate.now().plusDays(14));
        upsertPhaseSubmission("AI1604", "Team Vision", "EduChain Ledger", mentor, 1, false,
                "Assessment 1 (Week 3) — Milestone 1: Requirement Analysis & Design",
                "Milestone 1: Requirement Analysis & Design",
                List.of("giai đoạn 1", "milestone 1", "requirement", "proposal"),
                "Pending", "Vũ Văn H",
                "https://github.com/team-vision/educhain",
                "https://drive.google.com/file/d/m1-vision",
                "Proposal blockchain chứng chỉ số.",
                null, null,
                LocalDate.now().plusDays(7));

        studentGroupRepository.findByGroupCode("SE1701").ifPresent(group -> {
            group.setMilestoneDone(3);
            group.setMilestoneTotal(4);
            group.setProgress(82);
            studentGroupRepository.save(group);
        });
    }

    private void seedPhaseSubmission(String groupCode, String groupName, String project, User mentor,
                                     int phaseId, boolean submitToCommittee,
                                     String title, String milestone, String status,
                                     LocalDate dueDate, String studentName,
                                     String repoLink, String docLink, String note,
                                     String feedback, String rating) {
        saveSubmissionWithLinks(groupCode, groupName, project, mentor, title, milestone, status,
                dueDate, studentName, repoLink, docLink, note, feedback, rating, phaseId, submitToCommittee);
    }

    private void upsertPhaseSubmission(String groupCode, String groupName, String project, User mentor,
                                       int phaseId, boolean submitToCommittee,
                                       String milestone, String title, List<String> matchKeys,
                                       String status, String studentName,
                                       String repoLink, String docLink, String note,
                                       String feedback, String rating, LocalDate dueDate) {
        List<Submission> existing = submissionRepository.findByGroupCodeOrderBySubmittedAtDesc(groupCode);
        Submission target = existing.stream()
                .filter(s -> matchesSubmission(s, matchKeys))
                .findFirst()
                .orElse(null);

        if (target == null && "Pending".equals(status)) {
            target = existing.stream()
                    .filter(s -> "Pending".equals(s.getStatus()))
                    .filter(s -> matchesSubmission(s, matchKeys) || s.getMilestone() == null)
                    .findFirst()
                    .orElse(null);
        }

        if (target == null) {
            saveSubmissionWithLinks(groupCode, groupName, project, mentor, title, milestone,
                    status, dueDate, studentName, repoLink, docLink, note, feedback, rating);
            return;
        }

        target.setMilestone(milestone);
        target.setTitle(title);
        target.setStatus(status);
        target.setStudentName(studentName);
        target.setDueDate(dueDate);
        target.setFileUrl(buildLinksJson(repoLink, docLink, note, phaseId, submitToCommittee));
        if (feedback != null) {
            target.setFeedback(feedback);
        }
        if (rating != null) {
            target.setRating(rating);
            target.setMentorScore(scoreFromRating(rating));
        }
        submissionRepository.save(target);
    }

    private boolean matchesSubmission(Submission submission, List<String> matchKeys) {
        String combined = ((submission.getMilestone() != null ? submission.getMilestone() : "") + " "
                + (submission.getTitle() != null ? submission.getTitle() : "")).toLowerCase();
        return matchKeys.stream().anyMatch(combined::contains);
    }

    private String buildLinksJson(String repoLink, String docLink, String note, int phaseId, boolean submitToCommittee) {
        return String.format(
                "{\"repoLink\":\"%s\",\"docLink\":\"%s\",\"note\":\"%s\",\"phaseId\":\"%d\",\"audience\":\"%s\"}",
                escapeJson(repoLink),
                escapeJson(docLink),
                escapeJson(note),
                phaseId,
                submitToCommittee ? "MENTOR_AND_COMMITTEE" : "MENTOR_ONLY"
        );
    }

    private String escapeJson(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private User seedUser(String username, String password, String role,
                          boolean approved, boolean profileComplete,
                          String fullName, String phone, String department) {
        return userRepository.findByUsername(username)
                .orElseGet(() -> userRepository.save(
                        new User(username, password, role, approved, profileComplete,
                                fullName, phone, department)
                ));
    }

    private StudentGroup saveGroup(String code, String name, String major, String members,
                                   int progress, int milestoneDone, int milestoneTotal,
                                   String lastActive, MentorClass cls, User mentor) {
        StudentGroup group = new StudentGroup();
        group.setGroupCode(code);
        group.setGroupName(name);
        group.setMajor(major);
        group.setMemberNames(members);
        group.setProgress(progress);
        group.setMilestoneDone(milestoneDone);
        group.setMilestoneTotal(milestoneTotal);
        group.setLastActive(lastActive);
        group.setMentorClass(cls);
        group.setMentor(mentor);
        semesterLookupService.applyLegacySqlServerFields(group, cls);
        return studentGroupRepository.save(group);
    }

    private void saveProject(String name, String desc, String status, String groupId, User mentor, int progress) {
        if (projectRepository.findByGroupId(groupId).isEmpty()) {
            projectRepository.save(new Project(name, desc, status, LocalDateTime.now(),
                    LocalDateTime.now().plusMonths(4), groupId, mentor, progress));
        }
    }

    private void saveRequest(User mentor, User student, String groupCode, String groupName,
                             String project, int members, String major, String message,
                             String proposalLink, String status) {
        MentorRequest req = new MentorRequest();
        req.setMentor(mentor);
        req.setStudent(student);
        req.setGroupCode(groupCode);
        req.setGroupName(groupName);
        req.setProjectTitle(project);
        req.setMemberCount(members);
        req.setMajor(major);
        req.setMessage(message);
        req.setProposalLink(proposalLink);
        req.setStatus(status);
        mentorRequestRepository.save(req);
    }

    private void saveSubmission(String groupCode, String groupName, String project, User mentor,
                                String title, String milestone, String status,
                                LocalDate dueDate, String studentName) {
        saveSubmissionWithLinks(groupCode, groupName, project, mentor, title, milestone, status,
                dueDate, studentName, "", "", "", null, null);
    }

    private void saveSubmissionWithLinks(String groupCode, String groupName, String project, User mentor,
                                         String title, String milestone, String status,
                                         LocalDate dueDate, String studentName,
                                         String repoLink, String docLink, String note,
                                         String feedback, String rating,
                                         int phaseId, boolean submitToCommittee) {
        Submission s = new Submission();
        s.setGroupCode(groupCode);
        s.setGroupName(groupName);
        s.setProjectTitle(project);
        s.setMentor(mentor);
        s.setTitle(title);
        s.setMilestone(milestone);
        s.setStatus(status);
        s.setDueDate(dueDate);
        s.setSubmittedAt(LocalDateTime.now().minusDays(2));
        s.setFileUrl(buildLinksJson(repoLink, docLink, note, phaseId, submitToCommittee));
        s.setStudentName(studentName);
        s.setFeedback(feedback);
        s.setRating(rating);
        s.setMentorScore(scoreFromRating(rating));
        submissionRepository.save(s);
    }

    private void saveSubmissionWithLinks(String groupCode, String groupName, String project, User mentor,
                                         String title, String milestone, String status,
                                         LocalDate dueDate, String studentName,
                                         String repoLink, String docLink, String note,
                                         String feedback, String rating) {
        saveSubmissionWithLinks(groupCode, groupName, project, mentor, title, milestone, status,
                dueDate, studentName, repoLink, docLink, note, feedback, rating, 1, false);
    }

    private void saveSubmission(String groupCode, String groupName, String project, User mentor,
                                String title, String milestone, String status,
                                LocalDate dueDate, String studentName,
                                String feedback, String rating) {
        saveSubmissionWithLinks(groupCode, groupName, project, mentor, title, milestone, status,
                dueDate, studentName, "", "", "", feedback, rating);
    }

    private void seedSemesterAndDefense(User committee, User committee2) {
        Semester fall24 = new Semester();
        fall24.setCode("FA24_CAP391");
        fall24.setName("Capstone Fall 2024");
        fall24.setDescription("Kỳ Capstone Project Fall 2024 — FPT University");
        fall24.setStartDate(LocalDate.of(2024, 9, 1));
        fall24.setEndDate(LocalDate.of(2024, 12, 31));
        fall24.setStatus("Active");
        fall24 = semesterRepository.save(fall24);

        Semester sp25 = new Semester();
        sp25.setCode("SP25_SW391");
        sp25.setName("Software Project Spring 2025");
        sp25.setDescription("Kỳ Software Project Spring 2025");
        sp25.setStartDate(LocalDate.of(2025, 1, 15));
        sp25.setEndDate(LocalDate.of(2025, 5, 30));
        sp25.setStatus("Planning");
        semesterRepository.save(sp25);

        if (defenseScheduleRepository.count() > 0) {
            return;
        }

        LocalDateTime slot1 = LocalDate.of(2026, 6, 15).atTime(8, 0);
        saveDefense(fall24, "SE1701", committee, slot1, "Ca 1: 08:00 — 10:30", "P.301 — Tòa Alpha");
        saveDefense(fall24, "AI1604", committee, slot1, "Ca 1: 08:00 — 10:30", "P.301 — Tòa Alpha");
        saveDefense(fall24, "SE1703", committee, slot1, "Ca 1: 08:00 — 10:30", "P.301 — Tòa Alpha");

        LocalDateTime slot2 = LocalDate.of(2026, 6, 15).atTime(13, 30);
        saveDefense(fall24, "SE1802", committee2, slot2, "Ca 2: 13:30 — 16:00", "P.302 — Tòa Alpha");
    }

    private void ensureSpring2026Semester(User committee, User committee2) {
        Semester sp26 = semesterRepository.findByCode("SP26_CAP391").orElseGet(() -> {
            Semester semester = new Semester();
            semester.setCode("SP26_CAP391");
            semester.setName("Capstone Spring 2026");
            semester.setDescription("Kỳ Capstone Project Spring 2026 — FPT University");
            semester.setStartDate(LocalDate.of(2026, 1, 15));
            semester.setEndDate(LocalDate.of(2026, 5, 30));
            semester.setStatus("Active");
            return semesterRepository.save(semester);
        });

        if (!defenseScheduleRepository.findBySemesterOrderByDefenseDateAsc(sp26).isEmpty()) {
            return;
        }

        LocalDateTime slot1 = LocalDate.of(2026, 6, 20).atTime(8, 0);
        saveDefense(sp26, "SE1701", committee, slot1, "Ca 1: 08:00 — 10:30", "P.401 — Tòa Beta");
        saveDefense(sp26, "AI1604", committee, slot1, "Ca 1: 08:00 — 10:30", "P.401 — Tòa Beta");
        saveDefense(sp26, "SE1703", committee, slot1, "Ca 1: 08:00 — 10:30", "P.401 — Tòa Beta");

        LocalDateTime slot2 = LocalDate.of(2026, 6, 20).atTime(13, 30);
        saveDefense(sp26, "SE1802", committee2, slot2, "Ca 2: 13:30 — 16:00", "P.402 — Tòa Beta");
    }

    private void saveDefense(Semester semester, String groupCode, User committee,
                             LocalDateTime defenseDate, String timeSlot, String location) {
        studentGroupRepository.findByGroupCode(groupCode).ifPresent(group -> {
            DefenseSchedule schedule = new DefenseSchedule();
            schedule.setSemester(semester);
            schedule.setStudentGroup(group);
            schedule.setCommittee(committee);
            schedule.setDefenseDate(defenseDate);
            schedule.setTimeSlot(timeSlot);
            schedule.setLocation(location);
            schedule.setStatus("Scheduled");
            schedule.setNotes("Lịch bảo vệ Capstone");
            defenseScheduleRepository.save(schedule);
        });
    }

    private void ensureCommitteeGradeData(User committee) {
        seedCommitteeEvaluation("SE1701", committee, 8.5, 8.0, 9.0, "Pass",
                "Nhóm trình bày tốt, demo ổn định, đạt yêu cầu Capstone.", true);
        seedCommitteeEvaluation("SE1703", committee, 3.2, 3.5, 3.0, "Fail",
                "Sản phẩm chưa hoàn thiện, trả lời phản biện yếu — điểm hội đồng dưới 4.", true);

        userRepository.findByUsername("mentor@fpt.edu.vn").ifPresent(mentor ->
                ensureApiTeamMentorGrades(mentor));
    }

    private void ensureApiTeamMentorGrades(User mentor) {
        upsertPhaseSubmission("SE1703", "Team API", "E-Commerce API", mentor, 1, false,
                "Assessment 1 (Week 3) — Milestone 1: Requirement Analysis & Design",
                "Milestone 1: Requirement Analysis & Design",
                List.of("giai đoạn 1", "milestone 1", "requirement analysis", "proposal", "srs"),
                "Graded", "Hoàng Văn E",
                "https://github.com/team-api/ecommerce-api",
                "https://drive.google.com/file/d/se1703-m1",
                "SRS cơ bản.", "SRS đạt mức tối thiểu.", "Good",
                LocalDate.now().minusDays(40));
        upsertPhaseSubmission("SE1703", "Team API", "E-Commerce API", mentor, 2, false,
                "Assessment 2 (Week 8) — Milestone 2: Workflow 1 & 2 Implementation",
                "Milestone 2: Workflow Implementation",
                List.of("giai đoạn 2", "milestone 2", "workflow", "implementation"),
                "Graded", "Vũ Thị F",
                "https://github.com/team-api/ecommerce-api/tree/m2",
                "https://drive.google.com/file/d/se1703-m2",
                "Workflow 1.", "Workflow chưa đủ exception.", "Needs Improvement",
                LocalDate.now().minusDays(25));
        upsertPhaseSubmission("SE1703", "Team API", "E-Commerce API", mentor, 3, false,
                "Assessment 3 (Week 10) — Milestone 3: Full System Completion & Testing",
                "Milestone 3: System Completion & Testing",
                List.of("giai đoạn 3", "milestone 3", "testing", "completion"),
                "Graded", "Đặng Văn G",
                "https://github.com/team-api/ecommerce-api/releases/m3",
                "https://drive.google.com/file/d/se1703-m3",
                "Test cases.", "Coverage thấp.", "At Risk",
                LocalDate.now().minusDays(10));
        upsertPhaseSubmission("SE1703", "Team API", "E-Commerce API", mentor, 4, true,
                "Final Project Presentation",
                "Final Project Presentation",
                List.of("giai đoạn 4", "milestone 4", "final", "presentation"),
                "Graded", "Hoàng Văn E",
                "https://github.com/team-api/ecommerce-api/releases/final",
                "https://drive.google.com/file/d/se1703-final",
                "Báo cáo cuối kỳ.", "Chờ hội đồng chấm.", "At Risk",
                LocalDate.now().minusDays(3));
    }

    private void seedCommitteeEvaluation(String groupCode, User committee, double technical,
                                         double presentation, double innovation, String recommendation,
                                         String feedback, boolean publish) {
        studentGroupRepository.findByGroupCode(groupCode).ifPresent(group ->
                defenseScheduleRepository.findAllByOrderByDefenseDateAsc().stream()
                        .filter(d -> d.getStudentGroup() != null
                                && groupCode.equals(d.getStudentGroup().getGroupCode()))
                        .findFirst()
                        .ifPresent(defense -> {
                            Evaluation evaluation = evaluationRepository
                                    .findByDefenseIdAndEvaluatorId(defense.getId(), committee.getId())
                                    .orElse(new Evaluation());
                            evaluation.setDefense(defense);
                            evaluation.setStudentGroup(group);
                            evaluation.setEvaluator(committee);
                            evaluation.setTechnicalScore(technical);
                            evaluation.setPresentationScore(presentation);
                            evaluation.setInnovationScore(innovation);
                            evaluation.setOverallScore(Math.round(((technical + presentation + innovation) / 3.0) * 10.0) / 10.0);
                            evaluation.setRecommendation(recommendation);
                            evaluation.setFeedback(feedback);
                            evaluationRepository.save(evaluation);

                            defense.setStatus("Completed");
                            defenseScheduleRepository.save(defense);

                            if (publish && publishedResultRepository.findByEvaluationId(evaluation.getId()).isEmpty()) {
                                CommitteePublishedResult published = new CommitteePublishedResult();
                                published.setEvaluationId(evaluation.getId());
                                published.setCommitteeId(committee.getId());
                                published.setDefenseId(defense.getId());
                                publishedResultRepository.save(published);
                            }
                        }));
    }
}
