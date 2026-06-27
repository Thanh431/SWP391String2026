package com.swp391.pimsbackend.service;

import com.swp391.pimsbackend.model.Notification;
import com.swp391.pimsbackend.model.User;
import com.swp391.pimsbackend.repository.NotificationRepository;
import com.swp391.pimsbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    private User testUser;
    private Notification testNotification;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("student@fpt.edu.vn");

        testNotification = new Notification(testUser, "Test Title", "Test Message");
        testNotification.setId(100L);
    }

    @Test
    void testSendNotification_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        Notification saved = notificationService.sendNotification(1L, "Test Title", "Test Message");

        assertNotNull(saved);
        assertEquals(100L, saved.getId());
        assertEquals("Test Title", saved.getTitle());
        assertEquals("Test Message", saved.getMessage());
        assertEquals(testUser, saved.getUser());
        verify(userRepository, times(1)).findById(1L);
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    void testSendNotification_UserNotFound() {
        when(userRepository.findById(2L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> {
            notificationService.sendNotification(2L, "Title", "Msg");
        });

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void testGetUnreadNotifications() {
        List<Notification> list = Arrays.asList(testNotification);
        when(notificationRepository.findByUserIdAndIsReadFalse(1L)).thenReturn(list);

        List<Notification> result = notificationService.getUnreadNotifications(1L);

        assertEquals(1, result.size());
        assertEquals(100L, result.get(0).getId());
        verify(notificationRepository, times(1)).findByUserIdAndIsReadFalse(1L);
    }

    @Test
    void testGetAllNotifications() {
        List<Notification> list = Arrays.asList(testNotification);
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(list);

        List<Notification> result = notificationService.getAllNotifications(1L);

        assertEquals(1, result.size());
        assertEquals(100L, result.get(0).getId());
        verify(notificationRepository, times(1)).findByUserIdOrderByCreatedAtDesc(1L);
    }

    @Test
    void testMarkAsRead() {
        when(notificationRepository.findById(100L)).thenReturn(Optional.of(testNotification));

        notificationService.markAsRead(100L);

        assertTrue(testNotification.isRead());
        verify(notificationRepository, times(1)).save(testNotification);
    }

    @Test
    void testMarkAllAsRead() {
        Notification notification2 = new Notification(testUser, "Title 2", "Msg 2");
        List<Notification> list = Arrays.asList(testNotification, notification2);
        when(notificationRepository.findByUserIdAndIsReadFalse(1L)).thenReturn(list);

        notificationService.markAllAsRead(1L);

        assertTrue(testNotification.isRead());
        assertTrue(notification2.isRead());
        verify(notificationRepository, times(2)).save(any(Notification.class));
    }

    @Test
    void testDeleteNotification() {
        doNothing().when(notificationRepository).deleteById(100L);

        notificationService.deleteNotification(100L);

        verify(notificationRepository, times(1)).deleteById(100L);
    }
}
