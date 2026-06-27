package com.swp391.pimsbackend.controller;

import com.swp391.pimsbackend.model.User;
import com.swp391.pimsbackend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("message", "User endpoint"));
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<List<User>> getUsersByRole(@PathVariable String role) {
        return ResponseEntity.ok(userService.findByRole(role));
    }

    @GetMapping("/mentors")
    public ResponseEntity<List<User>> getAllMentors() {
        return ResponseEntity.ok(userService.findByRole("Mentor"));
    }

    @GetMapping("/students")
    public ResponseEntity<List<User>> getAllStudents() {
        return ResponseEntity.ok(userService.findByRole("Student"));
    }

    @GetMapping("/committee")
    public ResponseEntity<List<User>> getAllCommittee() {
        return ResponseEntity.ok(userService.findByRole("Committee"));
    }

    @GetMapping("/approved")
    public ResponseEntity<List<User>> getApprovedUsers() {
        return ResponseEntity.ok(userService.findApprovedUsers());
    }
}
