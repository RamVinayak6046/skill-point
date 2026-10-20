import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useApp } from "../../context/AppContext";

function AppLayout() {
  const { targetJob } = useApp();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sp_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add("mobile-drawer-open");
    } else {
      document.body.classList.remove("mobile-drawer-open");
    }
    return () => {
      document.body.classList.remove("mobile-drawer-open");
    };
  }, [mobileOpen]);

  // Remember collapsed preference in localStorage
  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sp_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <div className={`app-layout ${collapsed ? "layout-collapsed" : ""}`}>
      {/* Mobile Top App Bar — fixed to viewport, accessible at any scroll position */}
      <header className="mobile-app-bar">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="mobile-brand-title">
          <span className="mobile-logo-mark">SP</span>
          <strong>Skill Point</strong>
        </div>

        {targetJob ? (
          <span className="mobile-target-pill" title={`Target: ${targetJob}`}>
            {targetJob.length > 14 ? `${targetJob.slice(0, 14)}…` : targetJob}
          </span>
        ) : (
          <span style={{ width: "36px" }} />
        )}
      </header>

      {/* Backdrop for Mobile Navigation Drawer — fixed full screen */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Collapsible & Mobile-aware Sidebar */}
      <Sidebar
        id="mobile-sidebar"
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <main className={`main-content ${collapsed ? "sidebar-collapsed" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
