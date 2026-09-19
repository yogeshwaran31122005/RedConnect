/* HomePage - dashboard shell: sidebar (brand, nav, user, sign out) + main content.
   Public pages remain Login + Register only. Role decides the workspace. */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/Toast";
import { clearSession, getSessionRole, isLoggedIn } from "../api/auth";
import {
    getProfile,
    getMatchingDonors,
    getRequests,
    getIncomingRequests,
    getAllUsers,
    getAllRequests,
    getAppLogs,
} from "../api/data";
import {
    IconDashboard, IconProfile, IconHeart,
    IconFileText, IconUsers, IconLogout,
} from "../components/Icons";
import PatientDashboard from "./PatientDashboard";
import DonorDashboard from "./DonorDashboard";
import AdminDashboard from "./AdminDashboard";

const TABS = {
    PATIENT: [
        { id: "dashboard", label: "Dashboard", icon: <IconDashboard size={20} /> },
        { id: "donors", label: "Matching Donors", icon: <IconHeart size={20} /> },
        { id: "requests", label: "My Requests", icon: <IconFileText size={20} /> },
        { id: "profile", label: "Profile", icon: <IconProfile size={20} /> },
    ],
    DONOR: [
        { id: "dashboard", label: "Dashboard", icon: <IconDashboard size={20} /> },
        { id: "requests", label: "Patient Requests", icon: <IconFileText size={20} /> },
        { id: "profile", label: "Profile", icon: <IconProfile size={20} /> },
    ],
    ADMIN: [
        { id: "dashboard", label: "Dashboard", icon: <IconDashboard size={20} /> },
        { id: "users", label: "All Users", icon: <IconUsers size={20} /> },
        { id: "requests", label: "All Requests", icon: <IconFileText size={20} /> },
        { id: "logs", label: "App Logs", icon: <IconFileText size={20} /> },
    ],
};

export default function HomePage() {
    const navigate = useNavigate();
    const [toast, setToast] = useState(null);
    const [profile, setProfile] = useState(null);
    const [role, setRole] = useState((getSessionRole() || "DONOR").toUpperCase());
    const [activeTab, setActiveTab] = useState("dashboard");
    const [donors, setDonors] = useState([]);
    const [requests, setRequests] = useState([]);
    const [incoming, setIncoming] = useState([]);
    const [users, setUsers] = useState([]);
    const [allRequests, setAllRequests] = useState([]);
    const [appLogs, setAppLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        if (!isLoggedIn()) { navigate("/"); return; }
        let active = true;
        (async () => {
            try {
                const p = await getProfile();
                if (!active) return;
                const r = (p.role || getSessionRole() || "DONOR").toUpperCase();
                setProfile(p);
                setRole(r);
                setActiveTab("dashboard");
                if (r === "PATIENT") {
                    const [m, req] = await Promise.all([getMatchingDonors(), getRequests()]);
                    if (!active) return;
                    setDonors(m); setRequests(req);
                } else if (r === "DONOR") {
                    const inc = await getIncomingRequests();
                    if (!active) return;
                    setIncoming(inc);
                } else if (r === "ADMIN") {
                    const [u, ar, logs] = await Promise.all([getAllUsers(), getAllRequests(), getAppLogs().catch(()=>[])]);
                    if (!active) return;
                    setUsers(u); setAllRequests(ar); setAppLogs(logs||[]);
                }
            } catch (err) {
                if (!active) return;
                showToast(err.message || "Could not load data.", "error");
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    const handleLogout = () => {
        clearSession();
        showToast("Logged out successfully.", "success");
        setTimeout(() => navigate("/"), 800);
    };

    const tabs = TABS[role] || TABS.DONOR;
    const pendingCount = role === "PATIENT"
        ? requests.filter((r) => r.status === "Pending").length
        : role === "DONOR"
            ? incoming.filter((r) => r.status === "Pending").length
            : allRequests.filter((r) => r.status === "Pending").length;

    const tabBadge = (id) => {
        if (id === "requests" && pendingCount > 0) return pendingCount;
        if (id === "donors" && donors.length > 0) return donors.length;
        if (id === "users" && users.length > 0) return users.length;
        if (id === "logs" && appLogs.length > 0) return appLogs.length;
        return null;
    };

    const displayName = profile?.name || profile?.fullName || "Account";
    const initial = (displayName || profile?.email || "U").charAt(0).toUpperCase();

    return (
        <div className="dash-shell">
            <aside className="dash-side">
                <div className="dash-brand">
                    <img src="/logo.png" alt="RedConnect logo" style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 6 }} />
                    <div className="dash-brand-text">
                        <strong>RedConnect</strong>
                        <span>{role.charAt(0) + role.slice(1).toLowerCase()} Dashboard</span>
                    </div>
                </div>
                <nav className="dash-nav">
                    {tabs.map((t) => {
                        const badge = tabBadge(t.id);
                        return (
                            <button
                                key={t.id}
                                type="button"
                                className={`dash-nav-item ${activeTab === t.id ? "active" : ""}`}
                                onClick={() => setActiveTab(t.id)}
                            >
                                {t.icon}
                                {t.label}
                                {badge != null && <span className="dash-nav-count">{badge}</span>}
                            </button>
                        );
                    })}
                </nav>
                <div className="dash-user">
                    <div className="dash-user-row">
                        <span className="dash-avatar">{initial}</span>
                        <div className="dash-user-meta">
                            <span className="dash-user-email" title={profile?.email || ""}>{profile?.email || "Account"}</span>
                            <span className="dash-user-role">{role.charAt(0) + role.slice(1).toLowerCase()}</span>
                        </div>
                    </div>
                    <button className="dash-signout" type="button" onClick={handleLogout}>
                        <IconLogout size={17} /> Sign out
                    </button>
                </div>
            </aside>

            <main className="dash-main">
                {loading ? (
                    <div className="dash-head"><div><h1>Loading…</h1><p>Fetching your data from the database.</p></div></div>
                ) : role === "PATIENT" ? (
                    <PatientDashboard activeTab={activeTab} goTab={setActiveTab} profile={profile} setProfile={setProfile}
                        donors={donors} setDonors={setDonors} requests={requests} setRequests={setRequests} showToast={showToast} />
                ) : role === "DONOR" ? (
                    <DonorDashboard activeTab={activeTab} goTab={setActiveTab} profile={profile} setProfile={setProfile}
                        incoming={incoming} setIncoming={setIncoming} showToast={showToast} />
                ) : (
                    <AdminDashboard activeTab={activeTab} profile={profile} users={users} setUsers={setUsers} allRequests={allRequests} appLogs={appLogs} setAppLogs={setAppLogs} showToast={showToast} />
                )}
            </main>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
