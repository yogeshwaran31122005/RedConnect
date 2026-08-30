package com.college.redconnect.controller;

import com.college.redconnect.dto.request.AvailabilityUpdate;
import com.college.redconnect.dto.request.BloodRequestCreate;
import com.college.redconnect.dto.request.DonationCreate;
import com.college.redconnect.dto.request.DonorRequestCreate;
import com.college.redconnect.dto.request.NotificationCreate;
import com.college.redconnect.dto.request.ProfileUpdateRequest;
import com.college.redconnect.dto.request.StatusUpdate;
import com.college.redconnect.dto.response.ApiResponse;
import com.college.redconnect.dto.response.UserProfileResponse;
import com.college.redconnect.model.entity.BloodRequest;
import com.college.redconnect.model.entity.Donation;
import com.college.redconnect.model.entity.Notification;
import com.college.redconnect.model.entity.AppLog;
import com.college.redconnect.service.AppLogService;
import com.college.redconnect.service.DataService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/data")
public class DataController {

    private final DataService dataService;
    private final AppLogService appLogService;

    public DataController(DataService dataService, AppLogService appLogService) {
        this.dataService = dataService;
        this.appLogService = appLogService;
    }

    /* ---- Profile ---- */

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse> getProfile(Authentication authentication) {
        UserProfileResponse profile = dataService.getProfile(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("Profile loaded", profile));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse> updateProfile(Authentication authentication,
                                                     @Valid @RequestBody ProfileUpdateRequest request) {
        UserProfileResponse profile = dataService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated", profile));
    }

    @PutMapping("/availability")
    public ResponseEntity<ApiResponse> updateAvailability(Authentication authentication,
                                                          @Valid @RequestBody AvailabilityUpdate request) {
        UserProfileResponse profile = dataService.updateAvailability(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.ok("Availability updated", profile));
    }

    /* ---- Matching (patient only sees matching donors) ---- */

    @GetMapping("/matching-donors")
    public ResponseEntity<ApiResponse> getMatchingDonors(Authentication authentication) {
        List<UserProfileResponse> donors = dataService.getMatchingDonors(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("Matching donors loaded", donors));
    }

    /* ---- Blood requests ---- */

    @GetMapping("/requests")
    public ResponseEntity<ApiResponse> getRequests(Authentication authentication) {
        List<BloodRequest> requests = dataService.getRequests(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("Requests loaded", requests));
    }

    @GetMapping("/requests/incoming")
    public ResponseEntity<ApiResponse> getIncomingRequests(Authentication authentication) {
        List<BloodRequest> requests = dataService.getIncomingRequests(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("Incoming requests loaded", requests));
    }

    @PostMapping("/requests")
    public ResponseEntity<ApiResponse> createRequest(Authentication authentication,
                                                     @Valid @RequestBody BloodRequestCreate request) {
        BloodRequest saved = dataService.createRequest(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Blood request sent", saved));
    }

    /** Patient clicks Emergency on a donor card. */
    @PostMapping("/requests/to-donor")
    public ResponseEntity<ApiResponse> createDonorRequest(Authentication authentication,
                                                          @Valid @RequestBody DonorRequestCreate request) {
        BloodRequest saved = dataService.createDonorRequest(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Emergency request sent to donor", saved));
    }

    @PatchMapping("/requests/{id}/status")
    public ResponseEntity<ApiResponse> updateRequestStatus(Authentication authentication,
                                                           @PathVariable Long id,
                                                           @Valid @RequestBody StatusUpdate update) {
        BloodRequest saved = dataService.updateRequestStatus(authentication.getName(), id, update);
        return ResponseEntity.ok(ApiResponse.ok("Request status updated", saved));
    }

    /** Donor clicks Available (Accepted) or Not Available (Declined). */
    @PatchMapping("/requests/{id}/respond")
    public ResponseEntity<ApiResponse> respondToRequest(Authentication authentication,
                                                        @PathVariable Long id,
                                                        @Valid @RequestBody StatusUpdate update) {
        BloodRequest saved = dataService.respondToRequest(authentication.getName(), id, update);
        return ResponseEntity.ok(ApiResponse.ok("Response recorded", saved));
    }

    /* ---- Donations ---- */

    @GetMapping("/donations")
    public ResponseEntity<ApiResponse> getDonations(Authentication authentication) {
        List<Donation> donations = dataService.getDonations(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("Donations loaded", donations));
    }

    @PostMapping("/donations")
    public ResponseEntity<ApiResponse> addDonation(Authentication authentication,
                                                   @Valid @RequestBody DonationCreate request) {
        Donation saved = dataService.addDonation(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Donation recorded", saved));
    }

    /* ---- Notifications ---- */

    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse> getNotifications(Authentication authentication) {
        List<Notification> notifications = dataService.getNotifications(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("Notifications loaded", notifications));
    }

    @PostMapping("/notifications")
    public ResponseEntity<ApiResponse> createNotification(Authentication authentication,
                                                          @Valid @RequestBody NotificationCreate request) {
        Notification saved = dataService.createNotification(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Notification created", saved));
    }

    @PatchMapping("/notifications/read")
    public ResponseEntity<ApiResponse> markNotificationsRead(Authentication authentication) {
        int marked = dataService.markNotificationsRead(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok(marked + " notification(s) marked as read"));
    }

    /* ---- Admin ---- */

    @GetMapping("/admin/users")
    public ResponseEntity<ApiResponse> getAllUsers(Authentication authentication) {
        List<UserProfileResponse> users = dataService.getAllUsers(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("Users loaded", users));
    }

    @GetMapping("/admin/requests")
    public ResponseEntity<ApiResponse> getAllRequests(Authentication authentication) {
        List<BloodRequest> requests = dataService.getAllRequests(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("All requests loaded", requests));
    }

    @DeleteMapping("/admin/users/{id}")
    public ResponseEntity<ApiResponse> deleteUser(Authentication authentication, @PathVariable Long id) {
        dataService.deleteUser(authentication.getName(), id);
        appLogService.info("ADMIN_DELETE_USER", "Deleted user id=" + id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("User deleted"));
    }

    @GetMapping("/admin/logs")
    public ResponseEntity<ApiResponse> getAppLogs(Authentication authentication) {
        List<AppLog> logs = appLogService.getAll();
        // Admin check inside DataService indirectly, but also ensure via appLogService? rely on admin role check
        dataService.getAllUsers(authentication.getName()); // throws if not admin
        return ResponseEntity.ok(ApiResponse.ok("Application logs loaded", logs));
    }
}
