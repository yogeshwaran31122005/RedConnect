package com.college.redconnect.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DonorRequestCreate(

        @NotBlank(message = "Donor email is required")
        @Email(message = "Donor email must be valid")
        String donorEmail,

        @Min(value = 1, message = "Units must be at least 1")
        @Max(value = 10, message = "Units must be at most 10")
        int units,

        @Size(max = 100, message = "Location must be at most 100 characters")
        String location,

        @Size(max = 120, message = "Hospital must be at most 120 characters")
        String hospitalName,

        @Size(max = 500, message = "Notes must be at most 500 characters")
        String notes
) {
}
