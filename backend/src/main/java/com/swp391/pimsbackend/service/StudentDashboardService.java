package com.swp391.pimsbackend.service;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class StudentDashboardService {

    private final StudentTeamService studentTeamService;
    private final StudentSubmissionService studentSubmissionService;
    private final StudentGradeService studentGradeService;

    public StudentDashboardService(StudentTeamService studentTeamService,
                                   StudentSubmissionService studentSubmissionService,
                                   StudentGradeService studentGradeService) {
        this.studentTeamService = studentTeamService;
        this.studentSubmissionService = studentSubmissionService;
        this.studentGradeService = studentGradeService;
    }

    public Map<String, Object> getDashboard(Long studentId) {
        Map<String, Object> team = studentTeamService.getMyTeam(studentId);
        Map<String, Object> submissions = studentSubmissionService.getSubmissions(studentId);

        Map<String, Object> dashboard = new LinkedHashMap<>();
        dashboard.put("team", team);
        dashboard.put("submissions", submissions);

        if (!Boolean.TRUE.equals(team.get("hasTeam"))) {
            dashboard.put("hasTeam", false);
            dashboard.put("message", team.get("message"));
            dashboard.put("courseGrades", studentGradeService.getCourseGrades(studentId));
            return dashboard;
        }

        dashboard.put("hasTeam", true);
        dashboard.put("projectTitle", team.get("projectTitle"));
        dashboard.put("groupName", team.get("groupName"));
        dashboard.put("groupCode", team.get("joinCode"));
        dashboard.put("mentor", team.get("mentor"));
        dashboard.put("progress", team.get("progress") != null ? team.get("progress") : 0);
        dashboard.put("memberCount", team.get("memberCount"));
        dashboard.put("maxMembers", team.get("maxMembers"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> phases = (List<Map<String, Object>>) submissions.getOrDefault("phases", List.of());
        long openPhases = phases.stream().filter(p -> "Open".equals(p.get("status"))).count();
        long reviewingPhases = phases.stream().filter(p -> "Reviewing".equals(p.get("status"))).count();

        Map<String, Object> activePhase = phases.stream()
                .filter(p -> "Open".equals(p.get("status")) || "Reviewing".equals(p.get("status")))
                .findFirst()
                .orElse(null);

        dashboard.put("openPhaseCount", openPhases + reviewingPhases);
        dashboard.put("activePhase", activePhase);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> history = (List<Map<String, Object>>) submissions.getOrDefault("history", List.of());
        List<Map<String, Object>> recentFeedback = history.stream()
                .filter(item -> item.get("feedback") != null && !"—".equals(item.get("feedback")))
                .filter(item -> !"Bài làm đang chờ mentor chấm điểm và nhận xét.".equals(item.get("feedback")))
                .limit(3)
                .collect(Collectors.toList());
        dashboard.put("recentFeedback", recentFeedback);

        Optional<Map<String, Object>> latestGraded = history.stream()
                .filter(item -> "Approved".equals(item.get("status")) || "Rejected".equals(item.get("status")))
                .findFirst();
        dashboard.put("latestEvaluation", latestGraded.orElse(null));
        dashboard.put("courseGrades", studentGradeService.getCourseGrades(studentId));

        return dashboard;
    }
}
