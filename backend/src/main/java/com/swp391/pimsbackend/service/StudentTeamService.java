package com.swp391.pimsbackend.service;

import com.swp391.pimsbackend.model.*;
import com.swp391.pimsbackend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StudentTeamService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final UserRepository userRepository;
    private final TopicGroupMemberRepository topicGroupMemberRepository;
    private final TopicGroupRepository topicGroupRepository;
    private final StudentGroupRepository studentGroupRepository;
    private final ProjectRepository projectRepository;
    private final ClassEnrollmentRepository classEnrollmentRepository;
    private final TeamInvitationRepository teamInvitationRepository;
    private final TopicGroupService topicGroupService;

    public StudentTeamService(UserRepository userRepository,
                              TopicGroupMemberRepository topicGroupMemberRepository,
                              TopicGroupRepository topicGroupRepository,
                              StudentGroupRepository studentGroupRepository,
                              ProjectRepository projectRepository,
                              ClassEnrollmentRepository classEnrollmentRepository,
                              TeamInvitationRepository teamInvitationRepository,
                              TopicGroupService topicGroupService) {
        this.userRepository = userRepository;
        this.topicGroupMemberRepository = topicGroupMemberRepository;
        this.topicGroupRepository = topicGroupRepository;
        this.studentGroupRepository = studentGroupRepository;
        this.projectRepository = projectRepository;
        this.classEnrollmentRepository = classEnrollmentRepository;
        this.teamInvitationRepository = teamInvitationRepository;
        this.topicGroupService = topicGroupService;
    }

    public Optional<StudentGroup> resolveStudentGroup(Long studentId) {
        User student = requireStudent(studentId);
        List<TopicGroupMember> memberships = topicGroupMemberRepository.findByStudentOrderByJoinedAtDesc(student);
        if (!memberships.isEmpty()) {
            TopicGroup topic = memberships.get(0).getTopicGroup();
            if (topic.getStudentGroup() != null) {
                return Optional.of(topic.getStudentGroup());
            }
            return studentGroupRepository.findByGroupCode(topic.getGroupCode());
        }
        return findLegacyGroup(student);
    }

    public Map<String, Object> getMyTeam(Long studentId) {
        User student = requireStudent(studentId);

        List<TopicGroupMember> memberships = topicGroupMemberRepository.findByStudentOrderByJoinedAtDesc(student);
        if (!memberships.isEmpty()) {
            return buildTeamFromTopic(memberships.get(0), student);
        }

        Optional<StudentGroup> legacyGroup = findLegacyGroup(student);
        if (legacyGroup.isPresent()) {
            return buildTeamFromStudentGroup(legacyGroup.get(), student);
        }

        List<Map<String, Object>> incomingInvites = teamInvitationRepository
                .findByInviteeAndStatusOrderByCreatedAtDesc(student, "Pending").stream()
                .map(this::toInvitationDto)
                .collect(Collectors.toList());

        Map<String, Object> empty = new LinkedHashMap<>();
        empty.put("hasTeam", false);
        empty.put("message", "Bạn chưa tham gia nhóm nào. Hãy vào My Courses để chọn đề tài hoặc nhập mã nhóm.");
        empty.put("incomingInvites", incomingInvites);
        return empty;
    }

    @Transactional
    public Map<String, Object> joinByCode(Long studentId, String groupCode) {
        User student = requireStudent(studentId);
        String code = groupCode != null ? groupCode.trim() : "";
        if (code.isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập mã nhóm.");
        }

        TopicGroup topic = topicGroupRepository.findByGroupCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Mã nhóm không tồn tại."));

        teamInvitationRepository.findByInviteeAndStatusOrderByCreatedAtDesc(student, "Pending").stream()
                .filter(inv -> inv.getTopicGroup().getId().equals(topic.getId()))
                .findFirst()
                .ifPresent(inv -> {
                    inv.setStatus("Accepted");
                    teamInvitationRepository.save(inv);
                });

        topicGroupService.joinTopic(studentId, topic.getId());
        return getMyTeam(studentId);
    }

    @Transactional
    public Map<String, Object> inviteMember(Long studentId, String email) {
        User inviter = requireStudent(studentId);
        String inviteEmail = email != null ? email.trim().toLowerCase() : "";
        if (inviteEmail.isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập email sinh viên.");
        }

        TopicGroupMember membership = topicGroupMemberRepository.findByStudentOrderByJoinedAtDesc(inviter).stream()
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Bạn chưa tham gia nhóm nào."));

        TopicGroup topic = membership.getTopicGroup();
        if (!isLeader(topic, inviter)) {
            throw new IllegalArgumentException("Chỉ trưởng nhóm mới được mời thành viên.");
        }

        User invitee = userRepository.findByUsername(inviteEmail)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sinh viên với email này."));

        if (!"Student".equals(invitee.getRole())) {
            throw new IllegalArgumentException("Chỉ có thể mời sinh viên.");
        }

        if (invitee.getId().equals(inviter.getId())) {
            throw new IllegalArgumentException("Bạn không thể mời chính mình.");
        }

        MentorClass mentorClass = topic.getMentorClass();
        if (!classEnrollmentRepository.existsByStudentAndMentorClass(invitee, mentorClass)) {
            throw new IllegalArgumentException("Sinh viên cần tham gia lớp học trước khi được mời vào nhóm.");
        }

        if (topicGroupMemberRepository.findByStudentAndMentorClass(invitee, mentorClass).isPresent()) {
            throw new IllegalArgumentException("Sinh viên đã tham gia một nhóm trong lớp này.");
        }

        if (teamInvitationRepository.existsByTopicGroupAndInviteeAndStatus(topic, invitee, "Pending")) {
            throw new IllegalArgumentException("Lời mời đã được gửi trước đó.");
        }

        long memberCount = topicGroupMemberRepository.countByTopicGroup(topic);
        if (memberCount >= topic.getMaxMembers()) {
            throw new IllegalArgumentException("Nhóm đã đủ thành viên.");
        }

        TeamInvitation invitation = new TeamInvitation();
        invitation.setTopicGroup(topic);
        invitation.setInviter(inviter);
        invitation.setInvitee(invitee);
        invitation.setStatus("Pending");
        teamInvitationRepository.save(invitation);

        return getMyTeam(studentId);
    }

    @Transactional
    public Map<String, Object> acceptInvitation(Long studentId, Long invitationId) {
        User student = requireStudent(studentId);
        TeamInvitation invitation = teamInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lời mời."));

        if (!invitation.getInvitee().getId().equals(student.getId())) {
            throw new IllegalArgumentException("Bạn không có quyền chấp nhận lời mời này.");
        }

        if (!"Pending".equals(invitation.getStatus())) {
            throw new IllegalArgumentException("Lời mời đã được xử lý.");
        }

        invitation.setStatus("Accepted");
        teamInvitationRepository.save(invitation);

        topicGroupService.joinTopic(studentId, invitation.getTopicGroup().getId());
        return getMyTeam(studentId);
    }

    @Transactional
    public Map<String, Object> declineInvitation(Long studentId, Long invitationId) {
        User student = requireStudent(studentId);
        TeamInvitation invitation = teamInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lời mời."));

        if (!invitation.getInvitee().getId().equals(student.getId())) {
            throw new IllegalArgumentException("Bạn không có quyền từ chối lời mời này.");
        }

        invitation.setStatus("Declined");
        teamInvitationRepository.save(invitation);
        return getMyTeam(studentId);
    }

    private Map<String, Object> buildTeamFromTopic(TopicGroupMember membership, User currentStudent) {
        TopicGroup topic = membership.getTopicGroup();
        List<TopicGroupMember> allMembers = topicGroupMemberRepository.findByTopicGroupOrderByJoinedAtAsc(topic);
        User leader = allMembers.isEmpty() ? currentStudent : allMembers.get(0).getStudent();
        boolean isLeader = leader.getId().equals(currentStudent.getId());

        User mentor = topic.getMentor();
        String mentorName = mentor.getFullName() != null ? mentor.getFullName() : mentor.getUsername();

        String projectTitle = topic.getTitle();
        String projectStatus = mapTopicStatus(topic.getStatus());

        Optional<Project> project = projectRepository.findByGroupId(topic.getGroupCode()).stream().findFirst();
        if (project.isPresent()) {
            projectTitle = project.get().getName();
            projectStatus = mapProjectStatus(project.get().getStatus());
        }

        List<Map<String, Object>> members = allMembers.stream()
                .map(m -> toMemberDto(m, leader, currentStudent))
                .collect(Collectors.toList());

        List<Map<String, Object>> pendingInvites = isLeader
                ? teamInvitationRepository.findByTopicGroupAndStatusOrderByCreatedAtDesc(topic, "Pending").stream()
                .map(this::toInvitationDto)
                .collect(Collectors.toList())
                : List.of();

        Map<String, Object> team = new LinkedHashMap<>();
        team.put("hasTeam", true);
        team.put("teamName", topic.getGroupCode());
        team.put("joinCode", topic.getGroupCode());
        team.put("groupName", topic.getStudentGroup() != null ? topic.getStudentGroup().getGroupName() : ("Nhóm " + topic.getGroupNumber()));
        team.put("projectTitle", projectTitle);
        team.put("projectDescription", topic.getDescription());
        team.put("mentor", mentorName);
        team.put("mentorEmail", mentor.getUsername());
        team.put("className", topic.getMentorClass().getName());
        team.put("classCode", topic.getMentorClass().getCode());
        team.put("status", projectStatus);
        team.put("topicStatus", topic.getStatus());
        team.put("maxMembers", topic.getMaxMembers());
        team.put("memberCount", members.size());
        team.put("isLeader", isLeader);
        team.put("members", members);
        team.put("pendingInvites", pendingInvites);
        team.put("incomingInvites", List.of());
        team.put("progress", topic.getStudentGroup() != null ? topic.getStudentGroup().getProgress() : 0);
        return team;
    }

    private Map<String, Object> buildTeamFromStudentGroup(StudentGroup group, User currentStudent) {
        User mentor = group.getMentor();
        String mentorName = mentor != null
                ? (mentor.getFullName() != null ? mentor.getFullName() : mentor.getUsername())
                : "—";

        String projectTitle = projectRepository.findByGroupId(group.getGroupCode()).stream()
                .findFirst()
                .map(Project::getName)
                .orElse("—");

        String projectStatus = projectRepository.findByGroupId(group.getGroupCode()).stream()
                .findFirst()
                .map(p -> mapProjectStatus(p.getStatus()))
                .orElse("Đang thực hiện");

        List<Map<String, Object>> members = parseLegacyMembers(group.getMemberNames(), currentStudent);

        Map<String, Object> team = new LinkedHashMap<>();
        team.put("hasTeam", true);
        team.put("teamName", group.getGroupCode());
        team.put("joinCode", group.getGroupCode());
        team.put("groupName", group.getGroupName());
        team.put("projectTitle", projectTitle);
        team.put("projectDescription", "");
        team.put("mentor", mentorName);
        team.put("mentorEmail", mentor != null ? mentor.getUsername() : "");
        team.put("className", group.getMentorClass() != null ? group.getMentorClass().getName() : "—");
        team.put("classCode", group.getMentorClass() != null ? group.getMentorClass().getCode() : "—");
        team.put("status", projectStatus);
        team.put("topicStatus", "In Progress");
        team.put("maxMembers", 5);
        team.put("memberCount", members.size());
        team.put("isLeader", members.stream().anyMatch(m -> Boolean.TRUE.equals(m.get("isMe")) && "Leader".equals(m.get("role"))));
        team.put("members", members);
        team.put("pendingInvites", List.of());
        team.put("incomingInvites", List.of());
        team.put("progress", group.getProgress());
        team.put("legacy", true);
        return team;
    }

    private List<Map<String, Object>> parseLegacyMembers(String memberNames, User currentStudent) {
        if (memberNames == null || memberNames.isBlank()) {
            return List.of(toLegacyMemberDto(currentStudent, "Leader", true));
        }

        String[] names = memberNames.split(",");
        List<Map<String, Object>> members = new ArrayList<>();
        for (int i = 0; i < names.length; i++) {
            String name = names[i].trim();
            boolean isMe = matchesStudent(name, currentStudent);
            members.add(Map.of(
                    "id", "legacy-" + i,
                    "name", name,
                    "rollNumber", extractRollNumber(currentStudent),
                    "email", isMe ? currentStudent.getUsername() : "",
                    "role", i == 0 ? "Leader" : "Member",
                    "isMe", isMe
            ));
        }
        return members;
    }

    private Map<String, Object> toMemberDto(TopicGroupMember member, User leader, User currentStudent) {
        User s = member.getStudent();
        boolean isMe = s.getId().equals(currentStudent.getId());
        boolean isLeaderMember = s.getId().equals(leader.getId());

        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", s.getId());
        map.put("name", s.getFullName() != null ? s.getFullName() : s.getUsername());
        map.put("rollNumber", extractRollNumber(s));
        map.put("email", s.getUsername());
        map.put("role", isLeaderMember ? "Leader" : "Member");
        map.put("isMe", isMe);
        map.put("joinedAt", member.getJoinedAt().format(DATE_FMT));
        return map;
    }

    private Map<String, Object> toLegacyMemberDto(User student, String role, boolean isMe) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", student.getId());
        map.put("name", student.getFullName() != null ? student.getFullName() : student.getUsername());
        map.put("rollNumber", extractRollNumber(student));
        map.put("email", student.getUsername());
        map.put("role", role);
        map.put("isMe", isMe);
        return map;
    }

    private Map<String, Object> toInvitationDto(TeamInvitation invitation) {
        User invitee = invitation.getInvitee();
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", invitation.getId());
        map.put("name", invitee.getFullName() != null ? invitee.getFullName() : invitee.getUsername());
        map.put("rollNumber", extractRollNumber(invitee));
        map.put("email", invitee.getUsername());
        map.put("status", "Chờ phản hồi");
        map.put("topicGroupCode", invitation.getTopicGroup().getGroupCode());
        map.put("createdAt", invitation.getCreatedAt().format(DATE_FMT));
        return map;
    }

    private boolean isLeader(TopicGroup topic, User student) {
        return topicGroupMemberRepository.findByTopicGroupOrderByJoinedAtAsc(topic).stream()
                .findFirst()
                .map(m -> m.getStudent().getId().equals(student.getId()))
                .orElse(false);
    }

    private Optional<StudentGroup> findLegacyGroup(User student) {
        String name = student.getFullName() != null ? student.getFullName() : "";
        String username = student.getUsername();
        return studentGroupRepository.findAll().stream()
                .filter(g -> g.getMemberNames() != null
                        && (g.getMemberNames().contains(name) || g.getMemberNames().contains(username)))
                .findFirst();
    }

    private boolean matchesStudent(String name, User student) {
        if (student.getFullName() != null && student.getFullName().equalsIgnoreCase(name)) {
            return true;
        }
        return student.getUsername().equalsIgnoreCase(name);
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
            return matcher.group(1).toUpperCase();
        }
        return local.toUpperCase();
    }

    private String mapProjectStatus(String status) {
        if (status == null) return "Đang thực hiện";
        return switch (status) {
            case "Completed" -> "Đã hoàn thành";
            case "On Hold" -> "Tạm dừng";
            case "Planning" -> "Đang lên kế hoạch";
            default -> "Đang thực hiện";
        };
    }

    private String mapTopicStatus(String status) {
        if (status == null) return "Đang thực hiện";
        return switch (status) {
            case "Open" -> "Đang tuyển thành viên";
            case "Full" -> "Đủ thành viên";
            case "Completed" -> "Đã hoàn thành";
            case "In Progress" -> "Đang thực hiện";
            default -> status;
        };
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
