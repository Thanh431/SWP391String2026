package com.swp391.pimsbackend.config;

import com.swp391.pimsbackend.model.StudentGroup;
import com.swp391.pimsbackend.service.SemesterLookupService;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class StudentGroupEntityListener {

    private static SemesterLookupService semesterLookupService;

    @Autowired
    public void setSemesterLookupService(SemesterLookupService semesterLookupService) {
        StudentGroupEntityListener.semesterLookupService = semesterLookupService;
    }

    @PrePersist
    @PreUpdate
    public void ensureLegacyFields(StudentGroup group) {
        if (semesterLookupService == null) {
            return;
        }
        if (group.getSemester() == null && group.getMentorClass() != null) {
            semesterLookupService.applyLegacySqlServerFields(group, group.getMentorClass());
        } else if (group.getStatus() == null || group.getStatus().isBlank()) {
            group.setStatus("Recruiting");
        }
    }
}
