package com.swp391.pimsbackend.repository;

import com.swp391.pimsbackend.model.DefenseSchedule;
import com.swp391.pimsbackend.model.Semester;
import com.swp391.pimsbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DefenseScheduleRepository extends JpaRepository<DefenseSchedule, Long> {
    List<DefenseSchedule> findAllByOrderByDefenseDateAsc();
    List<DefenseSchedule> findBySemesterOrderByDefenseDateAsc(Semester semester);
    List<DefenseSchedule> findByCommitteeOrderByDefenseDateAsc(User committee);
}
