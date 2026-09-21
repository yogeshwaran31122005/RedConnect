/* PatientDashboard - content for each tab:
   dashboard: stats + how-it-works | donors: matching donor cards + Emergency
   requests: my requests with donor details | profile: editable profile form */

import { useState } from "react";
import { BLOOD_GROUPS } from "../api/constants";
import { saveProfile, sendDonorRequest, updateRequestStatus, getRequests, getMatchingDonors, isPending, isAccepted, normStatus, friendlyRequestError } from "../api/data";
import { IconHeart, IconShield, IconPhone, IconLocation, IconCalendar, IconEmergency, IconChevronRight } from "../components/Icons";

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

export default function PatientDashboard({ activeTab, goTab, profile, setProfile, donors, setDonors, requests, setRequests, showToast }) {
    const name = profile?.name || profile?.fullName || "Patient";
    const pending = requests.filter((r) => isPending(r.status)).length;
    const accepted = requests.filter((r) => isAccepted(r.status)).length;
    const [expandedDonor, setExpandedDonor] = useState(null);

    const updateField = (key) => (e) => setProfile((p) => ({ ...p, [key]: e.target.value }));

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const saved = await saveProfile(profile);
            setProfile(saved);
            setDonors(await getMatchingDonors());
            showToast("Profile saved to database.");
        } catch (err) {
            showToast(err.message || "Unable to save profile.", "error");
        }
    };

    const handleEmergency = async (donor) => {
        try {
            await sendDonorRequest(donor.email, { units: 1 });
            setRequests(await getRequests());
            showToast(`Emergency request sent to ${donor.fullName || donor.name}.`);
            goTab("requests");
        } catch (err) {
            showToast(friendlyRequestError(err, "send this request"), "error");
        }
    };

    const handleCancel = async (id) => {
        try {
            await updateRequestStatus(id, "Cancelled");
            setRequests(await getRequests());
            showToast("Request cancelled.");
        } catch (err) {
            showToast(friendlyRequestError(err, "cancel this request"), "error");
        }
    };

    /* Patient-visible pipeline: PENDING → DONOR NOTIFIED → DONOR ACCEPTED → DONOR DETAILS AVAILABLE */
    const pipelineStage = (r) => {
        const s = normStatus(r.status);
        if (s === "ACCEPTED") return 3;
        if (s === "REJECTED" || s === "CANCELLED") return -1;
        return r.donorEmail ? 1 : 0; // created → donor notified once routed to a donor
    };

    const pipelineLabels = ["Pending", "Donor Notified", "Donor Accepted", "Donor Details Available"];

    if (activeTab === "donors") {
        return (
            <>
                <Head title="Matching Donors" sub={profile?.bloodGroup ? `Only Available donors with blood group ${profile.bloodGroup}` : "Set your blood group to see matches"}
                    badge={<Badge icon={<IconHeart size={16} />} text={`${donors.length} available`} />} />
                {!profile?.bloodGroup && (
                    <div className="dash-panel">
                        <h3>Set your blood group first</h3>
                        <p>Go to Profile and save your blood group — matching donors will then appear here.</p>
                        <button className="dash-btn" onClick={() => goTab("profile")}>Go to Profile <IconChevronRight /></button>
                    </div>
                )}
                <div className="dash-grid">
                    {donors.length === 0 && profile?.bloodGroup && (
                        <div className="dash-empty">No matching donors found.<small>Donors with your blood group appear here once registered and Available.</small></div>
                    )}
                    {donors.map((d) => (
                        <div className="dash-card" key={d.id || d.email}>
                            <div className="dash-card-title">{d.fullName || d.name} <span className="dash-blood">{d.bloodGroup}</span></div>
                            <div className="dash-card-sub">{d.availability || "Available"}</div>
                            <div className="dash-meta"><IconPhone size={16} />{d.phone || "No phone"}</div>
                            <div className="dash-meta"><IconLocation size={16} />{d.city || "City not set"}</div>
                            <div className="dash-meta"><IconCalendar size={16} />{d.email}</div>
                            <div className="dash-card-actions">
                                <button className="dash-btn dash-btn-red" onClick={() => handleEmergency(d)}>
                                    <IconEmergency size={17} /> Emergency Request
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </>
        );
    }

    if (activeTab === "requests") {
        return (
            <>
                <Head title="My Requests" sub="Donor contact details appear once the donor accepts"
                    badge={<Badge icon={<IconShield size={16} />} text={`${pending} pending`} />} />
                <div className="dash-grid">
                    {requests.length === 0 && (
                        <div className="dash-empty">No requests yet.<small>Send an Emergency request from Matching Donors.</small></div>
                    )}
                    {requests.slice().reverse().map((r) => {
                        const acceptedNow = isAccepted(r.status);
                        const pendingNow = isPending(r.status);
                        const stage = pipelineStage(r);
                        const expanded = expandedDonor === r.id;
                        return (
                        <div className={`dash-card ${(pendingNow || acceptedNow) ? "" : "hbar-gray"}`} key={r.id}>
                            <div className="dash-card-title"><span className="dash-blood">{r.bloodGroup}</span>
                                <span className={`dash-status ${(r.status || "pending").toLowerCase()}`}>{r.status}</span>
                            </div>
                            <div className="dash-card-sub">Donor: {acceptedNow ? (r.donorName || "Donor") : (r.donorName || "Waiting for donor…")}</div>
                            {/* Request pipeline */}
                            <div className="dash-meta" style={{ flexWrap: "wrap" }}>
                                {stage === -1
                                    ? <span>{normStatus(r.status) === "REJECTED" ? "Donor is currently not available." : "Request cancelled."}</span>
                                    : pipelineLabels.slice(0, stage + 1).join(" → ")}
                            </div>
                            {acceptedNow && (
                                <>
                                    <div className="dash-meta" style={{ fontWeight: 700, color: "var(--rc-green, #15803d)" }}>DONOR ACCEPTED</div>
                                    <div className="dash-meta">Donor Name: {r.donorName || "—"}</div>
                                    <div className="dash-meta">Blood Group: {r.bloodGroup || "—"}</div>
                                    <div className="dash-meta"><IconPhone size={16} />{r.donorPhone || "—"}</div>
                                    <div className="dash-meta"><IconLocation size={16} />{r.donorCity || "—"}{r.donorEmail ? ` · ${r.donorEmail}` : ""}</div>
                                    <div className="dash-meta">Availability: Available</div>
                                    <div className="dash-card-actions">
                                        <button className="dash-btn dash-btn-ghost" onClick={() => setExpandedDonor(expanded ? null : r.id)}>
                                            {expanded ? "Hide Donor Details" : "View Donor Details"}
                                        </button>
                                    </div>
                                    {expanded && (
                                        <div className="dash-meta" style={{ display: "block", lineHeight: 1.7 }}>
                                            <div>Donor Name: {r.donorName || "—"}</div>
                                            <div>Blood Group: {r.bloodGroup || "—"}</div>
                                            <div>Phone Number: {r.donorPhone || "—"}</div>
                                            <div>Location: {r.donorCity || r.location || "—"}</div>
                                            {r.donorEmail && <div>Email: {r.donorEmail}</div>}
                                        </div>
                                    )}
                                </>
                            )}
                            <div className="dash-meta"><IconCalendar size={16} />{r.date || r.createdDate} · {r.units} unit(s)</div>
                            {pendingNow && (
                                <div className="dash-card-actions">
                                    <button className="dash-btn-ghost dash-btn" onClick={() => handleCancel(r.id)}>Cancel Request</button>
                                </div>
                            )}
                        </div>
                        );
                    })}
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
                            <span className="dash-profile-avatar">{(name || "P").charAt(0).toUpperCase()}</span>
                            <div><h3>{name}</h3><p>{profile?.email}</p></div>
                            {profile?.bloodGroup && <span className="dash-blood" style={{ marginLeft: "auto" }}>{profile.bloodGroup}</span>}
                        </div>
                        <div className="dash-form-grid">
                            <div className="rc-field">
                                <label className="rc-label" htmlFor="pName">Full Name</label>
                                <div className="rc-input-wrap"><input id="pName" type="text" style={{ paddingLeft: 14 }} value={profile?.name || profile?.fullName || ""} onChange={updateField("name")} /></div>
                            </div>
                            <div className="rc-field">
                                <label className="rc-label">Email</label>
                                <div className="rc-input-wrap"><input type="email" style={{ paddingLeft: 14 }} value={profile?.email || ""} disabled /></div>
                            </div>
                            <div className="rc-field">
                                <label className="rc-label" htmlFor="pBg">Blood Group</label>
                                <select id="pBg" value={profile?.bloodGroup || ""} onChange={updateField("bloodGroup")}>
                                    <option value="">Select blood group</option>
                                    {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div className="rc-field">
                                <label className="rc-label" htmlFor="pPhone">Phone</label>
                                <div className="rc-input-wrap"><input id="pPhone" type="tel" style={{ paddingLeft: 14 }} value={profile?.phone || ""} onChange={updateField("phone")} /></div>
                            </div>
                            <div className="rc-field">
                                <label className="rc-label" htmlFor="pCity">City</label>
                                <div className="rc-input-wrap"><input id="pCity" type="text" style={{ paddingLeft: 14 }} value={profile?.city || ""} onChange={updateField("city")} /></div>
                            </div>
                            <div className="rc-field">
                                <label className="rc-label" htmlFor="pDob">Date of Birth</label>
                                <div className="rc-input-wrap"><input id="pDob" type="date" style={{ paddingLeft: 14 }} value={profile?.dateOfBirth || ""} onChange={updateField("dateOfBirth")} /></div>
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
            <Head title="Patient Dashboard" sub={`Welcome, ${name} — your blood needs at a glance`}
                badge={<Badge icon={<IconHeart size={16} />} text={`${donors.length} matching donors`} />} />
            <div className="dash-stats">
                <div className="dash-stat"><span className="dash-stat-value">{profile?.bloodGroup || "—"}</span><span className="dash-stat-label">My Blood Group</span></div>
                <div className="dash-stat"><span className="dash-stat-value">{donors.length}</span><span className="dash-stat-label">Matching Donors</span></div>
                <div className="dash-stat"><span className="dash-stat-value">{pending}</span><span className="dash-stat-label">Pending Requests</span></div>
                <div className="dash-stat"><span className="dash-stat-value">{accepted}</span><span className="dash-stat-label">Accepted</span></div>
            </div>
            <div className="dash-panel">
                <h3>How it works</h3>
                <p>Three steps to emergency blood — everything is saved in the database.</p>
                <div className="dash-steps">
                    <div className="dash-step"><span className="dash-step-num">1</span>Open Matching Donors — you only see Available donors with your blood group.</div>
                    <div className="dash-step"><span className="dash-step-num">2</span>Click Emergency Request on a donor card — the donor is notified instantly.</div>
                    <div className="dash-step"><span className="dash-step-num">3</span>When the donor clicks Available, their phone and address appear in My Requests.</div>
                </div>
                <div style={{ marginTop: 16 }}>
                    <button className="dash-btn" onClick={() => goTab("donors")}>Find Donors <IconChevronRight /></button>
                </div>
            </div>
        </>
    );
}
