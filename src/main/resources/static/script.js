/* ============ RedConnect - Login / Register Scripts ============ */

const API_BASE = "/api";

/* ---------- Helpers ---------- */

function storeSession(data) {
    localStorage.setItem("redconnect_token", data.token);
    localStorage.setItem("redconnect_email", data.email);
}

function getToken() {
    return localStorage.getItem("redconnect_token");
}

function getEmail() {
    return localStorage.getItem("redconnect_email");
}

function clearSession() {
    localStorage.removeItem("redconnect_token");
    localStorage.removeItem("redconnect_email");
}

async function apiRequest(path, options = {}) {
    const headers = options.headers || {};
    if (options.body) headers["Content-Type"] = "application/json";
    const token = getToken();
    if (token) headers["Authorization"] = "Bearer " + token;

    const response = await fetch(API_BASE + path, { ...options, headers });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message = data.message
            || (data.fieldErrors ? Object.values(data.fieldErrors)[0] : null)
            || data.error
            || "Something went wrong. Please try again.";
        const error = new Error(message);
        error.status = response.status;
        throw error;
    }
    return data;
}

function setError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = message || "";
}

function clearErrors(...ids) {
    ids.forEach(setError);
}

/* ---------- Login Page ---------- */

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const loginBtn = document.getElementById("loginBtn");
    const createUserBtn = document.getElementById("createUserBtn");
    const loggedIn = document.getElementById("loggedIn");
    const loggedInEmail = document.getElementById("loggedInEmail");
    const logoutBtn = document.getElementById("logoutBtn");

    /* If already logged in, show that state instead of the form */
    const token = getToken();
    if (token && loggedIn) {
        loginForm.hidden = true;
        loggedIn.hidden = false;
        loggedInEmail.textContent = getEmail() || "you";
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            clearSession();
            location.reload();
        });
    }

    if (createUserBtn) {
        createUserBtn.addEventListener("click", () => {
            window.location.href = "register.html";
        });
    }

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearErrors("emailError", "passwordError", "formError");

        let valid = true;
        if (!email.value.trim()) {
            setError("emailError", "Email is required.");
            valid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
            setError("emailError", "Please enter a valid email address.");
            valid = false;
        }
        if (!password.value) {
            setError("passwordError", "Password is required.");
            valid = false;
        }
        if (!valid) return;

        loginBtn.disabled = true;
        loginBtn.textContent = "Signing in...";

        try {
            const body = {
                email: email.value.trim(),
                password: password.value,
            };
            const result = await apiRequest("/auth/login", {
                method: "POST",
                body: JSON.stringify(body),
            });
            storeSession(result.data);
            alert("Login successful! Welcome back to RedConnect.");
            location.reload();
        } catch (err) {
            setError("formError", err.message);
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = "Login";
        }
    });
}

/* ---------- Register Page ---------- */

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");
    const registerBtn = document.getElementById("registerBtn");

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearErrors("emailError", "passwordError", "confirmError", "formError");

        let valid = true;
        if (!email.value.trim()) {
            setError("emailError", "Email is required.");
            valid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
            setError("emailError", "Please enter a valid email address.");
            valid = false;
        }
        if (!password.value) {
            setError("passwordError", "Password is required.");
            valid = false;
        } else if (password.value.length < 6) {
            setError("passwordError", "Password must be at least 6 characters.");
            valid = false;
        }
        if (confirmPassword.value !== password.value) {
            setError("confirmError", "Passwords do not match.");
            valid = false;
        }
        if (!valid) return;

        registerBtn.disabled = true;
        registerBtn.textContent = "Creating account...";

        try {
            const body = {
                email: email.value.trim(),
                password: password.value,
            };
            await apiRequest("/auth/register", {
                method: "POST",
                body: JSON.stringify(body),
            });
            clearSession();
            alert("Account created successfully! Please login with your new credentials.");
            window.location.href = "login.html";
        } catch (err) {
            setError("formError", err.message);
        } finally {
            registerBtn.disabled = false;
            registerBtn.textContent = "Create Account";
        }
    });
}
