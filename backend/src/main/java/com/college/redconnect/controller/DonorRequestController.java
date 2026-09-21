package com.college.redconnect.controller;

import com.college.redconnect.dto.response.ApiResponse;
import com.college.redconnect.model.entity.BloodRequest;
import com.college.redconnect.service.DataService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Donor request workflow endpoints.
 *
 * <p>Base path is {@code /api}, so the full URLs are:
 * <ul>
 *   <li>{@code PUT /api/donor-requests/{requestId}/accept}</li>
 *   <li>{@code PUT /api/donor-requests/{requestId}/reject}</li>
 * </ul>
 * PATCH is accepted as an alias for clients that use it.
 */
@RestController
@RequestMapping("/api/donor-requests")
public class DonorRequestController {

    private final DataService dataService;

    public DonorRequestController(DataService dataService) {
        this.dataService = dataService;
    }

    /** Requests sent to the logged-in donor. */
    @GetMapping("/incoming")
    public ResponseEntity<ApiResponse> getIncoming(Authentication authentication) {
        List<BloodRequest> requests = dataService.getIncomingRequests(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("Incoming donor requests loaded", requests));
    }

    /** Requests created by the logged-in patient. */
    @GetMapping("/mine")
    public ResponseEntity<ApiResponse> getMine(Authentication authentication) {
        List<BloodRequest> requests = dataService.getRequests(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("Patient requests loaded", requests));
    }

    /**
     * Donor clicks AVAILABLE / ACCEPT REQUEST.
     * Finds the donor request, verifies request + donor, sets status=ACCEPTED,
     * saves to PostgreSQL, notifies the patient and returns HTTP 200.
     */
    @RequestMapping(value = "/{requestId}/accept", method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<ApiResponse> acceptRequest(Authentication authentication,
                                                     @PathVariable Long requestId) {
        BloodRequest saved = dataService.acceptDonorRequest(authentication.getName(), requestId);
        return ResponseEntity.ok(ApiResponse.ok("Donor accepted the blood request", payload(saved)));
    }

    /**
     * Donor clicks NOT AVAILABLE.
     * Sets status=REJECTED, saves to PostgreSQL and notifies the patient.
     */
    @RequestMapping(value = "/{requestId}/reject", method = {RequestMethod.PUT, RequestMethod.PATCH})
    public ResponseEntity<ApiResponse> rejectRequest(Authentication authentication,
                                                     @PathVariable Long requestId) {
        BloodRequest saved = dataService.rejectDonorRequest(authentication.getName(), requestId);
        return ResponseEntity.ok(ApiResponse.ok("Donor is currently not available.", payload(saved)));
    }

    private Map<String, Object> payload(BloodRequest saved) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", true);
        body.put("requestId", saved.getId());
        body.put("status", saved.getStatus());
        body.put("request", saved);
        return body;
    }
}
