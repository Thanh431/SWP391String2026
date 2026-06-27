package com.swp391.pimsbackend.service;

import com.swp391.pimsbackend.model.MentorClass;
import com.swp391.pimsbackend.model.Semester;
import com.swp391.pimsbackend.model.StudentGroup;
import com.swp391.pimsbackend.repository.SemesterRepository;
import org.springframework.stereotype.Service;

@Service
public class SemesterLookupService {

    private final SemesterRepository semesterRepository;

    public SemesterLookupService(SemesterRepository semesterRepository) {
        this.semesterRepository = semesterRepository;
    }

    public Semester resolveForMentorClass(MentorClass mentorClass) {
        if (mentorClass != null && mentorClass.getSemester() != null && !mentorClass.getSemester().isBlank()) {
            String label = mentorClass.getSemester().trim();
            return semesterRepository.findAll().stream()
                    .filter(s -> label.equalsIgnoreCase(s.getName()) || label.equalsIgnoreCase(s.getCode()))
                    .findFirst()
                    .orElseGet(this::fallbackSemester);
        }
        return fallbackSemester();
    }

    public void applyLegacySqlServerFields(StudentGroup group, MentorClass mentorClass) {
        group.setSemester(resolveForMentorClass(mentorClass));
        if (group.getStatus() == null || group.getStatus().isBlank()) {
            group.setStatus("Recruiting");
        }
    }

    private Semester fallbackSemester() {
        return semesterRepository.findAllByOrderByStartDateDesc().stream()
                .filter(s -> "Active".equalsIgnoreCase(s.getStatus()))
                .findFirst()
                .orElseGet(() -> semesterRepository.findAllByOrderByStartDateDesc().stream()
                        .findFirst()
                        .orElseThrow(() -> new IllegalStateException(
                                "Chưa có kỳ học trong hệ thống. Admin cần tạo Semester trước.")));
    }
}
