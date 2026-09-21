package com.college.redconnect.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    // Production frontend only. Local dev can still allow localhost via the
    // CORS_ORIGINS env var (comma-separated).
    // (Origin allowlisting is not access control - JWT still guards every API.)
    @Value("${app.cors.allowed-origins:https://redconnect-frontend.onrender.com}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Normalize entries: exact match is required, so a stray space after a
        // comma or a trailing slash ("https://x.onrender.com/") otherwise
        // breaks the origin check -> 403 on preflight.
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> s.endsWith("/") ? s.substring(0, s.length() - 1) : s)
                .toList();
        System.out.println("[CORS] Allowed origins: " + origins);
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
