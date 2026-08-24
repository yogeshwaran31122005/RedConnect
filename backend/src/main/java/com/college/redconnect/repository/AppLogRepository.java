package com.college.redconnect.repository;

import com.college.redconnect.model.entity.AppLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppLogRepository extends JpaRepository<AppLog, Long> {
    List<AppLog> findAllByOrderByTimestampDesc();
    List<AppLog> findTop50ByOrderByTimestampDesc();
}
