import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import {
  clearAllData,
  exportAllData,
} from "../../services/storageService";

/* =========================================
   INLINE SVG ICONS (NO EMOJIS)
   ========================================= */

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function CpuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3" />
      <path d="M15 1v3" />
      <path d="M9 20v3" />
      <path d="M15 20v3" />
      <path d="M20 9h3" />
      <path d="M20 14h3" />
      <path d="M1 9h3" />
      <path d="M1 14h3" />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

/* =========================================
   SETTINGS COMPONENT
   ========================================= */

function Settings() {
  const navigate = useNavigate();
  const { profile, targetJob, resetProgress, importUserData, theme, setTheme, toggleTheme, syncStatus, syncFromCloud } = useApp();
  const { user, logout } = useAuth();

  const isDarkMode = typeof document !== "undefined"
    ? document.documentElement.getAttribute("data-color-mode") === "dark"
    : false;

  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'account' | 'appearance' | 'data' | 'engine' | 'danger'
  const [confirmModal, setConfirmModal] = useState(null); // null | 'reset_progress' | 'clear_all'
  const [message, setMessage] = useState({ text: "", type: "info" });
  const fileInputRef = useRef(null);

  const showNotification = (text, type = "info") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "info" }), 4500);
  };

  /* =========================================
     EXPORT DATA
     ========================================= */

  const handleExport = () => {
    const data = exportAllData(user?.id || user?.email);

    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const sanitizedEmail = user?.email ? user.email.split("@")[0] : "backup";
    link.download = `skill-point-${sanitizedEmail}-${new Date().toISOString().split("T")[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
    showNotification("Data exported successfully! Saved to your local device.", "success");
  };

  /* =========================================
     IMPORT DATA (ATOMIC VALIDATION)
     ========================================= */

  const handleImportFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const result = importUserData ? importUserData(parsed) : { success: false, error: "Import not supported" };
        if (result.success) {
          showNotification(`Successfully restored ${result.count || ""} records!`, "success");
        } else {
          showNotification(`Import rejected: ${result.error || "Invalid file format."}`, "error");
        }
      } catch (err) {
        console.warn("Failed to parse JSON backup file:", err);
        showNotification("Failed to parse JSON file. Please ensure it is a valid backup file.", "error");
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.onerror = () => {
      showNotification("Could not read backup file from disk.", "error");
    };
    reader.readAsText(file);
  };

  /* =========================================
     RESET PROGRESS ONLY
     ========================================= */

  const handleResetProgress = () => {
    if (resetProgress) {
      resetProgress();
    }
    setConfirmModal(null);
    showNotification("Assessments, dynamic assignments, and skill levels have been reset.", "success");
  };

  /* =========================================
     CLEAR ALL DATA (GLOBAL WIPE)
     ========================================= */

  const handleClearData = () => {
    clearAllData();
    setConfirmModal(null);
    showNotification("All data cleared. Logging out and redirecting...", "info");
    setTimeout(() => {
      logout();
      window.location.reload();
    }, 1200);
  };

  const showSection = (tabName) => {
    return activeTab === "all" || activeTab === tabName;
  };

  return (
    <div className="settings-page">

      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <span className="eyebrow">System Preferences</span>
          <h1>Settings</h1>
          <p>
            Configure your account identity, manage offline data backups, inspect deterministic evaluation parameters, and manage session state.
          </p>
        </div>
      </div>

      {/* NOTIFICATION MESSAGE */}
      {message.text && (
        <div
          className="settings-message"
          style={{
            borderColor: message.type === "error" ? "#fca5a5" : message.type === "success" ? "#86efac" : "#fed7aa",
            color: message.type === "error" ? "#b91c1c" : message.type === "success" ? "#15803d" : "#c2410c",
            backgroundColor: message.type === "error" ? "#fef2f2" : message.type === "success" ? "#f0fdf4" : "#fff7ed",
          }}
        >
          {message.type === "success" ? <CheckIcon /> : <AlertTriangleIcon />}
          <span>{message.text}</span>
        </div>
      )}

      {/* STATUS / TELEMETRY BAR */}
      <div className="settings-status-bar">
        <div className="settings-status-card">
          <div className="settings-status-icon" style={{ background: isDarkMode ? "rgba(234, 88, 12, 0.18)" : "#fff7ed", color: isDarkMode ? "#fb923c" : "#ea580c" }}>
            <UserIcon />
          </div>
          <div className="settings-status-content">
            <span className="settings-status-label">Account Identity</span>
            <span className="settings-status-val">{profile?.name || user?.email || "Student Account"}</span>
          </div>
        </div>

        <div className="settings-status-card">
          <div className="settings-status-icon" style={{ background: "#fff7ed", color: "#ea580c" }}>
            <CpuIcon />
          </div>
          <div className="settings-status-content">
            <span className="settings-status-label">Target Role</span>
            <span className="settings-status-val">{targetJob || "Full Stack Developer"}</span>
          </div>
        </div>

        <div className="settings-status-card">
          <div className="settings-status-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
            <DatabaseIcon />
          </div>
          <div className="settings-status-content">
            <span className="settings-status-label">Storage Engine</span>
            <span className="settings-status-val">Browser Vault (Healthy)</span>
          </div>
        </div>

        <div className="settings-status-card">
          <div className="settings-status-icon" style={{ background: isDarkMode ? "rgba(234, 88, 12, 0.18)" : "#fff7ed", color: isDarkMode ? "#fb923c" : "#ea580c" }}>
            {isDarkMode ? <MoonIcon /> : <SunIcon />}
          </div>
          <div className="settings-status-content">
            <span className="settings-status-label">Theme Mode</span>
            <span className="settings-status-val">{theme === "system" ? `System (${isDarkMode ? "Dark" : "Light"})` : theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="settings-tabs">
        <button
          className={`settings-tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Settings
        </button>
        <button
          className={`settings-tab-btn ${activeTab === "account" ? "active" : ""}`}
          onClick={() => setActiveTab("account")}
        >
          <UserIcon />
          Account & Identity
        </button>
        <button
          className={`settings-tab-btn ${activeTab === "appearance" ? "active" : ""}`}
          onClick={() => setActiveTab("appearance")}
        >
          <SunIcon />
          Appearance & Theme
        </button>
        <button
          className={`settings-tab-btn ${activeTab === "data" ? "active" : ""}`}
          onClick={() => setActiveTab("data")}
        >
          <DatabaseIcon />
          Data & Backups
        </button>
        <button
          className={`settings-tab-btn ${activeTab === "engine" ? "active" : ""}`}
          onClick={() => setActiveTab("engine")}
        >
          <CpuIcon />
          Scoring Architecture
        </button>
        <button
          className={`settings-tab-btn ${activeTab === "danger" ? "active" : ""}`}
          onClick={() => setActiveTab("danger")}
        >
          <AlertTriangleIcon />
          Danger Zone
        </button>
      </div>

      {/* SECTION 1: ACCOUNT & IDENTITY */}
      {showSection("account") && (
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-header-left">
              <div className="settings-status-icon" style={{ background: isDarkMode ? "rgba(234, 88, 12, 0.18)" : "#fff7ed", color: isDarkMode ? "#fb923c" : "#ea580c" }}>
                <UserIcon />
              </div>
              <div>
                <h2>Account & Identity</h2>
                <p>Personal credentials, academic classification, and target career role.</p>
              </div>
            </div>
            <button
              className="settings-button"
              onClick={() => navigate("/profile")}
            >
              <span>Edit Full Profile</span>
              <ExternalLinkIcon />
            </button>
          </div>

          <div className="settings-card-body">
            <div className="settings-profile-preview">
              <div className="settings-profile-left">
                <div className="settings-avatar">
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : "S"}
                </div>
                <div className="settings-identity">
                  <h3>{profile?.name || "Student Developer"}</h3>
                  <p>{profile?.email || user?.email || "student@institution.edu"}</p>
                </div>
              </div>
              <div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "6px 12px",
                    background: "#fff7ed",
                    color: "#ea580c",
                    border: "1px solid #fed7aa",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  {profile?.degree || "B.Tech"} - {profile?.branch || "Computer Science"}
                </span>
              </div>
            </div>

            <div className="settings-kv-grid">
              <div className="settings-kv-item">
                <span className="settings-kv-label">Account Role</span>
                <span className="settings-kv-val">Student / Engineering Candidate</span>
              </div>
              <div className="settings-kv-item">
                <span className="settings-kv-label">Roll Number</span>
                <span className="settings-kv-val">{profile?.rollNo || "Not specified"}</span>
              </div>
              <div className="settings-kv-item">
                <span className="settings-kv-label">College / University</span>
                <span className="settings-kv-val">{profile?.college || "Engineering College"}</span>
              </div>
              <div className="settings-kv-item">
                <span className="settings-kv-label">Active Target Track</span>
                <span className="settings-kv-val">{targetJob || "Full Stack Developer"}</span>
              </div>
              <div className="settings-kv-item">
                <span className="settings-kv-label">Data Residency</span>
                <span className="settings-kv-val">Local Browser Vault (Zero Tracking)</span>
              </div>
              <div className="settings-kv-item">
                <span className="settings-kv-label">Session State</span>
                <span className="settings-kv-val">Active (Persistent Storage)</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION: APPEARANCE & THEME (DARK / LIGHT MODE TOOTLE) */}
      {showSection("appearance") && (
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-header-left">
              <div className="settings-status-icon" style={{ background: isDarkMode ? "rgba(234, 88, 12, 0.18)" : "#fff7ed", color: isDarkMode ? "#fb923c" : "#ea580c" }}>
                <SunIcon />
              </div>
              <div>
                <h2>Appearance & Theme</h2>
                <p>Toggle between dark mode and light mode, or follow your operating system preferences.</p>
              </div>
            </div>
            <div className="settings-theme-header-pill">
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  padding: "4px 10px",
                  borderRadius: "999px",
                  background: isDarkMode ? "rgba(234, 88, 12, 0.18)" : "#fff7ed",
                  color: isDarkMode ? "#fb923c" : "#ea580c",
                  border: `1px solid ${isDarkMode ? "rgba(234, 88, 12, 0.35)" : "#fed7aa"}`,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isDarkMode ? "#fb923c" : "#ea580c" }}></span>
                {theme === "system" ? `System (${isDarkMode ? "Dark" : "Light"})` : theme === "dark" ? "Dark Mode" : "Light Mode"}
              </span>
            </div>
          </div>

          <div className="settings-card-body">
            {/* INTERACTIVE THEME TOGGLE (THE TOOTLE) */}
            <div
              className="settings-theme-tootle-box"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                background: "var(--bg-surface, #f8fafc)",
                borderRadius: "10px",
                border: "1px solid var(--border-color, #e2e8f0)",
                marginBottom: "24px",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div>
                <strong style={{ fontSize: "15px", color: "var(--text-primary, #0f172a)", display: "block" }}>
                  Dark Mode Quick Toggle
                </strong>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-muted, #64748b)" }}>
                  Instantly switch the entire application between dark and light color schemes.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: isDarkMode ? "var(--text-muted, #64748b)" : "#ea580c" }}>
                  Light
                </span>
                {/* ACCESSIBLE SWITCH BUTTON */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isDarkMode}
                  aria-label="Toggle dark mode"
                  onClick={toggleTheme}
                  className="theme-switch-toggle"
                  style={{
                    position: "relative",
                    width: "56px",
                    height: "30px",
                    borderRadius: "999px",
                    background: isDarkMode ? "#ea580c" : "#cbd5e1",
                    border: "none",
                    cursor: "pointer",
                    padding: "3px",
                    transition: "background 0.25s ease",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "#ffffff",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.25)",
                      transform: isDarkMode ? "translateX(26px)" : "translateX(0px)",
                      transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isDarkMode ? "#ea580c" : "#64748b",
                      fontSize: "12px",
                    }}
                  >
                    {isDarkMode ? <MoonIcon /> : <SunIcon />}
                  </span>
                </button>
                <span style={{ fontSize: "12px", fontWeight: "600", color: isDarkMode ? "#fb923c" : "var(--text-muted, #64748b)" }}>
                  Dark
                </span>
              </div>
            </div>

            {/* THREE-STATE SEGMENTED SELECTOR */}
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted, #64748b)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "12px" }}>
                Theme Mode Preference
              </span>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "14px",
                }}
              >
                {/* LIGHT MODE OPTION */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setTheme("light")}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTheme("light"); } }}
                  style={{
                    padding: "18px",
                    borderRadius: "8px",
                    border: `1.5px solid ${theme === "light" ? "var(--primary-blue, #ea580c)" : "var(--border-color, #e2e8f0)"}`,
                    background: theme === "light" ? "var(--primary-blue-subtle, #fff7ed)" : "var(--bg-card, #ffffff)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <div style={{ color: theme === "light" ? "var(--primary-blue, #ea580c)" : "var(--text-muted, #64748b)" }}>
                      <SunIcon />
                    </div>
                    <strong style={{ fontSize: "14px", color: "var(--text-primary, #0f172a)" }}>Light Mode (Default)</strong>
                    {theme === "light" && (
                      <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: "700", color: "#15803d", background: "#f0fdf4", padding: "1px 6px", borderRadius: "4px" }}>Active</span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary, #475569)", lineHeight: "1.45" }}>
                    Clean white background with warm orange accents. Optimal for daytime studying and high ambient light.
                  </p>
                </div>

                {/* DARK MODE OPTION */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setTheme("dark")}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTheme("dark"); } }}
                  style={{
                    padding: "18px",
                    borderRadius: "8px",
                    border: `1.5px solid ${theme === "dark" ? "var(--primary-blue, #ea580c)" : "var(--border-color, #e2e8f0)"}`,
                    background: theme === "dark" ? "var(--primary-blue-subtle, #fff7ed)" : "var(--bg-card, #ffffff)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <div style={{ color: theme === "dark" ? "var(--primary-blue, #ea580c)" : "var(--text-muted, #64748b)" }}>
                      <MoonIcon />
                    </div>
                    <strong style={{ fontSize: "14px", color: "var(--text-primary, #0f172a)" }}>Dark Mode</strong>
                    {theme === "dark" && (
                      <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: "700", color: "#15803d", background: "#f0fdf4", padding: "1px 6px", borderRadius: "4px" }}>Active</span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary, #475569)", lineHeight: "1.45" }}>
                    Deep navy slate canvas with calibrated contrast. Reduces eye strain during late-night coding and assessments.
                  </p>
                </div>

                {/* SYSTEM MODE OPTION */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setTheme("system")}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTheme("system"); } }}
                  style={{
                    padding: "18px",
                    borderRadius: "8px",
                    border: `1.5px solid ${theme === "system" ? "var(--primary-blue, #ea580c)" : "var(--border-color, #e2e8f0)"}`,
                    background: theme === "system" ? "var(--primary-blue-subtle, #fff7ed)" : "var(--bg-card, #ffffff)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <div style={{ color: theme === "system" ? "var(--primary-blue, #ea580c)" : "var(--text-muted, #64748b)" }}>
                      <MonitorIcon />
                    </div>
                    <strong style={{ fontSize: "14px", color: "var(--text-primary, #0f172a)" }}>System Default</strong>
                    {theme === "system" && (
                      <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: "700", color: "#15803d", background: "#f0fdf4", padding: "1px 6px", borderRadius: "4px" }}>Active</span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary, #475569)", lineHeight: "1.45" }}>
                    Automatically follows your device's operating system schedule (currently {isDarkMode ? "Dark" : "Light"}).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: DATA MANAGEMENT & BACKUPS */}
      {showSection("data") && (
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-header-left">
              <div className="settings-status-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                <DatabaseIcon />
              </div>
              <div>
                <h2>Data Management & Cloud Synchronization</h2>
                <p>Account data is backed by Cloudflare D1 with cross-device synchronization and optional local JSON backups.</p>
              </div>
            </div>
          </div>

          <div className="settings-card-body">
            {/* CLOUD SYNC STATUS BANNER */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: "8px", background: isDarkMode ? "#1e293b" : "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: syncStatus === "synced" ? "#16a34a" : syncStatus === "saving" || syncStatus === "syncing" ? "#ea580c" : "#eab308" }} />
                <div>
                  <strong style={{ fontSize: "13px", color: isDarkMode ? "#f8fafc" : "#0f172a" }}>
                    {syncStatus === "synced" ? "Cloud Synchronized" : syncStatus === "saving" ? "Saving Changes to Cloud..." : syncStatus === "syncing" ? "Synchronizing with Server..." : syncStatus === "offline" ? "Offline Cache Active" : "Account Connected"}
                  </strong>
                  <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                    Your profile, assessments, assignments, and learning history synchronize automatically across all devices.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="settings-button"
                style={{ padding: "6px 14px", fontSize: "12px" }}
                onClick={() => syncFromCloud && syncFromCloud()}
                disabled={syncStatus === "syncing" || syncStatus === "saving"}
              >
                {syncStatus === "syncing" ? "Syncing..." : "Sync Now"}
              </button>
            </div>

            <div className="settings-grid-3">

              {/* EXPORT */}
              <div className="settings-action-tile">
                <div className="settings-action-tile-top">
                  <div className="settings-action-tile-icon" style={{ background: isDarkMode ? "rgba(234, 88, 12, 0.18)" : "#fff7ed", color: isDarkMode ? "#fb923c" : "#ea580c" }}>
                    <DownloadIcon />
                  </div>
                  <h3 className="settings-action-tile-title">Export Local Archive</h3>
                  <p className="settings-action-tile-desc">
                    Download an offline JSON snapshot of your verified skill assessments, dynamic assignments, target jobs, and profile history.
                  </p>
                </div>
                <button
                  className="settings-button primary"
                  onClick={handleExport}
                >
                  <DownloadIcon />
                  <span>Export JSON</span>
                </button>
              </div>

              {/* IMPORT */}
              <div className="settings-action-tile">
                <div className="settings-action-tile-top">
                  <div className="settings-action-tile-icon" style={{ background: isDarkMode ? "rgba(234, 88, 12, 0.18)" : "#fff7ed", color: isDarkMode ? "#fb923c" : "#ea580c" }}>
                    <UploadIcon />
                  </div>
                  <h3 className="settings-action-tile-title">Restore From Backup</h3>
                  <p className="settings-action-tile-desc">
                    Load a previously exported Skill Point JSON backup file. Validates schema atomically before replacing local records.
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    style={{ display: "none" }}
                    onChange={handleImportFileChange}
                  />
                </div>
                <button
                  className="settings-button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon />
                  <span>Select Backup File</span>
                </button>
              </div>

              {/* RESET PROGRESS */}
              <div className="settings-action-tile">
                <div className="settings-action-tile-top">
                  <div className="settings-action-tile-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
                    <RefreshIcon />
                  </div>
                  <h3 className="settings-action-tile-title">Reset Assessments & Progress</h3>
                  <p className="settings-action-tile-desc">
                    Reset assessment quiz results, adaptive skill badges, and dynamic assignment solutions back to baseline while keeping your user account intact.
                  </p>
                </div>
                <button
                  className="settings-button"
                  style={{ color: "#d97706", borderColor: "#fde68a" }}
                  onClick={() => setConfirmModal("reset_progress")}
                >
                  <RefreshIcon />
                  <span>Reset Progress...</span>
                </button>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: SYSTEM ARCHITECTURE & EVALUATION ENGINE */}
      {showSection("engine") && (
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-header-left">
              <div className="settings-status-icon" style={{ background: isDarkMode ? "rgba(234, 88, 12, 0.18)" : "#fff7ed", color: isDarkMode ? "#fb923c" : "#ea580c" }}>
                <CpuIcon />
              </div>
              <div>
                <h2>Deterministic Evaluation Engine & Architecture</h2>
                <p>Explainable AI scoring formula, dual-inference tier specifications, and system invariants.</p>
              </div>
            </div>
          </div>

          <div className="settings-card-body">
            {/* FORMULA CONTAINER */}
            <div className="settings-formula-container">
              <span style={{ fontSize: "11px", fontWeight: "700", color: isDarkMode ? "#fb923c" : "#ea580c", textTransform: "uppercase", letterSpacing: "0.06em", display: "block" }}>
                Deterministic Readiness Formula (Viva Standard)
              </span>

              <div className="settings-formula-banner">
                <div className="settings-formula-pillar">
                  <span className="settings-pillar-pct">40%</span>
                  <span className="settings-pillar-title">Resume Skill Match</span>
                  <span className="settings-pillar-sub">Semantic keyword extraction & target job alignment.</span>
                </div>
                <div className="settings-formula-pillar">
                  <span className="settings-pillar-pct">30%</span>
                  <span className="settings-pillar-title">Technical Assessment</span>
                  <span className="settings-pillar-sub">Verified multi-tier MCQ evaluation with server scoring.</span>
                </div>
                <div className="settings-formula-pillar">
                  <span className="settings-pillar-pct">20%</span>
                  <span className="settings-pillar-title">Practical Assignments</span>
                  <span className="settings-pillar-sub">Hands-on coding submissions and implementation tasks.</span>
                </div>
                <div className="settings-formula-pillar">
                  <span className="settings-pillar-pct">10%</span>
                  <span className="settings-pillar-title">Profile Completeness</span>
                  <span className="settings-pillar-sub">Academic credentials, portfolio links, and target selection.</span>
                </div>
              </div>

              <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>
                Every readiness score change is strictly deterministic, explainable, and traceable to student actions. Zero arbitrary multipliers, zero simulated black-box predictions.
              </p>
            </div>

            {/* TECHNICAL SPECIFICATIONS GRID */}
            <div className="settings-kv-grid">
              <div className="settings-kv-item">
                <span className="settings-kv-label">Persistence Database</span>
                <span className="settings-kv-val">Cloudflare D1 SQLite (skill_point_db) · Cross-Device Sync</span>
              </div>
              <div className="settings-kv-item">
                <span className="settings-kv-label">Session Security</span>
                <span className="settings-kv-val">Cloudflare KV Session Tokens &amp; PBKDF2-SHA256 Derivation</span>
              </div>
              <div className="settings-kv-item">
                <span className="settings-kv-label">Primary AI Inference</span>
                <span className="settings-kv-val">Cloudflare Workers AI (@cf/meta/llama-3.1-8b-instruct)</span>
              </div>
              <div className="settings-kv-item">
                <span className="settings-kv-label">Assessment Security</span>
                <span className="settings-kv-val">AttemptSecret verification, server scoring, replay rejection</span>
              </div>
              <div className="settings-kv-item">
                <span className="settings-kv-label">Frontend Stack</span>
                <span className="settings-kv-val">React 19 · Vite · Native Vector SVG Graphics Engine</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 4: DANGER ZONE & SESSION */}
      {showSection("danger") && (
        <section className="settings-card settings-danger-card">
          <div className="settings-card-header" style={{ background: "#fffaf5", borderBottomColor: "#fed7aa" }}>
            <div className="settings-card-header-left">
              <div className="settings-status-icon" style={{ background: "#fef2f2", color: "#dc2626" }}>
                <AlertTriangleIcon />
              </div>
              <div>
                <h2 style={{ color: "#991b1b" }}>Danger Zone & Session Management</h2>
                <p>Actions here permanently affect local browser data or terminate the active session.</p>
              </div>
            </div>
          </div>

          <div className="settings-card-body" style={{ padding: 0 }}>
            {/* SIGN OUT */}
            <div className="settings-danger-row">
              <div className="settings-danger-info">
                <h4>Sign Out of Session</h4>
                <p>Ends the current user session. Your stored local records remain in browser storage.</p>
              </div>
              <button
                className="settings-button"
                onClick={logout}
              >
                <LogOutIcon />
                <span>Sign Out</span>
              </button>
            </div>

            {/* WIPE ALL DATA */}
            <div className="settings-danger-row">
              <div className="settings-danger-info">
                <h4 style={{ color: "#dc2626" }}>Delete All Application Data</h4>
                <p>Permanently purges all registered accounts, assessment history, stored resumes, and custom roles from this browser.</p>
              </div>
              <button
                className="settings-button danger"
                onClick={() => setConfirmModal("clear_all")}
              >
                <TrashIcon />
                <span>Clear All Data</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* MODAL: RESET PROGRESS */}
      {confirmModal === "reset_progress" && (
        <div className="settings-overlay">
          <div className="settings-modal">
            <div className="settings-modal-header">
              <div className="settings-status-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
                <RefreshIcon />
              </div>
              <h3>Reset Learning & Assessment Progress?</h3>
            </div>
            <p>
              This will reset your assessment test scores, adaptive skill levels, and completed practical assignments back to initial baseline levels.
              Your account login credentials, personal profile, uploaded resume, and custom job targets will be preserved.
            </p>
            <div className="modal-actions">
              <button
                className="settings-button"
                onClick={() => setConfirmModal(null)}
              >
                Cancel
              </button>
              <button
                className="settings-button"
                style={{ backgroundColor: "#d97706", borderColor: "#d97706", color: "#ffffff" }}
                onClick={handleResetProgress}
              >
                Yes, Reset Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CLEAR ALL DATA */}
      {confirmModal === "clear_all" && (
        <div className="settings-overlay">
          <div className="settings-modal">
            <div className="settings-modal-header">
              <div className="settings-status-icon" style={{ background: "#fef2f2", color: "#dc2626" }}>
                <AlertTriangleIcon />
              </div>
              <h3 style={{ color: "#dc2626" }}>Clear All Application Data?</h3>
            </div>
            <p>
              This will permanently delete all stored accounts, profiles, assessments, uploaded resumes, and custom targets from this browser.
              This operation cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="settings-button"
                onClick={() => setConfirmModal(null)}
              >
                Cancel
              </button>
              <button
                className="settings-button danger"
                onClick={handleClearData}
              >
                Yes, Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Settings;
