package com.college.redconnect.dto.response;

import com.college.redconnect.model.entity.User;
import com.college.redconnect.model.entity.UserRole;

public record LoginResponse(
        String token,
        String tokenType,
        long expiresIn,
        Long id,
        String email,
        String fullName,
        String bloodGroup,
        String phone,
        String city,
        UserRole role,
        String availability
) {

    public static LoginResponse of(User user, String token, long expiresIn) {
        return new LoginResponse(token, "Bearer", expiresIn, user.getId(), user.getEmail(),
                user.getFullName(), user.getBloodGroup(), user.getPhone(), user.getCity(),
                user.getRole(), user.getAvailability());
    }
}