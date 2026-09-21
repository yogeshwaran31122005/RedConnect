/* ============ RedConnect - API Helper ============ */

// VITE_API_URL may be either the full backend URL with /api or the bare host.
// Always normalize it so requests hit /api/* consistently in both local and Render environments.
const API_BASE = (() => {
    const raw = (import.meta.env.VITE_API_URL || "/api").trim();
    const normalized = raw.replace(/\/$/, "");
    if (!normalized || normalized === "/api") return "/api";
    return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
})();

/* ---------- Session helpers ---------- */

function sessionStore(remember) {
    return remember ? localStorage : sessionStorage;
}

function readSession(key) {
    return sessionStorage.getItem(key) || localStorage.getItem(key);
}

export function storeSession(data, remember = true) {
    const store = sessionStore(remember);
    store.setItem("redconnect_token", data.token);
    store.setItem("redconnect_email", data.email);
    if (data.fullName) store.setItem("redconnect_name", data.fullName);
    if (data.bloodGroup) store.setItem("redconnect_blood_group", data.bloodGroup);
    if (data.phone) store.setItem("redconnect_phone", data.phone);
    if (data.city) store.setItem("redconnect_city", data.city);
    if (data.role) store.setItem("redconnect_role", data.role);
    if (data.availability) store.setItem("redconnect_availability", data.availability);
    localStorage.setItem("redconnect_remember", remember ? "1" : "0");
}

export function getToken() {
    return readSession("redconnect_token");
}

export function getEmail() {
    return readSession("redconnect_email");
}

export function getFullName() {
    return readSession("redconnect_name");
}

export function getSessionBloodGroup() {
    return readSession("redconnect_blood_group");
}

export function getSessionPhone() {
    return readSession("redconnect_phone");
}

export function getSessionCity() {
    return readSession("redconnect_city");
}

export function getSessionRole() {
    return readSession("redconnect_role") || "DONOR";
}

export function getSessionAvailability() {
    return readSession("redconnect_availability") || "Available";
}

export function getRememberPreference() {
    return localStorage.getItem("redconnect_remember") !== "0";
}

export function clearSession() {
    const keys = [
        "redconnect_token", "redconnect_email", "redconnect_name",
        "redconnect_blood_group", "redconnect_phone", "redconnect_city",
        "redconnect_role", "redconnect_availability",
    ];
    keys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
    localStorage.removeItem("redconnect_remember");
}

export function isLoggedIn() {
    return !!getToken();
}

/* ---------- API request wrapper ---------- */

export async function apiRequest(path, options = {}) {
    const headers = options.headers || {};
    if (options.body) headers["Content-Type"] = "application/json";
    const token = getToken();
    if (token) headers["Authorization"] = "Bearer " + token;

    let response;
    try {
        response = await fetch(API_BASE + path, { ...options, headers });
    } catch (networkErr) {
        // Network / proxy failure - surface directly
        const error = new Error(networkErr.message || "Network error. Is the backend running?");
        error.status = 0;
        throw error;
    }
    const data = await response.json().catch(() => ({}));
    // Log full error payload to console for debugging (helps trace "Something went wrong")
    if (!response.ok) {
        console.error(`[RedConnect] API ${response.status} ${path}`, data);

        const fieldErrorMessage = data.fieldErrors
            ? Object.values(data.fieldErrors).find(Boolean)
            : null;

        const message =
            fieldErrorMessage ||
            data.message ||
            data.error ||
            `Request failed (${response.status}). Please try again.`;

        const error = new Error(message);
        error.status = response.status;
        error.payload = data;
        throw error;
    }
    return data;
}

/* ---------- Auth API ---------- */

export async function loginUser(email, password, remember = true) {
    const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
    storeSession(result.data, remember);
    return result;
}

export async function registerUser(profile) {
    const result = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(profile),
    });
    storeSession(result.data);
    return result;
}

export async function fetchMe() {
    const result = await apiRequest("/auth/me");
    if (result.data) {
        storeSession({ token: getToken(), email: result.data.email, fullName: result.data.fullName });
    }
    return result.data;
}

export async function sendAdminOtp(email) {
    return apiRequest("/auth/admin/send-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
    });
}

export async function verifyAdminOtp(email, otp, remember = true) {
    const result = await apiRequest("/auth/admin/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
    });
    storeSession(result.data, remember);
    return result;
}
