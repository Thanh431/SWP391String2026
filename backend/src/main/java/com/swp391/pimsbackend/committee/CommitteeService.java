package com.swp391.pimsbackend.committee;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.pimsbackend.committee.model.CommitteePublishedResult;
import com.swp391.pimsbackend.committee.repository.CommitteePublishedResultRepository;
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
public class CommitteeService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ofPattern("EEEE, dd/MM/yyyy", new Locale("vi", "VN"));
    private static final List<String> RECOMMENDATIONS = List.of("Pass", "Conditional Pass", "Fail");

    private final DefenseScheduleRepository defenseScheduleRepository;
    private final EvaluationRepository evaluationRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final SubmissionRepository submissionRepository;
    private final CommitteePublishedResultRepository publishedResultRepository;
    private final ObjectMapper objectMapper;

    public CommitteeService(DefenseScheduleRepository defenseScheduleRepository,
                            EvaluationRepository evaluationRepository,
                            UserRepository userRepository,
                            ProjectRepository projectRepository,
                            SubmissionRepository submissionRepository,
                            CommitteePublishedResultRepository publishedResultRepository,
                            ObjectMapper objectMapper) {
        this.defenseScheduleRepository = defenseScheduleRepository;
        this.evaluationRepository = evaluationRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.submissionRepository = submissionRepository;
        this.publishedResultRepository = publishedResultRepository;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> getDashboardStats(Long committeeId) {
        User committee = requireCommittee(committeeId);
        List<DefenseSchedule> assigned = defenseScheduleRepository.findByCommitteeOrderByDefenseDateAsc(committee);
        LocalDate today = LocalDate.now();
        long todayCount = assigned.stream()
                .filter(s -> s.getDefenseDate().toLocalDate().equals(today))
                .count();
        long completed = evaluationRepository.countByEvaluatorId(committeeId);
        long pending = Math.max(0, assigned.size() - completed);
        long published = publishedResultRepository.countByCommitteeId(committeeId);
        int publishRate = completed == 0 ? 0 : (int) Math.round((published * 100.0) / completed);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("awaiting", pending);
        stats.put("todayScheduled", todayCount);
        stats.put("completedEvaluations", completed);
        stats.put("publishedCount", published);
        stats.put("publishRate", publishRate);
        stats.put("totalAssigned", assigned.size());
        stats.put("pendingReports", countPendingReports(assigned));
        return stats;
    }

    public List<Map<String, Object>> getFeedbacks(Long committeeId) {
        Set<String> groupCodes = assignedGroupCodes(requireCommittee(committeeId));
        return submissionRepository.findByStatusOrderBySubmittedAtDesc("Graded").stream()
                .filter(s -> groupCodes.contains(s.getGroupCode()))
                .map(this::toFeedbackDto)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getSchedules(Long committeeId) {
        User committee = requireCommittee(committeeId);
        List<DefenseSchedule> schedules = defenseScheduleRepository.findByCommitteeOrderByDefenseDateAsc(committee);
        Map<String, List<DefenseSchedule>> grouped = new LinkedHashMap<>();

        for (DefenseSchedule s : schedules) {
            String key = s.getDefenseDate().toLocalDate() + "|" + s.getTimeSlot() + "|" + s.getLocation();
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
        }

        List<Map<String, Object>> slots = new ArrayList<>();
        int idx = 0;
        for (List<DefenseSchedule> group : grouped.values()) {
            DefenseSchedule first = group.get(0);
            Map<String, Object> slot = new LinkedHashMap<>();
            slot.put("id", "slot-" + (++idx));
            slot.put("date", first.getDefenseDate().toLocalDate().format(DATE_FMT));
            slot.put("dayLabel", formatDayLabel(first.getDefenseDate()));
            slot.put("room", first.getLocation());
            slot.put("timeSlot", first.getTimeSlot());
            slot.put("groupCount", group.size());
            slot.put("committeeLead", committee.getFullName() != null ? committee.getFullName() : committee.getUsername());
            slot.put("groups", group.stream().map(s -> {
                Map<String, Object> g = new LinkedHashMap<>();
                g.put("id", s.getStudentGroup().getGroupCode());
                g.put("name", s.getStudentGroup().getGroupName());
                g.put("topic", findProjectName(s.getStudentGroup().getGroupCode()));
                g.put("status", s.getStatus());
                g.put("defenseId", s.getId());
                return g;
            }).collect(Collectors.toList()));
            slots.add(slot);
        }
        return slots;
    }

    public List<Map<String, Object>> getEvaluationItems(Long committeeId) {
        User committee = requireCommittee(committeeId);
        return defenseScheduleRepository.findByCommitteeOrderByDefenseDateAsc(committee).stream()
                .map(schedule -> toEvaluationItem(schedule, committeeId))
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> submitEvaluation(Long committeeId, Map<String, String> body) {
        User committee = requireCommittee(committeeId);
        Long defenseId = Long.parseLong(require(body, "defenseId"));
        DefenseSchedule defense = defenseScheduleRepository.findById(defenseId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch chấm."));
        if (defense.getCommittee() == null || !defense.getCommittee().getId().equals(committeeId)) {
            throw new IllegalArgumentException("Bạn không được phân công chấm nhóm này.");
        }

        double technical = parseScore(body.get("technicalScore"), "Điểm kỹ thuật");
        double presentation = parseScore(body.get("presentationScore"), "Điểm trình bày");
        double innovation = parseScore(body.get("innovationScore"), "Điểm sáng tạo");
        String recommendation = require(body, "recommendation");
        if (!RECOMMENDATIONS.contains(recommendation)) {
            throw new IllegalArgumentException("Kết luận không hợp lệ.");
        }

        Evaluation evaluation = evaluationRepository
                .findByDefenseIdAndEvaluatorId(defenseId, committeeId)
                .orElse(new Evaluation());
        evaluation.setDefense(defense);
        evaluation.setStudentGroup(defense.getStudentGroup());
        evaluation.setEvaluator(committee);
        evaluation.setTechnicalScore(technical);
        evaluation.setPresentationScore(presentation);
        evaluation.setInnovationScore(innovation);
        evaluation.setOverallScore(Math.round(((technical + presentation + innovation) / 3.0) * 10.0) / 10.0);
        evaluation.setFeedback(body.get("feedback"));
        evaluation.setRecommendation(recommendation);
        evaluationRepository.save(evaluation);

        defense.setStatus("Completed");
        defenseScheduleRepository.save(defense);

        return toEvaluationDto(evaluation, defense, false);
    }

    public Map<String, Object> getEvaluationStats(Long committeeId) {
        requireCommittee(committeeId);
        long total = defenseScheduleRepository.findByCommitteeOrderByDefenseDateAsc(
                userRepository.findById(committeeId).orElseThrow()).size();
        long completed = evaluationRepository.countByEvaluatorId(committeeId);
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalAssigned", total);
        stats.put("completed", completed);
        stats.put("pending", Math.max(0, total - completed));
        return stats;
    }

    public List<Map<String, Object>> getPendingReports(Long committeeId) {
        Set<String> groupCodes = assignedGroupCodes(requireCommittee(committeeId));
        List<Map<String, Object>> reports = new ArrayList<>();

        submissionRepository.findByStatusOrderBySubmittedAtDesc("Pending").stream()
                .filter(s -> groupCodes.contains(s.getGroupCode()))
                .filter(this::isCommitteeSubmission)
                .map(this::toReportReviewDto)
                .forEach(reports::add);

        submissionRepository.findByStatusOrderBySubmittedAtDesc("Graded").stream()
                .filter(s -> groupCodes.contains(s.getGroupCode()))
                .filter(s -> !"Committee Approved".equals(s.getStatus()) && !"Committee Rejected".equals(s.getStatus()))
                .map(this::toReportReviewDto)
                .forEach(reports::add);

        return reports;
    }

    @Transactional
    public Map<String, Object> reviewReport(Long committeeId, Long submissionId, Map<String, String> body) {
        requireCommittee(committeeId);
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy báo cáo."));
        Set<String> groupCodes = assignedGroupCodes(userRepository.findById(committeeId).orElseThrow());
        if (!groupCodes.contains(submission.getGroupCode())) {
            throw new IllegalArgumentException("Báo cáo không thuộc nhóm bạn phụ trách.");
        }
        if (!"Graded".equals(submission.getStatus())) {
            throw new IllegalArgumentException("Chỉ duyệt báo cáo đã được mentor chấm.");
        }

        String action = require(body, "action");
        if (!"approve".equals(action) && !"reject".equals(action)) {
            throw new IllegalArgumentException("Hành động không hợp lệ.");
        }
        submission.setStatus("approve".equals(action) ? "Committee Approved" : "Committee Rejected");
        String note = body.get("note");
        if (note != null && !note.isBlank()) {
            submission.setFeedback(submission.getFeedback() + "\n[Committee] " + note.trim());
        }
        submissionRepository.save(submission);
        return toReportReviewDto(submission);
    }

    public List<Map<String, Object>> getPublishedResults(Long committeeId) {
        User committee = requireCommittee(committeeId);
        return defenseScheduleRepository.findByCommitteeOrderByDefenseDateAsc(committee).stream()
                .map(schedule -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("defenseId", schedule.getId());
                    item.put("groupCode", schedule.getStudentGroup().getGroupCode());
                    item.put("groupName", schedule.getStudentGroup().getGroupName());
                    item.put("project", findProjectName(schedule.getStudentGroup().getGroupCode()));
                    item.put("defenseDate", schedule.getDefenseDate().toLocalDate().toString());
                    item.put("hasEvaluation", false);
                    item.put("published", false);

                    evaluationRepository.findByDefenseIdAndEvaluatorId(schedule.getId(), committeeId)
                            .ifPresent(ev -> {
                                item.put("hasEvaluation", true);
                                item.put("id", ev.getId());
                                item.put("technicalScore", ev.getTechnicalScore());
                                item.put("presentationScore", ev.getPresentationScore());
                                item.put("innovationScore", ev.getInnovationScore());
                                item.put("overallScore", ev.getOverallScore());
                                item.put("feedback", ev.getFeedback());
                                item.put("recommendation", ev.getRecommendation());
                                item.put("published", isPublished(ev.getId()));
                                item.put("submittedAt", ev.getUpdatedAt() != null
                                        ? ev.getUpdatedAt().format(DATETIME_FMT) : "");
                            });
                    return item;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> publishResult(Long committeeId, Long defenseId) {
        requireCommittee(committeeId);
        DefenseSchedule defense = defenseScheduleRepository.findById(defenseId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch chấm."));
        if (defense.getCommittee() == null || !defense.getCommittee().getId().equals(committeeId)) {
            throw new IllegalArgumentException("Bạn không được phân công nhóm này.");
        }
        Evaluation evaluation = evaluationRepository.findByDefenseIdAndEvaluatorId(defenseId, committeeId)
                .orElseThrow(() -> new IllegalArgumentException("Chưa có điểm chấm để công bố."));
        if (publishedResultRepository.findByEvaluationId(evaluation.getId()).isPresent()) {
            throw new IllegalArgumentException("Kết quả đã được công bố.");
        }
        CommitteePublishedResult published = new CommitteePublishedResult();
        published.setEvaluationId(evaluation.getId());
        published.setCommitteeId(committeeId);
        published.setDefenseId(defenseId);
        publishedResultRepository.save(published);
        return toEvaluationDto(evaluation, defense, true);
    }

    @Transactional
    public Map<String, Object> unpublishResult(Long committeeId, Long defenseId) {
        requireCommittee(committeeId);
        CommitteePublishedResult published = publishedResultRepository.findByDefenseIdAndCommitteeId(defenseId, committeeId)
                .orElseThrow(() -> new IllegalArgumentException("Kết quả chưa được công bố."));
        publishedResultRepository.delete(published);
        Evaluation evaluation = evaluationRepository.findByDefenseIdAndEvaluatorId(defenseId, committeeId)
                .orElseThrow();
        return toEvaluationDto(evaluation, evaluation.getDefense(), false);
    }

    public List<Map<String, Object>> getProjectArchives(Long committeeId) {
        User committee = requireCommittee(committeeId);
        return defenseScheduleRepository.findByCommitteeOrderByDefenseDateAsc(committee).stream()
                .filter(s -> "Completed".equals(s.getStatus()))
                .map(s -> {
                    String groupCode = s.getStudentGroup().getGroupCode();
                    Map<String, Object> archive = new LinkedHashMap<>();
                    archive.put("defenseId", s.getId());
                    archive.put("groupCode", groupCode);
                    archive.put("groupName", s.getStudentGroup().getGroupName());
                    archive.put("project", findProjectName(groupCode));
                    archive.put("defenseDate", s.getDefenseDate().toLocalDate().format(DATE_FMT));
                    archive.put("location", s.getLocation());
                    evaluationRepository.findByDefenseIdAndEvaluatorId(s.getId(), committeeId)
                            .ifPresent(ev -> {
                                archive.put("overallScore", ev.getOverallScore());
                                archive.put("recommendation", ev.getRecommendation());
                                archive.put("published", isPublished(ev.getId()));
                            });
                    projectRepository.findByGroupId(groupCode).stream().findFirst().ifPresent(p -> {
                        archive.put("projectStatus", p.getStatus());
                        archive.put("progress", p.getProgress());
                        archive.put("description", p.getDescription());
                    });
                    return archive;
                })
                .collect(Collectors.toList());
    }

    public Map<String, Object> getReportsSummary(Long committeeId) {
        User committee = requireCommittee(committeeId);
        List<DefenseSchedule> assigned = defenseScheduleRepository.findByCommitteeOrderByDefenseDateAsc(committee);
        Set<String> groupCodes = assignedGroupCodes(committee);
        List<Submission> related = submissionRepository.findAll().stream()
                .filter(s -> groupCodes.contains(s.getGroupCode()))
                .collect(Collectors.toList());

        long graded = related.stream().filter(s -> "Graded".equals(s.getStatus())).count();
        long approved = related.stream().filter(s -> "Committee Approved".equals(s.getStatus())).count();
        long rejected = related.stream().filter(s -> "Committee Rejected".equals(s.getStatus())).count();
        long evaluations = evaluationRepository.countByEvaluatorId(committeeId);
        long published = publishedResultRepository.countByCommitteeId(committeeId);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("assignedGroups", assigned.size());
        summary.put("mentorGradedReports", graded + approved + rejected);
        summary.put("committeeApproved", approved);
        summary.put("committeeRejected", rejected);
        summary.put("evaluationsCompleted", evaluations);
        summary.put("resultsPublished", published);
        summary.put("passCount", countByRecommendation(committeeId, "Pass"));
        summary.put("conditionalCount", countByRecommendation(committeeId, "Conditional Pass"));
        summary.put("failCount", countByRecommendation(committeeId, "Fail"));
        return summary;
    }

    public List<Map<String, Object>> exportReportData(Long committeeId) {
        return getEvaluationItems(committeeId).stream()
                .map(item -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("groupCode", item.get("groupCode"));
                    row.put("groupName", item.get("groupName"));
                    row.put("project", item.get("project"));
                    row.put("defenseDate", item.get("defenseDate"));
                    row.put("timeSlot", item.get("timeSlot"));
                    row.put("location", item.get("location"));
                    row.put("scheduleStatus", item.get("scheduleStatus"));
                    @SuppressWarnings("unchecked")
                    Map<String, Object> ev = (Map<String, Object>) item.get("evaluation");
                    if (ev != null) {
                        row.put("technicalScore", ev.get("technicalScore"));
                        row.put("presentationScore", ev.get("presentationScore"));
                        row.put("innovationScore", ev.get("innovationScore"));
                        row.put("overallScore", ev.get("overallScore"));
                        row.put("recommendation", ev.get("recommendation"));
                        row.put("feedback", ev.get("feedback"));
                        row.put("published", ev.get("published"));
                    }
                    return row;
                })
                .collect(Collectors.toList());
    }

    private long countPendingReports(List<DefenseSchedule> assigned) {
        Set<String> groupCodes = assigned.stream()
                .map(s -> s.getStudentGroup().getGroupCode())
                .collect(Collectors.toSet());
        long gradedPending = submissionRepository.findByStatusOrderBySubmittedAtDesc("Graded").stream()
                .filter(s -> groupCodes.contains(s.getGroupCode()))
                .filter(s -> !"Committee Approved".equals(s.getStatus()) && !"Committee Rejected".equals(s.getStatus()))
                .count();
        long finalSubmitted = submissionRepository.findByStatusOrderBySubmittedAtDesc("Pending").stream()
                .filter(s -> groupCodes.contains(s.getGroupCode()))
                .filter(this::isCommitteeSubmission)
                .count();
        return gradedPending + finalSubmitted;
    }

    private boolean isCommitteeSubmission(Submission submission) {
        return "MENTOR_AND_COMMITTEE".equals(decodeSubmissionPayload(submission.getFileUrl()).get("audience"));
    }

    private Map<String, String> decodeSubmissionPayload(String fileUrl) {
        Map<String, String> result = new LinkedHashMap<>();
        result.put("repoLink", "");
        result.put("docLink", "");
        result.put("note", "");
        result.put("audience", "MENTOR_ONLY");
        if (fileUrl == null || fileUrl.isBlank() || "#".equals(fileUrl)) {
            return result;
        }
        if (fileUrl.trim().startsWith("{")) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, String> parsed = objectMapper.readValue(fileUrl, Map.class);
                result.putAll(parsed);
            } catch (JsonProcessingException ignored) {
                result.put("docLink", fileUrl);
            }
        } else if (fileUrl.startsWith("http")) {
            result.put("docLink", fileUrl);
        }
        return result;
    }

    private long countByRecommendation(Long committeeId, String recommendation) {
        return evaluationRepository.findByEvaluatorIdOrderByUpdatedAtDesc(committeeId).stream()
                .filter(ev -> recommendation.equals(ev.getRecommendation()))
                .count();
    }

    private User requireCommittee(Long committeeId) {
        User committee = userRepository.findById(committeeId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản hội đồng."));
        if (!"Committee".equals(committee.getRole())) {
            throw new IllegalArgumentException("Tài khoản không phải Committee.");
        }
        return committee;
    }

    private Set<String> assignedGroupCodes(User committee) {
        return defenseScheduleRepository.findByCommitteeOrderByDefenseDateAsc(committee).stream()
                .map(s -> s.getStudentGroup().getGroupCode())
                .collect(Collectors.toSet());
    }

    private boolean isPublished(Long evaluationId) {
        return publishedResultRepository.findByEvaluationId(evaluationId).isPresent();
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
        map.put("date", formatDateTime(s.getSubmittedAt()));
        map.put("rating", s.getRating());
        map.put("feedback", s.getFeedback());
        return map;
    }

    private Map<String, Object> toReportReviewDto(Submission s) {
        Map<String, Object> map = toFeedbackDto(s);
        map.put("status", s.getStatus());
        map.put("submissionId", s.getId());
        Map<String, String> payload = decodeSubmissionPayload(s.getFileUrl());
        map.put("studentNote", payload.getOrDefault("note", ""));
        map.put("submitAudience", "MENTOR_AND_COMMITTEE".equals(payload.get("audience"))
                ? "Mentor + Committee" : "Mentor");
        List<Map<String, String>> links = new ArrayList<>();
        if (!payload.getOrDefault("repoLink", "").isBlank()) {
            links.add(Map.of("type", "github", "label", "GitHub", "url", payload.get("repoLink")));
        }
        if (!payload.getOrDefault("docLink", "").isBlank()) {
            links.add(Map.of("type", "drive", "label", "Google Drive", "url", payload.get("docLink")));
        }
        map.put("links", links);
        return map;
    }

    private Map<String, Object> toEvaluationItem(DefenseSchedule schedule, Long committeeId) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("defenseId", schedule.getId());
        item.put("groupCode", schedule.getStudentGroup().getGroupCode());
        item.put("groupName", schedule.getStudentGroup().getGroupName());
        item.put("project", findProjectName(schedule.getStudentGroup().getGroupCode()));
        item.put("defenseDate", schedule.getDefenseDate().toLocalDate().toString());
        item.put("timeSlot", schedule.getTimeSlot());
        item.put("location", schedule.getLocation());
        item.put("scheduleStatus", schedule.getStatus());

        evaluationRepository.findByDefenseIdAndEvaluatorId(schedule.getId(), committeeId)
                .ifPresentOrElse(
                        ev -> item.put("evaluation", toEvaluationDto(ev, schedule, isPublished(ev.getId()))),
                        () -> item.put("evaluation", null)
                );
        return item;
    }

    private Map<String, Object> toEvaluationDto(Evaluation evaluation, DefenseSchedule schedule, boolean published) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", evaluation.getId());
        map.put("defenseId", schedule.getId());
        map.put("groupCode", schedule.getStudentGroup().getGroupCode());
        map.put("groupName", schedule.getStudentGroup().getGroupName());
        map.put("project", findProjectName(schedule.getStudentGroup().getGroupCode()));
        map.put("technicalScore", evaluation.getTechnicalScore());
        map.put("presentationScore", evaluation.getPresentationScore());
        map.put("innovationScore", evaluation.getInnovationScore());
        map.put("overallScore", evaluation.getOverallScore());
        map.put("feedback", evaluation.getFeedback());
        map.put("recommendation", evaluation.getRecommendation());
        map.put("published", published);
        map.put("submittedAt", evaluation.getUpdatedAt() != null
                ? evaluation.getUpdatedAt().format(DATETIME_FMT) : "");
        return map;
    }

    private String findProjectName(String groupCode) {
        return projectRepository.findByGroupId(groupCode).stream()
                .findFirst()
                .map(Project::getName)
                .orElse("—");
    }

    private String formatDayLabel(LocalDateTime dateTime) {
        try {
            return dateTime.format(DAY_FMT);
        } catch (Exception e) {
            return dateTime.toLocalDate().format(DATE_FMT);
        }
    }

    private String formatDateTime(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(DATETIME_FMT) : "";
    }

    private double parseScore(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Thiếu " + label + ".");
        }
        double score = Double.parseDouble(value);
        if (score < 0 || score > 10) {
            throw new IllegalArgumentException(label + " phải từ 0 đến 10.");
        }
        return score;
    }

    private String require(Map<String, String> body, String key) {
        String value = body.get(key);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Thiếu trường: " + key);
        }
        return value.trim();
    }
}
