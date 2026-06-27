package com.swp391.pimsbackend.service;

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
public class AdminService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ofPattern("EEEE, dd/MM/yyyy", new Locale("vi", "VN"));
    private static final List<String> RECOMMENDATIONS = List.of("Pass", "Conditional Pass", "Fail");

    private final SemesterRepository semesterRepository;
    private final DefenseScheduleRepository defenseScheduleRepository;
    private final StudentGroupRepository studentGroupRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final MentorClassRepository mentorClassRepository;
    private final EvaluationRepository evaluationRepository;
    private final CommitteePublishedResultRepository publishedResultRepository;

    public AdminService(SemesterRepository semesterRepository,
                        DefenseScheduleRepository defenseScheduleRepository,
                        StudentGroupRepository studentGroupRepository,
                        UserRepository userRepository,
                        ProjectRepository projectRepository,
                        MentorClassRepository mentorClassRepository,
                        EvaluationRepository evaluationRepository,
                        CommitteePublishedResultRepository publishedResultRepository) {
        this.semesterRepository = semesterRepository;
        this.defenseScheduleRepository = defenseScheduleRepository;
        this.studentGroupRepository = studentGroupRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.mentorClassRepository = mentorClassRepository;
        this.evaluationRepository = evaluationRepository;
        this.publishedResultRepository = publishedResultRepository;
    }

    public List<Map<String, Object>> getSemesters() {
        return semesterRepository.findAllByOrderByStartDateDesc().stream()
                .map(this::toSemesterDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public Semester createSemester(Map<String, String> body) {
        String code = require(body, "code");
        if (semesterRepository.findByCode(code).isPresent()) {
            throw new IllegalArgumentException("Mã kỳ học đã tồn tại.");
        }
        Semester semester = new Semester();
        semester.setCode(code);
        semester.setName(require(body, "name"));
        semester.setDescription(body.get("description"));
        semester.setStartDate(LocalDate.parse(body.get("startDate")));
        semester.setEndDate(LocalDate.parse(body.get("endDate")));
        semester.setStatus(body.getOrDefault("status", "Planning"));
        return semesterRepository.save(semester);
    }

    @Transactional
    public Semester updateSemester(Long id, Map<String, String> body) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kỳ học."));
        if (body.containsKey("name")) semester.setName(body.get("name"));
        if (body.containsKey("description")) semester.setDescription(body.get("description"));
        if (body.containsKey("startDate")) semester.setStartDate(LocalDate.parse(body.get("startDate")));
        if (body.containsKey("endDate")) semester.setEndDate(LocalDate.parse(body.get("endDate")));
        if (body.containsKey("status")) semester.setStatus(body.get("status"));
        return semesterRepository.save(semester);
    }

    @Transactional
    public void deleteSemester(Long id) {
        if (!semesterRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy kỳ học.");
        }
        semesterRepository.deleteById(id);
    }

    public List<Map<String, Object>> getDefenseSchedules() {
        return defenseScheduleRepository.findAllByOrderByDefenseDateAsc().stream()
                .map(this::toDefenseDto)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getStudentGroupOptions() {
        return studentGroupRepository.findAll().stream()
                .map(g -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", g.getId());
                    map.put("groupCode", g.getGroupCode());
                    map.put("groupName", g.getGroupName());
                    map.put("project", findProjectName(g.getGroupCode()));
                    map.put("progress", g.getProgress());
                    map.put("mentorId", g.getMentor() != null ? g.getMentor().getId() : null);
                    map.put("mentorName", g.getMentor() != null
                            ? (g.getMentor().getFullName() != null ? g.getMentor().getFullName() : g.getMentor().getUsername())
                            : "—");
                    map.put("semester", g.getMentorClass() != null ? g.getMentorClass().getSemester() : "—");
                    return map;
                })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getEvaluationOverview() {
        return defenseScheduleRepository.findAllByOrderByDefenseDateAsc().stream()
                .map(this::toEvaluationOverviewDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> submitDefenseEvaluation(Long defenseId, Map<String, String> body) {
        DefenseSchedule defense = defenseScheduleRepository.findById(defenseId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch chấm."));
        User committee = defense.getCommittee();
        if (committee == null) {
            throw new IllegalArgumentException("Lịch chấm chưa có thành viên hội đồng.");
        }

        double technical = parseScore(body.get("technicalScore"), "Điểm kỹ thuật");
        double presentation = parseScore(body.get("presentationScore"), "Điểm trình bày");
        double innovation = parseScore(body.get("innovationScore"), "Điểm sáng tạo");
        String recommendation = require(body, "recommendation");
        if (!RECOMMENDATIONS.contains(recommendation)) {
            throw new IllegalArgumentException("Kết luận không hợp lệ.");
        }

        Evaluation evaluation = evaluationRepository
                .findByDefenseIdAndEvaluatorId(defenseId, committee.getId())
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

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Đã lưu điểm chấm thành công.");
        result.put("evaluation", toEvaluationSummary(evaluation));
        return result;
    }

    public Map<String, Object> getReports() {
        Map<String, Object> report = new LinkedHashMap<>();

        report.put("totalStudents", userRepository.findByRole("Student").size());
        report.put("totalMentors", userRepository.findByRole("Mentor").size());
        report.put("totalCommittee", userRepository.findByRole("Committee").size());
        report.put("totalGroups", studentGroupRepository.count());
        report.put("totalClasses", mentorClassRepository.count());
        report.put("pendingAccounts", userRepository.findByApprovedFalse().size());

        List<Project> projects = projectRepository.findAll();
        report.put("totalProjects", projects.size());
        report.put("activeProjects", projects.stream().filter(p -> "In Progress".equals(p.getStatus())).count());
        report.put("completedProjects", projects.stream().filter(p -> "Completed".equals(p.getStatus())).count());
        report.put("onHoldProjects", projects.stream().filter(p -> "On Hold".equals(p.getStatus())).count());

        List<DefenseSchedule> schedules = defenseScheduleRepository.findAllByOrderByDefenseDateAsc();
        Map<String, Long> defenseByStatus = schedules.stream()
                .collect(Collectors.groupingBy(s -> s.getStatus() != null ? s.getStatus() : "Unknown", Collectors.counting()));
        report.put("defenseByStatus", defenseByStatus);
        report.put("totalDefenses", schedules.size());

        List<Evaluation> evaluations = evaluationRepository.findAllByOrderByUpdatedAtDesc();
        Map<String, Long> recommendationCounts = evaluations.stream()
                .filter(e -> e.getRecommendation() != null)
                .collect(Collectors.groupingBy(Evaluation::getRecommendation, Collectors.counting()));
        report.put("evaluationCount", evaluations.size());
        report.put("recommendationCounts", recommendationCounts);
        report.put("pendingEvaluations", Math.max(0, schedules.size() - evaluations.size()));

        report.put("semesters", getSemesters());
        report.put("classes", getMentorClasses());

        report.put("groupProgress", studentGroupRepository.findAll().stream()
                .map(g -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("groupCode", g.getGroupCode());
                    map.put("groupName", g.getGroupName());
                    map.put("project", findProjectName(g.getGroupCode()));
                    map.put("progress", g.getProgress());
                    map.put("mentorName", g.getMentor() != null
                            ? (g.getMentor().getFullName() != null ? g.getMentor().getFullName() : g.getMentor().getUsername())
                            : "—");
                    map.put("semester", g.getMentorClass() != null ? g.getMentorClass().getSemester() : "—");
                    return map;
                })
                .sorted(Comparator.comparingInt(m -> -(int) m.get("progress")))
                .collect(Collectors.toList()));

        report.put("recentProjects", projects.stream()
                .sorted(Comparator.comparing(Project::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(10)
                .map(p -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", p.getId());
                    map.put("name", p.getName());
                    map.put("groupId", p.getGroupId());
                    map.put("status", p.getStatus());
                    map.put("progress", p.getProgress());
                    map.put("mentorName", p.getMentor() != null
                            ? (p.getMentor().getFullName() != null ? p.getMentor().getFullName() : p.getMentor().getUsername())
                            : "—");
                    map.put("updatedAt", p.getUpdatedAt() != null ? p.getUpdatedAt().format(DATE_FMT) : "—");
                    return map;
                })
                .collect(Collectors.toList()));

        return report;
    }

    @Transactional
    public DefenseSchedule createDefenseSchedule(Map<String, String> body) {
        StudentGroup group = studentGroupRepository.findById(Long.parseLong(require(body, "studentGroupId")))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhóm."));
        User committee = userRepository.findById(Long.parseLong(require(body, "committeeId")))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thành viên hội đồng."));
        if (!"Committee".equals(committee.getRole())) {
            throw new IllegalArgumentException("Tài khoản không phải Committee.");
        }
        if (!committee.isApproved()) {
            throw new IllegalArgumentException("Tài khoản Committee chưa được duyệt.");
        }

        DefenseSchedule schedule = new DefenseSchedule();
        schedule.setStudentGroup(group);
        schedule.setCommittee(committee);
        schedule.setDefenseDate(LocalDateTime.parse(body.get("defenseDate") + "T" + body.getOrDefault("defenseTime", "08:00")));
        schedule.setTimeSlot(require(body, "timeSlot"));
        schedule.setLocation(require(body, "location"));
        schedule.setStatus(body.getOrDefault("status", "Scheduled"));
        schedule.setNotes(body.get("notes"));

        if (body.get("semesterId") != null && !body.get("semesterId").isBlank()) {
            Semester semester = semesterRepository.findById(Long.parseLong(body.get("semesterId")))
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kỳ học."));
            schedule.setSemester(semester);
        }

        return defenseScheduleRepository.save(schedule);
    }

    @Transactional
    public DefenseSchedule updateDefenseSchedule(Long id, Map<String, String> body) {
        DefenseSchedule schedule = defenseScheduleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch chấm."));

        if (body.containsKey("studentGroupId") && body.get("studentGroupId") != null && !body.get("studentGroupId").isBlank()) {
            StudentGroup group = studentGroupRepository.findById(Long.parseLong(body.get("studentGroupId")))
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhóm."));
            schedule.setStudentGroup(group);
        }

        if (body.containsKey("committeeId") && body.get("committeeId") != null && !body.get("committeeId").isBlank()) {
            User committee = userRepository.findById(Long.parseLong(body.get("committeeId")))
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thành viên hội đồng."));
            if (!"Committee".equals(committee.getRole())) {
                throw new IllegalArgumentException("Tài khoản không phải Committee.");
            }
            if (!committee.isApproved()) {
                throw new IllegalArgumentException("Tài khoản Committee chưa được duyệt.");
            }
            schedule.setCommittee(committee);
        }

        if (body.containsKey("semesterId") && body.get("semesterId") != null && !body.get("semesterId").isBlank()) {
            Semester semester = semesterRepository.findById(Long.parseLong(body.get("semesterId")))
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kỳ học."));
            schedule.setSemester(semester);
        } else if (body.containsKey("semesterId") && (body.get("semesterId") == null || body.get("semesterId").isBlank())) {
            schedule.setSemester(null);
        }

        if (body.containsKey("status")) schedule.setStatus(body.get("status"));
        if (body.containsKey("location")) schedule.setLocation(body.get("location"));
        if (body.containsKey("timeSlot")) schedule.setTimeSlot(body.get("timeSlot"));
        if (body.containsKey("notes")) schedule.setNotes(body.get("notes"));
        if (body.containsKey("defenseDate") && body.containsKey("defenseTime")) {
            schedule.setDefenseDate(LocalDateTime.parse(body.get("defenseDate") + "T" + body.get("defenseTime")));
        }
        return defenseScheduleRepository.save(schedule);
    }

    @Transactional
    public void deleteDefenseSchedule(Long id) {
        DefenseSchedule schedule = defenseScheduleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lịch chấm."));

        for (Evaluation evaluation : evaluationRepository.findByDefenseId(id)) {
            publishedResultRepository.findByEvaluationId(evaluation.getId())
                    .ifPresent(publishedResultRepository::delete);
            evaluationRepository.delete(evaluation);
        }

        publishedResultRepository.findByDefenseId(id).forEach(publishedResultRepository::delete);
        defenseScheduleRepository.delete(schedule);
    }

    public List<Map<String, Object>> getMentorClasses() {
        return mentorClassRepository.findAllByOrderByNameAsc().stream()
                .map(this::toMentorClassDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public MentorClass createMentorClass(Map<String, String> body) {
        String code = require(body, "code");
        String slug = toSlug(body.getOrDefault("slug", code));
        if (mentorClassRepository.existsBySlug(slug)) {
            throw new IllegalArgumentException("Slug class đã tồn tại.");
        }

        User mentor = userRepository.findById(Long.parseLong(require(body, "mentorId")))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mentor."));
        if (!"Mentor".equals(mentor.getRole())) {
            throw new IllegalArgumentException("Tài khoản không phải Mentor.");
        }

        MentorClass mentorClass = new MentorClass();
        mentorClass.setSlug(slug);
        mentorClass.setName(require(body, "name"));
        mentorClass.setCode(code);
        mentorClass.setSemester(require(body, "semester"));
        mentorClass.setCampus(require(body, "campus"));
        mentorClass.setMentor(mentor);
        return mentorClassRepository.save(mentorClass);
    }

    @Transactional
    public MentorClass updateMentorClass(Long id, Map<String, String> body) {
        MentorClass mentorClass = mentorClassRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy class."));

        if (body.containsKey("name")) mentorClass.setName(body.get("name"));
        if (body.containsKey("code")) mentorClass.setCode(body.get("code"));
        if (body.containsKey("semester")) mentorClass.setSemester(body.get("semester"));
        if (body.containsKey("campus")) mentorClass.setCampus(body.get("campus"));

        if (body.containsKey("mentorId") && body.get("mentorId") != null && !body.get("mentorId").isBlank()) {
            User mentor = userRepository.findById(Long.parseLong(body.get("mentorId")))
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mentor."));
            if (!"Mentor".equals(mentor.getRole())) {
                throw new IllegalArgumentException("Tài khoản không phải Mentor.");
            }
            mentorClass.setMentor(mentor);
            studentGroupRepository.findByMentorClass(mentorClass).forEach(group -> {
                group.setMentor(mentor);
                studentGroupRepository.save(group);
            });
        }

        return mentorClassRepository.save(mentorClass);
    }

    @Transactional
    public void deleteMentorClass(Long id) {
        MentorClass mentorClass = mentorClassRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy class."));
        if (studentGroupRepository.countByMentorClass(mentorClass) > 0) {
            throw new IllegalArgumentException("Không thể xóa class đang có nhóm sinh viên.");
        }
        mentorClassRepository.delete(mentorClass);
    }

    public List<Map<String, Object>> getCommitteeScheduleSlots() {
        List<DefenseSchedule> schedules = defenseScheduleRepository.findAllByOrderByDefenseDateAsc();
        Map<String, List<DefenseSchedule>> grouped = new LinkedHashMap<>();

        for (DefenseSchedule s : schedules) {
            String key = s.getDefenseDate().toLocalDate() + "|" + s.getTimeSlot() + "|" + s.getLocation()
                    + "|" + (s.getCommittee() != null ? s.getCommittee().getId() : "none");
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
            slot.put("committeeLead", first.getCommittee() != null
                    ? (first.getCommittee().getFullName() != null ? first.getCommittee().getFullName() : first.getCommittee().getUsername())
                    : "—");
            slot.put("groups", group.stream().map(s -> {
                Map<String, Object> g = new LinkedHashMap<>();
                g.put("id", s.getStudentGroup().getGroupCode());
                g.put("name", s.getStudentGroup().getGroupName());
                g.put("topic", findProjectName(s.getStudentGroup().getGroupCode()));
                g.put("status", s.getStatus());
                return g;
            }).collect(Collectors.toList()));
            slots.add(slot);
        }
        return slots;
    }

    private Map<String, Object> toSemesterDto(Semester s) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", s.getId());
        map.put("code", s.getCode());
        map.put("name", s.getName());
        map.put("description", s.getDescription());
        map.put("startDate", s.getStartDate().toString());
        map.put("endDate", s.getEndDate().toString());
        map.put("status", s.getStatus());
        map.put("createdAt", s.getCreatedAt() != null ? s.getCreatedAt().format(DATE_FMT) : "");
        return map;
    }

    private Map<String, Object> toDefenseDto(DefenseSchedule s) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", s.getId());
        map.put("semesterId", s.getSemester() != null ? s.getSemester().getId() : null);
        map.put("semesterName", s.getSemester() != null ? s.getSemester().getName() : "—");
        map.put("studentGroupId", s.getStudentGroup().getId());
        map.put("groupCode", s.getStudentGroup().getGroupCode());
        map.put("groupName", s.getStudentGroup().getGroupName());
        map.put("project", findProjectName(s.getStudentGroup().getGroupCode()));
        map.put("defenseDate", s.getDefenseDate().toLocalDate().toString());
        map.put("defenseTime", s.getDefenseDate().toLocalTime().toString().substring(0, 5));
        map.put("timeSlot", s.getTimeSlot());
        map.put("location", s.getLocation());
        map.put("committeeId", s.getCommittee() != null ? s.getCommittee().getId() : null);
        map.put("committeeName", s.getCommittee() != null
                ? (s.getCommittee().getFullName() != null ? s.getCommittee().getFullName() : s.getCommittee().getUsername())
                : "—");
        map.put("status", s.getStatus());
        map.put("notes", s.getNotes());
        return map;
    }

    private Map<String, Object> toMentorClassDto(MentorClass cls) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", cls.getId());
        map.put("slug", cls.getSlug());
        map.put("name", cls.getName());
        map.put("code", cls.getCode());
        map.put("semester", cls.getSemester());
        map.put("campus", cls.getCampus());
        map.put("mentorId", cls.getMentor().getId());
        map.put("mentorName", cls.getMentor().getFullName() != null
                ? cls.getMentor().getFullName() : cls.getMentor().getUsername());
        map.put("mentorEmail", cls.getMentor().getUsername());
        map.put("groupCount", studentGroupRepository.countByMentorClass(cls));
        return map;
    }

    private Map<String, Object> toEvaluationOverviewDto(DefenseSchedule schedule) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("defenseId", schedule.getId());
        item.put("groupCode", schedule.getStudentGroup().getGroupCode());
        item.put("groupName", schedule.getStudentGroup().getGroupName());
        item.put("project", findProjectName(schedule.getStudentGroup().getGroupCode()));
        item.put("defenseDate", schedule.getDefenseDate().toLocalDate().toString());
        item.put("defenseTime", schedule.getDefenseDate().toLocalTime().toString().substring(0, 5));
        item.put("timeSlot", schedule.getTimeSlot());
        item.put("location", schedule.getLocation());
        item.put("scheduleStatus", schedule.getStatus());
        item.put("semesterName", schedule.getSemester() != null ? schedule.getSemester().getName() : "—");
        item.put("committeeId", schedule.getCommittee() != null ? schedule.getCommittee().getId() : null);
        item.put("committeeName", schedule.getCommittee() != null
                ? (schedule.getCommittee().getFullName() != null ? schedule.getCommittee().getFullName() : schedule.getCommittee().getUsername())
                : "—");

        if (schedule.getCommittee() != null) {
            evaluationRepository.findByDefenseIdAndEvaluatorId(schedule.getId(), schedule.getCommittee().getId())
                    .ifPresentOrElse(
                            ev -> item.put("evaluation", toEvaluationSummary(ev)),
                            () -> item.put("evaluation", null)
                    );
        } else {
            item.put("evaluation", null);
        }
        return item;
    }

    private Map<String, Object> toEvaluationSummary(Evaluation evaluation) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", evaluation.getId());
        map.put("technicalScore", evaluation.getTechnicalScore());
        map.put("presentationScore", evaluation.getPresentationScore());
        map.put("innovationScore", evaluation.getInnovationScore());
        map.put("overallScore", evaluation.getOverallScore());
        map.put("recommendation", evaluation.getRecommendation());
        map.put("feedback", evaluation.getFeedback());
        map.put("updatedAt", evaluation.getUpdatedAt() != null ? evaluation.getUpdatedAt().format(DATE_FMT) : "");
        return map;
    }

    private String toSlug(String value) {
        return value.trim().toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
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

    private String require(Map<String, String> body, String key) {
        String value = body.get(key);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Thiếu trường: " + key);
        }
        return value.trim();
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
}
