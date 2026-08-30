package com.college.redconnect.dto.request;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
        @NotBlank(message = "Full name is required")
        @Size(max = 120, message = "Full name must be at most 120 characters")
        String fullName,

        @Pattern(regexp = "^(A|B|AB|O)[+-]$", message = "Blood group must be a valid group like A+, B-, O+, AB+")
        String bloodGroup,

        @Size(max = 20, message = "Phone must be at most 20 characters")
        String phone,

        @Size(max = 100, message = "City must be at most 100 characters")
        String city,

        LocalDate dateOfBirth
) {
}