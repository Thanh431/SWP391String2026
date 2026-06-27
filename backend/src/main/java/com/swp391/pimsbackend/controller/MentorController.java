package com.swp391.pimsbackend.controller;

import com.swp391.pimsbackend.model.MentorRequest;
import com.swp391.pimsbackend.model.Submission;
import com.swp391.pimsbackend.service.MentorService;
import com.swp391.pimsbackend.service.TopicGroupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mentor")
@CrossOrigin(origins = "*")
public class MentorController {

    private final MentorService mentorService;
    private final TopicGroupService topicGroupService;

    public MentorController(MentorService mentorService, TopicGroupService topicGroupService) {
        this.mentorService = mentorService;
        this.topicGroupService = topicGroupService;
    }

    @GetMapping("/dashboard/{mentorId}")
    public ResponseEntity<?> getDashboard(@PathVariable Long mentorId) {
        try {
            return ResponseEntity.ok(mentorService.getDashboard(mentorId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/classes/{mentorId}")
    public ResponseEntity<?> getClasses(@PathVariable Long mentorId) {
        try {
            return ResponseEntity.ok(mentorService.getClasses(mentorId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/classes/{mentorId}/{slug}")
    public ResponseEntity<?> getClassDetail(@PathVariable Long mentorId, @PathVariable String slug) {
        return mentorService.getClassDetail(mentorId, slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/requests/{mentorId}")
    public ResponseEntity<?> getRequests(@PathVariable Long mentorId) {
        try {
            return ResponseEntity.ok(mentorService.getMentorRequests(mentorId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/requests/{mentorId}/{requestId}/accept")
    public ResponseEntity<?> acceptRequest(@PathVariable Long mentorId, @PathVariable Long requestId) {
        try {
            MentorRequest request = mentorService.acceptRequest(mentorId, requestId);
            return ResponseEntity.ok(Map.of("message", "Đã chấp nhận yêu cầu.", "request", request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/requests/{mentorId}/{requestId}/decline")
    public ResponseEntity<?> declineRequest(@PathVariable Long mentorId,
                                            @PathVariable Long requestId,
                                            @RequestBody(required = false) Map<String, String> body) {
        try {
            String reason = body != null ? body.get("reason") : null;
            MentorRequest request = mentorService.declineRequest(mentorId, requestId, reason);
            return ResponseEntity.ok(Map.of("message", "Đã từ chối yêu cầu.", "request", request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/review-queue/{mentorId}")
    public ResponseEntity<?> getReviewQueue(@PathVariable Long mentorId) {
        try {
            return ResponseEntity.ok(mentorService.getReviewQueue(mentorId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/review-queue/{mentorId}/{submissionId}/grade")
    public ResponseEntity<?> gradeSubmission(@PathVariable Long mentorId,
                                             @PathVariable Long submissionId,
                                             @RequestBody Map<String, String> body) {
        try {
            String feedback = body.get("feedback");
            String rating = body.getOrDefault("rating", "Good");
            Double score = null;
            if (body.get("score") != null && !body.get("score").isBlank()) {
                score = Double.parseDouble(body.get("score"));
            }
            if (feedback == null || feedback.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Feedback không được để trống."));
            }
            Submission submission = mentorService.gradeSubmission(mentorId, submissionId, feedback.trim(), rating, score);
            return ResponseEntity.ok(submission);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/progress/{mentorId}")
    public ResponseEntity<?> getProgress(@PathVariable Long mentorId) {
        try {
            return ResponseEntity.ok(mentorService.getProgressGroups(mentorId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/classes/{mentorId}/{slug}/topics")
    public ResponseEntity<?> getClassTopics(@PathVariable Long mentorId, @PathVariable String slug) {
        try {
            return ResponseEntity.ok(topicGroupService.getMentorTopics(mentorId, slug));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/classes/{mentorId}/{slug}/topics")
    public ResponseEntity<?> createClassTopic(@PathVariable Long mentorId,
                                              @PathVariable String slug,
                                              @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(topicGroupService.createTopic(mentorId, slug, body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/classes/{mentorId}/topics/{topicId}")
    public ResponseEntity<?> deleteClassTopic(@PathVariable Long mentorId, @PathVariable Long topicId) {
        try {
            topicGroupService.deleteTopic(mentorId, topicId);
            return ResponseEntity.ok(Map.of("message", "Đã xóa đề tài nhóm."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
