package com.college.redconnect.service;

import com.college.redconnect.model.entity.AppLog;
import com.college.redconnect.repository.AppLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AppLogService {

    private static final Logger log = LoggerFactory.getLogger(AppLogService.class);
    private final AppLogRepository appLogRepository;

    public AppLogService(AppLogRepository appLogRepository) {
        this.appLogRepository = appLogRepository;
    }

    public void info(String action, String message, String actorEmail) {
        save("INFO", action, message, actorEmail);
    }

    public void warn(String action, String message, String actorEmail) {
        save("WARN", action, message, actorEmail);
    }

    public void error(String action, String message, String actorEmail) {
        save("ERROR", action, message, actorEmail);
    }

    private void save(String level, String action, String message, String actorEmail) {
        try {
            AppLog entry = new AppLog();
            entry.setLevel(level);
            entry.setAction(action);
            entry.setMessage(message);
            entry.setActorEmail(actorEmail);
            entry.setTimestamp(LocalDateTime.now());
            appLogRepository.save(entry);
        } catch (Exception ex) {
            log.warn("Failed to persist app log: {}", ex.getMessage());
        }
        log.info("[{}] {} by {}: {}", level, action, actorEmail != null ? actorEmail : "system", message);
    }

    public List<AppLog> getAll() {
        return appLogRepository.findAllByOrderByTimestampDesc();
    }

    public List<AppLog> getRecent() {
        return appLogRepository.findTop50ByOrderByTimestampDesc();
    }
}
