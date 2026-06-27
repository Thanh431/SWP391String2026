package com.swp391.pimsbackend.service;

import com.swp391.pimsbackend.model.*;
import com.swp391.pimsbackend.repository.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminFinalGradeService {

    private final StudentGroupRepository studentGroupRepository;
    private final ProjectRepository projectRepository;
    private final StudentGradeService studentGradeService;
    private final TopicGroupRepository topicGroupRepository;
    private final TopicGroupMemberRepository topicGroupMemberRepository;
    private final SemesterRepository semesterRepository;
    private final DefenseScheduleRepository defenseScheduleRepository;
    private final AdminPublishedGradeRepository adminPublishedGradeRepository;
    private final FinalGradeAiAssistService aiAssistService;

    public AdminFinalGradeService(StudentGroupRepository studentGroupRepository,
                                  ProjectRepository projectRepository,
                                  StudentGradeService studentGradeService,
                                  TopicGroupRepository topicGroupRepository,
                                  TopicGroupMemberRepository topicGroupMemberRepository,
                                  SemesterRepository semesterRepository,
                                  DefenseScheduleRepository defenseScheduleRepository,
                                  AdminPublishedGradeRepository adminPublishedGradeRepository,
                                  FinalGradeAiAssistService aiAssistService) {
        this.studentGroupRepository = studentGroupRepository;
        this.projectRepository = projectRepository;
        this.studentGradeService = studentGradeService;
        this.topicGroupRepository = topicGroupRepository;
        this.topicGroupMemberRepository = topicGroupMemberRepository;
        this.semesterRepository = semesterRepository;
        this.defenseScheduleRepository = defenseScheduleRepository;
        this.adminPublishedGradeRepository = adminPublishedGradeRepository;
        this.aiAssistService = aiAssistService;
    }

    public Map<String, Object> getFinalGradeSummary(Long semesterId, String resultFilter, String search,
                                                    String mentorFilter) {
        Semester semester = semesterId != null
                ? semesterRepository.findById(semesterId).orElse(null)
                : null;
        Set<String> semesterGroupCodes = resolveSemesterGroupCodes(semester);

        List<Map<String, Object>> groups = studentGroupRepository.findAll().stream()
                .filter(g -> matchesSemester(g, semester, semesterGroupCodes))
                .map(this::buildGroupRow)
                .sorted(Comparator.comparing((Map<String, Object> m) -> (String) m.get("groupCode")))
                .collect(Collectors.toList());

        if (resultFilter != null && !resultFilter.isBlank() && !"ALL".equalsIgnoreCase(resultFilter)) {
            String rf = resultFilter.toUpperCase(Locale.ROOT);
            groups = groups.stream()
                    .filter(g -> rf.equals(g.get("result")))
                    .collect(Collectors.toList());
        }

        enrichGroupsWithVerification(groups);

        List<Map<String, Object>> students = flattenStudents(groups, search);
        students = filterByMentorStatus(students, mentorFilter);
        enrichStudentsWithVerification(students, groups);

        long pass = groups.stream().filter(g -> "PASS".equals(g.get("result"))).count();
        long fail = groups.stream().filter(g -> "FAIL".equals(g.get("result"))).count();
        long incomplete = groups.stream().filter(g -> "INCOMPLETE".equals(g.get("result"))).count();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("semesters", semesterRepository.findAllByOrderByStartDateDesc().stream()
                .map(this::toSemesterOption)
                .collect(Collectors.toList()));
        summary.put("selectedSemesterId", semesterId);
        summary.put("selectedSemesterName", semester != null ? semester.getName() : "Tất cả kỳ");
        summary.put("resultFilter", resultFilter != null ? resultFilter : "ALL");
        summary.put("mentorFilter", mentorFilter != null ? mentorFilter : "ALL");
        summary.put("search", search);
        summary.put("groups", groups);
        summary.put("students", students);
        summary.put("totalGroups", groups.size());
        summary.put("totalStudents", students.size());
        summary.put("mentorGradedStudents", students.stream()
                .filter(s -> Boolean.TRUE.equals(s.get("mentorComplete"))).count());
        summary.put("mentorPendingStudents", students.stream()
                .filter(s -> !Boolean.TRUE.equals(s.get("mentorComplete"))).count());
        summary.put("passCount", pass);
        summary.put("failCount", fail);
        summary.put("incompleteCount", incomplete);
        summary.put("rules", buildRules());
        summary.put("gradeSheetVerification", buildGradeSheetVerification(groups));
        return summary;
    }

    public Map<String, Object> aiLoadStudents(String query) {
        Map<String, Object> ai = aiAssistService.interpretLoadQuery(query);
        Long semesterId = (Long) ai.get("semesterId");
        String resultFilter = (String) ai.get("resultFilter");
        String search = ai.get("search") != null ? (String) ai.get("search") : null;
        String mentorFilter = ai.get("mentorFilter") != null ? (String) ai.get("mentorFilter") : "ALL";

        Map<String, Object> data = getFinalGradeSummary(semesterId, resultFilter, search, mentorFilter);
        data.put("aiAssist", ai);
        data.put("gradeSheetDraft", true);
        return data;
    }

    public Map<String, Object> publishGrades(Long semesterId, Long adminUserId) {
        if (semesterId == null) {
            throw new IllegalArgumentException("Vui lòng chọn kỳ học trước khi công bố điểm.");
        }
        Map<String, Object> summary = getFinalGradeSummary(semesterId, "ALL", null, "ALL");
        @SuppressWarnings("unchecked")
        Map<String, Object> verification = (Map<String, Object>) summary.get("gradeSheetVerification");
        if (!Boolean.TRUE.equals(verification.get("readyToPublish"))) {
            throw new IllegalArgumentException(
                    "Chưa đủ 100% điểm để công bố. Vui lòng kiểm tra lại bảng điểm nháp.");
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> groups = (List<Map<String, Object>>) summary.get("groups");
        int publishedCount = 0;
        for (Map<String, Object> row : groups) {
            String groupCode = (String) row.get("groupCode");
            AdminPublishedGrade grade = adminPublishedGradeRepository.findByGroupCode(groupCode)
                    .orElse(new AdminPublishedGrade());
            grade.setGroupCode(groupCode);
            grade.setSemesterId(semesterId);
            grade.setMentorPhase1Score((Double) row.get("mentorPhase1Score"));
            grade.setMentorPhase2Score((Double) row.get("mentorPhase2Score"));
            grade.setMentorPhase3Score((Double) row.get("mentorPhase3Score"));
            grade.setCommitteeScore((Double) row.get("committeeScore"));
            grade.setMentorSubtotal((Double) row.get("mentorSubtotal"));
            grade.setFinalScore((Double) row.get("finalScore"));
            grade.setResult((String) row.get("result"));
            grade.setLetterGrade((String) row.get("letterGrade"));
            grade.setPublishedBy(adminUserId);
            adminPublishedGradeRepository.save(grade);
            publishedCount++;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Đã công bố điểm cho " + publishedCount + " nhóm. Sinh viên có thể xem điểm ngay.");
        result.put("publishedCount", publishedCount);
        result.put("semesterId", semesterId);
        result.put("selectedSemesterName", summary.get("selectedSemesterName"));
        return result;
    }

    private Map<String, Object> toSemesterOption(Semester semester) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", semester.getId());
        map.put("code", semester.getCode());
        map.put("name", semester.getName());
        map.put("status", semester.getStatus());
        return map;
    }

    private Set<String> resolveSemesterGroupCodes(Semester semester) {
        if (semester == null) {
            return Set.of();
        }
        return defenseScheduleRepository.findBySemesterOrderByDefenseDateAsc(semester).stream()
                .filter(d -> d.getStudentGroup() != null)
                .map(d -> d.getStudentGroup().getGroupCode())
                .collect(Collectors.toSet());
    }

    private boolean matchesSemester(StudentGroup group, Semester semester, Set<String> defenseGroupCodes) {
        if (semester == null) {
            return true;
        }
        if (defenseGroupCodes.contains(group.getGroupCode())) {
            return true;
        }
        if (group.getMentorClass() != null && group.getMentorClass().getSemester() != null) {
            String mentorSem = group.getMentorClass().getSemester().toLowerCase(Locale.ROOT);
            String semName = semester.getName().toLowerCase(Locale.ROOT);
            String semCode = semester.getCode().toLowerCase(Locale.ROOT);
            return mentorSem.contains(semName) || semName.contains(mentorSem)
                    || mentorSem.contains(semCode) || semCode.contains(mentorSem);
        }
        return false;
    }

    private List<Map<String, Object>> flattenStudents(List<Map<String, Object>> groups, String search) {
        String needle = search != null ? search.trim().toLowerCase(Locale.ROOT) : "";
        List<Map<String, Object>> rows = new ArrayList<>();

        for (Map<String, Object> group : groups) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> members = (List<Map<String, Object>>) group.getOrDefault("students", List.of());
            if (members.isEmpty()) {
                rows.add(copyStudentRow(group, null));
                continue;
            }
            for (Map<String, Object> member : members) {
                if (!needle.isBlank()) {
                    String name = String.valueOf(member.getOrDefault("name", "")).toLowerCase(Locale.ROOT);
                    String email = String.valueOf(member.getOrDefault("email", "")).toLowerCase(Locale.ROOT);
                    if (!name.contains(needle) && !email.contains(needle)) {
                        continue;
                    }
                }
                rows.add(copyStudentRow(group, member));
            }
        }
        return rows;
    }

    private Map<String, Object> copyStudentRow(Map<String, Object> group, Map<String, Object> member) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("studentId", member != null ? member.get("id") : null);
        row.put("studentName", member != null ? member.get("name") : "—");
        row.put("studentEmail", member != null ? member.get("email") : "—");
        row.put("rollNumber", member != null ? member.get("rollNumber") : "—");
        row.put("groupId", group.get("groupId"));
        row.put("groupCode", group.get("groupCode"));
        row.put("groupName", group.get("groupName"));
        row.put("projectTitle", group.get("projectTitle"));
        row.put("semester", group.get("semester"));
        row.put("mentorName", group.get("mentorName"));
        row.put("mentorPhase1Score", group.get("mentorPhase1Score"));
        row.put("mentorPhase2Score", group.get("mentorPhase2Score"));
        row.put("mentorPhase3Score", group.get("mentorPhase3Score"));
        row.put("committeeScore", group.get("committeeScore"));
        row.put("finalScore", group.get("finalScore"));
        row.put("weightedScore", group.get("weightedScore"));
        row.put("letterGrade", group.get("letterGrade"));
        row.put("result", group.get("result"));
        row.put("resultLabel", group.get("resultLabel"));
        row.put("failReasons", group.get("failReasons"));
        row.put("components", group.get("components"));
        row.put("verificationPercent", group.get("verificationPercent"));
        row.put("readyToPublish", group.get("readyToPublish"));
        row.put("missingFields", group.get("missingFields"));
        row.put("sourceChecks", group.get("sourceChecks"));
        row.put("alreadyPublished", group.get("alreadyPublished"));
        attachMentorFields(row, group);
        return row;
    }

    private void enrichGroupsWithVerification(List<Map<String, Object>> groups) {
        for (Map<String, Object> row : groups) {
            enrichRowWithVerification(row);
        }
    }

    private void enrichStudentsWithVerification(List<Map<String, Object>> students, List<Map<String, Object>> groups) {
        Map<String, Map<String, Object>> byGroupCode = groups.stream()
                .collect(Collectors.toMap(g -> (String) g.get("groupCode"), g -> g, (a, b) -> a));
        for (Map<String, Object> student : students) {
            Map<String, Object> group = byGroupCode.get(student.get("groupCode"));
            if (group == null) {
                continue;
            }
            student.put("verificationPercent", group.get("verificationPercent"));
            student.put("readyToPublish", group.get("readyToPublish"));
            student.put("missingFields", group.get("missingFields"));
            student.put("sourceChecks", group.get("sourceChecks"));
            student.put("alreadyPublished", group.get("alreadyPublished"));
        }
    }

    private void enrichRowWithVerification(Map<String, Object> row) {
        boolean mentorM1 = row.get("mentorPhase1Score") != null;
        boolean mentorM2 = row.get("mentorPhase2Score") != null;
        boolean mentorM3 = row.get("mentorPhase3Score") != null;
        boolean committee = row.get("committeeScore") != null;
        boolean finalComputed = row.get("finalScore") != null
                && Boolean.TRUE.equals(row.get("allGraded"));

        List<String> missing = new ArrayList<>();
        if (!mentorM1) missing.add("Mentor M1 (15%)");
        if (!mentorM2) missing.add("Mentor M2 (20%)");
        if (!mentorM3) missing.add("Mentor M3 (25%)");
        if (!committee) missing.add("Hội đồng (40%)");
        if (!finalComputed) missing.add("Tổng điểm cuối kỳ");

        int filled = (mentorM1 ? 1 : 0) + (mentorM2 ? 1 : 0) + (mentorM3 ? 1 : 0)
                + (committee ? 1 : 0) + (finalComputed ? 1 : 0);
        int percent = filled * 100 / 5;
        boolean readyToPublish = mentorM1 && mentorM2 && mentorM3 && committee && finalComputed;
        String groupCode = (String) row.get("groupCode");
        boolean alreadyPublished = groupCode != null
                && adminPublishedGradeRepository.existsByGroupCode(groupCode);

        Map<String, Object> sourceChecks = new LinkedHashMap<>();
        sourceChecks.put("mentorM1", mentorM1);
        sourceChecks.put("mentorM2", mentorM2);
        sourceChecks.put("mentorM3", mentorM3);
        sourceChecks.put("committee", committee);
        sourceChecks.put("finalComputed", finalComputed);

        row.put("verificationPercent", percent);
        row.put("readyToPublish", readyToPublish);
        row.put("missingFields", missing);
        row.put("sourceChecks", sourceChecks);
        row.put("alreadyPublished", alreadyPublished);
    }

    private Map<String, Object> buildGradeSheetVerification(List<Map<String, Object>> groups) {
        long verifiedGroups = groups.stream()
                .filter(g -> Integer.valueOf(100).equals(g.get("verificationPercent")))
                .count();
        long readyGroups = groups.stream()
                .filter(g -> Boolean.TRUE.equals(g.get("readyToPublish")))
                .count();
        long publishedGroups = groups.stream()
                .filter(g -> Boolean.TRUE.equals(g.get("alreadyPublished")))
                .count();
        int overallPercent = groups.isEmpty() ? 0
                : (int) Math.round(groups.stream()
                .mapToInt(g -> (Integer) g.getOrDefault("verificationPercent", 0))
                .average()
                .orElse(0));

        Map<String, Object> sheet = new LinkedHashMap<>();
        sheet.put("totalGroups", groups.size());
        sheet.put("verifiedGroups", verifiedGroups);
        sheet.put("readyGroups", readyGroups);
        sheet.put("publishedGroups", publishedGroups);
        sheet.put("overallVerificationPercent", overallPercent);
        sheet.put("readyToPublish", !groups.isEmpty() && readyGroups == groups.size());
        sheet.put("canPublish", !groups.isEmpty() && readyGroups == groups.size()
                && publishedGroups < groups.size());
        sheet.put("allPublished", !groups.isEmpty() && publishedGroups == groups.size());
        return sheet;
    }

    private void attachMentorFields(Map<String, Object> row, Map<String, Object> group) {
        row.put("mentorGrades", group.get("mentorGrades"));
        row.put("mentorSubtotal", group.get("mentorSubtotal"));
        row.put("mentorComplete", group.get("mentorComplete"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> mentorGrades = (List<Map<String, Object>>) group.get("mentorGrades");
        if (mentorGrades != null) {
            for (Map<String, Object> phase : mentorGrades) {
                int phaseId = (Integer) phase.get("phaseId");
                row.put("mentorPhase" + phaseId + "Rating", phase.get("rating"));
                row.put("mentorPhase" + phaseId + "Contribution", phase.get("weightedContribution"));
                row.put("mentorPhase" + phaseId + "Status", phase.get("status"));
            }
        }
    }

    private List<Map<String, Object>> filterByMentorStatus(List<Map<String, Object>> students, String mentorFilter) {
        if (mentorFilter == null || "ALL".equalsIgnoreCase(mentorFilter)) {
            return students;
        }
        if ("COMPLETE".equalsIgnoreCase(mentorFilter)) {
            return students.stream()
                    .filter(s -> Boolean.TRUE.equals(s.get("mentorComplete")))
                    .collect(Collectors.toList());
        }
        if ("INCOMPLETE".equalsIgnoreCase(mentorFilter)) {
            return students.stream()
                    .filter(s -> !Boolean.TRUE.equals(s.get("mentorComplete")))
                    .collect(Collectors.toList());
        }
        return students;
    }

    private Map<String, Object> buildGroupRow(StudentGroup group) {
        Map<String, Object> grades = studentGradeService.buildGradesForGroupForAdmin(group);
        Project project = projectRepository.findByGroupId(group.getGroupCode()).stream().findFirst().orElse(null);
        String semesterLabel = resolveSemesterLabel(group);

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("groupId", group.getId());
        row.put("groupCode", group.getGroupCode());
        row.put("groupName", group.getGroupName());
        row.put("projectTitle", project != null ? project.getName() : "—");
        row.put("semester", semesterLabel);
        row.put("mentorName", group.getMentor() != null
                ? (group.getMentor().getFullName() != null ? group.getMentor().getFullName() : group.getMentor().getUsername())
                : "—");
        row.put("students", resolveStudents(group));
        row.put("mentorPhase1Score", scoreForPhase(grades, 1));
        row.put("mentorPhase2Score", scoreForPhase(grades, 2));
        row.put("mentorPhase3Score", scoreForPhase(grades, 3));
        row.put("committeeScore", scoreForPhase(grades, 4));
        row.put("mentorSubtotal", grades.get("mentorSubtotal"));
        row.put("finalScore", grades.get("finalScore"));
        row.put("weightedScore", grades.get("weightedScore"));
        row.put("letterGrade", grades.get("letterGrade"));
        row.put("result", grades.get("result"));
        row.put("resultLabel", grades.get("resultLabel"));
        row.put("failReasons", grades.get("failReasons"));
        row.put("allGraded", grades.get("allGraded"));
        row.put("mentorComplete", grades.get("mentorComplete"));
        row.put("committeeGraded", grades.get("committeeGraded"));
        row.put("components", grades.get("components"));
        row.put("committeePublished", grades.get("published"));
        row.put("mentorGrades", extractMentorGrades(grades));
        attachMentorFields(row, row);
        return row;
    }

    private List<Map<String, Object>> extractMentorGrades(Map<String, Object> grades) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> components = (List<Map<String, Object>>) grades.get("components");
        if (components == null) {
            return List.of();
        }
        return components.stream()
                .filter(c -> (Integer) c.get("phaseId") <= 3)
                .map(c -> {
                    Map<String, Object> phase = new LinkedHashMap<>();
                    phase.put("phaseId", c.get("phaseId"));
                    phase.put("title", c.get("title"));
                    phase.put("weight", c.get("weight"));
                    phase.put("score", c.get("score"));
                    phase.put("rating", c.get("rating"));
                    phase.put("status", c.get("status"));
                    phase.put("weightedContribution", c.get("weightedContribution"));
                    phase.put("feedback", c.get("feedback"));
                    return phase;
                })
                .collect(Collectors.toList());
    }

    private String resolveSemesterLabel(StudentGroup group) {
        return defenseScheduleRepository.findAllByOrderByDefenseDateAsc().stream()
                .filter(d -> d.getStudentGroup() != null
                        && group.getGroupCode().equals(d.getStudentGroup().getGroupCode())
                        && d.getSemester() != null)
                .map(d -> d.getSemester().getName())
                .findFirst()
                .orElse(group.getMentorClass() != null ? group.getMentorClass().getSemester() : "—");
    }

    private Double scoreForPhase(Map<String, Object> grades, int phaseId) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> components = (List<Map<String, Object>>) grades.get("components");
        if (components == null) return null;
        return components.stream()
                .filter(c -> phaseId == (Integer) c.get("phaseId"))
                .map(c -> c.get("score"))
                .filter(Objects::nonNull)
                .map(score -> ((Number) score).doubleValue())
                .findFirst()
                .orElse(null);
    }

    private List<Map<String, Object>> resolveStudents(StudentGroup group) {
        Optional<TopicGroup> topicOpt = topicGroupRepository.findByStudentGroup(group);
        if (topicOpt.isPresent()) {
            return topicGroupMemberRepository.findByTopicGroupOrderByJoinedAtAsc(topicOpt.get()).stream()
                    .map(m -> {
                        User s = m.getStudent();
                        Map<String, Object> map = new LinkedHashMap<>();
                        map.put("id", s.getId());
                        map.put("name", s.getFullName() != null ? s.getFullName() : s.getUsername());
                        map.put("email", s.getUsername());
                        map.put("rollNumber", extractRollNumber(s));
                        return map;
                    })
                    .collect(Collectors.toList());
        }
        if (group.getMemberNames() != null && !group.getMemberNames().isBlank()) {
            return Arrays.stream(group.getMemberNames().split(","))
                    .map(String::trim)
                    .filter(n -> !n.isBlank())
                    .map(name -> {
                        Map<String, Object> map = new LinkedHashMap<>();
                        map.put("id", null);
                        map.put("name", name);
                        map.put("email", "—");
                        map.put("rollNumber", "—");
                        return map;
                    })
                    .collect(Collectors.toList());
        }
        return List.of();
    }

    private String extractRollNumber(User user) {
        if (user.getClassName() != null && !user.getClassName().isBlank()) {
            return user.getClassName();
        }
        String email = user.getUsername();
        if (email == null) return "—";
        String local = email.split("@")[0];
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("([A-Za-z]{2}\\d{4,6})").matcher(local);
        if (matcher.find()) {
            return matcher.group(1).toUpperCase(Locale.ROOT);
        }
        return local.toUpperCase(Locale.ROOT);
    }

    private List<Map<String, String>> buildRules() {
        return List.of(
                Map.of("key", "mentor", "label", "Mentor chấm 3 lần", "detail", "15% + 20% + 25% = 60%"),
                Map.of("key", "committee", "label", "Hội đồng chấm bảo vệ", "detail", "40%"),
                Map.of("key", "zero", "label", "Điểm 0", "detail", "Bất kỳ giai đoạn nào có điểm 0 → Fail ngay"),
                Map.of("key", "committeeMin", "label", "Điểm hội đồng", "detail", "Dưới 4.0 → Fail ngay"),
                Map.of("key", "total", "label", "Tổng điểm", "detail", "≥ 5.0 mới đạt (sau khi không vi phạm quy tắc trên)")
        );
    }
}
