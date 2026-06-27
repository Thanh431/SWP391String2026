package com.swp391.pimsbackend.repository;

import com.swp391.pimsbackend.model.ClassEnrollment;
import com.swp391.pimsbackend.model.MentorClass;
import com.swp391.pimsbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClassEnrollmentRepository extends JpaRepository<ClassEnrollment, Long> {
    List<ClassEnrollment> findByStudentOrderByEnrolledAtDesc(User student);
    List<ClassEnrollment> findByMentorClassOrderByEnrolledAtAsc(MentorClass mentorClass);
    long countByMentorClass(MentorClass mentorClass);
    boolean existsByStudentAndMentorClass(User student, MentorClass mentorClass);
    Optional<ClassEnrollment> findByStudentAndMentorClass(User student, MentorClass mentorClass);
}
