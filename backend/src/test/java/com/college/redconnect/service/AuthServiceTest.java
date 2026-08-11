package com.college.redconnect.service;

import com.college.redconnect.config.security.JwtUtil;
import com.college.redconnect.dto.request.LoginRequest;
import com.college.redconnect.dto.request.RegisterRequest;
import com.college.redconnect.dto.response.LoginResponse;
import com.college.redconnect.exception.BadCredentialsException;
import com.college.redconnect.exception.DuplicateResourceException;
import com.college.redconnect.model.entity.User;
import com.college.redconnect.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    @Test
    void register_shouldCreateAndReturnLoginResponse() {
        when(userRepository.existsByEmail("jane@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("hashed");

        User saved = new User();
        saved.setId(1L);
        saved.setEmail("jane@example.com");
        saved.setPassword("hashed");
        when(userRepository.save(any(User.class))).thenReturn(saved);
        when(jwtUtil.generateToken("jane@example.com")).thenReturn("jwt-token");
        when(jwtUtil.getExpirationMs()).thenReturn(3600000L);

        RegisterRequest request = new RegisterRequest("jane@example.com", "secret123");
        LoginResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.email()).isEqualTo("jane@example.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_shouldThrowDuplicateWhenEmailExists() {
        when(userRepository.existsByEmail("jane@example.com")).thenReturn(true);

        RegisterRequest request = new RegisterRequest("jane@example.com", "secret123");

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateResourceException.class);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_shouldReturnLoginResponseWhenCredentialsMatch() {
        User user = new User();
        user.setId(1L);
        user.setEmail("jane@example.com");
        user.setPassword("hashed");

        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret123", "hashed")).thenReturn(true);
        when(jwtUtil.generateToken("jane@example.com")).thenReturn("jwt-token");
        when(jwtUtil.getExpirationMs()).thenReturn(3600000L);

        LoginRequest request = new LoginRequest("jane@example.com", "secret123");
        LoginResponse response = authService.login(request);

        assertThat(response.email()).isEqualTo("jane@example.com");
        assertThat(response.token()).isEqualTo("jwt-token");
    }

    @Test
    void login_shouldThrowForUnknownEmail() {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        LoginRequest request = new LoginRequest("ghost@example.com", "secret123");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void login_shouldThrowForWrongPassword() {
        User user = new User();
        user.setId(1L);
        user.setEmail("jane@example.com");
        user.setPassword("hashed");

        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "hashed")).thenReturn(false);

        LoginRequest request = new LoginRequest("jane@example.com", "wrong-password");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);
    }
}
