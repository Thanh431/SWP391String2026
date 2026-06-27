package com.swp391.pimsbackend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.pimsbackend.model.*;
import com.swp391.pimsbackend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MentorService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final int MAX_GROUPS_PER_MENTOR = 3;

    private final UserRepository userRepository;
    private final MentorClassRepository mentorClassRepository;
    private final StudentGroupRepository studentGroupRepository;
    private final MentorRequestRepository mentorRequestRepository;
    private final SubmissionRepository submissionRepository;
    private final ProjectRepository projectRepository;
    private final ClassEnrollmentRepository classEnrollmentRepository;
    private final ObjectMapper objectMapper;
    private final SemesterLookupService semesterLookupService;

    public MentorService(UserRepository userRepository,
                         MentorClassRepository mentorClassRepository,
                         StudentGroupRepository studentGroupRepository,
                         MentorRequestRepository mentorRequestRepository,
                         SubmissionRepository submissionRepository,
                         ProjectRepository projectRepository,
                         ClassEnrollmentRepository classEnrollmentRepository,
                         ObjectMapper objectMapper,
                         SemesterLookupService semesterLookupService) {
        this.userRepository = userRepository;
        this.mentorClassRepository = mentorClassRepository;
        this.studentGroupRepository = studentGroupRepository;
        this.mentorRequestRepository = mentorRequestRepository;
        this.submissionRepository = submissionRepository;
        this.projectRepository = projectRepository;
        this.classEnrollmentRepository = classEnrollmentRepository;
        this.objectMapper = objectMapper;
        this.semesterLookupService = semesterLookupService;
    }

    public Optional<User> findUser(Long id) {
        return userRepository.findById(id);
    }

    public List<Map<String, Object>> getAvailableMentors() {
        return userRepository.findByRole("Mentor").stream()
                .filter(User::isApproved)
                .map(this::toMentorOption)
                .collect(Collectors.toList());
    }

    private Map<String, Object> toMentorOption(User mentor) {
        long assigned = studentGroupRepository.countByMentorAndMentorClassIsNotNull(mentor);
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", mentor.getId());
        map.put("name", mentor.getFullName() != null ? mentor.getFullName() : mentor.getUsername());
        map.put("email", mentor.getUsername());
        map.put("department", mentor.getDepartment() != null ? mentor.getDepartment() : "N/A");
        map.put("assignedGroups", assigned);
        map.put("maxGroups", MAX_GROUPS_PER_MENTOR);
        map.put("slots", assigned + "/" + MAX_GROUPS_PER_MENTOR + " nhóm");
        map.put("full", assigned >= MAX_GROUPS_PER_MENTOR);
        return map;
    }

    @Transactional
    public MentorRequest createRequest(Long mentorId, Long studentId, Map<String, String> body) {
        User mentor = userRepository.findById(mentorId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mentor."));
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sinh viên."));

        if (!"Mentor".equals(mentor.getRole())) {
            throw new IllegalArgumentException("Tài khoản không phải mentor.");
        }
        if (studentGroupRepository.countByMentorAndMentorClassIsNotNull(mentor) >= MAX_GROUPS_PER_MENTOR) {
            throw new IllegalArgumentException("Mentor đã nhận đủ số nhóm trong kỳ này.");
        }

        MentorRequest request = new MentorRequest();
        request.setMentor(mentor);
        request.setStudent(student);
        request.setGroupCode(body.getOrDefault("groupCode", "SE1700"));
        request.setGroupName(body.getOrDefault("groupName", "Team " + student.getFullName()));
        request.setProjectTitle(body.getOrDefault("projectTitle", "Capstone Project"));
        request.setMemberCount(parseInt(body.get("memberCount"), 4));
        request.setMajor(body.getOrDefault("major", student.getDepartment() != null ? student.getDepartment() : "Software Engineering"));
        request.setMessage(body.get("message"));
        request.setProposalLink(body.get("proposalLink"));
        request.setStatus("Pending");
        return mentorRequestRepository.save(request);
    }

    public List<Map<String, Object>> getStudentRequests(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sinh viên."));
        return mentorRequestRepository.findByStudentOrderByCreatedAtDesc(student).stream()
                .map(this::toStudentRequestDto)
                .collect(Collectors.toList());
    }

    private Map<String, Object> toStudentRequestDto(MentorRequest req) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", req.getId());
        map.put("mentorName", req.getMentor().getFullName() != null ? req.getMentor().getFullName() : req.getMentor().getUsername());
        map.put("dateSent", formatDate(req.getCreatedAt()));
        map.put("proposalLink", req.getProposalLink());
        map.put("message", req.getMessage());
        map.put("status", toStudentStatus(req.getStatus()));
        map.put("feedback", req.getDeclineReason());
        return map;
    }

    private String toStudentStatus(String status) {
        return switch (status) {
            case "Accepted" -> "Đồng ý";
            case "Declined" -> "Từ chối";
            default -> "Chờ phản hồi";
        };
    }

    public List<Map<String, Object>> getMentorRequests(Long mentorId) {
        User mentor = requireMentor(mentorId);
        return mentorRequestRepository.findByMentorOrderByCreatedAtDesc(mentor).stream()
                .map(this::toMentorRequestDto)
                .collect(Collectors.toList());
    }

    private Map<String, Object> toMentorRequestDto(MentorRequest req) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", req.getId());
        map.put("groupId", req.getGroupCode());
        map.put("groupName", req.getGroupName());
        map.put("project", req.getProjectTitle());
        map.put("members", req.getMemberCount());
        map.put("major", req.getMajor());
        map.put("dateSent", formatDate(req.getCreatedAt()));
        map.put("message", req.getMessage());
        map.put("proposalLink", req.getProposalLink());
        map.put("status", req.getStatus());
        map.put("declineReason", req.getDeclineReason());
        return map;
    }

    @Transactional
    public MentorRequest acceptRequest(Long mentorId, Long requestId) {
        User mentor = requireMentor(mentorId);
        MentorRequest request = mentorRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu."));
        if (!request.getMentor().getId().equals(mentor.getId())) {
            throw new IllegalArgumentException("Yêu cầu không thuộc mentor này.");
        }
        if (!"Pending".equals(request.getStatus())) {
            throw new IllegalArgumentException("Yêu cầu đã được xử lý.");
        }

        request.setStatus("Accepted");
        mentorRequestRepository.save(request);

        MentorClass mentorClass = classEnrollmentRepository.findByStudentOrderByEnrolledAtDesc(request.getStudent()).stream()
                .map(ClassEnrollment::getMentorClass)
                .filter(cls -> cls.getMentor().getId().equals(mentor.getId()))
                .findFirst()
                .orElseGet(() -> mentorClassRepository.findByMentor(mentor).stream()
                        .findFirst()
                        .orElseGet(() -> createDefaultClass(mentor)));

        StudentGroup group = studentGroupRepository.findByGroupCode(request.getGroupCode())
                .orElseGet(StudentGroup::new);
        group.setGroupCode(request.getGroupCode());
        group.setGroupName(request.getGroupName());
        group.setMajor(request.getMajor());
        group.setMemberNames(request.getStudent().getFullName() != null ? request.getStudent().getFullName() : request.getStudent().getUsername());
        group.setProgress(10);
        group.setMilestoneDone(0);
        group.setMilestoneTotal(5);
        group.setLastActive("Vừa xong");
        group.setMentor(mentor);
        group.setMentorClass(mentorClass);
        semesterLookupService.applyLegacySqlServerFields(group, mentorClass);
        studentGroupRepository.save(group);

        if (projectRepository.findByGroupId(request.getGroupCode()).isEmpty()) {
            Project project = new Project(
                    request.getProjectTitle(),
                    request.getMessage(),
                    "In Progress",
                    LocalDateTime.now(),
                    LocalDateTime.now().plusMonths(4),
                    request.getGroupCode(),
                    mentor,
                    10
            );
            projectRepository.save(project);
        }

        return request;
    }

    @Transactional
    public MentorRequest declineRequest(Long mentorId, Long requestId, String reason) {
        User mentor = requireMentor(mentorId);
        MentorRequest request = mentorRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy yêu cầu."));
        if (!request.getMentor().getId().equals(mentor.getId())) {
            throw new IllegalArgumentException("Yêu cầu không thuộc mentor này.");
        }
        request.setStatus("Declined");
        request.setDeclineReason(reason != null && !reason.isBlank()
                ? reason.trim()
                : "Không phù hợp lịch hướng dẫn hiện tại.");
        return mentorRequestRepository.save(request);
    }

    public List<Map<String, Object>> getClasses(Long mentorId) {
        User mentor = requireMentor(mentorId);
        return mentorClassRepository.findByMentor(mentor).stream()
                .map(cls -> toClassSummary(cls, mentor))
                .collect(Collectors.toList());
    }

    private Map<String, Object> toClassSummary(MentorClass cls, User mentor) {
        List<StudentGroup> groups = studentGroupRepository.findByMentorClass(cls);
        List<ClassEnrollment> enrollments = classEnrollmentRepository.findByMentorClassOrderByEnrolledAtAsc(cls);
        Set<String> groupCodes = groups.stream().map(StudentGroup::getGroupCode).collect(Collectors.toSet());
        List<Project> projects = projectRepository.findByMentor_Id(mentor.getId()).stream()
                .filter(p -> groupCodes.contains(p.getGroupId()))
                .collect(Collectors.toList());

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", cls.getSlug());
        map.put("name", cls.getName());
        map.put("code", cls.getCode());
        map.put("semester", cls.getSemester());
        map.put("campus", cls.getCampus());
        map.put("studentCount", enrollments.size());
        map.put("groupCount", groups.size());
        map.put("enrolledStudents", enrollments.stream().map(this::toEnrolledStudentDto).collect(Collectors.toList()));
        map.put("projects", projects.stream().map(this::toProjectDto).collect(Collectors.toList()));
        map.put("groups", groups.stream().map(this::toGroupDto).collect(Collectors.toList()));
        return map;
    }

    private Map<String, Object> toEnrolledStudentDto(ClassEnrollment enrollment) {
        User student = enrollment.getStudent();
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", student.getId());
        map.put("name", student.getFullName() != null ? student.getFullName() : student.getUsername());
        map.put("email", student.getUsername());
        map.put("department", student.getDepartment() != null ? student.getDepartment() : "—");
        map.put("enrolledAt", formatDate(enrollment.getEnrolledAt()));
        return map;
    }

    public Optional<Map<String, Object>> getClassDetail(Long mentorId, String slug) {
        User mentor = requireMentor(mentorId);
        return mentorClassRepository.findBySlugAndMentor(slug, mentor)
                .map(cls -> toClassSummary(cls, mentor));
    }

    public List<Map<String, Object>> getReviewQueue(Long mentorId) {
        User mentor = requireMentor(mentorId);
        return submissionRepository.findByMentorOrderBySubmittedAtDesc(mentor).stream()
                .map(this::toSubmissionDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public Submission gradeSubmission(Long mentorId, Long submissionId, String feedback, String rating, Double score) {
        User mentor = requireMentor(mentorId);
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài nộp."));
        if (!submission.getMentor().getId().equals(mentor.getId())) {
            throw new IllegalArgumentException("Bài nộp không thuộc mentor này.");
        }
        if (score == null) {
            throw new IllegalArgumentException("Vui lòng nhập điểm chấm (0–10).");
        }
        if (score < 0 || score > 10) {
            throw new IllegalArgumentException("Điểm chấm phải từ 0 đến 10.");
        }
        submission.setFeedback(feedback);
        submission.setRating(rating);
        submission.setMentorScore(Math.round(score * 10.0) / 10.0);
        submission.setStatus("Graded");
        return submissionRepository.save(submission);
    }

    public List<Map<String, Object>> getProgressGroups(Long mentorId) {
        User mentor = requireMentor(mentorId);
        return studentGroupRepository.findByMentor(mentor).stream()
                .map(this::toProgressDto)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getDashboard(Long mentorId) {
        User mentor = requireMentor(mentorId);
        List<StudentGroup> groups = studentGroupRepository.findByMentor(mentor);
        List<Submission> submissions = submissionRepository.findByMentorOrderBySubmittedAtDesc(mentor);
        long pendingReviews = submissions.stream().filter(s -> "Pending".equals(s.getStatus())).count();
        long pendingRequests = mentorRequestRepository.countByMentorAndStatus(mentor, "Pending");
        int avgProgress = groups.isEmpty() ? 0 : (int) groups.stream().mapToInt(StudentGroup::getProgress).average().orElse(0);

        Map<String, Object> dashboard = new LinkedHashMap<>();
        dashboard.put("assignedGroups", groups.size());
        dashboard.put("pendingReviews", pendingReviews);
        dashboard.put("mentorRequests", mentorRequestRepository.countByMentor(mentor));
        dashboard.put("newRequests", pendingRequests);
        dashboard.put("avgProgress", avgProgress);
        dashboard.put("reviewQueue", submissions.stream().limit(4).map(this::toSubmissionDto).collect(Collectors.toList()));
        dashboard.put("groupProgress", groups.stream().limit(4).map(g -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", g.getGroupCode());
            item.put("name", g.getGroupName());
            item.put("value", g.getProgress());
            item.put("variant", g.getProgress() < 50 ? "danger" : g.getProgress() < 70 ? "info" : "success");
            if (g.getProgress() < 50) item.put("alert", "Action Required");
            return item;
        }).collect(Collectors.toList()));
        dashboard.put("incomingRequests", mentorRequestRepository.findByMentorOrderByCreatedAtDesc(mentor).stream()
                .filter(r -> "Pending".equals(r.getStatus()))
                .limit(3)
                .map(this::toMentorRequestDto)
                .collect(Collectors.toList()));
        return dashboard;
    }

    public List<Map<String, Object>> getCommitteeFeedbacks() {
        return submissionRepository.findByStatusOrderBySubmittedAtDesc("Graded").stream()
                .map(this::toFeedbackDto)
                .collect(Collectors.toList());
    }

    private Map<String, Object> toFeedbackDto(Submission s) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", s.getId());
        map.put("mentor", s.getMentor().getFullName() != null ? s.getMentor().getFullName() : s.getMentor().getUsername());
        map.put("mentorEmail", s.getMentor().getUsername());
        map.put("groupId", s.getGroupCode());
        map.put("groupName", s.getGroupName());
        map.put("project", s.getProjectTitle());
        map.put("student", s.getStudentName() != null ? s.getStudentName() : "Sinh viên");
        map.put("milestone", s.getMilestone() + " — " + s.getTitle());
        map.put("date", formatDate(s.getSubmittedAt()));
        map.put("rating", s.getRating());
        map.put("feedback", s.getFeedback());
        return map;
    }

    private Map<String, Object> toProjectDto(Project p) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", p.getId());
        map.put("title", p.getName());
        map.put("topic", p.getDescription());
        map.put("status", p.getStatus());
        map.put("progress", p.getProgress());
        return map;
    }

    private Map<String, Object> toGroupDto(StudentGroup g) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", g.getGroupCode());
        map.put("name", g.getGroupName());
        map.put("project", findProjectName(g.getGroupCode()));
        map.put("members", Arrays.asList(g.getMemberNames().split(",\\s*")));
        map.put("progress", g.getProgress());
        map.put("lastActive", g.getLastActive());
        return map;
    }

    private Map<String, Object> toProgressDto(StudentGroup g) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", g.getGroupCode());
        map.put("name", g.getGroupName());
        map.put("project", findProjectName(g.getGroupCode()));
        map.put("className", g.getMentorClass() != null ? g.getMentorClass().getName() : "Capstone Project");
        map.put("progress", g.getProgress());
        map.put("milestoneDone", g.getMilestoneDone());
        map.put("milestoneTotal", g.getMilestoneTotal());
        map.put("lastActive", g.getLastActive());
        map.put("risk", calculateRisk(g));
        return map;
    }

    private Map<String, Object> toSubmissionDto(Submission s) {
        boolean overdue = s.getDueDate() != null
                && "Pending".equals(s.getStatus())
                && s.getDueDate().isBefore(LocalDate.now());
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", s.getId());
        map.put("groupId", s.getGroupCode());
        map.put("groupName", s.getGroupName());
        map.put("project", s.getProjectTitle());
        map.put("submission", s.getTitle());
        map.put("milestone", s.getMilestone());
        map.put("submittedAt", formatDate(s.getSubmittedAt()));
        map.put("dueDate", s.getDueDate() != null ? s.getDueDate().format(DATE_FMT) : "");
        map.put("status", s.getStatus());
        map.put("overdue", overdue);
        map.put("fileUrl", s.getFileUrl());
        map.put("feedback", s.getFeedback());
        map.put("rating", s.getRating());
        map.put("score", s.getMentorScore());
        map.put("studentName", s.getStudentName() != null ? s.getStudentName() : "Sinh viên");
        map.put("links", buildSubmissionLinks(s.getFileUrl()));
        map.put("studentNote", extractStudentNote(s.getFileUrl()));
        Map<String, String> decoded = decodeSubmissionLinks(s.getFileUrl());
        boolean committee = "MENTOR_AND_COMMITTEE".equals(decoded.get("audience"));
        map.put("submitToCommittee", committee);
        map.put("submitAudience", committee ? "Mentor + Committee" : "Mentor");
        return map;
    }

    private List<Map<String, String>> buildSubmissionLinks(String fileUrl) {
        Map<String, String> decoded = decodeSubmissionLinks(fileUrl);
        List<Map<String, String>> links = new ArrayList<>();
        if (!decoded.getOrDefault("repoLink", "").isBlank()) {
            links.add(Map.of(
                    "type", "github",
                    "label", "GitHub Repository",
                    "url", decoded.get("repoLink")
            ));
        }
        if (!decoded.getOrDefault("docLink", "").isBlank()) {
            links.add(Map.of(
                    "type", "drive",
                    "label", "Google Drive / Tài liệu",
                    "url", decoded.get("docLink")
            ));
        }
        if (links.isEmpty() && fileUrl != null && fileUrl.startsWith("http")) {
            links.add(Map.of(
                    "type", "link",
                    "label", "Tài liệu đính kèm",
                    "url", fileUrl
            ));
        }
        return links;
    }

    private String extractStudentNote(String fileUrl) {
        return decodeSubmissionLinks(fileUrl).getOrDefault("note", "");
    }

    private Map<String, String> decodeSubmissionLinks(String fileUrl) {
        Map<String, String> result = new LinkedHashMap<>();
        result.put("repoLink", "");
        result.put("docLink", "");
        result.put("note", "");
        result.put("audience", "MENTOR_ONLY");
        result.put("phaseId", "");
        if (fileUrl == null || fileUrl.isBlank() || "#".equals(fileUrl)) {
            return result;
        }
        if (fileUrl.trim().startsWith("{")) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, String> parsed = objectMapper.readValue(fileUrl, Map.class);
                result.putAll(parsed);
                return result;
            } catch (JsonProcessingException ignored) {
                result.put("docLink", fileUrl);
            }
        } else if (fileUrl.startsWith("http")) {
            result.put("docLink", fileUrl);
        }
        return result;
    }

    private String calculateRisk(StudentGroup g) {
        if (g.getProgress() < 50) return "high";
        if (g.getProgress() < 70) return "medium";
        return "low";
    }

    private String findProjectName(String groupCode) {
        return projectRepository.findByGroupId(groupCode).stream()
                .findFirst()
                .map(Project::getName)
                .orElse("—");
    }

    private MentorClass createDefaultClass(User mentor) {
        MentorClass cls = new MentorClass(
                "capstone-fa24",
                "Capstone Project",
                "FA24_CAP391",
                "Fall 2024",
                "Hà Nội",
                mentor
        );
        return mentorClassRepository.save(cls);
    }

    private User requireMentor(Long mentorId) {
        User user = userRepository.findById(mentorId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mentor."));
        if (!"Mentor".equals(user.getRole())) {
            throw new IllegalArgumentException("Tài khoản không phải mentor.");
        }
        return user;
    }

    private String formatDate(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(DATE_FMT) : "";
    }

    private int parseInt(String value, int defaultValue) {
        if (value == null || value.isBlank()) return defaultValue;
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
