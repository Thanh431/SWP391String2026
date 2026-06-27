package com.swp391.pimsbackend.controller;

import com.swp391.pimsbackend.service.StudentCourseService;
import com.swp391.pimsbackend.service.StudentDashboardService;
import com.swp391.pimsbackend.service.StudentGradeService;
import com.swp391.pimsbackend.service.StudentSubmissionService;
import com.swp391.pimsbackend.service.StudentTeamService;
import com.swp391.pimsbackend.service.TopicGroupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/student")
@CrossOrigin(origins = "*")
public class StudentController {

    private final StudentCourseService studentCourseService;
    private final TopicGroupService topicGroupService;
    private final StudentTeamService studentTeamService;
    private final StudentSubmissionService studentSubmissionService;
    private final StudentDashboardService studentDashboardService;
    private final StudentGradeService studentGradeService;

    public StudentController(StudentCourseService studentCourseService,
                             TopicGroupService topicGroupService,
                             StudentTeamService studentTeamService,
                             StudentSubmissionService studentSubmissionService,
                             StudentDashboardService studentDashboardService,
                             StudentGradeService studentGradeService) {
        this.studentCourseService = studentCourseService;
        this.topicGroupService = topicGroupService;
        this.studentTeamService = studentTeamService;
        this.studentSubmissionService = studentSubmissionService;
        this.studentDashboardService = studentDashboardService;
        this.studentGradeService = studentGradeService;
    }

    @GetMapping("/{studentId}/courses")
    public ResponseEntity<List<Map<String, Object>>> getMyCourses(@PathVariable Long studentId) {
        return ResponseEntity.ok(studentCourseService.getMyCourses(studentId));
    }

    @PostMapping("/{studentId}/courses/join")
    public ResponseEntity<?> joinCourse(@PathVariable Long studentId,
                                        @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(studentCourseService.joinCourse(studentId, body.get("classCode")));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{studentId}/courses/{classSlug}/topics")
    public ResponseEntity<?> getCourseTopics(@PathVariable Long studentId, @PathVariable String classSlug) {
        try {
            return ResponseEntity.ok(topicGroupService.getStudentTopics(studentId, classSlug));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{studentId}/topics/{topicId}/join")
    public ResponseEntity<?> joinTopic(@PathVariable Long studentId, @PathVariable Long topicId) {
        try {
            return ResponseEntity.ok(topicGroupService.joinTopic(studentId, topicId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{studentId}/team")
    public ResponseEntity<?> getMyTeam(@PathVariable Long studentId) {
        try {
            return ResponseEntity.ok(studentTeamService.getMyTeam(studentId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{studentId}/submissions")
    public ResponseEntity<?> getSubmissions(@PathVariable Long studentId) {
        try {
            return ResponseEntity.ok(studentSubmissionService.getSubmissions(studentId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{studentId}/dashboard")
    public ResponseEntity<?> getDashboard(@PathVariable Long studentId) {
        try {
            return ResponseEntity.ok(studentDashboardService.getDashboard(studentId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{studentId}/grades")
    public ResponseEntity<?> getGrades(@PathVariable Long studentId) {
        try {
            return ResponseEntity.ok(studentGradeService.getCourseGrades(studentId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{studentId}/submissions/{phaseId}")
    public ResponseEntity<?> submitPhase(@PathVariable Long studentId,
                                         @PathVariable int phaseId,
                                         @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(studentSubmissionService.submitPhase(studentId, phaseId, body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{studentId}/team/join-code")
    public ResponseEntity<?> joinTeamByCode(@PathVariable Long studentId,
                                            @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(studentTeamService.joinByCode(studentId, body.get("groupCode")));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{studentId}/team/invite")
    public ResponseEntity<?> inviteTeamMember(@PathVariable Long studentId,
                                              @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(studentTeamService.inviteMember(studentId, body.get("email")));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{studentId}/team/invitations/{invitationId}/accept")
    public ResponseEntity<?> acceptTeamInvitation(@PathVariable Long studentId,
                                                  @PathVariable Long invitationId) {
        try {
            return ResponseEntity.ok(studentTeamService.acceptInvitation(studentId, invitationId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{studentId}/team/invitations/{invitationId}/decline")
    public ResponseEntity<?> declineTeamInvitation(@PathVariable Long studentId,
                                                   @PathVariable Long invitationId) {
        try {
            return ResponseEntity.ok(studentTeamService.declineInvitation(studentId, invitationId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
