import React from "react";
import { Link } from "react-router-dom";

function PrivacyPolicy() {
  return (
    <div className="legal-page" style={{ minHeight: "100vh", backgroundColor: "#f8fafc", color: "#0f172a", fontFamily: "inherit" }}>
      {/* Navigation */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 5%", borderBottom: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none", color: "#0f172a", fontWeight: "750", fontSize: "1.125rem" }}>
          <div style={{ width: "30px", height: "30px", backgroundColor: "#ea580c", borderRadius: "6px", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "0.875rem" }}>
            SP
          </div>
          <span>Skill Point</span>
        </Link>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link to="/" style={{ textDecoration: "none", color: "#64748b", fontSize: "0.875rem", fontWeight: "600" }}>Home</Link>
          <Link to="/login" style={{ textDecoration: "none", color: "#ea580c", fontSize: "0.875rem", fontWeight: "600" }}>Sign In</Link>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "3.5rem 1.5rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase", color: "#ea580c", backgroundColor: "#fff7ed", padding: "3px 8px", borderRadius: "4px", border: "1px solid #fed7aa" }}>
            Compliance & Data Privacy
          </span>
          <h1 style={{ fontSize: "2.25rem", fontWeight: "800", marginTop: "0.75rem", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
            Privacy Policy
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
            Effective Date: October 11, 2026 · Version 1.0
          </p>
        </div>

        <div style={{ backgroundColor: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", padding: "2.5rem", lineHeight: "1.7", fontSize: "0.9375rem", color: "#334155" }}>
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.75rem" }}>
              1. Information We Collect
            </h2>
            <p style={{ marginBottom: "0.75rem" }}>
              Skill Point collects information necessary to evaluate job readiness and provide technical competency diagnostics. This includes:
            </p>
            <ul style={{ paddingLeft: "1.25rem", marginBottom: "0.75rem" }}>
              <li><strong>Account Information:</strong> Name, email address, password hash, and degree/academic branch provided during registration.</li>
              <li><strong>Technical Diagnostic Inputs:</strong> Target role selections, assessment responses, scores, and completion timestamps.</li>
              <li><strong>Resume Content:</strong> Text extracted from uploaded resumes (PDF, DOCX, TXT) used strictly for skill identification and keyword gap matching.</li>
              <li><strong>Job Descriptions:</strong> Custom job postings and role specifications input by users for parity benchmarking.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.75rem" }}>
              2. How Your Data Is Processed
            </h2>
            <p style={{ marginBottom: "0.75rem" }}>
              Your technical data is processed transparently and deterministically:
            </p>
            <ul style={{ paddingLeft: "1.25rem", marginBottom: "0.75rem" }}>
              <li><strong>Client-Side Storage:</strong> Your primary assessment history, resume extractions, and diagnostic states are stored locally in your browser session via HTML5 LocalStorage and indexed cache.</li>
              <li><strong>Stateless Inference:</strong> When adaptive technical questions are generated using Cloudflare Workers AI, only sanitized role keywords and difficulty guidelines are submitted. Raw resume text, personal contact information, and identifying metadata are never transmitted to third-party model providers.</li>
              <li><strong>No Data Brokering:</strong> We do not sell, rent, license, or monetize your resume, assessment scores, or personal data to recruiters, employers, or third-party advertisers.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.75rem" }}>
              3. Data Retention and Control
            </h2>
            <p style={{ marginBottom: "0.75rem" }}>
              You maintain full authority over your assessment data and resume records:
            </p>
            <ul style={{ paddingLeft: "1.25rem", marginBottom: "0.75rem" }}>
              <li>You may reset your assessment baseline, clear uploaded resumes, or remove custom job targets directly from the Settings and Resume panels at any time.</li>
              <li>Clearing your browser storage immediately deletes local cached diagnostics and profile records.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.75rem" }}>
              4. Cookies and Tracking
            </h2>
            <p>
              Skill Point uses essential session tokens solely for authentication and state persistence. We do not employ third-party tracking pixels, behavioural ad cookies, or cross-site tracking scripts.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.75rem" }}>
              5. Contact Us
            </h2>
            <p>
              For data privacy inquiries, corrections, or requests, contact our compliance team at <strong style={{ color: "#0f172a" }}>privacy@skillpoint.dev</strong>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e2e8f0", backgroundColor: "#ffffff", padding: "1.5rem 5%", textAlign: "center", fontSize: "0.8125rem", color: "#64748b" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginBottom: "0.5rem" }}>
          <Link to="/privacy" style={{ color: "#0f172a", fontWeight: "600", textDecoration: "none" }}>Privacy Policy</Link>
          <Link to="/terms" style={{ color: "#64748b", textDecoration: "none" }}>Terms & Conditions</Link>
          <Link to="/" style={{ color: "#64748b", textDecoration: "none" }}>Platform Home</Link>
        </div>
        <div>© 2026 Skill Point. All rights reserved.</div>
      </footer>
    </div>
  );
}

export default PrivacyPolicy;
