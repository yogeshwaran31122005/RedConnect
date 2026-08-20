package com.college.redconnect.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.college.redconnect.config.security.JwtUtil;
import com.college.redconnect.dto.request.LoginRequest;
import com.college.redconnect.dto.request.RegisterRequest;
import com.college.redconnect.dto.response.LoginResponse;
import com.college.redconnect.dto.response.UserProfileResponse;
import com.college.redconnect.exception.BadCredentialsException;
import com.college.redconnect.exception.DuplicateResourceException;
import com.college.redconnect.model.entity.User;
import com.college.redconnect.model.entity.UserRole;
import com.college.redconnect.repository.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("An account already exists for email: " + email);
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName().trim());
        user.setBloodGroup(request.bloodGroup());
        user.setPhone(request.phone());
        user.setCity(request.city());
        user.setDateOfBirth(request.dateOfBirth());
        user.setGender(request.gender());
        UserRole role = request.role() == null ? UserRole.DONOR : request.role();
        if (role == UserRole.ADMIN) {
            throw new DuplicateResourceException("Admin accounts cannot be self-registered. Contact existing admin or use OTP login.");
        }
        user.setRole(role);
        user.setAvailability("Available");

        User saved = userRepository.save(user);
        String token = generateToken(saved);
        return LoginResponse.of(saved, token, jwtUtil.getExpirationMs());
    }

    @Transactional(readOnly = true)
    public UserProfileResponse me(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("User not found"));
        return UserProfileResponse.of(user);
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String token = generateToken(user);
        return LoginResponse.of(user, token, jwtUtil.getExpirationMs());
    }

    private String generateToken(User user) {
        return jwtUtil.generateToken(user.getEmail(), user.getRole());
    }
}
