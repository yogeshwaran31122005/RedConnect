/* GlassLayout - Shared page wrapper with optional animated background */

export default function GlassLayout({ children, className = "", variant = "auth" }) {
    return (
        <main className={`glass-card ${variant === "auth" ? "glass-auth" : ""} ${className}`.trim()}>
            {variant === "auth" && (
                <div className="auth-bg" aria-hidden="true">
                    <div className="orb orb-1" />
                    <div className="orb orb-2" />
                    <div className="orb orb-3" />
                    <div className="orb orb-4" />
                </div>
            )}
            {children}
        </main>
    );
}