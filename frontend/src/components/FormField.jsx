/* FormField - Reusable form input with label + error message */

export default function FormField({
    id,
    label,
    type = "text",
    placeholder = "",
    value,
    onChange,
    error,
    autoComplete,
    autoFocus = false,
}) {
    return (
        <div className="field">
            <label htmlFor={id}>{label}</label>
            <input
                type={type}
                id={id}
                name={id}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
                autoFocus={autoFocus}
                className={error ? "invalid" : ""}
            />
            <small className="error-msg" id={`${id}Error`}>
                {error || ""}
            </small>
        </div>
    );
}
