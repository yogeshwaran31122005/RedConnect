/* DonorDashboard - content for each tab:
   dashboard: stats + availability toggle | requests: incoming patient requests
   profile: editable profile form */

import { BLOOD_GROUPS } from "../api/constants";
import { saveProfile, updateAvailability, acceptDonorRequest, rejectDonorRequest, getIncomingRequests, isPending, isAccepted, friendlyRequestError } from "../api/data";
import { IconHeart, IconShield, IconFileText, IconCalendar, IconChevronRight } from "../components/Icons";

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

export default function DonorDashboard({ activeTab, goTab, profile, setProfile, incoming, setIncoming, showToast }) {
    const name = profile?.name || profile?.fullName || "Donor";
    const isAvailable = (profile?.availability || "Available") === "Available";
    const pending = incoming.filter((r) => isPending(r.status));
    const acceptedCount = incoming.filter((r) => isAccepted(r.status)).length;

    const updateField = (key) => (e) => setProfile((p) => ({ ...p, [key]: e.target.value }));

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const saved = await saveProfile(profile);
            setProfile((prev) => ({ ...saved, availability: prev.availability }));
            showToast("Profile saved to database.");
        } catch (err) {
            showToast(err.message || "Could not save.", "error");
        }
    };

    const setAvail = async (value) => {
        try {
            const saved = await updateAvailability(value);
            setProfile(saved);
            showToast(value === "Available" ? "You are now Available for patients." : "You are now Not Available.");
        } catch (err) {
            showToast(err.message || "Could not update availability.", "error");
        }
    };

    /* Donor clicks AVAILABLE / ACCEPT REQUEST (or NOT AVAILABLE).
       Calls PUT /api/donor-requests/{requestId}/accept|reject — never a dead 404. */
    const respond = async (id, accepted) => {
        if (id == null) {
            showToast("Invalid request id.", "error");
            return;
        }
        try {
            if (accepted) {
                await acceptDonorRequest(id);
            } else {
                await rejectDonorRequest(id);
            }
            try {
                const refreshed = await getIncomingRequests();
                setIncoming(refreshed);
            } catch (refreshErr) {
                // Status already updated on server; refresh failure is secondary.
                // Drop the answered row locally so the pending list stays correct.
                console.error("[DonorDashboard] refresh incoming failed", refreshErr);
                setIncoming((prev) => prev.filter((r) => r.id !== id));
                showToast(accepted ? "Request Accepted — patient can now see your details. (list refresh failed)" : "Marked Not Available. (list refresh failed)", "error");
                return;
            }
            showToast(accepted ? "Request Accepted — patient can now see your details." : "Marked Not Available. Patient has been notified.");
        } catch (err) {
            console.error("[DonorDashboard] respond failed", err);
            showToast(friendlyRequestError(err, accepted ? "accept this request" : "decline this request"), "error");
        }
    };

    if (activeTab === "requests") {
        return (
            <>
                <Head title="Patient Requests" sub="Accept to share your details — decline if you can't donate"
                    badge={<Badge icon={<IconFileText size={16} />} text={`${pending.length} pending`} />} />
                <div className="dash-grid">
                    {incoming.length === 0 && (
                        <div className="dash-empty">No patient requests yet.<small>When a patient clicks Emergency on your card, it appears here.</small></div>
                    )}
                    {incoming.slice().reverse().map((r) => (
                        <div className={`dash-card ${isAccepted(r.status) ? "hbar-green" : isPending(r.status) ? "" : "hbar-gray"}`} key={r.id}>
                            <div className="dash-card-title"><span className="dash-blood">{r.bloodGroup}</span>
                                <span className={`dash-status ${(r.status || "pending").toLowerCase()}`}>{r.status}</span>
                            </div>
                            <div className="dash-card-sub">From: {r.userEmail}</div>
                            <div className="dash-meta"><IconHeart size={16} />{r.units} unit(s) · {r.urgency || "Emergency"}</div>
                            <div className="dash-meta"><IconCalendar size={16} />{r.date || r.createdDate} · {r.location || r.hospitalName || "—"}</div>
                            {isAccepted(r.status) && (
                                <div className="dash-meta" style={{ color: "var(--rc-green, #15803d)", fontWeight: 600 }}>Request Accepted — patient notified.</div>
                            )}
                            {isPending(r.status) && (
                                <div className="dash-card-actions">
                                    <button className="dash-btn dash-btn-green" onClick={() => respond(r.id, true)}>Available</button>
                                    <button className="dash-btn dash-btn-ghost" onClick={() => respond(r.id, false)}>Not Available</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </>
        );
    }

    if (activeTab === "profile") {
        return (
            <>
                <Head title="My Profile" sub="Your details stored in the PostgreSQL users table" />
                <form onSubmit={handleSave}>
                    <div className="dash-form-card">
                        <div className="dash-profile-top">
                            <span className="dash-profile-avatar">{(name || "D").charAt(0).toUpperCase()}</span>
                            <div><h3>{name}</h3><p>{profile?.email}</p></div>
                            {profile?.bloodGroup && <span className="dash-blood" style={{ marginLeft: "auto" }}>{profile.bloodGroup}</span>}
                        </div>
                        <div className="dash-form-grid">
                            <div className="rc-field">
                                <label className="rc-label" htmlFor="dName">Full Name</label>
                                <div className="rc-input-wrap"><input id="dName" type="text" style={{ paddingLeft: 14 }} value={profile?.name || profile?.fullName || ""} onChange={updateField("name")} /></div>
                            </div>
                            <div className="rc-field">
                                <label className="rc-label">Email</label>
                                <div className="rc-input-wrap"><input type="email" style={{ paddingLeft: 14 }} value={profile?.email || ""} disabled /></div>
                            </div>
                            <div className="rc-field">
                                <label className="rc-label" htmlFor="dBg">Blood Group</label>
                                <select id="dBg" value={profile?.bloodGroup || ""} onChange={updateField("bloodGroup")}>
                                    <option value="">Select blood group</option>
                                    {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div className="rc-field">
                                <label className="rc-label" htmlFor="dPhone">Phone</label>
                                <div className="rc-input-wrap"><input id="dPhone" type="tel" style={{ paddingLeft: 14 }} value={profile?.phone || ""} onChange={updateField("phone")} /></div>
                            </div>
                            <div className="rc-field">
                                <label className="rc-label" htmlFor="dCity">City</label>
                                <div className="rc-input-wrap"><input id="dCity" type="text" style={{ paddingLeft: 14 }} value={profile?.city || ""} onChange={updateField("city")} /></div>
                            </div>
                            <div className="rc-field">
                                <label className="rc-label" htmlFor="dDob">Date of Birth</label>
                                <div className="rc-input-wrap"><input id="dDob" type="date" style={{ paddingLeft: 14 }} value={profile?.dateOfBirth || ""} onChange={updateField("dateOfBirth")} /></div>
                            </div>
                        </div>
                        <button type="submit" className="dash-btn" style={{ marginTop: 8 }}>Save to Database</button>
                    </div>
                </form>
            </>
        );
    }

    return (
        <>
            <Head title="Donor Dashboard" sub={`Welcome, ${name} — manage your availability and requests`}
                badge={isAvailable
                    ? <Badge icon={<IconShield size={16} />} text="Available" tone="green" />
                    : <Badge icon={<IconShield size={16} />} text="Not Available" tone="gray" />} />
            <div className="dash-stats">
                <div className="dash-stat"><span className="dash-stat-value">{profile?.bloodGroup || "—"}</span><span className="dash-stat-label">Blood Group</span></div>
                <div className="dash-stat"><span className="dash-stat-value">{pending.length}</span><span className="dash-stat-label">Pending Requests</span></div>
                <div className="dash-stat"><span className="dash-stat-value">{acceptedCount}</span><span className="dash-stat-label">Accepted</span></div>
                <div className="dash-stat"><span className="dash-stat-value" style={{ fontSize: 19 }}>{isAvailable ? "Available" : "Not Available"}</span><span className="dash-stat-label">My Status</span></div>
            </div>
            <div className="dash-panel">
                <h3>My availability</h3>
                <p>Patients only see you when you are Available. Toggle your status — it saves to the database instantly.</p>
                <div className="dash-card-actions" style={{ marginTop: 0, maxWidth: 420 }}>
                    <button type="button" className={`dash-btn dash-btn-ghost ${isAvailable ? "active-blue" : ""}`} onClick={() => setAvail("Available")}>Available</button>
                    <button type="button" className={`dash-btn dash-btn-ghost ${!isAvailable ? "active-red" : ""}`} onClick={() => setAvail("Not Available")}>Not Available</button>
                </div>
            </div>
            {pending.length > 0 && (
                <div className="dash-panel">
                    <h3>{pending.length} patient{pending.length > 1 ? "s" : ""} waiting</h3>
                    <p>Respond fast — patients see your contact details the moment you accept.</p>
                    <button className="dash-btn" onClick={() => goTab("requests")}>View Requests <IconChevronRight /></button>
                </div>
            )}
        </>
    );
}
