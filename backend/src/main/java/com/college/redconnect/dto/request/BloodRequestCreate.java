package com.college.redconnect.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record BloodRequestCreate(

        @NotBlank(message = "Blood group is required")
        @Pattern(regexp = "^(A|B|AB|O)[+-]$", message = "Blood group must be a valid group like A+, B-, O+, AB+")
        String bloodGroup,

        @Min(value = 1, message = "Units must be at least 1")
        @Max(value = 50, message = "Units must be at most 50")
        int units,

        @Size(max = 20, message = "Urgency must be at most 20 characters")
        String urgency,

        @Size(max = 100, message = "Location must be at most 100 characters")
        String location,

        @Size(max = 120, message = "Hospital must be at most 120 characters")
        String hospitalName,

        @Size(max = 20, message = "Contact must be at most 20 characters")
        String contactNumber,

        @Size(max = 500, message = "Notes must be at most 500 characters")
        String notes
) {
}