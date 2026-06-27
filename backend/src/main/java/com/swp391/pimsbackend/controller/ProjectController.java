package com.swp391.pimsbackend.controller;

import com.swp391.pimsbackend.model.Project;
import com.swp391.pimsbackend.service.ProjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects() {
        return ResponseEntity.ok(projectService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProjectById(@PathVariable Long id) {
        return projectService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<Project>> getProjectsByGroup(@PathVariable String groupId) {
        return ResponseEntity.ok(projectService.findByGroupId(groupId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Project>> getProjectsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(projectService.findByStatus(status));
    }

    @GetMapping("/mentor/{mentorId}")
    public ResponseEntity<List<Project>> getProjectsByMentor(@PathVariable Long mentorId) {
        return ResponseEntity.ok(projectService.findByMentorId(mentorId));
    }

    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody Project project) {
        if (project.getName() == null || project.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tên dự án không được để trống."));
        }
        try {
            Project saved = projectService.save(project);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Lỗi khi tạo dự án."));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(@PathVariable Long id, @RequestBody Project project) {
        return projectService.updateProject(id, project)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/progress")
    public ResponseEntity<?> updateProgress(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        Integer progress = body.get("progress");
        if (progress == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tiến độ không được để trống."));
        }
        projectService.updateProgress(id, progress);
        return projectService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable Long id) {
        if (projectService.deleteById(id)) {
            return ResponseEntity.ok(Map.of("message", "Dự án đã được xóa."));
        }
        return ResponseEntity.notFound().build();
    }
}
