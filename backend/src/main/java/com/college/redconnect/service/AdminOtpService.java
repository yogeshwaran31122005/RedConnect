package com.college.redconnect.service;

import com.college.redconnect.config.security.JwtUtil;
import com.college.redconnect.dto.response.LoginResponse;
import com.college.redconnect.exception.BadCredentialsException;
import com.college.redconnect.exception.ResourceNotFoundException;
import com.college.redconnect.model.entity.User;
import com.college.redconnect.model.entity.UserRole;
import com.college.redconnect.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AdminOtpService {

    private static final Logger log = LoggerFactory.getLogger(AdminOtpService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final AppLogService appLogService;

    private final String mailtrapApiKey;
    private final String fromEmail;
    private final String fromName;
    private final long otpExpiryMinutes;

    // In-memory OTP store: email -> OtpEntry
    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    private record OtpEntry(String code, Instant expiresAt) {}

    public AdminOtpService(UserRepository userRepository, JwtUtil jwtUtil, AppLogService appLogService,
                           @Value("${app.mailtrap.api-key}") String mailtrapApiKey,
                           @Value("${app.mailtrap.from-email}") String fromEmail,
                           @Value("${app.mailtrap.from-name}") String fromName,
                           @Value("${app.admin.otp-expiry-minutes}") long otpExpiryMinutes) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.appLogService = appLogService;
        this.mailtrapApiKey = mailtrapApiKey;
        this.fromEmail = fromEmail;
        this.fromName = fromName;
        this.otpExpiryMinutes = otpExpiryMinutes;
    }

    public String sendOtp(String rawEmail) {
        String email = rawEmail.trim().toLowerCase();
        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Admin account not found"));
        if (admin.getRole() != UserRole.ADMIN) {
            throw new BadCredentialsException("This email is not an admin account");
        }

        String otp = String.format("%04d", RANDOM.nextInt(10_000));
        Instant expiresAt = Instant.now().plusSeconds(otpExpiryMinutes * 60);
        otpStore.put(email, new OtpEntry(otp, expiresAt));

        log.info("Generated OTP for admin {} expires at {}", email, expiresAt);
        appLogService.info("ADMIN_OTP_SENT", "OTP sent to " + email, email);

        // Try Mailtrap API (https://send.api.mailtrap.io/api/send), fallback to log if fails (dev / no internet)
        try {
            String json = """
                    {
                      "from": {"email": "%s", "name": "%s"},
                      "to": [{"email": "%s"}],
                      "subject": "RedConnect Admin OTP - %s",
                      "text": "Your RedConnect admin login OTP is: %s\\nIt expires in %d minutes.\\nIf you did not request this, ignore this email.",
                      "category": "Admin OTP"
                    }
                    """.formatted(escapeJson(fromEmail), escapeJson(fromName), escapeJson(email), escapeJson(otp), escapeJson(otp), otpExpiryMinutes);
            HttpClient http = HttpClient.newHttpClient();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("https://send.api.mailtrap.io/api/send"))
                    .header("Authorization", "Bearer " + mailtrapApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();
            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            log.info("Mailtrap send for {} status {} body {}", email, resp.statusCode(), resp.body());
            if (resp.statusCode() >= 400) {
                log.warn("Mailtrap returned non-2xx for {}: {}", email, resp.body());
                System.out.println("[RedConnect] ADMIN OTP for " + email + " = " + otp + " (Mailtrap non-2xx, check api key)");
            }
        } catch (Exception ex) {
            log.warn("Mailtrap send failed for {}: {} - OTP is {} (use this for testing)", email, ex.getMessage(), otp);
            System.out.println("[RedConnect] ADMIN OTP for " + email + " = " + otp);
        }
        return otp;
    }

    public LoginResponse verifyOtp(String rawEmail, String code) {
        String email = rawEmail.trim().toLowerCase();
        OtpEntry entry = otpStore.get(email);
        if (entry == null) {
            throw new BadCredentialsException("No OTP found. Please request a new one.");
        }
        if (Instant.now().isAfter(entry.expiresAt())) {
            otpStore.remove(email);
            throw new BadCredentialsException("OTP expired. Please request a new one.");
        }
        if (!entry.code().equals(code.trim())) {
            throw new BadCredentialsException("Invalid OTP");
        }
        otpStore.remove(email);

        User admin = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Admin account not found"));
        if (admin.getRole() != UserRole.ADMIN) {
            throw new BadCredentialsException("This email is not an admin account");
        }

        String token = jwtUtil.generateToken(admin.getEmail(), admin.getRole());
        appLogService.info("ADMIN_LOGIN", "Admin logged in via OTP", email);
        return LoginResponse.of(admin, token, jwtUtil.getExpirationMs());
    }

    private String escapeJson(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    // For testing / debugging: get current OTP (not exposed via API)
    public String peekOtpForTesting(String email) {
        OtpEntry e = otpStore.get(email.trim().toLowerCase());
        return e == null ? null : e.code();
    }
}
