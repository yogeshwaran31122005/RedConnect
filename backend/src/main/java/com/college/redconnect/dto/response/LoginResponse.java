package com.college.redconnect.dto.response;

import com.college.redconnect.model.entity.User;

public record LoginResponse(
        String token,
        String tokenType,
        long expiresIn,
        Long id,
        String email
) {

    public static LoginResponse of(User user, String token, long expiresIn) {
        return new LoginResponse(token, "Bearer", expiresIn, user.getId(), user.getEmail());
    }
}
