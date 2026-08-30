package com.college.redconnect.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record DonationCreate(

        @NotBlank(message = "Blood group is required")
        @Pattern(regexp = "^(A|B|AB|O)[+-]$", message = "Blood group must be a valid group like A+, B-, O+, AB+")
        String bloodGroup,

        @Min(value = 1, message = "Units must be at least 1")
        @Max(value = 50, message = "Units must be at most 50")
        int units,

        LocalDate date,

        @Size(max = 100, message = "Location must be at most 100 characters")
        String location,

        @Size(max = 120, message = "Hospital must be at most 120 characters")
        String hospital
) {
}