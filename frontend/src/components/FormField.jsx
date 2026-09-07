/* FormField - Reusable form control (input / select / textarea) with label, error, hint,
   icon prefix support, and a show/hide toggle for password fields */

import { useState } from "react";

export default function FormField({
    id,
    label,
    type = "text",
    placeholder = "",
    value,
    onChange,
    error,
    hint,
    autoComplete,
    autoFocus = false,
    options = [],
    rows = 3,
    min,
    max,
    required = false,
    disabled = false,
    className: outerClass = "",
    icon = null,
}) {
    const invalid = error ? "invalid" : "";
    const hasIcon = !!icon;

    if (type === "select") {
        return (
            <div className={`field ${outerClass}`}>
                <label htmlFor={id}>{label}</label>
                <div className={`input-wrap ${hasIcon ? "has-icon" : ""}`}>
                    {hasIcon && <span className="field-icon">{icon}</span>}
                    <select
                        id={id}
                        name={id}
                        value={value}
                        onChange={onChange}
                        required={required}
                        disabled={disabled}
                        className={invalid}
                    >
                        <option value="" disabled>
                            {placeholder || "Select an option"}
                        </option>
                        {options.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
                {hint && !error && <small className="field-hint" id={`${id}Hint`}>{hint}</small>}
                <small className="error-msg" id={`${id}Error`}>
                    {error || ""}
                </small>
            </div>
        );
    }

    if (type === "textarea") {
        return (
            <div className={`field ${outerClass}`}>
                <label htmlFor={id}>{label}</label>
                <div className={`input-wrap ${hasIcon ? "has-icon" : ""}`}>
                    {hasIcon && <span className="field-icon">{icon}</span>}
                    <textarea
                        id={id}
                        name={id}
                        placeholder={placeholder}
                        value={value}
                        onChange={onChange}
                        rows={rows}
                        required={required}
                        disabled={disabled}
                        autoFocus={autoFocus}
                        className={invalid}
                    />
                </div>
                <small className="error-msg" id={`${id}Error`}>
                    {error || ""}
                </small>
            </div>
        );
    }

    if (type === "password") {
        return <PasswordField {...{ id, label, placeholder, value, onChange, error, hint, autoComplete, autoFocus, required, disabled, outerClass, icon }} />;
    }

    return (
        <div className={`field ${outerClass}`}>
            <label htmlFor={id}>{label}</label>
            <div className={`input-wrap ${hasIcon ? "has-icon" : ""}`}>
                {hasIcon && <span className="field-icon">{icon}</span>}
                <input
                    type={type}
                    id={id}
                    name={id}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    autoFocus={autoFocus}
                    min={min}
                    max={max}
                    required={required}
                    disabled={disabled}
                    className={invalid}
                />
            </div>
            {hint && !error && <small className="field-hint" id={`${id}Hint`}>{hint}</small>}
            <small className="error-msg" id={`${id}Error`}>
                {error || ""}
            </small>
        </div>
    );
}

function PasswordField({ id, label, placeholder, value, onChange, error, hint, autoComplete, autoFocus, required, disabled, outerClass, icon }) {
    const [show, setShow] = useState(false);
    const invalid = error ? "invalid" : "";
    const hasIcon = !!icon;

    return (
        <div className={`field ${outerClass}`}>
            <label htmlFor={id}>{label}</label>
            <div className={`input-wrap has-toggle ${hasIcon ? "has-icon" : ""}`}>
                {hasIcon && <span className="field-icon">{icon}</span>}
                <input
                    type={show ? "text" : "password"}
                    id={id}
                    name={id}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    autoFocus={autoFocus}
                    required={required}
                    disabled={disabled}
                    className={invalid}
                />
                <button
                    type="button"
                    className="password-toggle"
                    aria-label={show ? "Hide password" : "Show password"}
                    title={show ? "Hide password" : "Show password"}
                    tabIndex={-1}
                    onClick={() => setShow((s) => !s)}
                >
                    {show ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            </div>
            {hint && !error && <small className="field-hint" id={`${id}Hint`}>{hint}</small>}
            <small className="error-msg" id={`${id}Error`}>
                {error || ""}
            </small>
        </div>
    );
}

function EyeIcon() {
    return (
        <svg className="eye-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function EyeOffIcon() {
    return (
        <svg className="eye-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    );
}