package com.swp391.pimsbackend.service;

import com.swp391.pimsbackend.committee.repository.CommitteePublishedResultRepository;
import com.swp391.pimsbackend.model.AdminPublishedGrade;
import com.swp391.pimsbackend.model.DefenseSchedule;
import com.swp391.pimsbackend.model.Evaluation;
import com.swp391.pimsbackend.model.Project;
import com.swp391.pimsbackend.model.StudentGroup;
import com.swp391.pimsbackend.repository.AdminPublishedGradeRepository;
import com.swp391.pimsbackend.repository.DefenseScheduleRepository;
import com.swp391.pimsbackend.repository.EvaluationRepository;
import com.swp391.pimsbackend.repository.ProjectRepository;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class StudentGradeService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter PUBLISH_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final StudentTeamService studentTeamService;
    private final StudentSubmissionService studentSubmissionService;
    private final DefenseScheduleRepository defenseScheduleRepository;
    private final EvaluationRepository evaluationRepository;
    private final CommitteePublishedResultRepository publishedResultRepository;
    private final AdminPublishedGradeRepository adminPublishedGradeRepository;
    private final ProjectRepository projectRepository;
    private final CourseGradeCalculator gradeCalculator;

    public StudentGradeService(StudentTeamService studentTeamService,
                               StudentSubmissionService studentSubmissionService,
                               DefenseScheduleRepository defenseScheduleRepository,
                               EvaluationRepository evaluationRepository,
                               CommitteePublishedResultRepository publishedResultRepository,
                               AdminPublishedGradeRepository adminPublishedGradeRepository,
                               ProjectRepository projectRepository,
                               CourseGradeCalculator gradeCalculator) {
        this.studentTeamService = studentTeamService;
        this.studentSubmissionService = studentSubmissionService;
        this.defenseScheduleRepository = defenseScheduleRepository;
        this.evaluationRepository = evaluationRepository;
        this.publishedResultRepository = publishedResultRepository;
        this.adminPublishedGradeRepository = adminPublishedGradeRepository;
        this.projectRepository = projectRepository;
        this.gradeCalculator = gradeCalculator;
    }

    public Map<String, Object> getCourseGrades(Long studentId) {
        Optional<StudentGroup> groupOpt = studentTeamService.resolveStudentGroup(studentId);
        if (groupOpt.isEmpty()) {
            Map<String, Object> empty = new LinkedHashMap<>();
            empty.put("hasTeam", false);
            empty.put("message", "Bạn chưa tham gia nhóm nào. Chưa có điểm môn học để hiển thị.");
            return empty;
        }
        return buildGradesForGroup(groupOpt.get());
    }

    public Map<String, Object> buildGradesForGroup(StudentGroup group) {
        return buildGradesForGroupInternal(group, false);
    }

    public Map<String, Object> buildGradesForGroupForAdmin(StudentGroup group) {
        return buildGradesForGroupInternal(group, true);
    }

    private Map<String, Object> buildGradesForGroupInternal(StudentGroup group, boolean adminMode) {
        Project project = projectRepository.findByGroupId(group.getGroupCode()).stream().findFirst().orElse(null);
        String projectTitle = project != null ? project.getName() : group.getGroupName();
        List<Map<String, Object>> phases = studentSubmissionService.buildPhasesForGroup(group.getGroupCode(), project);

        Optional<DefenseSchedule> defenseOpt = findDefenseForGroup(group.getGroupCode());
        Evaluation committeeEval = null;
        boolean committeePublished = false;
        if (defenseOpt.isPresent()) {
            DefenseSchedule defense = defenseOpt.get();
            committeeEval = resolveCommitteeEvaluation(defense, group.getGroupCode());
            if (committeeEval != null) {
                committeePublished = publishedResultRepository
                        .findByEvaluationId(committeeEval.getId())
                        .isPresent();
            }
        }

        if (adminMode && committeeEval != null && committeeEval.getOverallScore() != null) {
            committeePublished = true;
        }

        Map<String, Object> computed = gradeCalculator.compute(phases, committeeEval, committeePublished);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("hasTeam", true);
        result.put("groupCode", group.getGroupCode());
        result.put("groupName", group.getGroupName());
        result.put("projectTitle", projectTitle);
        result.putAll(computed);

        if (defenseOpt.isPresent()) {
            DefenseSchedule defense = defenseOpt.get();
            if (defense.getSemester() != null) {
                result.put("courseName", defense.getSemester().getName());
                result.put("courseCode", defense.getSemester().getCode());
                result.put("semesterId", defense.getSemester().getId());
            }
            boolean showCommitteeDetail = adminMode || committeePublished;
            result.put("defenseEvaluation", buildDefenseEvaluation(defense, committeeEval, showCommitteeDetail));
        } else {
            result.put("courseName", "Capstone Project");
            result.put("courseCode", "—");
            result.put("defenseEvaluation", null);
        }

        if (!adminMode) {
            applyStudentPublishGate(result, group.getGroupCode());
        } else {
            result.put("adminPublished", adminPublishedGradeRepository.existsByGroupCode(group.getGroupCode()));
        }

        result.put("status", result.get("result"));
        result.put("statusLabel", result.get("resultLabel"));
        return result;
    }

    private void applyStudentPublishGate(Map<String, Object> result, String groupCode) {
        Optional<AdminPublishedGrade> publishedOpt = adminPublishedGradeRepository.findByGroupCode(groupCode);
        if (publishedOpt.isPresent()) {
            AdminPublishedGrade published = publishedOpt.get();
            result.put("adminPublished", true);
            result.put("publishedAt", published.getPublishedAt().format(PUBLISH_FMT));
            result.put("finalScore", published.getFinalScore());
            result.put("letterGrade", published.getLetterGrade());
            result.put("result", published.getResult());
            result.put("resultLabel", labelResult(published.getResult()));
            result.put("status", published.getResult());
            result.put("statusLabel", labelResult(published.getResult()));
            return;
        }

        result.put("adminPublished", false);
        result.put("publishedAt", null);
        result.put("finalScore", null);
        result.put("letterGrade", null);
        result.put("status", "PENDING_PUBLISH");
        result.put("statusLabel", "Chờ admin công bố điểm");
        result.put("resultLabel", "Chờ admin công bố điểm");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> components = (List<Map<String, Object>>) result.get("components");
        if (components != null) {
            for (Map<String, Object> component : components) {
                if ((Integer) component.get("phaseId") == 4) {
                    component.put("score", null);
                    component.put("rating", null);
                    component.put("weightedContribution", null);
                    component.put("status", "PENDING_PUBLISH");
                    component.put("evaluator", "Hội đồng (chờ công bố)");
                }
            }
        }
        if (result.get("defenseEvaluation") instanceof Map<?, ?> defense) {
            @SuppressWarnings("unchecked")
            Map<String, Object> defenseMap = (Map<String, Object>) defense;
            defenseMap.put("published", false);
            defenseMap.put("overallScore", null);
            defenseMap.put("technicalScore", null);
            defenseMap.put("presentationScore", null);
            defenseMap.put("innovationScore", null);
        }
    }

    private String labelResult(String result) {
        return switch (result) {
            case "PASS" -> "Đạt";
            case "FAIL" -> "Fail";
            default -> "Chờ admin công bố điểm";
        };
    }

    private Optional<DefenseSchedule> findDefenseForGroup(String groupCode) {
        return defenseScheduleRepository.findAllByOrderByDefenseDateAsc().stream()
                .filter(d -> d.getStudentGroup() != null && groupCode.equals(d.getStudentGroup().getGroupCode()))
                .findFirst();
    }

    private Evaluation resolveCommitteeEvaluation(DefenseSchedule defense, String groupCode) {
        Evaluation eval = evaluationRepository.findByDefenseIdAndEvaluatorId(
                defense.getId(),
                defense.getCommittee() != null ? defense.getCommittee().getId() : -1L
        ).orElse(null);
        if (eval != null) return eval;
        return evaluationRepository.findAllByOrderByUpdatedAtDesc().stream()
                .filter(ev -> ev.getStudentGroup() != null && groupCode.equals(ev.getStudentGroup().getGroupCode()))
                .findFirst()
                .orElse(null);
    }

    private Map<String, Object> buildDefenseEvaluation(DefenseSchedule defense, Evaluation eval, boolean showScores) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("defenseDate", defense.getDefenseDate() != null
                ? defense.getDefenseDate().format(DATE_FMT) : "—");
        map.put("timeSlot", defense.getTimeSlot());
        map.put("location", defense.getLocation());
        map.put("published", showScores);
        if (eval != null && showScores) {
            map.put("technicalScore", eval.getTechnicalScore());
            map.put("presentationScore", eval.getPresentationScore());
            map.put("innovationScore", eval.getInnovationScore());
            map.put("overallScore", eval.getOverallScore());
            map.put("recommendation", eval.getRecommendation());
            map.put("feedback", eval.getFeedback());
        } else {
            map.put("technicalScore", null);
            map.put("presentationScore", null);
            map.put("innovationScore", null);
            map.put("overallScore", null);
            map.put("recommendation", null);
            map.put("feedback", null);
        }
        return map;
    }
}
