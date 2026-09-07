/* Toast - Premium notification with glassmorphism, icon, and auto-dismiss progress */

import { useState, useEffect } from "react";

const ICONS = {
    success: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12l3 3 5-5" />
        </svg>
    ),
    error: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
    ),
};

export default function Toast({ message, type = "success", onClose, duration = 3500 }) {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        if (!message) return;

        const timer = setTimeout(() => {
            setExiting(true);
            setTimeout(onClose, 400);
        }, duration);

        return () => clearTimeout(timer);
    }, [message, duration, onClose]);

    if (!message) return null;

    return (
        <div className={`toast toast-${type} ${exiting ? "toast-exit" : ""}`} role="alert">
            <span className="toast-icon">{ICONS[type] || ICONS.success}</span>
            <span className="toast-msg">{message}</span>
            <div className="toast-progress" style={{ animationDuration: `${duration}ms` }} />
        </div>
    );
}
