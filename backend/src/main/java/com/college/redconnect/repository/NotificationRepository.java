package com.college.redconnect.repository;

import com.college.redconnect.model.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserEmailOrderByIdDesc(String userEmail);

    List<Notification> findByUserEmailAndReadFalse(String userEmail);
}