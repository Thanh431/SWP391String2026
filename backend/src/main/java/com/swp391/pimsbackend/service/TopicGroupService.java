package com.swp391.pimsbackend.service;

import com.swp391.pimsbackend.model.*;
import com.swp391.pimsbackend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TopicGroupService {

    public static final int MAX_CLASS_MEMBERS = 40;
    public static final int MIN_GROUP_SIZE = 4;
    public static final int MAX_GROUP_SIZE = 5;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final UserRepository userRepository;
    private final MentorClassRepository mentorClassRepository;
    private final ClassEnrollmentRepository classEnrollmentRepository;
    private final TopicGroupRepository topicGroupRepository;
    private final TopicGroupMemberRepository topicGroupMemberRepository;
    private final StudentGroupRepository studentGroupRepository;
    private final ProjectRepository projectRepository;
    private final SemesterLookupService semesterLookupService;

    public TopicGroupService(UserRepository userRepository,
                             MentorClassRepository mentorClassRepository,
                             ClassEnrollmentRepository classEnrollmentRepository,
                             TopicGroupRepository topicGroupRepository,
                             TopicGroupMemberRepository topicGroupMemberRepository,
                             StudentGroupRepository studentGroupRepository,
                             ProjectRepository projectRepository,
                             SemesterLookupService semesterLookupService) {
        this.userRepository = userRepository;
        this.mentorClassRepository = mentorClassRepository;
        this.classEnrollmentRepository = classEnrollmentRepository;
        this.topicGroupRepository = topicGroupRepository;
        this.topicGroupMemberRepository = topicGroupMemberRepository;
        this.studentGroupRepository = studentGroupRepository;
        this.projectRepository = projectRepository;
        this.semesterLookupService = semesterLookupService;
    }

    public List<Map<String, Object>> getMentorTopics(Long mentorId, String classSlug) {
        MentorClass mentorClass = requireMentorClass(mentorId, classSlug);
        return topicGroupRepository.findByMentorClassOrderByGroupNumberAsc(mentorClass).stream()
                .map(topic -> toTopicDto(topic, null))
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> createTopic(Long mentorId, String classSlug, Map<String, String> body) {
        User mentor = requireMentor(mentorId);
        MentorClass mentorClass = requireMentorClass(mentorId, classSlug);

        int maxMembers = parseGroupSize(body.get("maxMembers"));
        String title = require(body, "title");
        String description = body.getOrDefault("description", "");

        int nextNumber = topicGroupRepository.countByMentorClass(mentorClass) + 1;
        String groupCode = mentorClass.getCode() + "-G" + String.format("%02d", nextNumber);

        TopicGroup topic = new TopicGroup();
        topic.setMentorClass(mentorClass);
        topic.setMentor(mentor);
        topic.setGroupNumber(nextNumber);
        topic.setGroupCode(groupCode);
        topic.setTitle(title);
        topic.setDescription(description);
        topic.setMaxMembers(maxMembers);
        topic.setStatus("Open");
        topicGroupRepository.save(topic);

        return toTopicDto(topic, null);
    }

    @Transactional
    public void deleteTopic(Long mentorId, Long topicId) {
        User mentor = requireMentor(mentorId);
        TopicGroup topic = topicGroupRepository.findByIdAndMentor(topicId, mentor)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đề tài nhóm."));
        if (topicGroupMemberRepository.countByTopicGroup(topic) > 0) {
            throw new IllegalArgumentException("Không thể xóa đề tài đã có sinh viên tham gia.");
        }
        topicGroupRepository.delete(topic);
    }

    public List<Map<String, Object>> getStudentTopics(Long studentId, String classSlug) {
        User student = requireStudent(studentId);
        MentorClass mentorClass = mentorClassRepository.findBySlug(classSlug)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lớp học."));
        requireClassEnrollment(student, mentorClass);

        Optional<TopicGroupMember> myMembership = topicGroupMemberRepository
                .findByStudentAndMentorClass(student, mentorClass);

        return topicGroupRepository.findByMentorClassOrderByGroupNumberAsc(mentorClass).stream()
                .map(topic -> toTopicDto(topic, myMembership.orElse(null)))
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> joinTopic(Long studentId, Long topicId) {
        User student = requireStudent(studentId);
        TopicGroup topic = topicGroupRepository.findById(topicId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đề tài nhóm."));

        MentorClass mentorClass = topic.getMentorClass();
        requireClassEnrollment(student, mentorClass);

        if (topicGroupMemberRepository.findByStudentAndMentorClass(student, mentorClass).isPresent()) {
            throw new IllegalArgumentException("Bạn đã tham gia một nhóm trong lớp này và không thể rời nhóm.");
        }

        if ("Full".equals(topic.getStatus()) || "Completed".equals(topic.getStatus())) {
            throw new IllegalArgumentException("Nhóm này đã đủ thành viên hoặc đã hoàn thành.");
        }

        long currentCount = topicGroupMemberRepository.countByTopicGroup(topic);
        if (currentCount >= topic.getMaxMembers()) {
            topic.setStatus("Full");
            topicGroupRepository.save(topic);
            throw new IllegalArgumentException("Nhóm đã đủ " + topic.getMaxMembers() + " thành viên.");
        }

        TopicGroupMember member = new TopicGroupMember();
        member.setTopicGroup(topic);
        member.setStudent(student);
        topicGroupMemberRepository.save(member);

        StudentGroup group = topic.getStudentGroup();
        if (group == null) {
            group = new StudentGroup();
            group.setGroupCode(topic.getGroupCode());
            group.setGroupName("Nhóm " + topic.getGroupNumber());
            group.setMajor(student.getDepartment() != null ? student.getDepartment() : "Software Engineering");
            group.setProgress(0);
            group.setMilestoneDone(0);
            group.setMilestoneTotal(5);
            group.setLastActive("Vừa join");
            group.setMentor(topic.getMentor());
            group.setMentorClass(mentorClass);
            semesterLookupService.applyLegacySqlServerFields(group, mentorClass);
            group = studentGroupRepository.save(group);
            topic.setStudentGroup(group);

            if (projectRepository.findByGroupId(topic.getGroupCode()).isEmpty()) {
                Project project = new Project(
                        topic.getTitle(),
                        topic.getDescription(),
                        "In Progress",
                        LocalDateTime.now(),
                        LocalDateTime.now().plusMonths(4),
                        topic.getGroupCode(),
                        topic.getMentor(),
                        0
                );
                projectRepository.save(project);
            }
        }

        syncGroupMembers(group, topic);
        topicGroupRepository.save(topic);

        if (topicGroupMemberRepository.countByTopicGroup(topic) >= topic.getMaxMembers()) {
            topic.setStatus("Full");
            topicGroupRepository.save(topic);
        } else if ("Open".equals(topic.getStatus()) && topicGroupMemberRepository.countByTopicGroup(topic) >= MIN_GROUP_SIZE) {
            topic.setStatus("In Progress");
            topicGroupRepository.save(topic);
        }

        TopicGroupMember savedMembership = topicGroupMemberRepository
                .findByStudentAndMentorClass(student, mentorClass).orElse(member);
        return toTopicDto(topic, savedMembership);
    }

    private void syncGroupMembers(StudentGroup group, TopicGroup topic) {
        List<TopicGroupMember> members = topicGroupMemberRepository.findByTopicGroupOrderByJoinedAtAsc(topic);
        String names = members.stream()
                .map(m -> m.getStudent().getFullName() != null ? m.getStudent().getFullName() : m.getStudent().getUsername())
                .collect(Collectors.joining(", "));
        group.setMemberNames(names);
        group.setLastActive("Vừa xong");
        if (group.getSemester() == null && topic.getMentorClass() != null) {
            semesterLookupService.applyLegacySqlServerFields(group, topic.getMentorClass());
        }
        studentGroupRepository.save(group);
    }

    private Map<String, Object> toTopicDto(TopicGroup topic, TopicGroupMember myMembership) {
        long memberCount = topicGroupMemberRepository.countByTopicGroup(topic);
        List<Map<String, Object>> members = topicGroupMemberRepository.findByTopicGroupOrderByJoinedAtAsc(topic).stream()
                .map(m -> {
                    User s = m.getStudent();
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", s.getId());
                    map.put("name", s.getFullName() != null ? s.getFullName() : s.getUsername());
                    map.put("email", s.getUsername());
                    map.put("joinedAt", m.getJoinedAt().format(DATE_FMT));
                    return map;
                })
                .collect(Collectors.toList());

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", topic.getId());
        map.put("groupNumber", topic.getGroupNumber());
        map.put("groupCode", topic.getGroupCode());
        map.put("title", topic.getTitle());
        map.put("description", topic.getDescription());
        map.put("maxMembers", topic.getMaxMembers());
        map.put("memberCount", memberCount);
        map.put("slotsLeft", Math.max(0, topic.getMaxMembers() - memberCount));
        map.put("status", topic.getStatus());
        map.put("members", members);
        map.put("canJoin", myMembership == null
                && memberCount < topic.getMaxMembers()
                && !"Completed".equals(topic.getStatus())
                && !"Full".equals(topic.getStatus()));
        map.put("joined", myMembership != null && myMembership.getTopicGroup().getId().equals(topic.getId()));
        map.put("lockedIn", myMembership != null);
        map.put("myGroupCode", myMembership != null ? myMembership.getTopicGroup().getGroupCode() : null);
        return map;
    }

    private MentorClass requireMentorClass(Long mentorId, String classSlug) {
        User mentor = requireMentor(mentorId);
        return mentorClassRepository.findBySlugAndMentor(classSlug, mentor)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lớp học."));
    }

    private void requireClassEnrollment(User student, MentorClass mentorClass) {
        if (!classEnrollmentRepository.existsByStudentAndMentorClass(student, mentorClass)) {
            throw new IllegalArgumentException("Bạn cần tham gia lớp học trước khi xem hoặc chọn đề tài.");
        }
    }

    private User requireMentor(Long mentorId) {
        User user = userRepository.findById(mentorId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mentor."));
        if (!"Mentor".equals(user.getRole())) {
            throw new IllegalArgumentException("Tài khoản không phải Mentor.");
        }
        return user;
    }

    private User requireStudent(Long studentId) {
        User user = userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sinh viên."));
        if (!"Student".equals(user.getRole())) {
            throw new IllegalArgumentException("Tài khoản không phải Student.");
        }
        return user;
    }

    private int parseGroupSize(String value) {
        if (value == null || value.isBlank()) {
            return MAX_GROUP_SIZE;
        }
        int size = Integer.parseInt(value);
        if (size < MIN_GROUP_SIZE || size > MAX_GROUP_SIZE) {
            throw new IllegalArgumentException("Mỗi nhóm chỉ được từ " + MIN_GROUP_SIZE + " đến " + MAX_GROUP_SIZE + " thành viên.");
        }
        return size;
    }

    private String require(Map<String, String> body, String key) {
        String value = body.get(key);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Thiếu trường: " + key);
        }
        return value.trim();
    }
}
