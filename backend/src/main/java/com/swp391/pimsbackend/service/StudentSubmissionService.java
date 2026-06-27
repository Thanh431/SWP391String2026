package com.swp391.pimsbackend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.pimsbackend.model.Project;
import com.swp391.pimsbackend.model.StudentGroup;
import com.swp391.pimsbackend.model.Submission;
import com.swp391.pimsbackend.model.User;
import com.swp391.pimsbackend.repository.ProjectRepository;
import com.swp391.pimsbackend.repository.SubmissionRepository;
import com.swp391.pimsbackend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StudentSubmissionService {

    private static final DateTimeFormatter DATE_TIME_FMT = DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final List<PhaseTemplate> PHASES = List.of(
            new PhaseTemplate(
                    1,
                    "Assessment 1 (Week 3) — Milestone 1: Requirement Analysis & Design",
                    "Milestone 1: Requirement Analysis & Design",
                    "Week 3",
                    "20 phút/nhóm",
                    "15%",
                    "On-going",
                    "CLO1, CLO2, CLO4",
                    "Phân tích yêu cầu, tài liệu hóa có hỗ trợ AI, kiến trúc hệ thống, UI ban đầu và ERD. Sinh viên trình bày slide, demo và trả lời câu hỏi mentor.",
                    List.of(
                            "SRS Document (30%): ≥15 trang, ≥12 user stories, hoàn chỉnh và được validate bằng AI + chuyên gia",
                            "Design Artifacts (50%): ERD ≥8 entities, state diagram hợp lệ, kiến trúc rõ ràng, UI nhất quán",
                            "Process (20%): ≥6 AI logs và 4 weekly reports có bằng chứng"
                    ),
                    List.of("Slide thuyết trình", "Tài liệu SRS (Google Drive)", "ERD & Figma/UI mockup", "AI logs & weekly reports"),
                    List.of("giai đoạn 1", "milestone 1", "requirement analysis", "requirement analysis & design", "proposal", "srs"),
                    false
            ),
            new PhaseTemplate(
                    2,
                    "Assessment 2 (Week 8) — Milestone 2: Workflow 1 & 2 Implementation",
                    "Milestone 2: Workflow Implementation",
                    "Week 8",
                    "20 phút/nhóm",
                    "20%",
                    "On-going",
                    "CLO2, CLO3, CLO4",
                    "Triển khai module coding, tích hợp database, debug có hỗ trợ AI và kiểm thử chức năng. Trình bày slide, demo và Q&A với mentor.",
                    List.of(
                            "Workflow Implementation (50%): Workflow 0 + 1 + 2 (main flow + ≥2 exception paths) hoạt động đầy đủ",
                            "Codebase & Database (30%): Multi-layer (MVC), CRUD đầy đủ, DB ≥10 bảng chuẩn hóa PK/FK",
                            "Process (20%): ≥8 commits/thành viên + ≥6 AI debugging logs"
                    ),
                    List.of("Source code GitHub (release milestone 2)", "Slide demo workflow", "Database script", "AI debugging logs"),
                    List.of("giai đoạn 2", "milestone 2", "workflow", "implementation", "srs", "thiết kế"),
                    false
            ),
            new PhaseTemplate(
                    3,
                    "Assessment 3 (Week 10) — Milestone 3: Full System Completion & Testing",
                    "Milestone 3: System Completion & Testing",
                    "Week 10",
                    "20 phút/nhóm",
                    "25%",
                    "On-going",
                    "CLO3, CLO4, CLO5",
                    "Hoàn thiện end-to-end workflow, sinh test case bằng AI, hoàn thiện UI/UX. Demo mượt và báo cáo đủ milestone.",
                    List.of(
                            "Product (50%): Tích hợp 3 workflows (data setup, main + ≥2 exceptions, dashboard); demo mượt",
                            "Testing & QA (30%): ≥25 test cases (AI + manual), pass rate ≥80%, coverage đầy đủ",
                            "Process (20%): 3 milestone reports, slide, 10 AI logs, đủ thành viên tham gia"
                    ),
                    List.of("Full source code", "Test cases & báo cáo QA", "3 milestone reports", "Slide & video demo"),
                    List.of("giai đoạn 3", "milestone 3", "midterm", "giữa kỳ", "testing", "completion"),
                    false
            ),
            new PhaseTemplate(
                    4,
                    "Final Project Presentation",
                    "Final Project Presentation",
                    "Cuối kỳ",
                    "60 phút/nhóm",
                    "40%",
                    "Final exam",
                    "CLO1, CLO2, CLO3, CLO4, CLO5",
                    "Bảo vệ đồ án trước hội đồng: trình bày slide, demo hệ thống và phản biện. Yêu cầu điểm on-going trung bình ≥5/10 và hoàn thành 2 workflow chính.",
                    List.of(
                            "Requirement Analysis (20%): Chất lượng SRS, elicitation & validation có AI",
                            "System Design (20%): ERD, state diagrams, architecture, UI workflows có AI",
                            "Software Implementation (40%): Workflows hoàn chỉnh, codebase có cấu trúc, DB design",
                            "AI Usage & Professionalism (20%): Minh bạch AI logs, teamwork, chất lượng trình bày"
                    ),
                    List.of("Quyển báo cáo hoàn chỉnh (PDF)", "Slide bảo vệ cuối kỳ", "Video demo 5–10 phút", "Full source code & AI usage report"),
                    List.of("giai đoạn 4", "milestone 4", "final", "final project", "presentation", "bảo vệ"),
                    true
            )
    );

    private final UserRepository userRepository;
    private final StudentTeamService studentTeamService;
    private final ProjectRepository projectRepository;
    private final SubmissionRepository submissionRepository;
    private final ObjectMapper objectMapper;

    public StudentSubmissionService(UserRepository userRepository,
                                    StudentTeamService studentTeamService,
                                    ProjectRepository projectRepository,
                                    SubmissionRepository submissionRepository,
                                    ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.studentTeamService = studentTeamService;
        this.projectRepository = projectRepository;
        this.submissionRepository = submissionRepository;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> getSubmissions(Long studentId) {
        User student = requireStudent(studentId);
        Optional<StudentGroup> groupOpt = studentTeamService.resolveStudentGroup(studentId);
        if (groupOpt.isEmpty()) {
            Map<String, Object> empty = new LinkedHashMap<>();
            empty.put("hasTeam", false);
            empty.put("message", "Bạn chưa tham gia nhóm nào. Hãy vào My Courses hoặc Team Management để tham gia nhóm.");
            return empty;
        }

        StudentGroup group = groupOpt.get();
        Project project = projectRepository.findByGroupId(group.getGroupCode()).stream().findFirst().orElse(null);
        String projectTitle = project != null ? project.getName() : group.getGroupName();

        List<Map<String, Object>> phases = buildPhasesForGroup(group.getGroupCode(), project);
        Integer activePhaseId = phases.stream()
                .filter(p -> "Open".equals(p.get("status")))
                .map(p -> (Integer) p.get("id"))
                .findFirst()
                .orElse(phases.stream()
                        .filter(p -> "Reviewing".equals(p.get("status")))
                        .map(p -> (Integer) p.get("id"))
                        .findFirst()
                        .orElse(PHASES.size()));

        List<Submission> groupSubmissions = submissionRepository.findByGroupCodeOrderBySubmittedAtDesc(group.getGroupCode());
        List<Map<String, Object>> history = groupSubmissions.stream()
                .map(this::toSubmissionDto)
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("hasTeam", true);
        result.put("groupCode", group.getGroupCode());
        result.put("groupName", group.getGroupName());
        result.put("projectTitle", projectTitle);
        result.put("phases", phases);
        result.put("activePhaseId", activePhaseId);
        result.put("history", history);
        result.put("studentName", student.getFullName() != null ? student.getFullName() : student.getUsername());
        return result;
    }

    public List<Map<String, Object>> buildPhasesForGroup(String groupCode, Project project) {
        List<Submission> groupSubmissions = submissionRepository.findByGroupCodeOrderBySubmittedAtDesc(groupCode);
        List<Map<String, Object>> phases = new ArrayList<>();

        for (PhaseTemplate phase : PHASES) {
            Submission latest = findLatestForPhase(groupSubmissions, phase);
            boolean previousCompleted = phase.id() == 1 || isPhaseCompleted(phases.get(phases.size() - 1));
            String phaseStatus = resolvePhaseStatus(phase, latest, previousCompleted);

            Map<String, Object> phaseMap = new LinkedHashMap<>();
            phaseMap.put("id", phase.id());
            phaseMap.put("title", phase.title());
            phaseMap.put("shortTitle", phase.shortTitle());
            phaseMap.put("week", phase.week());
            phaseMap.put("duration", phase.duration());
            phaseMap.put("weight", phase.weight());
            phaseMap.put("assessmentType", phase.assessmentType());
            phaseMap.put("clo", phase.clo());
            phaseMap.put("description", phase.description());
            phaseMap.put("gradingCriteria", phase.gradingCriteria());
            phaseMap.put("deliverables", phase.deliverables());
            phaseMap.put("submitToCommittee", phase.submitToCommittee());
            phaseMap.put("submitAudience", phase.submitToCommittee() ? "Mentor + Committee" : "Mentor");
            phaseMap.put("status", phaseStatus);
            phaseMap.put("deadline", formatDeadline(project, phase.id()));
            if (latest != null) {
                phaseMap.put("latestSubmission", toSubmissionDto(latest));
            }
            phases.add(phaseMap);
        }
        return phases;
    }

    @Transactional
    public Map<String, Object> submitPhase(Long studentId, int phaseId, Map<String, String> body) {
        User student = requireStudent(studentId);
        StudentGroup group = studentTeamService.resolveStudentGroup(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Bạn chưa tham gia nhóm nào."));

        PhaseTemplate phase = PHASES.stream()
                .filter(p -> p.id() == phaseId)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Giai đoạn nộp bài không hợp lệ."));

        if (phaseId > 1) {
            Map<String, Object> current = getSubmissions(studentId);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> phases = (List<Map<String, Object>>) current.get("phases");
            Map<String, Object> previous = phases.get(phaseId - 2);
            if (!"Completed".equals(previous.get("status"))) {
                throw new IllegalArgumentException("Bạn cần hoàn thành giai đoạn trước trước khi nộp bài giai đoạn này.");
            }
        }

        List<Submission> existing = submissionRepository.findByGroupCodeOrderBySubmittedAtDesc(group.getGroupCode());
        Submission latest = findLatestForPhase(existing, phase);
        if (latest != null && "Pending".equals(latest.getStatus())) {
            throw new IllegalArgumentException("Giai đoạn này đã có bài nộp đang chờ đánh giá. Vui lòng đợi phản hồi.");
        }
        if (latest != null && "Graded".equals(latest.getStatus()) && !needsRevision(latest)) {
            throw new IllegalArgumentException("Giai đoạn này đã được chấm điểm. Không thể nộp lại.");
        }

        String repoLink = trim(body.get("repoLink"));
        String docLink = trim(body.get("docLink"));
        String note = trim(body.get("note"));

        if (repoLink.isBlank() && docLink.isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập ít nhất một liên kết GitHub hoặc Google Drive.");
        }

        User mentor = group.getMentor();
        if (mentor == null) {
            throw new IllegalArgumentException("Nhóm chưa được gán mentor. Vui lòng liên hệ giảng viên.");
        }

        Project project = projectRepository.findByGroupId(group.getGroupCode()).stream().findFirst().orElse(null);
        String projectTitle = project != null ? project.getName() : group.getGroupName();

        Submission submission = new Submission();
        submission.setGroupCode(group.getGroupCode());
        submission.setGroupName(group.getGroupName());
        submission.setProjectTitle(projectTitle);
        submission.setMentor(mentor);
        submission.setTitle(phase.shortTitle());
        submission.setMilestone(phase.title());
        submission.setStatus("Pending");
        submission.setDueDate(estimateDueDate(project, phase.id()));
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setStudentName(student.getFullName() != null ? student.getFullName() : student.getUsername());
        submission.setFileUrl(encodeLinks(repoLink, docLink, note, phase));
        submissionRepository.save(submission);

        return getSubmissions(studentId);
    }

    private String resolvePhaseStatus(PhaseTemplate phase, Submission latest, boolean previousCompleted) {
        if (!previousCompleted) {
            return "Locked";
        }
        if (latest == null) {
            return "Open";
        }
        if ("Pending".equals(latest.getStatus())) {
            return "Reviewing";
        }
        if ("Graded".equals(latest.getStatus())) {
            return needsRevision(latest) ? "Open" : "Completed";
        }
        return "Open";
    }

    private boolean isPhaseCompleted(Map<String, Object> phaseMap) {
        return "Completed".equals(phaseMap.get("status"));
    }

    private boolean needsRevision(Submission submission) {
        if (!"Graded".equals(submission.getStatus())) {
            return false;
        }
        String rating = submission.getRating();
        return rating != null && rating.toLowerCase().contains("needs");
    }

    private Submission findLatestForPhase(List<Submission> submissions, PhaseTemplate phase) {
        return submissions.stream()
                .filter(s -> matchesPhase(s, phase))
                .max(Comparator.comparing(Submission::getSubmittedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);
    }

    private boolean matchesPhase(Submission submission, PhaseTemplate phase) {
        Map<String, String> links = decodeLinks(submission.getFileUrl());
        String phaseId = links.get("phaseId");
        if (phaseId != null && !phaseId.isBlank()) {
            try {
                return phase.id() == Integer.parseInt(phaseId.trim());
            } catch (NumberFormatException ignored) {
                // fall through to keyword matching
            }
        }
        String milestone = submission.getMilestone() != null ? submission.getMilestone().toLowerCase() : "";
        String title = submission.getTitle() != null ? submission.getTitle().toLowerCase() : "";
        String combined = milestone + " " + title;
        return phase.matchKeys().stream().anyMatch(combined::contains);
    }

    private Map<String, Object> toSubmissionDto(Submission submission) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", submission.getId());
        map.put("phaseTitle", submission.getMilestone());
        map.put("title", submission.getTitle());
        map.put("submittedAt", submission.getSubmittedAt() != null
                ? submission.getSubmittedAt().format(DATE_TIME_FMT)
                : "—");
        map.put("submittedBy", submission.getStudentName() != null ? submission.getStudentName() : "Sinh viên");
        map.put("status", mapUiStatus(submission));
        map.put("feedback", submission.getFeedback() != null && !submission.getFeedback().isBlank()
                ? submission.getFeedback()
                : defaultFeedback(submission));
        map.put("reviewer", submission.getMentor() != null
                ? (submission.getMentor().getFullName() != null
                ? submission.getMentor().getFullName()
                : submission.getMentor().getUsername())
                : "Mentor");
        map.put("rating", submission.getRating());
        map.put("score", submission.getMentorScore());

        Map<String, String> links = decodeLinks(submission.getFileUrl());
        List<Map<String, String>> linkItems = new ArrayList<>();
        if (!links.getOrDefault("repoLink", "").isBlank()) {
            linkItems.add(Map.of("type", "github", "label", "GitHub Repository", "url", links.get("repoLink")));
        }
        if (!links.getOrDefault("docLink", "").isBlank()) {
            linkItems.add(Map.of("type", "drive", "label", "Google Drive / Tài liệu", "url", links.get("docLink")));
        }
        if (linkItems.isEmpty() && submission.getFileUrl() != null && submission.getFileUrl().startsWith("http")) {
            linkItems.add(Map.of("type", "link", "label", "Tài liệu đính kèm", "url", submission.getFileUrl()));
        }
        map.put("links", linkItems);
        map.put("note", links.getOrDefault("note", ""));
        map.put("submitAudience", "MENTOR_AND_COMMITTEE".equals(links.get("audience"))
                ? "Mentor + Committee" : "Mentor");
        map.put("submitToCommittee", "MENTOR_AND_COMMITTEE".equals(links.get("audience")));
        return map;
    }

    private String mapUiStatus(Submission submission) {
        if ("Pending".equals(submission.getStatus())) {
            return "Reviewing";
        }
        if ("Graded".equals(submission.getStatus())) {
            return needsRevision(submission) ? "Rejected" : "Approved";
        }
        return submission.getStatus();
    }

    private String defaultFeedback(Submission submission) {
        if ("Pending".equals(submission.getStatus())) {
            Map<String, String> links = decodeLinks(submission.getFileUrl());
            if ("MENTOR_AND_COMMITTEE".equals(links.get("audience"))) {
                return "Bài làm đang chờ mentor và hội đồng (committee) xem xét.";
            }
            return "Bài làm đang chờ mentor chấm điểm và nhận xét.";
        }
        if ("Graded".equals(submission.getStatus()) && submission.getFeedback() != null) {
            return submission.getFeedback();
        }
        return "—";
    }

    private String formatDeadline(Project project, int phaseId) {
        LocalDate due = estimateDueDate(project, phaseId);
        return "23:59 - " + due.format(DATE_FMT);
    }

    private LocalDate estimateDueDate(Project project, int phaseId) {
        if (project == null || project.getStartDate() == null || project.getEndDate() == null) {
            return LocalDate.now().plusWeeks((long) phaseId * 3);
        }
        long totalDays = ChronoUnit.DAYS.between(project.getStartDate().toLocalDate(), project.getEndDate().toLocalDate());
        if (totalDays <= 0) {
            return project.getEndDate().toLocalDate();
        }
        long offset = (totalDays * phaseId) / PHASES.size();
        return project.getStartDate().toLocalDate().plusDays(offset);
    }

    private String encodeLinks(String repoLink, String docLink, String note, PhaseTemplate phase) {
        Map<String, String> payload = new LinkedHashMap<>();
        payload.put("repoLink", repoLink);
        payload.put("docLink", docLink);
        payload.put("note", note);
        payload.put("phaseId", String.valueOf(phase.id()));
        payload.put("audience", phase.submitToCommittee() ? "MENTOR_AND_COMMITTEE" : "MENTOR_ONLY");
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            return docLink.isBlank() ? repoLink : docLink;
        }
    }

    private Map<String, String> decodeLinks(String fileUrl) {
        Map<String, String> result = new LinkedHashMap<>();
        result.put("repoLink", "");
        result.put("docLink", "");
        result.put("note", "");
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
        } else {
            result.put("docLink", fileUrl);
        }
        return result;
    }

    private User requireStudent(Long studentId) {
        User user = userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sinh viên."));
        if (!"Student".equals(user.getRole())) {
            throw new IllegalArgumentException("Tài khoản không phải Student.");
        }
        return user;
    }

    private String trim(String value) {
        return value != null ? value.trim() : "";
    }

    private record PhaseTemplate(
            int id,
            String title,
            String shortTitle,
            String week,
            String duration,
            String weight,
            String assessmentType,
            String clo,
            String description,
            List<String> gradingCriteria,
            List<String> deliverables,
            List<String> matchKeys,
            boolean submitToCommittee
    ) {
    }
}
