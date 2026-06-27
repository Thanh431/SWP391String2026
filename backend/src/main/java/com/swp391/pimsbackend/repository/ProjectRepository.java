package com.swp391.pimsbackend.repository;

import com.swp391.pimsbackend.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByGroupId(String groupId);
    List<Project> findByStatus(String status);
    List<Project> findByMentor_Id(Long mentorId);
    Optional<Project> findByName(String name);
    List<Project> findAll();
    Optional<Project> findById(Long id);
}
