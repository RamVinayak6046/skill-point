import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";

// Clean, lightweight SVG Icons for SaaS Interface
const Icons = {
  Dashboard: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  Profile: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  TargetJob: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  JDIntelligence: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <circle cx="11" cy="14" r="2.5" />
      <path d="m13 16 2.5 2.5" />
    </svg>
  ),
  Resume: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  SkillGap: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20V10" />
      <path d="M18 20V4" />
      <path d="M6 20v-4" />
    </svg>
  ),
  Assessment: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  Assignments: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  Learning: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  Progress: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Readiness: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  Settings: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  SignOut: () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Collapse: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <path d="m14 9-3 3 3 3" />
    </svg>
  ),
  Expand: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <path d="m12 9 3 3-3 3" />
    </svg>
  ),
  Sun: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  ),
  Moon: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
};

function Sidebar({ collapsed = false, onToggleCollapse, mobileOpen = false, onCloseMobile }) {
  const { profile, theme, toggleTheme } = useApp();
  const { logout } = useAuth();

  const isDark = typeof document !== "undefined"
    ? document.documentElement.getAttribute("data-color-mode") === "dark"
    : false;

  const displayName = profile?.name || "Student";
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const showLabels = !collapsed || mobileOpen;

  // Escape key closes mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && mobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  const mainLinks = [
    { name: "Dashboard", path: "/dashboard", Icon: Icons.Dashboard },
    { name: "My Profile", path: "/profile", Icon: Icons.Profile },
  ];

  const readinessLinks = [
    { name: "Target Job", path: "/job", Icon: Icons.TargetJob },
    { name: "JD Intelligence", path: "/jd", Icon: Icons.JDIntelligence },
    { name: "Resume", path: "/resume", Icon: Icons.Resume },
    { name: "Skill Gap", path: "/skills", Icon: Icons.SkillGap },
    { name: "Assessments", path: "/assessment", Icon: Icons.Assessment },
  ];

  const developmentLinks = [
    { name: "Assignments", path: "/assignments", Icon: Icons.Assignments },
    { name: "Learning", path: "/learning", Icon: Icons.Learning },
    { name: "Progress", path: "/progress", Icon: Icons.Progress },
    { name: "Readiness", path: "/readiness", Icon: Icons.Readiness },
  ];

  const systemLinks = [
    { name: "Settings", path: "/settings", Icon: Icons.Settings },
  ];

  const handleNavClick = () => {
    if (mobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderLinks = (links) =>
    links.map((link) => (
      <NavLink
        key={link.path}
        to={link.path}
        title={collapsed && !mobileOpen ? link.name : undefined}
        onClick={handleNavClick}
        className={({ isActive }) =>
          `nav-item ${isActive ? "active" : ""}`
        }
      >
        <span className="nav-icon">
          <link.Icon />
        </span>
        <span className="nav-label">{link.name}</span>
      </NavLink>
    ));

  return (
    <>
      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`} aria-label="Main Navigation">
        {/* LOGO & CONTROLS */}
        <div className="logo">
          <div className="logo-brand-wrap">
            <div className="logo-mark" style={{ background: "#ea580c", borderRadius: "6px" }}>SP</div>
            {showLabels && (
              <div className="logo-text">
                <div className="logo-name">Skill Point</div>
                <div className="logo-subtitle" style={{ color: "#ea580c", fontWeight: "600" }}>Career Readiness</div>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            className="sidebar-collapse-btn desktop-only-btn"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <Icons.Expand /> : <Icons.Collapse />}
          </button>

          {/* Mobile Close Button */}
          {mobileOpen && (
            <button
              type="button"
              className="sidebar-close-btn mobile-only-btn"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* NAVIGATION */}
        <nav className="sidebar-nav">
          <div className="nav-section">{showLabels ? "MAIN" : "•"}</div>
          {renderLinks(mainLinks)}

          <div className="nav-section">{showLabels ? "JOB READINESS" : "•"}</div>
          {renderLinks(readinessLinks)}

          <div className="nav-section">{showLabels ? "DEVELOPMENT" : "•"}</div>
          {renderLinks(developmentLinks)}

          <div className="nav-section">{showLabels ? "SYSTEM" : "•"}</div>
          {renderLinks(systemLinks)}

          <button
            className="nav-item logout-button"
            onClick={logout}
            title={collapsed && !mobileOpen ? "Sign Out" : undefined}
          >
            <span className="nav-icon">
              <Icons.SignOut />
            </span>
            {showLabels && <span className="nav-label">Sign Out</span>}
          </button>
        </nav>

        {/* SIDEBAR BOTTOM */}
        <div className="sidebar-bottom">
          {/* SYSTEM STATUS */}
          {showLabels && (
            <div className="system-status">
              <span className="status-dot"></span>
              <div>
                <div className="system-title">Diagnostic Engine</div>
                <small>Deterministic Scoring</small>
              </div>
            </div>
          )}

          {/* USER MINI */}
          <div className="user-mini" title={displayName}>
            <div className="avatar" style={{ background: "#ea580c", borderRadius: "6px" }}>{avatarInitial}</div>
            {showLabels && (
              <div className="user-mini-info">
                <strong>{displayName}</strong>
                <small>{profile?.branch ? `${profile.degree || 'B.Tech'} · ${profile.branch}` : (profile?.degree ? `${profile.degree} · Student` : "B.Tech · Student")}</small>
              </div>
            )}
          </div>

          {/* THEME QUICK TOGGLE */}
          <button
            type="button"
            className="sidebar-theme-toggle-btn"
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "space-between",
              width: "100%",
              padding: "7px 10px",
              marginTop: "8px",
              background: "transparent",
              border: "1px solid var(--border-color, #e2e8f0)",
              borderRadius: "6px",
              color: "var(--text-secondary, #475569)",
              fontSize: "11px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              {isDark ? <Icons.Sun /> : <Icons.Moon />}
              {!collapsed && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
            </span>
            {!collapsed && (
              <span
                style={{
                  fontSize: "9px",
                  padding: "1px 5px",
                  borderRadius: "4px",
                  background: isDark ? "rgba(234, 88, 12, 0.2)" : "#fff7ed",
                  color: isDark ? "#fb923c" : "#ea580c",
                  fontWeight: "700",
                }}
              >
                {theme === "system" ? "Auto" : isDark ? "Dark" : "Light"}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;