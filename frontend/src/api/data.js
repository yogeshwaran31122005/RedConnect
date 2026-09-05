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
