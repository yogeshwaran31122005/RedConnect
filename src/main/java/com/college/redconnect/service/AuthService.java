package com.college.redconnect.service;

import com.college.redconnect.config.security.JwtUtil;
import com.college.redconnect.dto.request.LoginRequest;
import com.college.redconnect.dto.request.RegisterRequest;
import com.college.redconnect.dto.response.LoginResponse;
import com.college.redconnect.exception.BadCredentialsException;
import com.college.redconnect.exception.DuplicateResourceException;
import com.college.redconnect.model.entity.User;
import com.college.redconnect.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        User saved = userRepository.save(user);
        String token = jwtUtil.generateToken(saved.getEmail());
        return LoginResponse.of(saved, token, jwtUtil.getExpirationMs());
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getEmail());
        return LoginResponse.of(user, token, jwtUtil.getExpirationMs());
    }
}
