import React from "react";
import { Link } from "react-router-dom";

function TermsOfService() {
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
            Legal Agreements
          </span>
          <h1 style={{ fontSize: "2.25rem", fontWeight: "800", marginTop: "0.75rem", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
            Terms & Conditions
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
            Effective Date: October 11, 2026 · Version 1.0
          </p>
        </div>

        <div style={{ backgroundColor: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", padding: "2.5rem", lineHeight: "1.7", fontSize: "0.9375rem", color: "#334155" }}>
          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.75rem" }}>
              1. Agreement to Terms
            </h2>
            <p>
              By accessing or using Skill Point (&quot;the Platform&quot;), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, do not access or use the services.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.75rem" }}>
              2. Description of Platform Services
            </h2>
            <p style={{ marginBottom: "0.75rem" }}>
              Skill Point is an engineering evaluation platform designed to calculate deterministic job readiness scores, detect skill gaps between resume qualifications and target job descriptions, and deliver structured practical curricula.
            </p>
            <p>
              The Job Readiness Score is a comparative diagnostic benchmark derived from our deterministic formula (40% Skill Gap Coverage, 30% Assessment Results, 20% Completed Assignments, and 10% Profile/Resume evidence). It is intended for candidate preparation and does not constitute a legal guarantee of employment by third-party hiring organizations.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.75rem" }}>
              3. User Responsibilities & Conduct
            </h2>
            <ul style={{ paddingLeft: "1.25rem" }}>
              <li>You agree to provide accurate information regarding your academic background and professional competencies.</li>
              <li>You agree not to exploit, automate scraping of, or disrupt the procedural question generation engine or backend endpoints.</li>
              <li>You are solely responsible for keeping your local credentials and account session keys secure.</li>
            </ul>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.75rem" }}>
              4. Intellectual Property
            </h2>
            <p>
              The procedural assessment algorithms, scoring formulas, platform interface designs, and curricula provided by Skill Point are proprietary assets. You retain full ownership of any original resumes or coding submissions you upload to the platform.
            </p>
          </section>

          <section style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.75rem" }}>
              5. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, Skill Point and its maintainers shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from the use or inability to use the platform.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.75rem" }}>
              6. Governing Law & Contact
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable laws. For questions regarding these terms, contact <strong style={{ color: "#0f172a" }}>legal@skillpoint.dev</strong>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e2e8f0", backgroundColor: "#ffffff", padding: "1.5rem 5%", textAlign: "center", fontSize: "0.8125rem", color: "#64748b" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginBottom: "0.5rem" }}>
          <Link to="/privacy" style={{ color: "#64748b", textDecoration: "none" }}>Privacy Policy</Link>
          <Link to="/terms" style={{ color: "#0f172a", fontWeight: "600", textDecoration: "none" }}>Terms & Conditions</Link>
          <Link to="/" style={{ color: "#64748b", textDecoration: "none" }}>Platform Home</Link>
        </div>
        <div>© 2026 Skill Point. All rights reserved.</div>
      </footer>
    </div>
  );
}

export default TermsOfService;
