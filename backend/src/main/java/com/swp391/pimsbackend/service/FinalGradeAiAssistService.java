package com.swp391.pimsbackend.service;

import com.swp391.pimsbackend.model.Semester;
import com.swp391.pimsbackend.repository.SemesterRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class FinalGradeAiAssistService {

    private final SemesterRepository semesterRepository;

    public FinalGradeAiAssistService(SemesterRepository semesterRepository) {
        this.semesterRepository = semesterRepository;
    }

    public Map<String, Object> interpretLoadQuery(String query) {
        String raw = query != null ? query.trim() : "";
        String q = raw.toLowerCase(Locale.ROOT);
        List<Semester> semesters = semesterRepository.findAllByOrderByStartDateDesc();

        Long semesterId = resolveSemesterId(q, semesters);
        String resultFilter = resolveResultFilter(q);
        String search = resolveStudentSearch(q);
        boolean includeMentorScores = resolveIncludeMentorScores(q);
        String mentorFilter = resolveMentorFilter(q);

        Semester matched = semesterId != null
                ? semesters.stream().filter(s -> s.getId().equals(semesterId)).findFirst().orElse(null)
                : null;

        String interpretation = buildInterpretation(raw, matched, resultFilter, search, includeMentorScores);
        List<String> appliedFilters = buildAppliedFilters(matched, resultFilter, search, includeMentorScores, mentorFilter);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("query", raw);
        result.put("semesterId", semesterId);
        result.put("semesterName", matched != null ? matched.getName() : null);
        result.put("semesterCode", matched != null ? matched.getCode() : null);
        result.put("resultFilter", resultFilter);
        result.put("search", search.isBlank() ? null : search);
        result.put("includeMentorScores", includeMentorScores);
        result.put("mentorFilter", mentorFilter);
        result.put("interpretation", interpretation);
        result.put("appliedFilters", appliedFilters);
        result.put("confidence", matched != null ? "high" : (semesterId == null && mentionsSemester(q) ? "low" : "medium"));
        result.put("suggestions", buildSuggestions(q, semesters, matched, includeMentorScores));
        return result;
    }

    private boolean resolveIncludeMentorScores(String q) {
        return q.contains("mentor") || q.contains("giảng viên") || q.contains("giang vien")
                || q.contains("chấm điểm") || q.contains("cham diem") || q.contains("milestone")
                || q.contains("m1") || q.contains("m2") || q.contains("m3")
                || q.contains("điểm mentor") || q.contains("diem mentor")
                || q.contains("on-going") || q.contains("ongoing");
    }

    private String resolveMentorFilter(String q) {
        if (q.contains("mentor chưa") || q.contains("chưa chấm mentor") || q.contains("chua cham mentor")
                || q.contains("thiếu điểm mentor") || q.contains("chưa đủ mentor")) {
            return "INCOMPLETE";
        }
        if (q.contains("mentor đã chấm") || q.contains("đã chấm đủ") || q.contains("mentor complete")) {
            return "COMPLETE";
        }
        return "ALL";
    }

    private Long resolveSemesterId(String q, List<Semester> semesters) {
        for (Semester semester : semesters) {
            if (containsToken(q, semester.getCode().toLowerCase(Locale.ROOT))
                    || containsToken(q, semester.getName().toLowerCase(Locale.ROOT))) {
                return semester.getId();
            }
        }
        if (q.contains("fall 2024") || q.contains("fa24") || q.contains("capstone fall")) {
            return findSemesterByHint(semesters, "fall", "2024", "capstone");
        }
        if (q.contains("spring 2025") || q.contains("sp25")) {
            return findSemesterByHint(semesters, "spring", "2025");
        }
        if (q.contains("spring 2026") || q.contains("sp26") || q.contains("string 2026")
                || q.contains("string2026") || q.contains("string 2026")) {
            Long sp26 = findSemesterByHint(semesters, "spring", "2026");
            if (sp26 != null) {
                return sp26;
            }
            return findSemesterByHint(semesters, "string", "2026");
        }
        Long fromPattern = resolveSemesterFromSeasonYear(q, semesters);
        if (fromPattern != null) {
            return fromPattern;
        }
        if (q.contains("kỳ này") || q.contains("ky nay") || q.contains("hiện tại") || q.contains("active")) {
            return semesters.stream()
                    .filter(s -> "Active".equalsIgnoreCase(s.getStatus()))
                    .map(Semester::getId)
                    .findFirst()
                    .orElse(semesters.isEmpty() ? null : semesters.get(0).getId());
        }
        return null;
    }

    private Long resolveSemesterFromSeasonYear(String q, List<Semester> semesters) {
        Matcher matcher = Pattern.compile(
                "(spring|fall|summer|string|sp|fa|su)\\s*(\\d{4})",
                Pattern.CASE_INSENSITIVE
        ).matcher(q);
        if (!matcher.find()) {
            return null;
        }
        String season = normalizeSeasonToken(matcher.group(1).toLowerCase(Locale.ROOT));
        String year = matcher.group(2);
        return findSemesterByHint(semesters, season, year);
    }

    private String normalizeSeasonToken(String token) {
        return switch (token) {
            case "sp", "string", "spring" -> "spring";
            case "fa", "fall" -> "fall";
            case "su", "summer" -> "summer";
            default -> token;
        };
    }

    private Long findSemesterByHint(List<Semester> semesters, String... hints) {
        return semesters.stream()
                .filter(s -> {
                    String combined = (s.getCode() + " " + s.getName()).toLowerCase(Locale.ROOT);
                    for (String hint : hints) {
                        if (!combined.contains(hint)) return false;
                    }
                    return true;
                })
                .map(Semester::getId)
                .findFirst()
                .orElse(null);
    }

    private String resolveResultFilter(String q) {
        if (q.contains("fail") || q.contains("trượt") || q.contains("trượt") || q.contains("rớt")
                || q.contains("rot") || q.contains("không đạt") || q.contains("khong dat")) {
            return "FAIL";
        }
        if (q.contains("chưa đủ") || q.contains("chua du") || q.contains("thiếu điểm")
                || q.contains("incomplete") || q.contains("chưa chấm") || q.contains("pending")) {
            return "INCOMPLETE";
        }
        if (q.contains("đạt") || q.contains("dat") || q.contains("pass") || q.contains("passed")) {
            return "PASS";
        }
        return "ALL";
    }

    private String resolveStudentSearch(String q) {
        if (q.contains("toàn bộ sinh viên") || q.contains("toan bo sinh vien")
                || q.contains("load sinh viên") || q.contains("load sinh vien")
                || q.contains("danh sách sinh viên") || q.contains("danh sach sinh vien")) {
            return "";
        }
        if (q.contains("tên") || q.contains("ten ") || q.contains("sinh viên tên") || q.contains("student")) {
            String[] parts = q.split("(tên|ten |sinh viên|student)\\s*");
            if (parts.length > 1) {
                String candidate = parts[parts.length - 1].trim();
                candidate = candidate.replaceAll("(kỳ|ky|học kỳ|hoc ky|fall|spring|capstone|đạt|fail|pass).*", "").trim();
                if (!candidate.isBlank() && candidate.length() >= 2) {
                    return candidate;
                }
            }
        }
        return "";
    }

    private boolean mentionsSemester(String q) {
        return q.contains("kỳ") || q.contains("ky") || q.contains("semester") || q.contains("fall")
                || q.contains("spring") || q.contains("string") || q.contains("fa24") || q.contains("sp25")
                || q.contains("sp26") || q.contains("2026");
    }

    private boolean containsToken(String q, String token) {
        if (token == null || token.isBlank()) return false;
        return q.contains(token);
    }

    private String buildInterpretation(String raw, Semester semester, String resultFilter, String search,
                                       boolean includeMentorScores) {
        StringBuilder sb = new StringBuilder("AI đã phân tích yêu cầu");
        if (!raw.isBlank()) {
            sb.append(" \"").append(raw).append("\"");
        }
        sb.append(" và sẽ load danh sách sinh viên");
        if (semester != null) {
            sb.append(" thuộc kỳ ").append(semester.getName()).append(" (").append(semester.getCode()).append(")");
        } else {
            sb.append(" của tất cả kỳ học");
        }
        if (includeMentorScores) {
            sb.append(" kèm điểm mentor chấm 3 lần (15% + 20% + 25%)");
        }
        if (!"ALL".equals(resultFilter)) {
            sb.append(", lọc kết quả: ").append(labelResult(resultFilter));
        }
        if (!search.isBlank()) {
            sb.append(", tìm theo tên: \"").append(search).append("\"");
        }
        sb.append(". AI đã tự động điền điểm Mentor (M1/M2/M3) và Hội đồng từ dữ liệu chấm trong hệ thống.");
        sb.append(" Admin kiểm tra bảng điểm nháp — khi đạt 100% có thể công bố cho sinh viên xem.");
        return sb.toString();
    }

    private List<String> buildAppliedFilters(Semester semester, String resultFilter, String search,
                                             boolean includeMentorScores, String mentorFilter) {
        List<String> filters = new ArrayList<>();
        if (semester != null) {
            filters.add("Kỳ học: " + semester.getName());
        }
        if (includeMentorScores) {
            filters.add("Hiển thị: Điểm mentor (M1/M2/M3)");
        }
        if ("INCOMPLETE".equals(mentorFilter)) {
            filters.add("Mentor: Chưa chấm đủ 3 lần");
        } else if ("COMPLETE".equals(mentorFilter)) {
            filters.add("Mentor: Đã chấm đủ 3 lần");
        }
        if (!"ALL".equals(resultFilter)) {
            filters.add("Kết quả: " + labelResult(resultFilter));
        }
        if (!search.isBlank()) {
            filters.add("Tìm kiếm: " + search);
        }
        return filters;
    }

    private List<String> buildSuggestions(String q, List<Semester> semesters, Semester matched,
                                          boolean includeMentorScores) {
        List<String> suggestions = new ArrayList<>();
        String semLabel = matched != null ? matched.getName()
                : (!semesters.isEmpty() ? semesters.get(0).getName() : "Fall 2024");
        if (!includeMentorScores) {
            suggestions.add("Load sinh viên kỳ " + semLabel + " kèm điểm mentor chấm");
        } else if (matched == null) {
            suggestions.add("Load sinh viên kỳ " + semLabel);
        }
        if (!q.contains("fail") && !q.contains("đạt")) {
            suggestions.add("Sinh viên Fail kỳ " + semLabel + " và điểm mentor");
        }
        if (!q.contains("chưa chấm")) {
            suggestions.add("Sinh viên mentor chưa chấm đủ kỳ " + semLabel);
        }
        return suggestions.stream().limit(3).collect(java.util.stream.Collectors.toList());
    }

    private String labelResult(String resultFilter) {
        return switch (resultFilter) {
            case "PASS" -> "Đạt";
            case "FAIL" -> "Fail";
            case "INCOMPLETE" -> "Chưa đủ điểm";
            default -> "Tất cả";
        };
    }
}
