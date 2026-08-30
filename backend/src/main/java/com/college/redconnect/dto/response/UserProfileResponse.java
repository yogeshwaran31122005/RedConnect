package com.college.redconnect.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.college.redconnect.model.entity.User;
import com.college.redconnect.model.entity.UserRole;

public record UserProfileResponse(
        Long id,
        String email,
        String fullName,
        String bloodGroup,
        String phone,
        String city,
        LocalDate dateOfBirth,
        String gender,
        LocalDateTime createdAt,
        UserRole role,
        String availability
) {

    public static UserProfileResponse of(User user) {
        return new UserProfileResponse(
                user.getId(), user.getEmail(), user.getFullName(), user.getBloodGroup(),
                user.getPhone(), user.getCity(), user.getDateOfBirth(), user.getGender(),
                user.getCreatedAt(), user.getRole(), user.getAvailability());
    }
}