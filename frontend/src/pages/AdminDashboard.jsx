/* AdminDashboard - dashboard, users with delete, requests, app logs (Mailtrap OTP audit) */

import { useState } from "react";
import { IconUsers, IconShield, IconPhone, IconLocation, IconCalendar, IconFileText } from "../components/Icons";
import { deleteUser } from "../api/data";

function Head({ title, sub, badge }) {
    return (
        <div className="dash-head">
            <div><h1>{title}</h1><p>{sub}</p></div>
            {badge}
        </div>
    );
}

function Badge({ icon, text, tone = "" }) {
    return <span className={`dash-badge ${tone}`}>{icon}{text}</span>;
}

export default function AdminDashboard({ activeTab, profile, users, setUsers, allRequests, appLogs, setAppLogs, showToast }) {
    const name = profile?.name || profile?.fullName || "Admin";
    const patients = users.filter((u) => (u.role || "").toUpperCase() === "PATIENT").length;
    const donors = users.filter((u) => (u.role || "").toUpperCase() === "DONOR").length;
    const pending = allRequests.filter((r) => r.status === "Pending").length;
    const [deleting, setDeleting] = useState(null);

    const handleDelete = async (id, email) => {
        if (!confirm(`Remove user ${email}? This cannot be undone.`)) return;
        setDeleting(id);
        try {
            await deleteUser(id);
            setUsers(prev => prev.filter(u => (u.id || u.email) !== id && u.id !== id));
            // also filter by id numeric
            setUsers(prev => prev.filter(u => String(u.id) !== String(id)));
            // force refetch is alternative but local filter works
            showToast(`Removed ${email}`);
            // refresh logs if present
            if (setAppLogs) {
                // keep as is, no auto refresh
            }
        } catch (err) {
            showToast(err.message || "Could not remove user.", "error");
        } finally {
            setDeleting(null);
        }
    };

    if (activeTab === "users") {
        return (
            <>
                <Head title="All Users" sub="Detailed user table — remove users from system"
                    badge={<Badge icon={<IconUsers size={16} />} text={`${users.length} users`} />} />
                <div className="dash-grid">
                    {users.length === 0 && <div className="dash-empty">No users found.<small>Registered patients, donors and admins appear here.</small></div>}
                    {users.map((u) => (
                        <div className="dash-card hbar-gray" key={u.id || u.email} style={{ position: "relative" }}>
                            <div className="dash-card-title">{u.fullName || u.name} <span className="dash-role-pill">{u.role}</span></div>
                            <div className="dash-card-sub">{u.email} {u.id ? <small style={{ color: "#94a3b8" }}>#{u.id}</small> : null}</div>
                            <div className="dash-meta"><span className="dash-blood">{u.bloodGroup || "—"}</span><span>{u.availability || "Available"}</span></div>
                            <div className="dash-meta"><IconPhone size={16} />{u.phone || "No phone"}</div>
                            <div className="dash-meta"><IconLocation size={16} />{u.city || "City not set"}</div>
                            {u.dateOfBirth && <div className="dash-meta"><IconCalendar size={16} />DOB: {u.dateOfBirth}</div>}
                            <button
                                className="dash-btn dash-btn-ghost"
                                style={{ marginTop: 10, borderColor: "#fecaca", color: "#dc2626", fontSize: 13 }}
                                onClick={() => handleDelete(u.id, u.email)}
                                disabled={deleting === u.id}
                            >
                                {deleting === u.id ? "Removing..." : "Remove User"}
                            </button>
                        </div>
                    ))}
                </div>
            </>
        );
    }

    if (activeTab === "requests") {
        return (
            <>
                <Head title="All Requests" sub="Every row from the blood_requests table"
                    badge={<Badge icon={<IconShield size={16} />} text={`${pending} pending`} />} />
                <div className="dash-grid">
                    {allRequests.length === 0 && <div className="dash-empty">No requests in database.<small>Patient emergency requests appear here.</small></div>}
                    {allRequests.slice().reverse().map((r) => (
                        <div className={`dash-card ${r.status === "Accepted" ? "hbar-green" : r.status === "Pending" ? "" : "hbar-gray"}`} key={r.id}>
                            <div className="dash-card-title"><span className="dash-blood">{r.bloodGroup}</span>
                                <span className={`dash-status ${(r.status || "pending").toLowerCase()}`}>{r.status}</span>
                            </div>
                            <div className="dash-card-sub">Patient: {r.userEmail}</div>
                            <div className="dash-meta"><IconUsers size={16} />Donor: {r.donorName ? `${r.donorName} (${r.donorEmail})` : "—"}</div>
                            <div className="dash-meta"><IconCalendar size={16} />{r.date || r.createdDate} · {r.units} unit(s)</div>
                        </div>
                    ))}
                </div>
            </>
        );
    }

    if (activeTab === "logs") {
        return (
            <>
                <Head title="Application Logs" sub="Audit trail persisted in PostgreSQL app_logs table"
                    badge={<Badge icon={<IconFileText size={16} />} text={`${(appLogs||[]).length} events`} />} />
                <div className="dash-panel" style={{ overflowX: "auto" }}>
                    {(appLogs||[]).length === 0 ? (
                        <div className="dash-empty">No logs yet.<small>Admin OTP sends, logins and deletions are recorded here.</small></div>
                    ) : (
                        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ textAlign: "left", borderBottom: "2px solid #e2e8f0", color: "#64748b" }}>
                                    <th style={{ padding: "8px 6px" }}>Time</th>
                                    <th style={{ padding: "8px 6px" }}>Level</th>
                                    <th style={{ padding: "8px 6px" }}>Action</th>
                                    <th style={{ padding: "8px 6px" }}>Actor</th>
                                    <th style={{ padding: "8px 6px" }}>Message</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appLogs.map(l => (
                                    <tr key={l.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                        <td style={{ padding: "6px", whiteSpace: "nowrap" }}>{(l.timestamp||"").replace("T"," ").slice(0,19)}</td>
                                        <td style={{ padding: "6px" }}><span className={`dash-status ${l.level?.toLowerCase()}`}>{l.level}</span></td>
                                        <td style={{ padding: "6px", fontFamily: "monospace", fontSize: 11 }}>{l.action}</td>
                                        <td style={{ padding: "6px", fontSize: 12 }}>{l.actorEmail||"—"}</td>
                                        <td style={{ padding: "6px" }}>{l.message}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Admin Dashboard" sub={`Welcome, ${name} — via OTP (Mailtrap) — platform overview from PostgreSQL`}
                badge={<Badge icon={<IconUsers size={16} />} text={`${users.length} users`} />} />
            <div className="dash-stats">
                <div className="dash-stat"><span className="dash-stat-value">{users.length}</span><span className="dash-stat-label">Total Users</span></div>
                <div className="dash-stat"><span className="dash-stat-value">{patients}</span><span className="dash-stat-label">Patients</span></div>
                <div className="dash-stat"><span className="dash-stat-value">{donors}</span><span className="dash-stat-label">Donors</span></div>
                <div className="dash-stat"><span className="dash-stat-value">{allRequests.length}</span><span className="dash-stat-label">Requests ({pending} pending)</span></div>
            </div>
            <div className="dash-panel">
                <h3>Platform at a glance</h3>
                <p>Admin authenticated via OTP sent with Mailtrap (API key ...771e5c). No self-registration for admins.</p>
                <div className="dash-steps">
                    <div className="dash-step"><span className="dash-step-num">1</span>All Users: view details & remove users (DELETE /api/data/admin/users/{`{id}`}).</div>
                    <div className="dash-step"><span className="dash-step-num">2</span>All Requests tracks each patient → donor emergency request.</div>
                    <div className="dash-step"><span className="dash-step-num">3</span>Application Logs shows every OTP send, login and deletion persisted in app_logs.</div>
                </div>
            </div>
        </>
    );
}
