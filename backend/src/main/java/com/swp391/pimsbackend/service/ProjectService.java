package com.swp391.pimsbackend.service;

import com.swp391.pimsbackend.model.Project;
import com.swp391.pimsbackend.model.TopicGroup;
import com.swp391.pimsbackend.model.TopicGroupMember;
import com.swp391.pimsbackend.repository.ProjectRepository;
import com.swp391.pimsbackend.repository.TopicGroupRepository;
import com.swp391.pimsbackend.repository.TopicGroupMemberRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final NotificationService notificationService;
    private final TopicGroupRepository topicGroupRepository;
    private final TopicGroupMemberRepository topicGroupMemberRepository;

    public ProjectService(ProjectRepository projectRepository,
                          NotificationService notificationService,
                          TopicGroupRepository topicGroupRepository,
                          TopicGroupMemberRepository topicGroupMemberRepository) {
        this.projectRepository = projectRepository;
        this.notificationService = notificationService;
        this.topicGroupRepository = topicGroupRepository;
        this.topicGroupMemberRepository = topicGroupMemberRepository;
    }

    public Project save(Project project) {
        return projectRepository.save(project);
    }

    public Optional<Project> findById(Long id) {
        return projectRepository.findById(id);
    }

    public List<Project> findAll() {
        return projectRepository.findAll();
    }

    public List<Project> findByGroupId(String groupId) {
        return projectRepository.findByGroupId(groupId);
    }

    public List<Project> findByStatus(String status) {
        return projectRepository.findByStatus(status);
    }

    public List<Project> findByMentorId(Long mentorId) {
        return projectRepository.findByMentor_Id(mentorId);
    }

    public Optional<Project> updateProject(Long id, Project updatedProject) {
        return projectRepository.findById(id).map(project -> {
            boolean statusChanged = project.getStatus() != null && !project.getStatus().equals(updatedProject.getStatus());
            boolean progressChanged = project.getProgress() != updatedProject.getProgress();

            project.setName(updatedProject.getName());
            project.setDescription(updatedProject.getDescription());
            project.setStatus(updatedProject.getStatus());
            project.setProgress(updatedProject.getProgress());
            project.setStartDate(updatedProject.getStartDate());
            project.setEndDate(updatedProject.getEndDate());
            if (updatedProject.getMentor() != null) {
                project.setMentor(updatedProject.getMentor());
            }
            Project saved = projectRepository.save(project);

            if (statusChanged || progressChanged) {
                notifyProjectUpdate(saved, statusChanged, progressChanged);
            }

            return saved;
        });
    }

    public boolean deleteById(Long id) {
        if (projectRepository.existsById(id)) {
            projectRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public void updateProgress(Long projectId, int progress) {
        projectRepository.findById(projectId).ifPresent(project -> {
            int oldProgress = project.getProgress();
            int newProgress = Math.min(100, Math.max(0, progress));
            if (oldProgress != newProgress) {
                project.setProgress(newProgress);
                Project saved = projectRepository.save(project);
                notifyProjectUpdate(saved, false, true);
            }
        });
    }

    private void notifyProjectUpdate(Project project, boolean statusChanged, boolean progressChanged) {
        try {
            topicGroupRepository.findByGroupCode(project.getGroupId()).ifPresent(topicGroup -> {
                List<TopicGroupMember> members = topicGroupMemberRepository.findByTopicGroupOrderByJoinedAtAsc(topicGroup);
                String message;
                if (statusChanged && progressChanged) {
                    message = "Dự án \"" + project.getName() + "\" đã cập nhật trạng thái thành \"" + project.getStatus() + "\" và tiến độ thành " + project.getProgress() + "%.";
                } else if (statusChanged) {
                    message = "Dự án \"" + project.getName() + "\" đã cập nhật trạng thái thành \"" + project.getStatus() + "\".";
                } else {
                    message = "Tiến độ dự án \"" + project.getName() + "\" đã được cập nhật thành " + project.getProgress() + "%.";
                }

                for (TopicGroupMember member : members) {
                    notificationService.sendNotification(
                            member.getStudent().getId(),
                            "Cập nhật dự án",
                            message
                    );
                }
            });
        } catch (Exception e) {
            // Ignore notification errors to ensure transactional safety
        }
    }
}
