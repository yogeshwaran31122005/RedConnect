package com.college.redconnect.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminVerifyOtpRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email")
        String email,

        @NotBlank(message = "OTP is required")
        @Size(min = 4, max = 4, message = "OTP must be 4 digits")
        String otp
) {}
