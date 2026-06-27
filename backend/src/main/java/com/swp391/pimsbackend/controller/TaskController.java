package com.swp391.pimsbackend.controller;

import com.swp391.pimsbackend.model.Task;
import com.swp391.pimsbackend.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<List<Task>> getAllTasks() {
        return ResponseEntity.ok(taskService.findByProjectId(null));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTaskById(@PathVariable Long id) {
        return taskService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<Task>> getTasksByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(taskService.findByProjectId(projectId));
    }

    @GetMapping("/project/{projectId}/status/{status}")
    public ResponseEntity<List<Task>> getTasksByProjectAndStatus(@PathVariable Long projectId, @PathVariable String status) {
        return ResponseEntity.ok(taskService.findByProjectIdAndStatus(projectId, status));
    }

    @GetMapping("/assigned/{userId}")
    public ResponseEntity<List<Task>> getTasksAssignedToUser(@PathVariable Long userId) {
        return ResponseEntity.ok(taskService.findByAssignedToId(userId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Task>> getTasksByStatus(@PathVariable String status) {
        return ResponseEntity.ok(taskService.findByStatus(status));
    }

    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody Task task) {
        if (task.getTitle() == null || task.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tiêu đề công việc không được để trống."));
        }
        if (task.getProject() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Dự án không được để trống."));
        }
        try {
            Task saved = taskService.save(task);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Lỗi khi tạo công việc."));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(@PathVariable Long id, @RequestBody Task task) {
        return taskService.updateTask(id, task)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Trạng thái không được để trống."));
        }
        return taskService.findById(id).map(task -> {
            task.setStatus(status);
            taskService.save(task);
            return ResponseEntity.ok(task);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/progress")
    public ResponseEntity<?> updateProgress(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        Integer progress = body.get("progress");
        if (progress == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tiến độ không được để trống."));
        }
        taskService.updateProgress(id, progress);
        return taskService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id) {
        if (taskService.deleteById(id)) {
            return ResponseEntity.ok(Map.of("message", "Công việc đã được xóa."));
        }
        return ResponseEntity.notFound().build();
    }
}
