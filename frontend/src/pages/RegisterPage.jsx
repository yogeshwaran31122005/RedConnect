/* RegisterPage - User registration with email + password */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassLayout from "../components/GlassLayout";
import FormField from "../components/FormField";
import Toast from "../components/Toast";
import { registerUser } from "../api/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function RegisterPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    function validate() {
        const errs = {};
        if (!email.trim()) {
            errs.email = "Email is required.";
        } else if (!EMAIL_REGEX.test(email.trim())) {
            errs.email = "Please enter a valid email address.";
        }
        if (!password) {
            errs.password = "Password is required.";
        } else if (password.length < 6) {
            errs.password = "Password must be at least 6 characters.";
        }
        if (!confirmPassword) {
            errs.confirmPassword = "Please confirm your password.";
        } else if (password !== confirmPassword) {
            errs.confirmPassword = "Passwords do not match.";
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
            await registerUser(email.trim(), password);
            setToast({ message: "Account created! Please log in to continue.", type: "success" });
            setTimeout(() => navigate("/"), 1200);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <GlassLayout>
            <div className="glass-brand">
                <span className="drop">🩸</span>
                <h1>RedConnect</h1>
                <p>Create your account</p>
            </div>

            <form id="registerForm" onSubmit={handleSubmit} noValidate>
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
                    placeholder="Create a password (min. 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errors.password}
                    autoComplete="new-password"
                />

                <FormField
                    id="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={errors.confirmPassword}
                    autoComplete="new-password"
                />

                {formError && (
                    <div className="error-msg form-error" id="formError">
                        {formError}
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-glass btn-primary"
                    id="registerBtn"
                    disabled={loading}
                >
                    {loading ? (
                        <span className="btn-spinner">Creating account…</span>
                    ) : (
                        "Register"
                    )}
                </button>
            </form>

            <div className="divider">
                <span>Already have an account?</span>
            </div>

            <button
                type="button"
                className="btn-glass btn-ghost"
                id="backToLoginBtn"
                onClick={() => navigate("/")}
            >
                Back to Login
            </button>

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
