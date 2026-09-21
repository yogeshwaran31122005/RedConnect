package com.college.redconnect.dto.request;

import java.time.LocalDate;

import com.college.redconnect.model.entity.UserRole;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Full name is required")
        @Size(max = 120, message = "Full name must be at most 120 characters")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        @Size(max = 120, message = "Email must be at most 120 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 6, max = 60, message = "Password must be between 6 and 60 characters")
        String password,

        @NotBlank(message = "Blood group is required")
        @Pattern(regexp = "^(A|B|AB|O)[+-]$", message = "Blood group must be a valid group like A+, B-, O+, AB+")
        String bloodGroup,

        @Size(max = 20, message = "Phone must be at most 20 characters")
        String phone,

        @Size(max = 100, message = "City must be at most 100 characters")
        String city,

        LocalDate dateOfBirth,

        @Size(max = 10, message = "Gender must be at most 10 characters")
        String gender,

        UserRole role
) {
        public RegisterRequest(String fullName, String email, String password, String bloodGroup,
                                                   String phone, String city, LocalDate dateOfBirth, String gender) {
                this(fullName, email, password, bloodGroup, phone, city, dateOfBirth, gender, null);
        }
}