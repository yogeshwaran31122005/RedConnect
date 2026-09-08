/* LoginPage - Patient/Donor via password, Admin via static password Neymarjr (no OTP, no email) */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { loginUser, clearSession, getRememberPreference } from "../api/auth";
import { IconEmail, IconLock, IconUser, IconHeart, IconShield, IconEye, IconEyeOff, IconUserPlus } from "../components/Icons";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ADMIN_FIXED_EMAIL = "yogeshwaran31122005@gmail.com";

const ROLES = [
    { id: "PATIENT", label: "Patient", icon: <IconUser size={22} /> },
    { id: "DONOR", label: "Donor", icon: <IconHeart size={22} /> },
    { id: "ADMIN", label: "Admin", icon: <IconShield size={22} /> },
];

export default function LoginPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loginAs, setLoginAs] = useState(null);
    const [rememberMe, setRememberMe] = useState(getRememberPreference());
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const isAdminMode = loginAs === "ADMIN";

    const clearError = (field) => {
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const toggleRole = (id) => {
        setLoginAs((prev) => (prev === id ? null : id));
        setFormError("");
        setErrors({});
        setPassword("");
    };

    function validate() {
        const errs = {};
        if (!isAdminMode) {
            if (!email.trim()) {
                errs.email = "Email is required.";
            } else if (!EMAIL_REGEX.test(email.trim())) {
                errs.email = "Please enter a valid email address.";
            }
            if (!password) {
                errs.password = "Password is required.";
            }
        } else {
            // Admin: static email hidden, only password Neymarjr
            if (!password) {
                errs.password = "Password is required.";
            }
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
            if (isAdminMode) {
                // Static admin: fixed email, password validated server-side (Neymarjr)
                const result = await loginUser(ADMIN_FIXED_EMAIL, password, rememberMe);
                const accountRole = (result.data.role || "").toUpperCase();
                if (accountRole !== "ADMIN") {
                    clearSession();
                    setFormError(`This account is ${accountRole}, not ADMIN.`);
                    return;
                }
                setToast({ message: "Admin login successful!", type: "success" });
                setTimeout(() => navigate("/home"), 600);
            } else {
                const result = await loginUser(email.trim(), password, rememberMe);
                const accountRole = (result.data.role || "").toUpperCase();
                if (loginAs && accountRole !== loginAs) {
                    clearSession();
                    setFormError(`This account is registered as ${accountRole}. Please select ${accountRole}.`);
                    return;
                }
                setToast({ message: "Login successful! Welcome back.", type: "success" });
                setTimeout(() => navigate("/home"), 800);
            }
        } catch (err) {
            setFormError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="rc-auth-page">
            <div className="rc-brand">
                <img src="/logo.png" alt="RedConnect logo" style={{ width: 48, height: 48, objectFit: "contain" }} />
                <h1>RedConnect</h1>
                <p>Blood Donation Platform</p>
            </div>

            <div className="rc-card">
                <h2>Welcome back</h2>
                <p className="rc-card-sub">{isAdminMode ? "Admin sign-in" : "Sign in to your account"}</p>

                <form id="loginForm" onSubmit={handleSubmit} noValidate>
                    <span className="rc-label">Login As</span>
                    <div className="rc-roles" role="group" aria-label="Login as role">
                        {ROLES.map((r) => (
                            <button
                                key={r.id}
                                type="button"
                                className={`rc-role ${loginAs === r.id ? "selected" : ""}`}
                                onClick={() => toggleRole(r.id)}
                                aria-pressed={loginAs === r.id}
                            >
                                {r.icon}
                                {r.label}
                            </button>
                        ))}
                    </div>
                    <p className="rc-hint" style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, margin: "8px 0 0" }}>{isAdminMode ? "Full control via static password — tap again to un-select" : "Patient & donor requests — tap again to un-select"}</p>

                    <div style={{ height: 18 }} />

                    {!isAdminMode && (
                        <div className="rc-field">
                            <label className="rc-label" htmlFor="email">Email Address</label>
                            <div className="rc-input-wrap">
                                <span className="rc-icon"><IconEmail /></span>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="name@organization.com"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
                                    className={errors.email ? "invalid" : ""}
                                    autoComplete="email"
                                    autoFocus
                                />
                            </div>
                            {errors.email && <span className="rc-field-error">{errors.email}</span>}
                        </div>
                    )}

                    {/* Password field - shown for both, but for Admin it's the ONLY field */}
                    <div className="rc-field">
                        <label className="rc-label" htmlFor="password">Password</label>
                        <div className="rc-input-wrap">
                            <span className="rc-icon"><IconLock /></span>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder={isAdminMode ? "Enter admin password" : "Enter your password"}
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
                                className={errors.password ? "invalid" : ""}
                                autoComplete="current-password"
                                style={{ paddingRight: 44 }}
                                autoFocus={isAdminMode}
                            />
                            <button
                                type="button"
                                className="rc-eye"
                                onClick={() => setShowPassword((s) => !s)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <IconEyeOff /> : <IconEye />}
                            </button>
                        </div>
                        {errors.password && <span className="rc-field-error">{errors.password}</span>}
                    </div>

                    {!isAdminMode ? (
                        <div className="rc-row">
                            <label className="rc-check">
                                <input
                                    type="checkbox"
                                    id="rememberMe"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                Remember me
                            </label>
                            <button
                                type="button"
                                className="rc-link"
                                onClick={() => setToast({ message: "Password reset is not available — please contact your administrator.", type: "error" })}
                            >
                                Forgot password?
                            </button>
                        </div>
                    ) : (
                        <div className="rc-row">
                            <label className="rc-check">
                                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                                Remember me
                            </label>
                        </div>
                    )}

                    {formError && <div className="rc-form-error" id="formError">{formError}</div>}

                    <button type="submit" className="rc-btn" id="loginBtn" disabled={loading}>
                        {loading ? "Signing in…" : "Sign In"}
                    </button>
                </form>
            </div>

            {!isAdminMode && (
                <div className="rc-footer">
                    <button type="button" id="createUserBtn" onClick={() => navigate("/register")}>
                        <IconUserPlus /> Create new account
                    </button>
                </div>
            )}
            {isAdminMode && (
                <div className="rc-footer" style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
                    Admin access only — no registration.
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
