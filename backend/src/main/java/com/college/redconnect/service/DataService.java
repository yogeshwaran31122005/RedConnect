package com.college.redconnect.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.college.redconnect.dto.request.AvailabilityUpdate;
import com.college.redconnect.dto.request.BloodRequestCreate;
import com.college.redconnect.dto.request.DonationCreate;
import com.college.redconnect.dto.request.DonorRequestCreate;
import com.college.redconnect.dto.request.NotificationCreate;
import com.college.redconnect.dto.request.ProfileUpdateRequest;
import com.college.redconnect.dto.request.StatusUpdate;
import com.college.redconnect.dto.response.UserProfileResponse;
import com.college.redconnect.exception.BadCredentialsException;
import com.college.redconnect.exception.ResourceNotFoundException;
import com.college.redconnect.model.entity.BloodRequest;
import com.college.redconnect.model.entity.Donation;
import com.college.redconnect.model.entity.Notification;
import com.college.redconnect.model.entity.User;
import com.college.redconnect.model.entity.UserRole;
import com.college.redconnect.repository.BloodRequestRepository;
import com.college.redconnect.repository.DonationRepository;
import com.college.redconnect.repository.NotificationRepository;
import com.college.redconnect.repository.UserRepository;

@Service
@Transactional
public class DataService {

    private final UserRepository userRepository;
    private final BloodRequestRepository bloodRequestRepository;
    private final DonationRepository donationRepository;
    private final NotificationRepository notificationRepository;

    public DataService(UserRepository userRepository,
                       BloodRequestRepository bloodRequestRepository,
                       DonationRepository donationRepository,
                       NotificationRepository notificationRepository) {
        this.userRepository = userRepository;
        this.bloodRequestRepository = bloodRequestRepository;
        this.donationRepository = donationRepository;
        this.notificationRepository = notificationRepository;
    }

