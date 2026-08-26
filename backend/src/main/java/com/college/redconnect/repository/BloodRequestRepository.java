package com.college.redconnect.repository;

import com.college.redconnect.model.entity.BloodRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BloodRequestRepository extends JpaRepository<BloodRequest, Long> {

    List<BloodRequest> findByUserEmailOrderByIdDesc(String userEmail);

    List<BloodRequest> findByDonorEmailOrderByIdDesc(String donorEmail);

    List<BloodRequest> findAllByOrderByIdDesc();
}