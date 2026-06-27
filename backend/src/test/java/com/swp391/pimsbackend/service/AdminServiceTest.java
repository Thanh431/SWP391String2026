package com.swp391.pimsbackend.service;

import com.swp391.pimsbackend.committee.repository.CommitteePublishedResultRepository;
import com.swp391.pimsbackend.model.Semester;
import com.swp391.pimsbackend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminServiceTest {

    @Mock
    private SemesterRepository semesterRepository;
    @Mock
    private DefenseScheduleRepository defenseScheduleRepository;
    @Mock
    private StudentGroupRepository studentGroupRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private MentorClassRepository mentorClassRepository;
    @Mock
    private EvaluationRepository evaluationRepository;
    @Mock
    private CommitteePublishedResultRepository publishedResultRepository;

    @InjectMocks
    private AdminService adminService;

    private Semester testSemester;

    @BeforeEach
    void setUp() {
        testSemester = new Semester();
        testSemester.setId(1L);
        testSemester.setCode("SU2026");
        testSemester.setName("Summer 2026");
        testSemester.setDescription("Summer Semester 2026");
        testSemester.setStartDate(LocalDate.of(2026, 5, 1));
        testSemester.setEndDate(LocalDate.of(2026, 8, 31));
        testSemester.setStatus("Planning");
    }

    @Test
    void testGetSemesters() {
        List<Semester> list = Arrays.asList(testSemester);
        when(semesterRepository.findAllByOrderByStartDateDesc()).thenReturn(list);

        List<Map<String, Object>> result = adminService.getSemesters();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("SU2026", result.get(0).get("code"));
        assertEquals("Summer 2026", result.get(0).get("name"));
        verify(semesterRepository, times(1)).findAllByOrderByStartDateDesc();
    }

    @Test
    void testCreateSemester_Success() {
        Map<String, String> body = new HashMap<>();
        body.put("code", "SU2026");
        body.put("name", "Summer 2026");
        body.put("description", "Summer Semester 2026");
        body.put("startDate", "2026-05-01");
        body.put("endDate", "2026-08-31");
        body.put("status", "Planning");

        when(semesterRepository.findByCode("SU2026")).thenReturn(Optional.empty());
        when(semesterRepository.save(any(Semester.class))).thenReturn(testSemester);

        Semester created = adminService.createSemester(body);

        assertNotNull(created);
        assertEquals("SU2026", created.getCode());
        verify(semesterRepository, times(1)).findByCode("SU2026");
        verify(semesterRepository, times(1)).save(any(Semester.class));
    }

    @Test
    void testCreateSemester_DuplicateCode() {
        Map<String, String> body = new HashMap<>();
        body.put("code", "SU2026");
        body.put("name", "Summer 2026");

        when(semesterRepository.findByCode("SU2026")).thenReturn(Optional.of(testSemester));

        assertThrows(IllegalArgumentException.class, () -> {
            adminService.createSemester(body);
        });

        verify(semesterRepository, never()).save(any(Semester.class));
    }

    @Test
    void testUpdateSemester_Success() {
        Map<String, String> body = new HashMap<>();
        body.put("name", "Summer 2026 Updated");
        body.put("status", "Active");

        when(semesterRepository.findById(1L)).thenReturn(Optional.of(testSemester));
        when(semesterRepository.save(any(Semester.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Semester updated = adminService.updateSemester(1L, body);

        assertNotNull(updated);
        assertEquals("Summer 2026 Updated", updated.getName());
        assertEquals("Active", updated.getStatus());
        verify(semesterRepository, times(1)).findById(1L);
        verify(semesterRepository, times(1)).save(any(Semester.class));
    }

    @Test
    void testDeleteSemester_Success() {
        when(semesterRepository.existsById(1L)).thenReturn(true);
        doNothing().when(semesterRepository).deleteById(1L);

        adminService.deleteSemester(1L);

        verify(semesterRepository, times(1)).existsById(1L);
        verify(semesterRepository, times(1)).deleteById(1L);
    }

    @Test
    void testDeleteSemester_NotFound() {
        when(semesterRepository.existsById(2L)).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> {
            adminService.deleteSemester(2L);
        });

        verify(semesterRepository, never()).deleteById(2L);
    }
}
