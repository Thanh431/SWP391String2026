package com.swp391.pimsbackend.service;

import com.swp391.pimsbackend.model.Task;
import com.swp391.pimsbackend.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final NotificationService notificationService;

    public TaskService(TaskRepository taskRepository, NotificationService notificationService) {
        this.taskRepository = taskRepository;
        this.notificationService = notificationService;
    }

    public Task save(Task task) {
        boolean isNew = task.getId() == null;
        boolean statusChanged = false;
        if (!isNew) {
            Task existing = taskRepository.findById(task.getId()).orElse(null);
            if (existing != null && existing.getStatus() != null && !existing.getStatus().equals(task.getStatus())) {
                statusChanged = true;
            }
        }

        Task saved = taskRepository.save(task);

        if (isNew && saved.getAssignedTo() != null) {
            notifyTaskAssignment(saved);
        } else if (statusChanged) {
            notifyTaskStatusUpdate(saved);
        }
        return saved;
    }

    public Optional<Task> findById(Long id) {
        return taskRepository.findById(id);
    }

    public List<Task> findByProjectId(Long projectId) {
        return taskRepository.findByProjectId(projectId);
    }

    public List<Task> findByStatus(String status) {
        return taskRepository.findByStatus(status);
    }

    public List<Task> findByAssignedToId(Long userId) {
        return taskRepository.findByAssignedToId(userId);
    }

    public List<Task> findByProjectIdAndStatus(Long projectId, String status) {
        return taskRepository.findByProjectIdAndStatus(projectId, status);
    }

    public Optional<Task> updateTask(Long id, Task updatedTask) {
        return taskRepository.findById(id).map(task -> {
            boolean assignmentChanged = false;
            if (updatedTask.getAssignedTo() != null) {
                if (task.getAssignedTo() == null || !task.getAssignedTo().getId().equals(updatedTask.getAssignedTo().getId())) {
                    assignmentChanged = true;
                }
            }
            boolean statusChanged = task.getStatus() != null && !task.getStatus().equals(updatedTask.getStatus());

            task.setTitle(updatedTask.getTitle());
            task.setDescription(updatedTask.getDescription());
            task.setStatus(updatedTask.getStatus());
            task.setPriority(updatedTask.getPriority());
            task.setProgress(updatedTask.getProgress());
            task.setDueDate(updatedTask.getDueDate());
            if (updatedTask.getAssignedTo() != null) {
                task.setAssignedTo(updatedTask.getAssignedTo());
            }
            Task saved = taskRepository.save(task);

            if (assignmentChanged) {
                notifyTaskAssignment(saved);
            }
            if (statusChanged) {
                notifyTaskStatusUpdate(saved);
            }
            return saved;
        });
    }

    public boolean deleteById(Long id) {
        if (taskRepository.existsById(id)) {
            taskRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public void updateProgress(Long taskId, int progress) {
        taskRepository.findById(taskId).ifPresent(task -> {
            task.setProgress(Math.min(100, Math.max(0, progress)));
            taskRepository.save(task);
        });
    }

    private void notifyTaskAssignment(Task task) {
        try {
            if (task.getAssignedTo() != null && task.getProject() != null) {
                notificationService.sendNotification(
                        task.getAssignedTo().getId(),
                        "Phân công công việc mới",
                        "Bạn đã được phân công công việc mới: \"" + task.getTitle() + "\" trong dự án \"" + task.getProject().getName() + "\"."
                );
            }
        } catch (Exception e) {
            // Ignore error to prevent breaking standard operations
        }
    }

    private void notifyTaskStatusUpdate(Task task) {
        try {
            if (task.getProject() != null && task.getProject().getMentor() != null) {
                notificationService.sendNotification(
                        task.getProject().getMentor().getId(),
                        "Cập nhật trạng thái công việc",
                        "Công việc \"" + task.getTitle() + "\" trong dự án \"" + task.getProject().getName() + "\" đã được chuyển sang trạng thái \"" + task.getStatus() + "\"."
                );
            }
        } catch (Exception e) {
            // Ignore error
        }
    }
}
