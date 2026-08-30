package com.college.redconnect.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NotificationCreate(

        @Size(max = 20, message = "Type must be at most 20 characters")
        String type,

        @NotBlank(message = "Title is required")
        @Size(max = 120, message = "Title must be at most 120 characters")
        String title,

        @Size(max = 500, message = "Message must be at most 500 characters")
        String message
) {
}