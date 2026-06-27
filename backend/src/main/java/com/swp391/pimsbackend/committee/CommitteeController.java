package com.swp391.pimsbackend.committee;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/committee")
@CrossOrigin(origins = "*")
public class CommitteeController {

    private final CommitteeService committeeService;

    public CommitteeController(CommitteeService committeeService) {
        this.committeeService = committeeService;
    }

    @GetMapping("/dashboard/{committeeId}")
    public ResponseEntity<?> getDashboard(@PathVariable Long committeeId) {
        return handle(() -> committeeService.getDashboardStats(committeeId));
    }

    @GetMapping("/feedbacks/{committeeId}")
    public ResponseEntity<?> getFeedbacks(@PathVariable Long committeeId) {
        return handle(() -> committeeService.getFeedbacks(committeeId));
    }

    @GetMapping("/feedbacks")
    public ResponseEntity<?> getFeedbacksQuery(@RequestParam(required = false) Long committeeId) {
        if (committeeId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu committeeId."));
        }
        return handle(() -> committeeService.getFeedbacks(committeeId));
    }

    @GetMapping("/schedules/{committeeId}")
    public ResponseEntity<?> getSchedules(@PathVariable Long committeeId) {
        return handle(() -> committeeService.getSchedules(committeeId));
    }

    @GetMapping("/schedules")
    public ResponseEntity<?> getSchedulesQuery(@RequestParam(required = false) Long committeeId) {
        if (committeeId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu committeeId."));
        }
        return handle(() -> committeeService.getSchedules(committeeId));
    }

    @GetMapping("/evaluations/{committeeId}")
    public ResponseEntity<?> getEvaluations(@PathVariable Long committeeId) {
        return handle(() -> committeeService.getEvaluationItems(committeeId));
    }

    @GetMapping("/evaluations/{committeeId}/stats")
    public ResponseEntity<?> getEvaluationStats(@PathVariable Long committeeId) {
        return handle(() -> committeeService.getEvaluationStats(committeeId));
    }

    @PostMapping("/evaluations/{committeeId}")
    public ResponseEntity<?> submitEvaluation(@PathVariable Long committeeId,
                                              @RequestBody Map<String, String> body) {
        return handle(() -> committeeService.submitEvaluation(committeeId, body));
    }

    @GetMapping("/reports/{committeeId}/pending")
    public ResponseEntity<?> getPendingReports(@PathVariable Long committeeId) {
        return handle(() -> committeeService.getPendingReports(committeeId));
    }

    @PutMapping("/reports/{committeeId}/{submissionId}/review")
    public ResponseEntity<?> reviewReport(@PathVariable Long committeeId,
                                            @PathVariable Long submissionId,
                                            @RequestBody Map<String, String> body) {
        return handle(() -> committeeService.reviewReport(committeeId, submissionId, body));
    }

    @GetMapping("/published-results/{committeeId}")
    public ResponseEntity<?> getPublishedResults(@PathVariable Long committeeId) {
        return handle(() -> committeeService.getPublishedResults(committeeId));
    }

    @PostMapping("/published-results/{committeeId}/{defenseId}")
    public ResponseEntity<?> publishResult(@PathVariable Long committeeId,
                                             @PathVariable Long defenseId) {
        return handle(() -> committeeService.publishResult(committeeId, defenseId));
    }

    @DeleteMapping("/published-results/{committeeId}/{defenseId}")
    public ResponseEntity<?> unpublishResult(@PathVariable Long committeeId,
                                               @PathVariable Long defenseId) {
        return handle(() -> committeeService.unpublishResult(committeeId, defenseId));
    }

    @GetMapping("/archives/{committeeId}")
    public ResponseEntity<?> getArchives(@PathVariable Long committeeId) {
        return handle(() -> committeeService.getProjectArchives(committeeId));
    }

    @GetMapping("/reports/{committeeId}/summary")
    public ResponseEntity<?> getReportsSummary(@PathVariable Long committeeId) {
        return handle(() -> committeeService.getReportsSummary(committeeId));
    }

    @GetMapping("/export/{committeeId}")
    public ResponseEntity<?> exportReport(@PathVariable Long committeeId) {
        return handle(() -> committeeService.exportReportData(committeeId));
    }

    private ResponseEntity<?> handle(SupplierWithException supplier) {
        try {
            Object result = supplier.get();
            if (result instanceof List) {
                return ResponseEntity.ok(result);
            }
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @FunctionalInterface
    private interface SupplierWithException {
        Object get();
    }
}
