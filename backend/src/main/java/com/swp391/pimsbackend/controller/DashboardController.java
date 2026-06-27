package com.swp391.pimsbackend.controller;

import com.swp391.pimsbackend.repository.MentorClassRepository;
import com.swp391.pimsbackend.repository.StudentGroupRepository;
import com.swp391.pimsbackend.service.ProjectService;
import com.swp391.pimsbackend.service.TaskService;
import com.swp391.pimsbackend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final UserService userService;
    private final ProjectService projectService;
    private final TaskService taskService;
    private final StudentGroupRepository studentGroupRepository;
    private final MentorClassRepository mentorClassRepository;

    public DashboardController(UserService userService, ProjectService projectService, TaskService taskService,
                               StudentGroupRepository studentGroupRepository,
                               MentorClassRepository mentorClassRepository) {
        this.userService = userService;
        this.projectService = projectService;
        this.taskService = taskService;
        this.studentGroupRepository = studentGroupRepository;
        this.mentorClassRepository = mentorClassRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        stats.put("totalStudents", userService.countByRole("Student"));
        stats.put("totalMentors", userService.countByRole("Mentor"));
        stats.put("totalCommittee", userService.countByRole("Committee"));
        stats.put("totalProjects", projectService.findAll().size());
        stats.put("activeProjects", projectService.findByStatus("In Progress").size());
        stats.put("completedProjects", projectService.findByStatus("Completed").size());
        stats.put("onHoldProjects", projectService.findByStatus("On Hold").size());
        stats.put("pendingAccounts", userService.findPendingAccounts().size());
        stats.put("totalGroups", studentGroupRepository.count());
        stats.put("totalClasses", mentorClassRepository.count());

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/user/{userId}/stats")
    public ResponseEntity<Map<String, Object>> getUserStats(@PathVariable Long userId) {
        Map<String, Object> stats = new HashMap<>();
        
        stats.put("assignedTasks", taskService.findByAssignedToId(userId).size());
        stats.put("completedTasks", taskService.findByAssignedToId(userId).stream()
                .filter(t -> "Completed".equals(t.getStatus()))
                .count());
        stats.put("inProgressTasks", taskService.findByAssignedToId(userId).stream()
                .filter(t -> "In Progress".equals(t.getStatus()))
                .count());
        
        return ResponseEntity.ok(stats);
    }
}
