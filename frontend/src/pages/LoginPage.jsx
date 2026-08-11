/* LoginPage - User login with email + password */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassLayout from "../components/GlassLayout";
import FormField from "../components/FormField";
import Toast from "../components/Toast";
import { loginUser, isLoggedIn, getEmail, clearSession } from "../api/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function LoginPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [loggedIn, setLoggedIn] = useState(isLoggedIn());

    function validate() {
        const errs = {};
        if (!email.trim()) {
            errs.email = "Email is required.";
        } else if (!EMAIL_REGEX.test(email.trim())) {
            errs.email = "Please enter a valid email address.";
        }
        if (!password) {
            errs.password = "Password is required.";
        }
        return errs;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setFormError("");
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setLoading(true);
        try {
            await loginUser(email.trim(), password);
            setToast({ message: "Login successful! Welcome back to RedConnect.", type: "success" });
            setLoggedIn(true);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function handleLogout() {
        clearSession();
        setLoggedIn(false);
        setEmail("");
        setPassword("");
        setToast({ message: "Logged out successfully.", type: "success" });
    }

    return (
        <GlassLayout>
            <div className="glass-brand">
                <span className="drop">🩸</span>
                <h1>RedConnect</h1>
                <p>Donate Blood, Save Lives</p>
            </div>

            {!loggedIn ? (
                <>
                    <form id="loginForm" onSubmit={handleSubmit} noValidate>
                        <FormField
                            id="email"
                            label="User ID (Email)"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            error={errors.email}
                            autoComplete="email"
                            autoFocus
                        />

                        <FormField
                            id="password"
                            label="Password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={errors.password}
                            autoComplete="current-password"
                        />

                        {formError && (
                            <div className="error-msg form-error" id="formError">
                                {formError}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn-glass btn-primary"
                            id="loginBtn"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="btn-spinner">Signing in…</span>
                            ) : (
                                "Login"
                            )}
                        </button>
                    </form>

                    <div className="divider">
                        <span>New to RedConnect?</span>
                    </div>

                    <button
                        type="button"
                        className="btn-glass btn-ghost"
                        id="createUserBtn"
                        onClick={() => navigate("/register")}
                    >
                        Create New User
                    </button>
                </>
            ) : (
                <div className="logged-in" id="loggedIn">
                    ✅ Logged in as <strong>{getEmail() || "you"}</strong>
                    <button
                        type="button"
                        className="link-btn"
                        id="logoutBtn"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            )}

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </GlassLayout>
    );
}
