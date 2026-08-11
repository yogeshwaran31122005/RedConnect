/* ============ RedConnect - API Helper ============ */

const API_BASE = "/api";

/* ---------- Session helpers ---------- */

export function storeSession(data) {
    localStorage.setItem("redconnect_token", data.token);
    localStorage.setItem("redconnect_email", data.email);
}

export function getToken() {
    return localStorage.getItem("redconnect_token");
}

export function getEmail() {
    return localStorage.getItem("redconnect_email");
}

export function clearSession() {
    localStorage.removeItem("redconnect_token");
    localStorage.removeItem("redconnect_email");
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

    const response = await fetch(API_BASE + path, { ...options, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message =
            data.message ||
            (data.fieldErrors ? Object.values(data.fieldErrors)[0] : null) ||
            data.error ||
            "Something went wrong. Please try again.";
        const error = new Error(message);
        error.status = response.status;
        throw error;
    }
    return data;
}

/* ---------- Auth API ---------- */

export async function loginUser(email, password) {
    const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
    storeSession(result.data);
    return result;
}

export async function registerUser(email, password) {
    const result = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
    return result;
}
