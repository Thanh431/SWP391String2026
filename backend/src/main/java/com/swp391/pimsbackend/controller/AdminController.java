package com.swp391.pimsbackend.controller;

import com.swp391.pimsbackend.model.DefenseSchedule;
import com.swp391.pimsbackend.model.MentorClass;
import com.swp391.pimsbackend.model.Semester;
import com.swp391.pimsbackend.service.AdminFinalGradeService;
import com.swp391.pimsbackend.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final AdminService adminService;
    private final AdminFinalGradeService adminFinalGradeService;

    public AdminController(AdminService adminService, AdminFinalGradeService adminFinalGradeService) {
        this.adminService = adminService;
        this.adminFinalGradeService = adminFinalGradeService;
    }

    @GetMapping("/semesters")
    public ResponseEntity<List<Map<String, Object>>> getSemesters() {
        return ResponseEntity.ok(adminService.getSemesters());
    }

    @PostMapping("/semesters")
    public ResponseEntity<?> createSemester(@RequestBody Map<String, String> body) {
        try {
            Semester saved = adminService.createSemester(body);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/semesters/{id}")
    public ResponseEntity<?> updateSemester(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            Semester saved = adminService.updateSemester(id, body);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/semesters/{id}")
    public ResponseEntity<?> deleteSemester(@PathVariable Long id) {
        try {
            adminService.deleteSemester(id);
            return ResponseEntity.ok(Map.of("message", "Đã xóa kỳ học."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/defense-schedules")
    public ResponseEntity<List<Map<String, Object>>> getDefenseSchedules() {
        return ResponseEntity.ok(adminService.getDefenseSchedules());
    }

    @GetMapping("/student-groups")
    public ResponseEntity<List<Map<String, Object>>> getStudentGroups() {
        return ResponseEntity.ok(adminService.getStudentGroupOptions());
    }

    @PostMapping("/defense-schedules")
    public ResponseEntity<?> createDefenseSchedule(@RequestBody Map<String, String> body) {
        try {
            DefenseSchedule saved = adminService.createDefenseSchedule(body);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/defense-schedules/{id}")
    public ResponseEntity<?> updateDefenseSchedule(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            DefenseSchedule saved = adminService.updateDefenseSchedule(id, body);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/defense-schedules/{id}")
    public ResponseEntity<?> deleteDefenseSchedule(@PathVariable Long id) {
        try {
            adminService.deleteDefenseSchedule(id);
            return ResponseEntity.ok(Map.of("message", "Đã xóa lịch chấm."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/classes")
    public ResponseEntity<List<Map<String, Object>>> getMentorClasses() {
        return ResponseEntity.ok(adminService.getMentorClasses());
    }

    @PostMapping("/classes")
    public ResponseEntity<?> createMentorClass(@RequestBody Map<String, String> body) {
        try {
            MentorClass saved = adminService.createMentorClass(body);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/classes/{id}")
    public ResponseEntity<?> updateMentorClass(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            MentorClass saved = adminService.updateMentorClass(id, body);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/classes/{id}")
    public ResponseEntity<?> deleteMentorClass(@PathVariable Long id) {
        try {
            adminService.deleteMentorClass(id);
            return ResponseEntity.ok(Map.of("message", "Đã xóa class."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/evaluations")
    public ResponseEntity<List<Map<String, Object>>> getEvaluationOverview() {
        return ResponseEntity.ok(adminService.getEvaluationOverview());
    }

    @PostMapping("/evaluations/{defenseId}/grade")
    public ResponseEntity<?> gradeDefenseEvaluation(@PathVariable Long defenseId,
                                                   @RequestBody Map<String, String> body) {
        return ResponseEntity.badRequest().body(Map.of(
                "message", "Admin chỉ giám sát. Chấm điểm hội đồng do Committee thực hiện."));
    }

    @GetMapping("/reports")
    public ResponseEntity<Map<String, Object>> getReports() {
        return ResponseEntity.ok(adminService.getReports());
    }

    @GetMapping("/final-grades")
    public ResponseEntity<Map<String, Object>> getFinalGrades(
            @RequestParam(required = false) Long semesterId,
            @RequestParam(required = false, defaultValue = "ALL") String result,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "ALL") String mentorFilter) {
        return ResponseEntity.ok(adminFinalGradeService.getFinalGradeSummary(semesterId, result, search, mentorFilter));
    }

    @PostMapping("/final-grades/ai-load")
    public ResponseEntity<?> aiLoadFinalGrades(@RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(adminFinalGradeService.aiLoadStudents(body.get("query")));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/final-grades/publish")
    public ResponseEntity<?> publishFinalGrades(@RequestBody Map<String, Object> body) {
        try {
            Long semesterId = body.get("semesterId") != null
                    ? Long.parseLong(body.get("semesterId").toString()) : null;
            Long adminId = body.get("adminId") != null
                    ? Long.parseLong(body.get("adminId").toString()) : null;
            return ResponseEntity.ok(adminFinalGradeService.publishGrades(semesterId, adminId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
