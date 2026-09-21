/* ============ RedConnect - API Data Layer ============ */

import { apiRequest } from "./auth";

function mapProfile(backendProfile) {
    return {
        ...backendProfile,
        name: backendProfile.fullName,
    };
}

/* ---------- Profile ---------- */

export async function getProfile() {
    const result = await apiRequest("/data/profile");
    return mapProfile(result.data);
}

export async function saveProfile(profile) {
    const result = await apiRequest("/data/profile", {
        method: "PUT",
        body: JSON.stringify({
            fullName: profile.name,
            bloodGroup: profile.bloodGroup,
            phone: profile.phone,
            city: profile.city,
            dateOfBirth: profile.dateOfBirth || null,
        }),
    });
    return mapProfile(result.data);
}

export async function updateAvailability(availability) {
    const result = await apiRequest("/data/availability", {
        method: "PUT",
        body: JSON.stringify({ availability }),
    });
    return mapProfile(result.data);
}

/* ---------- Matching (patient sees only matching donors) ---------- */

export async function getMatchingDonors() {
    const result = await apiRequest("/data/matching-donors");
    return result.data.map(mapProfile);
}

/* ---------- Blood requests ---------- */

export async function getRequests() {
    const result = await apiRequest("/data/requests");
    return result.data.map((r) => ({ ...r, date: r.createdDate }));
}

export async function getIncomingRequests() {
    const result = await apiRequest("/data/requests/incoming");
    return result.data.map((r) => ({ ...r, date: r.createdDate }));
}

export async function submitRequest(data) {
    const result = await apiRequest("/data/requests", {
        method: "POST",
        body: JSON.stringify(data),
    });
    return result.data;
}

/* Patient clicks Emergency button on a donor card */
export async function sendDonorRequest(donorEmail, extra = {}) {
    const result = await apiRequest("/data/requests/to-donor", {
        method: "POST",
        body: JSON.stringify({
            donorEmail,
            units: extra.units || 1,
            location: extra.location || null,
            hospitalName: extra.hospitalName || null,
            notes: extra.notes || null,
        }),
    });
    return result.data;
}