    /* ---- Profile ---- */

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String email) {
        return UserProfileResponse.of(requireUser(email));
    }

    public UserProfileResponse updateProfile(String email, ProfileUpdateRequest request) {
        User user = requireUser(email);
        user.setFullName(request.fullName().trim());
        user.setBloodGroup(request.bloodGroup());
        user.setPhone(request.phone());
        user.setCity(request.city());
        user.setDateOfBirth(request.dateOfBirth());
        return UserProfileResponse.of(userRepository.save(user));
    }

    public UserProfileResponse updateAvailability(String email, AvailabilityUpdate update) {
        User user = requireUser(email);
        user.setAvailability(update.availability());
        return UserProfileResponse.of(userRepository.save(user));
    }

    /* ---- Matching: patient sees ONLY donors with same blood group ---- */

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getMatchingDonors(String patientEmail) {
        User patient = requireUser(patientEmail);
        if (patient.getBloodGroup() == null) {
            return List.of();
        }
        // Only Available donors with the same blood group as the patient
        List<User> matches = userRepository.findByRoleAndBloodGroupAndAvailability(
                UserRole.DONOR, patient.getBloodGroup(), "Available");
        return matches.stream().map(UserProfileResponse::of).toList();
    }

    /* ---- Blood requests ---- */

    @Transactional(readOnly = true)
    public List<BloodRequest> getRequests(String email) {
        return bloodRequestRepository.findByUserEmailOrderByIdDesc(email);
    }

    @Transactional(readOnly = true)
    public List<BloodRequest> getIncomingRequests(String donorEmail) {
        return bloodRequestRepository.findByDonorEmailOrderByIdDesc(donorEmail);
    }

    public BloodRequest createRequest(String email, BloodRequestCreate request) {
        BloodRequest entity = new BloodRequest();
        entity.setUserEmail(email);
        entity.setBloodGroup(request.bloodGroup());
        entity.setUnits(request.units());
        entity.setUrgency(request.urgency());
        entity.setLocation(request.location());
        entity.setHospitalName(request.hospitalName());
        entity.setContactNumber(request.contactNumber());
        entity.setNotes(request.notes());
        entity.setStatus("PENDING");
        entity.setCreatedDate(LocalDate.now());
        return bloodRequestRepository.save(entity);
    }

    /**
     * Patient clicks Emergency button on a matched donor card.
     * Creates a request row linking patient -> specific donor (status Pending).
     */
    public BloodRequest createDonorRequest(String patientEmail, DonorRequestCreate request) {
        User patient = requireUser(patientEmail);
        User donor = userRepository.findByEmail(request.donorEmail().trim().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Donor not found"));
        if (donor.getRole() != UserRole.DONOR) {
            throw new ResourceNotFoundException("Donor not found");
        }
        if (!donor.getBloodGroup().equals(patient.getBloodGroup())) {
            throw new ResourceNotFoundException("Donor blood group does not match patient");
        }

        BloodRequest entity = new BloodRequest();
        entity.setUserEmail(patientEmail);
        entity.setBloodGroup(patient.getBloodGroup());
        entity.setUnits(request.units());
        entity.setUrgency("Emergency");
        entity.setLocation(request.location() != null ? request.location() : patient.getCity());
        entity.setHospitalName(request.hospitalName() != null ? request.hospitalName() : patient.getCity());
        entity.setContactNumber(patient.getPhone());
        entity.setNotes(request.notes());
        entity.setStatus("PENDING");
        entity.setCreatedDate(LocalDate.now());
        entity.setDonorEmail(donor.getEmail());
        entity.setDonorName(donor.getFullName());
        entity.setDonorPhone(donor.getPhone());
        entity.setDonorCity(donor.getCity());
        BloodRequest saved = bloodRequestRepository.save(entity);

        // Notify the donor in the database
        Notification donorNotif = new Notification();
        donorNotif.setUserEmail(donor.getEmail());
        donorNotif.setType("request");
        donorNotif.setTitle("New emergency blood request");
        donorNotif.setMessage("Patient " + patient.getFullName() + " (" + patient.getBloodGroup()
                + ") needs " + request.units() + " unit(s) urgently.");
        donorNotif.setNotificationDate(LocalDate.now());
        donorNotif.setRead(false);
        notificationRepository.save(donorNotif);

        return saved;
    }

    /**
     * Donor clicks AVAILABLE / ACCEPT REQUEST.
     * PUT /api/donor-requests/{requestId}/accept
     * Verifies request + donor, sets status=ACCEPTED, saves to PostgreSQL,
     * notifies the patient and returns the updated request.
     */
    public BloodRequest acceptDonorRequest(String donorEmail, Long requestId) {
        return setDonorResponse(donorEmail, requestId, "ACCEPTED");
    }

    /**
     * Donor clicks NOT AVAILABLE.
     * PUT /api/donor-requests/{requestId}/reject
     * Sets status=REJECTED, saves to PostgreSQL and notifies the patient.
     */
    public BloodRequest rejectDonorRequest(String donorEmail, Long requestId) {
        return setDonorResponse(donorEmail, requestId, "REJECTED");
    }

    /**
     * Donor clicks Available (Accept) or Not Available (Decline).
     * Legacy alias for PATCH /api/data/requests/{id}/respond.
     * Accepts both legacy ("Accepted"/"Available") and canonical
     * ("ACCEPTED"/"REJECTED") status values for robustness.
     */
    public BloodRequest respondToRequest(String donorEmail, Long id, StatusUpdate update) {
        return setDonorResponse(donorEmail, id, normalizeResponseStatus(update == null ? null : update.status()));
    }

    private BloodRequest setDonorResponse(String donorEmail, Long id, String status) {
        if (id == null) {
            throw new IllegalArgumentException("Request id is required");
        }
        BloodRequest request = bloodRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found"));
        // Verify the donor exists (401/404 if unknown)
        User donor = requireUser(donorEmail);
        if (donor.getRole() != UserRole.DONOR) {
            throw new ResourceNotFoundException("Blood request not found");
        }
        // Verify this request was actually sent to this donor (404 to avoid leaking other rows)
        String storedDonor = request.getDonorEmail() == null ? null : request.getDonorEmail().trim().toLowerCase();
        String callerDonor = donor.getEmail() == null ? null : donor.getEmail().trim().toLowerCase();
        if (storedDonor == null || !storedDonor.equals(callerDonor)) {
            throw new ResourceNotFoundException("Blood request not found");
        }
        // Idempotency: if already in target status, just return without side-effects
        if (status.equalsIgnoreCase(request.getStatus())) {
            return request;
        }
        request.setStatus(status);
        // Refresh the donor snapshot so the patient sees current contact details after accept
        if (status.equals("ACCEPTED")) {
            request.setDonorName(donor.getFullName());
            request.setDonorPhone(donor.getPhone());
            request.setDonorCity(donor.getCity());
        }
        BloodRequest saved = bloodRequestRepository.save(request);

        // Notify the patient in the database - failure here should not roll back status change
        try {
            Notification patientNotif = new Notification();
            patientNotif.setUserEmail(request.getUserEmail());
            patientNotif.setType(status.equals("ACCEPTED") ? "match" : "info");
            if (status.equals("ACCEPTED")) {
                String phone = donor.getPhone() != null ? donor.getPhone() : "N/A";
                String city = donor.getCity() != null ? donor.getCity() : "N/A";
                patientNotif.setTitle("Donor accepted your request");
                patientNotif.setMessage("Donor " + donor.getFullName() + " (" + phone + ", "
                        + city + ") is Available. Contact: " + phone);
            } else {
                patientNotif.setTitle("Donor is not available");
                patientNotif.setMessage("Donor " + donor.getFullName()
                        + " is currently not available.");
            }
            patientNotif.setNotificationDate(LocalDate.now());
            patientNotif.setRead(false);
            notificationRepository.save(patientNotif);
        } catch (Exception ex) {
            // Log but do not fail the request - notification is secondary
            org.slf4j.LoggerFactory.getLogger(DataService.class).warn("Failed to create patient notification for request {}: {}", id, ex.getMessage());
        }

        // If accepted, record a donation row for the donor - also best-effort
        if (status.equals("ACCEPTED")) {
            try {
                Donation donation = new Donation();
                donation.setUserEmail(donorEmail);
                donation.setBloodGroup(request.getBloodGroup());
                donation.setUnits(request.getUnits());
                donation.setDonationDate(LocalDate.now());
                donation.setLocation(request.getLocation());
                donation.setHospital(request.getHospitalName());
                donation.setStatus("Completed");
                donationRepository.save(donation);
            } catch (Exception ex) {
                org.slf4j.LoggerFactory.getLogger(DataService.class).warn("Failed to create donation for request {}: {}", id, ex.getMessage());
            }
        }

        return saved;
    }

    /**
     * Normalizes every accepted spelling of a donor response to the canonical
     * uppercase status (ACCEPTED / REJECTED). Throws IllegalArgumentException
     * (→ HTTP 400) for anything else instead of a misleading 404.
     */
    private String normalizeResponseStatus(String raw) {
        String status = raw == null ? "" : raw.trim();
        if (status.equalsIgnoreCase("Accepted") || status.equalsIgnoreCase("Available")) return "ACCEPTED";
        if (status.equalsIgnoreCase("Declined") || status.equalsIgnoreCase("Rejected")
                || status.equalsIgnoreCase("Not Available") || status.equalsIgnoreCase("NotAvailable")) return "REJECTED";
        throw new IllegalArgumentException("Status must be ACCEPTED or REJECTED");
    }

    public BloodRequest updateRequestStatus(String email, Long id, StatusUpdate update) {
        BloodRequest request = bloodRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found"));
        if (!request.getUserEmail().equals(email)) {
            throw new ResourceNotFoundException("Blood request not found");
        }
        request.setStatus(update.status());
        return bloodRequestRepository.save(request);
    }

    /* ---- Donations ---- */

    @Transactional(readOnly = true)
    public List<Donation> getDonations(String email) {
        return donationRepository.findByUserEmailOrderByIdDesc(email);
    }

    public Donation addDonation(String email, DonationCreate request) {
        Donation entity = new Donation();
        entity.setUserEmail(email);
        entity.setBloodGroup(request.bloodGroup());
        entity.setUnits(request.units());
        entity.setDonationDate(request.date() != null ? request.date() : LocalDate.now());
        entity.setLocation(request.location());
        entity.setHospital(request.hospital());
        entity.setStatus("Completed");
        return donationRepository.save(entity);
    }

    /* ---- Notifications ---- */

    @Transactional(readOnly = true)
    public List<Notification> getNotifications(String email) {
        return notificationRepository.findByUserEmailOrderByIdDesc(email);
    }

    public Notification createNotification(String email, NotificationCreate request) {
        Notification entity = new Notification();
        entity.setUserEmail(email);
        entity.setType(request.type());
        entity.setTitle(request.title());
        entity.setMessage(request.message());
        entity.setNotificationDate(LocalDate.now());
        entity.setRead(false);
        return notificationRepository.save(entity);
    }

    public int markNotificationsRead(String email) {
        List<Notification> unread = notificationRepository.findByUserEmailAndReadFalse(email);
        unread.forEach((n) -> n.setRead(true));
        notificationRepository.saveAll(unread);
        return unread.size();
    }

    /* ---- Admin ---- */

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getAllUsers(String adminEmail) {
        requireAdmin(adminEmail);
        return userRepository.findAll().stream().map(UserProfileResponse::of).toList();
    }

    @Transactional(readOnly = true)
    public List<BloodRequest> getAllRequests(String adminEmail) {
        requireAdmin(adminEmail);
        return bloodRequestRepository.findAllByOrderByIdDesc();
    }

    public void deleteUser(String adminEmail, Long id) {
        requireAdmin(adminEmail);
        User target = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (target.getEmail().equalsIgnoreCase(adminEmail)) {
            throw new ResourceNotFoundException("Admin cannot delete self");
        }
        userRepository.delete(target);
    }

    private void requireAdmin(String email) {
        User user = requireUser(email);
        if (user.getRole() != UserRole.ADMIN) {
            throw new ResourceNotFoundException("Admin access required");
        }
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("User not found"));
    }
}
