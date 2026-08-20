package com.college.redconnect.controller;

import com.college.redconnect.dto.request.AdminSendOtpRequest;
import com.college.redconnect.dto.request.AdminVerifyOtpRequest;
import com.college.redconnect.dto.request.LoginRequest;
import com.college.redconnect.dto.request.RegisterRequest;
import com.college.redconnect.dto.response.ApiResponse;
import com.college.redconnect.dto.response.LoginResponse;
import com.college.redconnect.dto.response.UserProfileResponse;
import com.college.redconnect.service.AdminOtpService;
import com.college.redconnect.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AdminOtpService adminOtpService;

    public AuthController(AuthService authService, AdminOtpService adminOtpService) {
        this.authService = authService;
        this.adminOtpService = adminOtpService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@Valid @RequestBody RegisterRequest request) {
        LoginResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Account created successfully", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse> me(Authentication authentication) {
        UserProfileResponse response = authService.me(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("Profile loaded", response));
    }

    // ---- Admin OTP (Mailtrap) ----

    @PostMapping("/admin/send-otp")
    public ResponseEntity<ApiResponse> adminSendOtp(@Valid @RequestBody AdminSendOtpRequest request) {
        String otp = adminOtpService.sendOtp(request.email());
        // Direct-to-portal: return OTP in response so admin portal can display it immediately
        // Mailtrap still sends in parallel; this makes local testing / direct portal possible
        java.util.Map<String, String> data = java.util.Map.of(
                "email", request.email().trim().toLowerCase(),
                "otp", otp,
                "message", "OTP sent via Mailtrap and also returned for direct portal display"
        );
        return ResponseEntity.ok(ApiResponse.ok("OTP sent to admin email (also returned for portal)", data));
    }

    @PostMapping("/admin/verify-otp")
    public ResponseEntity<ApiResponse> adminVerifyOtp(@Valid @RequestBody AdminVerifyOtpRequest request) {
        LoginResponse response = adminOtpService.verifyOtp(request.email(), request.otp());
        return ResponseEntity.ok(ApiResponse.ok("Admin login successful", response));
    }
}
