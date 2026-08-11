/* Toast - Notification component for success/error messages */

import { useState, useEffect } from "react";

export default function Toast({ message, type = "success", onClose, duration = 3500 }) {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        if (!message) return;

        const timer = setTimeout(() => {
            setExiting(true);
            setTimeout(onClose, 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [message, duration, onClose]);

    if (!message) return null;

    return (
        <div className={`toast toast-${type} ${exiting ? "toast-exit" : ""}`}>
            {type === "success" ? "✅" : "⚠️"} {message}
        </div>
    );
}
