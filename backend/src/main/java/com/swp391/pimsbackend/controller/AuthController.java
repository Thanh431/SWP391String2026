package com.swp391.pimsbackend.controller;

import com.swp391.pimsbackend.model.User;
import com.swp391.pimsbackend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        String role = body.get("role");

        if (username == null || password == null || role == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin đăng nhập."));
        }

        return userService.findByUsername(username.trim().toLowerCase())
                .filter(user -> user.getPassword().equals(password))
                .filter(user -> user.getRole().equals(role))
                .map(user -> {
                    if (!user.isApproved() && !"Admin".equals(user.getRole())) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Tài khoản chưa được duyệt."));
                    }
                    return ResponseEntity.ok(user);
                })
                .orElse(ResponseEntity.badRequest().body(Map.of("message", "Email hoặc mật khẩu không đúng.")));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        String role = body.get("role");

        if (username == null || password == null || role == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin đăng ký."));
        }

        if (!"Student".equals(role)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Chỉ hỗ trợ đăng ký cho Student tại đây."));
        }

        if (userService.findByUsername(username.trim().toLowerCase()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tài khoản đã tồn tại."));
        }

        User user = new User(
                username.trim().toLowerCase(),
                password,
                role,
                true,
                false,
                null,
                null,
                null
        );

        User saved = userService.save(user);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/create")
    public ResponseEntity<?> create(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        String role = body.get("role");

        if (username == null || password == null || role == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin tạo tài khoản."));
        }

        if ("Admin".equals(role) || "Student".equals(role)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Chỉ Admin mới được tạo Mentor hoặc Committee."));
        }

        if (userService.findByUsername(username.trim().toLowerCase()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tài khoản đã tồn tại."));
        }

        User user = new User(
                username.trim().toLowerCase(),
                password,
                role,
                false,
                false,
                null,
                null,
                null
        );

        User saved = userService.save(user);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<User>> pendingAccounts() {
        return ResponseEntity.ok(userService.findPendingAccounts());
    }

    @PutMapping("/approve/{id}")
    public ResponseEntity<?> approve(@PathVariable Long id) {
        return userService.approve(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String fullName = body.get("fullName");
        String phone = body.get("phone");
        String department = body.get("department");
        String className = body.get("className");
        String semester = body.get("semester");
        String campus = body.get("campus");
        String avatarUrl = body.get("avatarUrl");

        if (username == null || fullName == null || phone == null || department == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin bắt buộc."));
        }

        return userService.updateProfile(username.trim().toLowerCase(), fullName, phone, department, className, semester, campus, avatarUrl)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
