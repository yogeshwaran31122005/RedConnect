/* RegisterPage - clean light card: name + email + password + role tiles only */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { registerUser } from "../api/auth";
import { IconEmail, IconLock, IconUser, IconHeart, IconEye, IconEyeOff } from "../components/Icons";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ROLES = [
    { id: "PATIENT", label: "Patient", icon: <IconUser size={22} /> },
    { id: "DONOR", label: "Donor", icon: <IconHeart size={22} /> },
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function RegisterPage() {
    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [bloodGroup, setBloodGroup] = useState("O+");
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState(null);
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const clearError = (field) => {
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    function validate() {
        const errs = {};
        if (!fullName.trim()) {
            errs.fullName = "Full name is required.";
        }
        if (!email.trim()) {
            errs.email = "Email is required.";
        } else if (!EMAIL_REGEX.test(email.trim())) {
            errs.email = "Please enter a valid email address.";
        }
        if (!password) {
            errs.password = "Password is required.";
        } else if (password.length < 6) {
            errs.password = "Password must be at least 6 characters.";
        } else if (password.length > 60) {
            errs.password = "Password must be at most 60 characters.";
        }
        if (!bloodGroup) {
            errs.bloodGroup = "Blood group is required.";
        }
        if (!role) {
            errs.role = "Please select a role.";
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
            await registerUser({
                fullName: fullName.trim(),
                email: email.trim(),
                password,
                bloodGroup,
                role,
            });
            setToast({ message: "Account created! Welcome to RedConnect.", type: "success" });
            setTimeout(() => navigate("/home"), 1200);
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
                <h2>Create account</h2>
                <p className="rc-card-sub">Join RedConnect to get started</p>

                <form id="registerForm" onSubmit={handleSubmit} noValidate>
                    <span className="rc-label">Register As</span>
                    <div className="rc-roles" role="group" aria-label="Register as role">
                        {ROLES.map((r) => (
                            <button
                                key={r.id}
                                type="button"
                                className={`rc-role ${role === r.id ? "selected" : ""}`}
                                onClick={() => { setRole(r.id); clearError("role"); }}
                                aria-pressed={role === r.id}
                            >
                                {r.icon}
                                {r.label}
                            </button>
                        ))}
                    </div>
                    {errors.role
                        ? <span className="rc-field-error" style={{ textAlign: "center", marginTop: 8 }}>{errors.role}</span>
                        : <p className="rc-hint">Choose how you will use RedConnect</p>}

                    <div className="rc-field">
                        <label className="rc-label" htmlFor="bloodGroup">Blood Group</label>
                        <div className="rc-input-wrap" style={{ paddingLeft: 12 }}>
                            <select
                                id="bloodGroup"
                                value={bloodGroup}
                                onChange={(e) => { setBloodGroup(e.target.value); clearError("bloodGroup"); }}
                                className={errors.bloodGroup ? "invalid" : ""}
                                style={{ width: "100%", border: "none", background: "transparent", fontSize: 18, color: "#1e293b", padding: "12px 10px" }}
                            >
                                {BLOOD_GROUPS.map((group) => (
                                    <option key={group} value={group}>{group}</option>
                                ))}
                            </select>
                        </div>
                        {errors.bloodGroup && <span className="rc-field-error">{errors.bloodGroup}</span>}
                    </div>

                    <div style={{ height: 20 }} />

                    <div className="rc-field">
                        <label className="rc-label" htmlFor="fullName">Full Name</label>
                        <div className="rc-input-wrap">
                            <span className="rc-icon"><IconUser /></span>
                            <input
                                id="fullName"
                                type="text"
                                placeholder="Enter your full name"
                                value={fullName}
                                onChange={(e) => { setFullName(e.target.value); clearError("fullName"); }}
                                className={errors.fullName ? "invalid" : ""}
                                autoComplete="name"
                                autoFocus
                            />
                        </div>
                        {errors.fullName && <span className="rc-field-error">{errors.fullName}</span>}
                    </div>

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
                            />
                        </div>
                        {errors.email && <span className="rc-field-error">{errors.email}</span>}
                    </div>

                    <div className="rc-field">
                        <label className="rc-label" htmlFor="password">Password</label>
                        <div className="rc-input-wrap">
                            <span className="rc-icon"><IconLock /></span>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a password (min. 6 characters)"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
                                className={errors.password ? "invalid" : ""}
                                autoComplete="new-password"
                                style={{ paddingRight: 44 }}
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

                    {formError && <div className="rc-form-error" id="formError">{formError}</div>}

                    <button type="submit" className="rc-btn" id="registerBtn" disabled={loading}>
                        {loading ? "Creating account…" : "Create Account"}
                    </button>
                </form>
            </div>

            <div className="rc-footer">
                <button type="button" id="backToLoginBtn" onClick={() => navigate("/")}>
                    Already have an account? Sign in
                </button>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
