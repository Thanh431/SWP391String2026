package com.swp391.pimsbackend.repository;

import com.swp391.pimsbackend.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectId(Long projectId);
    List<Task> findByStatus(String status);
    List<Task> findByAssignedToId(Long userId);
    List<Task> findByProjectIdAndStatus(Long projectId, String status);
    Optional<Task> findById(Long id);
}
