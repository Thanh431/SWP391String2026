package com.swp391.pimsbackend.service;

import com.swp391.pimsbackend.model.*;
import com.swp391.pimsbackend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StudentCourseService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final UserRepository userRepository;
    private final MentorClassRepository mentorClassRepository;
    private final ClassEnrollmentRepository classEnrollmentRepository;
    private final SemesterRepository semesterRepository;

    public StudentCourseService(UserRepository userRepository,
                                MentorClassRepository mentorClassRepository,
                                ClassEnrollmentRepository classEnrollmentRepository,
                                SemesterRepository semesterRepository) {
        this.userRepository = userRepository;
        this.mentorClassRepository = mentorClassRepository;
        this.classEnrollmentRepository = classEnrollmentRepository;
        this.semesterRepository = semesterRepository;
    }

    public List<Map<String, Object>> getMyCourses(Long studentId) {
        User student = requireStudent(studentId);
        return classEnrollmentRepository.findByStudentOrderByEnrolledAtDesc(student).stream()
                .map(enrollment -> toCourseDto(enrollment))
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> joinCourse(Long studentId, String classCode) {
        User student = requireStudent(studentId);
        String code = classCode != null ? classCode.trim() : "";
        if (code.isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập mã lớp.");
        }

        MentorClass mentorClass = mentorClassRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new IllegalArgumentException("Mã lớp học không tồn tại trên hệ thống."));

        String status = resolveClassStatus(mentorClass);
        if ("Closed".equals(status)) {
            throw new IllegalArgumentException("Khóa học này đã đóng và không tiếp nhận thành viên mới.");
        }

        if (classEnrollmentRepository.existsByStudentAndMentorClass(student, mentorClass)) {
            throw new IllegalArgumentException("Bạn đã tham gia khóa học này rồi.");
        }

        long classSize = classEnrollmentRepository.countByMentorClass(mentorClass);
        if (classSize >= TopicGroupService.MAX_CLASS_MEMBERS) {
            throw new IllegalArgumentException("Lớp học đã đủ tối đa " + TopicGroupService.MAX_CLASS_MEMBERS + " sinh viên.");
        }

        ClassEnrollment enrollment = new ClassEnrollment();
        enrollment.setStudent(student);
        enrollment.setMentorClass(mentorClass);
        enrollment.setStatus("Active");
        classEnrollmentRepository.save(enrollment);

        return toCourseDto(enrollment);
    }

    private Map<String, Object> toCourseDto(ClassEnrollment enrollment) {
        MentorClass cls = enrollment.getMentorClass();
        User mentor = cls.getMentor();
        String mentorName = mentor.getFullName() != null ? mentor.getFullName() : mentor.getUsername();

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", cls.getSlug());
        map.put("enrollmentId", enrollment.getId());
        map.put("name", cls.getName());
        map.put("code", cls.getCode());
        map.put("semester", cls.getSemester());
        map.put("campus", cls.getCampus());
        map.put("teacher", mentorName);
        map.put("teacherEmail", mentor.getUsername());
        map.put("status", enrollment.getStatus());
        map.put("enrolledAt", enrollment.getEnrolledAt().format(DATE_FMT));
        map.put("materials", defaultMaterials(cls));
        map.put("assignments", List.of());
        map.put("members", buildMembers(cls, mentorName));
        return map;
    }

    private List<Map<String, String>> buildMembers(MentorClass cls, String mentorName) {
        List<Map<String, String>> members = new ArrayList<>();
        Map<String, String> teacher = new LinkedHashMap<>();
        teacher.put("id", "MENTOR");
        teacher.put("name", mentorName);
        teacher.put("role", "Teacher");
        members.add(teacher);

        for (ClassEnrollment e : classEnrollmentRepository.findByMentorClassOrderByEnrolledAtAsc(cls)) {
            User s = e.getStudent();
            Map<String, String> member = new LinkedHashMap<>();
            member.put("id", "SV" + s.getId());
            member.put("name", s.getFullName() != null ? s.getFullName() : s.getUsername());
            member.put("role", "Student");
            members.add(member);
        }
        return members;
    }

    private List<Map<String, String>> defaultMaterials(MentorClass cls) {
        List<Map<String, String>> materials = new ArrayList<>();
        Map<String, String> syllabus = new LinkedHashMap<>();
        syllabus.put("title", "Course Syllabus — " + cls.getName());
        syllabus.put("type", "Guideline");
        syllabus.put("date", DATE_FMT.format(java.time.LocalDate.now()));
        materials.add(syllabus);
        return materials;
    }

    private String resolveClassStatus(MentorClass cls) {
        return semesterRepository.findAll().stream()
                .filter(s -> cls.getSemester() != null
                        && (cls.getSemester().equalsIgnoreCase(s.getName())
                        || cls.getSemester().equalsIgnoreCase(s.getCode())))
                .map(Semester::getStatus)
                .map(status -> "Completed".equalsIgnoreCase(status) ? "Closed" : "Active")
                .findFirst()
                .orElse("Active");
    }

    private User requireStudent(Long studentId) {
        User user = userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sinh viên."));
        if (!"Student".equals(user.getRole())) {
            throw new IllegalArgumentException("Tài khoản không phải Student.");
        }
        return user;
    }
}
