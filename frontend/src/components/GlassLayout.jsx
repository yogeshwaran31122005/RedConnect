/* GlassLayout - Shared wrapper with animated orbs + glass card */

export default function GlassLayout({ children }) {
    return (
        <>
            {/* Decorative blurred orbs */}
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>

            <main className="glass-card">
                {children}
            </main>
        </>
    );
}
