package com.college.redconnect.config;

import com.college.redconnect.model.entity.User;
import com.college.redconnect.model.entity.UserRole;
import com.college.redconnect.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminSeeder {

    @Bean
    CommandLineRunner seedAdmin(UserRepository userRepository, PasswordEncoder encoder) {
        return args -> {
            for (String adminEmail : new String[]{"admin@redconnect.com", "yogeshwaran31122005@gmail.com"}) {
                User existing = userRepository.findByEmail(adminEmail).orElse(null);
                if (existing == null) {
                    User admin = new User();
                    admin.setEmail(adminEmail);
                    admin.setPassword(encoder.encode("Neymarjr"));
                    admin.setFullName("RedConnect Admin");
                    admin.setRole(UserRole.ADMIN);
                    admin.setAvailability("Available");
                    admin.setBloodGroup("O+");
                    admin.setCity("HQ");
                    admin.setPhone("+91 99999 99999");
                    userRepository.save(admin);
                    System.out.println("[Seeder] Created default admin: " + adminEmail + " / Neymarjr");
                } else {
                    // Force static password Neymarjr and ADMIN role
                    boolean changed = false;
                    if (existing.getRole() != UserRole.ADMIN) { existing.setRole(UserRole.ADMIN); changed = true; }
                    // Always reset password to Neymarjr to satisfy static requirement
                    existing.setPassword(encoder.encode("Neymarjr"));
                    if (changed || true) userRepository.save(existing);
                    System.out.println("[Seeder] Updated admin password to Neymarjr for: " + adminEmail);
                }
            }
        };
    }
}
