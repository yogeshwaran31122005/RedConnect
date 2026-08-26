package com.college.redconnect.repository;

import com.college.redconnect.model.entity.Donation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DonationRepository extends JpaRepository<Donation, Long> {

    List<Donation> findByUserEmailOrderByIdDesc(String userEmail);
}