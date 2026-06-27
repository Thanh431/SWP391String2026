package com.swp391.pimsbackend.service;

import com.swp391.pimsbackend.model.User;
import com.swp391.pimsbackend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public UserService(UserRepository userRepository, NotificationService notificationService) {
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username.trim().toLowerCase());
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public List<User> findPendingAccounts() {
        return userRepository.findByApprovedFalse();
    }

    public Optional<User> approve(Long userId) {
        return userRepository.findById(userId).map(user -> {
            user.setApproved(true);
            User savedUser = userRepository.save(user);
            try {
                notificationService.sendNotification(
                        savedUser.getId(), 
                        "Tài khoản được phê duyệt", 
                        "Tài khoản của bạn đã được phê duyệt thành công bởi Quản trị viên."
                );
            } catch (Exception e) {
                // Prevent notification failure from blocking approval
            }
            return savedUser;
        });
    }

    public Optional<User> updateProfile(String username, String fullName, String phone, String department, 
                                         String className, String semester, String campus, String avatarUrl) {
        return findByUsername(username).map(user -> {
            user.setFullName(fullName);
            user.setPhone(phone);
            user.setDepartment(department);
            user.setClassName(className);
            user.setSemester(semester);
            user.setCampus(campus);
            user.setAvatarUrl(avatarUrl);
            user.setProfileComplete(true);
            return save(user);
        });
    }

    public List<User> findByRole(String role) {
        return userRepository.findByRole(role);
    }

    public List<User> findApprovedUsers() {
        return userRepository.findAll().stream()
                .filter(User::isApproved)
                .toList();
    }

    public long countByRole(String role) {
        return userRepository.findByRole(role).size();
    }
}
