package com.swp391.pimsbackend.service;

import com.swp391.pimsbackend.model.Evaluation;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class CourseGradeCalculator {

    public static final Map<Integer, Integer> PHASE_WEIGHTS = Map.of(1, 15, 2, 20, 3, 25, 4, 40);
    public static final double PASS_MIN_TOTAL = 5.0;
    public static final double COMMITTEE_FAIL_BELOW = 4.0;

    public Map<String, Object> compute(List<Map<String, Object>> submissionPhases,
                                       Evaluation committeeEval,
                                       boolean committeePublished) {
        List<Map<String, Object>> components = new ArrayList<>();
        double weightedSum = 0;
        int gradedWeight = 0;
        int gradedPhases = 0;

        for (Map<String, Object> phase : submissionPhases) {
            int phaseId = (Integer) phase.get("id");
            int weight = PHASE_WEIGHTS.getOrDefault(phaseId, 0);
            Map<String, Object> component = buildComponent(phase, phaseId, weight, committeeEval, committeePublished);
            components.add(component);

            if ("GRADED".equals(component.get("status"))) {
                Double score = (Double) component.get("score");
                if (score != null) {
                    weightedSum += score * weight / 100.0;
                    gradedWeight += weight;
                    gradedPhases++;
                }
            }
        }

        boolean mentorComplete = components.stream()
                .filter(c -> (Integer) c.get("phaseId") <= 3)
                .allMatch(c -> "GRADED".equals(c.get("status")));
        boolean committeeGraded = components.stream()
                .filter(c -> (Integer) c.get("phaseId") == 4)
                .anyMatch(c -> "GRADED".equals(c.get("status")));
        boolean allGraded = mentorComplete && committeeGraded;

        Double finalScore = allGraded ? round(weightedSum) : null;
        Double mentorSubtotal = computeMentorSubtotal(components);
        Map<String, Object> passFail = evaluatePassFail(components, finalScore, allGraded);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("components", components);
        result.put("gradedPhases", gradedPhases);
        result.put("totalPhases", 4);
        result.put("mentorComplete", mentorComplete);
        result.put("committeeGraded", committeeGraded);
        result.put("allGraded", allGraded);
        result.put("mentorSubtotal", mentorSubtotal);
        result.put("ongoingScore", gradedWeight > 0 ? round(weightedSum * 100.0 / gradedWeight) : null);
        result.put("weightedScore", gradedWeight > 0 ? round(weightedSum) : null);
        result.put("finalScore", finalScore);
        result.put("letterGrade", finalScore != null && "PASS".equals(passFail.get("result")) ? toLetterGrade(finalScore) : null);
        result.put("published", committeePublished);
        result.putAll(passFail);
        return result;
    }

    private Double computeMentorSubtotal(List<Map<String, Object>> components) {
        double sum = 0;
        int weight = 0;
        for (Map<String, Object> c : components) {
            int phaseId = (Integer) c.get("phaseId");
            if (phaseId > 3 || !"GRADED".equals(c.get("status"))) continue;
            Double score = (Double) c.get("score");
            int w = PHASE_WEIGHTS.getOrDefault(phaseId, 0);
            if (score != null) {
                sum += score * w / 100.0;
                weight += w;
            }
        }
        return weight == 60 ? round(sum) : null;
    }

    public Map<String, Object> evaluatePassFail(List<Map<String, Object>> components,
                                                Double finalScore,
                                                boolean allGraded) {
        List<String> failReasons = new ArrayList<>();

        for (Map<String, Object> component : components) {
            if (!"GRADED".equals(component.get("status"))) continue;
            Double score = (Double) component.get("score");
            int phaseId = (Integer) component.get("phaseId");
            if (score != null && score <= 0.0) {
                failReasons.add("Giai đoạn " + phaseId + " có điểm 0 — Fail ngay");
            }
        }

        components.stream()
                .filter(c -> (Integer) c.get("phaseId") == 4 && "GRADED".equals(c.get("status")))
                .map(c -> (Double) c.get("score"))
                .filter(Objects::nonNull)
                .findFirst()
                .ifPresent(committeeScore -> {
                    if (committeeScore < COMMITTEE_FAIL_BELOW) {
                        failReasons.add(String.format(
                                "Điểm hội đồng (%.1f) dưới %.1f — Fail ngay",
                                committeeScore, COMMITTEE_FAIL_BELOW));
                    }
                });

        if (!failReasons.isEmpty()) {
            return passFailMap("FAIL", failReasons, true);
        }

        if (!allGraded || finalScore == null) {
            return passFailMap("INCOMPLETE", List.of("Chưa đủ điểm mentor (3 lần) và hội đồng để tổng hợp"), false);
        }

        if (finalScore < PASS_MIN_TOTAL) {
            failReasons.add(String.format(
                    "Tổng điểm (%.1f) dưới ngưỡng đạt (≥ %.1f)",
                    finalScore, PASS_MIN_TOTAL));
            return passFailMap("FAIL", failReasons, true);
        }

        return passFailMap("PASS", List.of("Đạt yêu cầu môn học"), true);
    }

    private Map<String, Object> passFailMap(String result, List<String> reasons, boolean decided) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("result", result);
        map.put("resultLabel", switch (result) {
            case "PASS" -> "Đạt";
            case "FAIL" -> "Fail";
            default -> "Chưa đủ điểm";
        });
        map.put("failReasons", reasons);
        map.put("decided", decided);
        return map;
    }

    private Map<String, Object> buildComponent(Map<String, Object> phase, int phaseId, int weight,
                                               Evaluation committeeEval, boolean committeePublished) {
        Map<String, Object> component = new LinkedHashMap<>();
        component.put("phaseId", phaseId);
        component.put("title", phase.get("shortTitle"));
        component.put("fullTitle", phase.get("title"));
        component.put("week", phase.get("week"));
        component.put("weight", phase.get("weight"));
        component.put("weightValue", weight);
        component.put("assessmentType", phase.get("assessmentType"));
        component.put("evaluator", phaseId == 4 ? "Hội đồng" : "Mentor");

        @SuppressWarnings("unchecked")
        Map<String, Object> latest = (Map<String, Object>) phase.get("latestSubmission");

        if (phaseId == 4 && committeePublished && committeeEval != null && committeeEval.getOverallScore() != null) {
            fillGraded(component, committeeEval.getOverallScore(), committeeEval.getRecommendation(),
                    committeeEval.getFeedback(), weight);
            component.put("technicalScore", committeeEval.getTechnicalScore());
            component.put("presentationScore", committeeEval.getPresentationScore());
            component.put("innovationScore", committeeEval.getInnovationScore());
            return component;
        }

        if (latest != null && ("Approved".equals(latest.get("status")) || "Rejected".equals(latest.get("status")))) {
            Double score = resolveMentorSubmissionScore(latest);
            if (score != null) {
                fillGraded(component, score, (String) latest.get("rating"), (String) latest.get("feedback"), weight);
                if (latest.get("reviewer") != null) {
                    component.put("evaluator", latest.get("reviewer"));
                }
                if (phaseId == 4) {
                    component.put("evaluator", "Mentor (chờ hội đồng)");
                }
                return component;
            }
        }

        if (latest != null && "Reviewing".equals(latest.get("status"))) {
            component.put("status", "REVIEWING");
            component.put("score", null);
            component.put("rating", null);
            component.put("feedback", null);
            component.put("weightedContribution", null);
            return component;
        }

        component.put("status", "Locked".equals(phase.get("status")) ? "LOCKED" : "PENDING");
        component.put("score", null);
        component.put("rating", null);
        component.put("feedback", null);
        component.put("weightedContribution", null);
        return component;
    }

    private void fillGraded(Map<String, Object> component, Double score, String rating, String feedback, int weight) {
        component.put("status", "GRADED");
        component.put("score", score);
        component.put("rating", rating);
        component.put("feedback", feedback);
        component.put("weightedContribution", score != null ? round(score * weight / 100.0) : null);
    }

    private Double resolveMentorSubmissionScore(Map<String, Object> latest) {
        if (latest.get("score") instanceof Number number) {
            return round(number.doubleValue());
        }
        return ratingToScore((String) latest.get("rating"));
    }

    public Double ratingToScore(String rating) {
        if (rating == null) return null;
        return switch (rating) {
            case "Excellent" -> 9.5;
            case "Good" -> 8.5;
            case "Needs Improvement" -> 6.5;
            case "At Risk" -> 5.0;
            default -> null;
        };
    }

    public String toLetterGrade(double score) {
        if (score >= 8.5) return "A";
        if (score >= 8.0) return "B+";
        if (score >= 7.0) return "B";
        if (score >= 6.5) return "C+";
        if (score >= 5.5) return "C";
        if (score >= 5.0) return "D";
        return "F";
    }

    public double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
