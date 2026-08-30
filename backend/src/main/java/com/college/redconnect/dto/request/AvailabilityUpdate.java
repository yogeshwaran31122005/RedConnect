package com.college.redconnect.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AvailabilityUpdate(

        @NotBlank(message = "Availability is required")
        @Pattern(regexp = "^(Available|Not Available)$", message = "Availability must be Available or Not Available")
        String availability
) {
}
