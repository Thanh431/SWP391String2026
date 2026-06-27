package com.swp391.pimsbackend.controller;

import com.swp391.pimsbackend.model.MentorRequest;
import com.swp391.pimsbackend.service.MentorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mentor-requests")
@CrossOrigin(origins = "*")
public class MentorRequestController {

    private final MentorService mentorService;

    public MentorRequestController(MentorService mentorService) {
        this.mentorService = mentorService;
    }

    @GetMapping("/mentors")
    public ResponseEntity<List<Map<String, Object>>> getAvailableMentors() {
        return ResponseEntity.ok(mentorService.getAvailableMentors());
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getStudentRequests(@PathVariable Long studentId) {
        try {
            return ResponseEntity.ok(mentorService.getStudentRequests(studentId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createRequest(@RequestBody Map<String, String> body) {
        try {
            Long mentorId = Long.parseLong(body.get("mentorId"));
            Long studentId = Long.parseLong(body.get("studentId"));
            MentorRequest saved = mentorService.createRequest(mentorId, studentId, body);
            return ResponseEntity.ok(saved);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu mentorId hoặc studentId."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
