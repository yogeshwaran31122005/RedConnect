package com.college.redconnect.repository;

import com.college.redconnect.model.entity.User;
import com.college.redconnect.model.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(UserRole role);

    List<User> findByRoleAndBloodGroupAndAvailability(UserRole role, String bloodGroup, String availability);

    List<User> findByRoleAndAvailability(UserRole role, String availability);
}