export async function updateRequestStatus(id, status) {
    const result = await apiRequest(`/data/requests/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
    return result.data;
}

/* Donor clicks Available (Accepted) / Not Available (Declined) */
export async function respondToRequest(id, status) {
    const result = await apiRequest(`/data/requests/${id}/respond`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
    return result.data;
}

/* ---------- Donor request workflow (PUT /api/donor-requests/...) ---------- */

/** Canonical status helper — backend stores PENDING / ACCEPTED / REJECTED
 *  (legacy rows may hold Pending / Accepted / Declined). */
export function normStatus(status) {
    const s = (status || "").trim().toUpperCase();
    if (s === "ACCEPTED") return "ACCEPTED";
    if (s === "REJECTED" || s === "DECLINED") return "REJECTED";
    if (s === "PENDING") return "PENDING";
    if (s === "COMPLETED") return "COMPLETED";
    if (s === "CANCELLED" || s === "CANCELED") return "CANCELLED";
    return s || "UNKNOWN";
}

export function isPending(status) {
    return normStatus(status) === "PENDING";
}

export function isAccepted(status) {
    return normStatus(status) === "ACCEPTED";
}

/** User-friendly message for API failures — never a blank page / raw 404. */
export function friendlyRequestError(err, action = "process this request") {
    const status = err?.status;
    if (status === 404) return "Unable to accept this request. Please try again. (Request or endpoint not found)";
    if (status === 400) return err.message || `Invalid request. Could not ${action}.`;
    if (status === 401) return "Your session expired. Please log in again.";
    if (status === 403) return "Access denied. You are not allowed to respond to this request.";
    if (status === 500) return "Server error. Please try again in a moment.";
    if (status === 0) return "Cannot reach the server. Is the backend running on port 8080?";
    return err?.message || `Unable to ${action}. Please try again.`;
}

/**
 * Donor clicks AVAILABLE / ACCEPT REQUEST.
 * Calls PUT /api/donor-requests/{requestId}/accept and returns the
 * updated request. Falls back to the legacy PATCH endpoint if the new
 * route is unavailable, so the button never dead-ends on a 404.
 */
export async function acceptDonorRequest(requestId) {
    if (requestId == null) {
        const error = new Error("Invalid request id.");
        error.status = 400;
        throw error;
    }
    try {
        const result = await apiRequest(`/donor-requests/${requestId}/accept`, { method: "PUT" });
        return result.data?.request || result.data;
    } catch (err) {
        if (isEndpointMissing(err)) {
            // Endpoint itself missing (e.g. stale backend) — retry legacy route once.
            const legacy = await apiRequest(`/data/requests/${requestId}/respond`, {
                method: "PATCH",
                body: JSON.stringify({ status: "ACCEPTED" }),
            });
            return legacy.data;
        }
        throw err;
    }
}

/**
 * Donor clicks NOT AVAILABLE.
 * Calls PUT /api/donor-requests/{requestId}/reject (status = REJECTED).
 */
export async function rejectDonorRequest(requestId) {
    if (requestId == null) {
        const error = new Error("Invalid request id.");
        error.status = 400;
        throw error;
    }
    try {
        const result = await apiRequest(`/donor-requests/${requestId}/reject`, { method: "PUT" });
        return result.data?.request || result.data;
    } catch (err) {
        if (isEndpointMissing(err)) {
            const legacy = await apiRequest(`/data/requests/${requestId}/respond`, {
                method: "PATCH",
                body: JSON.stringify({ status: "REJECTED" }),
            });
            return legacy.data;
        }
        throw err;
    }
}

/**
 * True when the 404 came from a missing endpoint (wrong URL / stale backend)
 * rather than a missing blood-request row. A missing row reports
 * "Blood request not found"; a missing route reports "Resource not found"
 * with the request path pointing at /donor-requests/.
 */
function isEndpointMissing(err) {
    if (err?.status !== 404) return false;
    const path = String(err.payload?.path || "");
    if (path.includes("/donor-requests/")) return true;
    return !String(err.message || "").toLowerCase().includes("blood request");
}

/* ---------- Notifications ---------- */

export async function getNotifications() {
    const result = await apiRequest("/data/notifications");
    return result.data.map((n) => ({ ...n, date: n.notificationDate }));
}

export async function pushNotification(title, message, type = "info") {
    const result = await apiRequest("/data/notifications", {
        method: "POST",
        body: JSON.stringify({ title, message, type }),
    });
    return result.data;
}

export async function markAllNotificationsRead() {
    await apiRequest("/data/notifications/read", { method: "PATCH" });
    return getNotifications();
}

/* ---------- Donation history ---------- */

export async function getDonations() {
    const result = await apiRequest("/data/donations");
    return result.data.map((d) => ({ ...d, date: d.donationDate }));
}

export async function addDonation(data) {
    const result = await apiRequest("/data/donations", {
        method: "POST",
        body: JSON.stringify({
            bloodGroup: data.bloodGroup,
            units: data.units || 1,
            date: data.date || null,
            location: data.location,
            hospital: data.hospital,
        }),
    });
    return result.data;
}

/* ---------- Admin ---------- */

export async function getAllUsers() {
    const result = await apiRequest("/data/admin/users");
    return result.data.map(mapProfile);
}

export async function getAllRequests() {
    const result = await apiRequest("/data/admin/requests");
    return result.data.map((r) => ({ ...r, date: r.createdDate }));
}

export async function deleteUser(id) {
    return apiRequest(`/data/admin/users/${id}`, { method: "DELETE" });
}

export async function getAppLogs() {
    const result = await apiRequest("/data/admin/logs");
    return result.data;
}
