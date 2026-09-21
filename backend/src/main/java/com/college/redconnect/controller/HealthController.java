package com.college.redconnect.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public health endpoints for hosting platforms (e.g. Render health checks).
 * Both paths are permitAll in {@code SecurityConfig} and always return 200
 * when the app is up - no database access involved.
 */
@RestController
public class HealthController {

    @GetMapping("/")
    public Map<String, String> root() {
        return Map.of("status", "UP", "service", "redconnect");
    }

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}
