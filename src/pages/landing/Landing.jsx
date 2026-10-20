import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="landing-page">
      <style>{`
        /* CSS resets and Minimalist Monochrome / Slate theme */
        .landing-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #0f172a;
          background-color: #f8fafc;
          line-height: 1.5;
          margin: 0;
          padding: 0;
        }

        .landing-page a {
          text-decoration: none;
        }

        /* Navigation */
        .landing-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 6%;
          border-bottom: 1px solid #e2e8f0;
          background: #ffffff;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .landing-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 700;
          font-size: 1.125rem;
          color: #0f172a;
          letter-spacing: -0.3px;
        }

        .landing-logo-mark {
          background: #0f172a;
          color: #ffffff;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .landing-nav-actions {
          display: flex;
          gap: 1.25rem;
          align-items: center;
        }

        .landing-btn-login {
          color: #475569;
          font-weight: 600;
          font-size: 0.875rem;
          transition: color 0.15s;
        }

        .landing-btn-login:hover {
          color: #0f172a;
        }

        .landing-btn-primary {
          background: #0f172a;
          color: #ffffff !important;
          padding: 0.55rem 1.25rem;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.875rem;
          transition: background-color 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .landing-btn-primary:hover {
          background: #1e293b;
        }

        .landing-btn-secondary {
          background: #ffffff;
          color: #0f172a !important;
          padding: 0.55rem 1.25rem;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.875rem;
          border: 1px solid #cbd5e1;
          transition: background-color 0.15s, border-color 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .landing-btn-secondary:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
        }

        /* Hero */
        .landing-hero {
          display: grid;
          grid-template-columns: 1.15fr 0.95fr;
          gap: 3.5rem;
          padding: 4.5rem 6%;
          align-items: center;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
        }

        .landing-hero-content h1 {
          font-size: 2.75rem;
          font-weight: 800;
          line-height: 1.2;
          margin: 0 0 1.25rem 0;
          color: #0f172a;
          letter-spacing: -0.8px;
        }

        .landing-hero-content p {
          font-size: 1.0625rem;
          color: #475569;
          margin: 0 0 2rem 0;
          line-height: 1.6;
          max-width: 95%;
        }

        .landing-hero-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }

        /* Hero Right: Deterministic Scoring Framework Card */
        .landing-framework-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.02);
          padding: 1.75rem;
          position: relative;
        }

        .landing-framework-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.25rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .landing-framework-eyebrow {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #475569;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.25rem;
        }

        .landing-framework-title {
          font-weight: 700;
          font-size: 1.125rem;
          color: #0f172a;
          margin: 0;
        }

        .landing-framework-badge {
          background: #f1f5f9;
          color: #0f172a;
          padding: 0.25rem 0.65rem;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
          font-size: 0.75rem;
          font-weight: 700;
        }

        /* 4 Deterministic Pillars List */
        .landing-pillars-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }

        .landing-pillar-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 0.9rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          gap: 0.75rem;
        }

        .landing-pillar-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .landing-pillar-index {
          width: 24px;
          height: 24px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6875rem;
          font-weight: 700;
          color: #0f172a;
        }

        .landing-pillar-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #0f172a;
        }

        .landing-pillar-desc {
          font-size: 0.75rem;
          color: #64748b;
          display: block;
        }

        .landing-pillar-weight {
          background: #f1f5f9;
          color: #0f172a;
          border: 1px solid #cbd5e1;
          padding: 0.2rem 0.55rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .landing-formula-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-size: 0.75rem;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .landing-formula-code {
          font-family: monospace;
          color: #0f172a;
          font-weight: 600;
        }

        /* Platform Architectural Foundations Bar */
        .landing-foundations {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          padding: 3rem 6%;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .landing-foundation-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .landing-foundation-icon {
          width: 38px;
          height: 38px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0f172a;
          flex-shrink: 0;
        }

        .landing-foundation-text h3 {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.35rem 0;
        }

        .landing-foundation-text p {
          font-size: 0.8125rem;
          color: #475569;
          margin: 0;
          line-height: 1.5;
        }

        /* How It Works Section */
        .landing-steps {
          padding: 4.5rem 6%;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          text-align: center;
        }

        .landing-section-eyebrow {
          font-size: 0.75rem;
          font-weight: 700;
          color: #475569;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.5rem;
        }

        .landing-section-title {
          font-size: 2rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 0.75rem 0;
          letter-spacing: -0.5px;
        }

        .landing-section-subtitle {
          font-size: 0.9375rem;
          color: #64748b;
          max-width: 600px;
          margin: 0 auto 3rem auto;
          line-height: 1.5;
        }

        .landing-steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          max-width: 1080px;
          margin: 0 auto;
          text-align: left;
        }

        .landing-step-card {
          background: #ffffff;
          padding: 1.75rem;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .landing-step-num {
          width: 32px;
          height: 32px;
          background: #0f172a;
          color: #ffffff;
          border: 1px solid #0f172a;
          font-weight: 700;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
        }

        .landing-step-title {
          font-weight: 700;
          font-size: 1.0625rem;
          color: #0f172a;
          margin: 0;
        }

        .landing-step-desc {
          color: #475569;
          font-size: 0.875rem;
          line-height: 1.55;
          margin: 0;
        }

        /* Features Grid */
        .landing-features {
          padding: 4.5rem 6%;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          text-align: center;
        }

        .landing-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          max-width: 1140px;
          margin: 0 auto;
          text-align: left;
        }

        .landing-feature-card {
          background: #ffffff;
          padding: 1.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
        }

        .landing-feature-card:hover {
          transform: translateY(-2px);
          border-color: #cbd5e1;
          box-shadow: 0 6px 16px -2px rgba(15, 23, 42, 0.05);
        }

        .landing-feature-icon {
          width: 36px;
          height: 36px;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0f172a;
        }

        .landing-feature-title {
          font-weight: 700;
          font-size: 1rem;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
        }

        .landing-feature-desc {
          color: #475569;
          font-size: 0.8125rem;
          line-height: 1.55;
          margin: 0;
        }

        /* CTA Section */
        .landing-cta {
          padding: 4.5rem 6%;
          background: #0f172a;
          color: #ffffff;
          text-align: center;
        }

        .landing-cta-title {
          font-size: 2.125rem;
          font-weight: 800;
          margin: 0 0 0.75rem 0;
          color: #ffffff;
          letter-spacing: -0.5px;
        }

        .landing-cta-desc {
          font-size: 1rem;
          color: #94a3b8;
          max-width: 540px;
          margin: 0 auto 2rem auto;
          line-height: 1.6;
        }

        .landing-cta-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .landing-cta-btn-primary {
          background: #ffffff;
          color: #0f172a !important;
          padding: 0.75rem 1.75rem;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.9375rem;
          transition: background-color 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .landing-cta-btn-primary:hover {
          background: #f1f5f9;
        }

        .landing-cta-btn-secondary {
          background: transparent;
          color: #ffffff !important;
          border: 1px solid #334155;
          padding: 0.75rem 1.75rem;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.9375rem;
          transition: background-color 0.15s, border-color 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .landing-cta-btn-secondary:hover {
          background: #1e293b;
          border-color: #475569;
        }

        /* Footer */
        .landing-footer {
          padding: 2rem 6%;
          background: #ffffff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #64748b;
          font-size: 0.8125rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        @media (max-width: 900px) {
          .landing-hero {
            grid-template-columns: 1fr;
            gap: 2.5rem;
            padding: 3rem 6%;
          }
          .landing-foundations {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .landing-steps-grid,
          .landing-features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Navigation Bar */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="landing-logo-mark">SP</div>
          <span>Skill Point</span>
        </div>
        <div className="landing-nav-actions">
          <Link to="/login" className="landing-btn-login">Sign In</Link>
          <Link to="/register" className="landing-btn-primary">Create Account</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="landing-hero">
        <div className="landing-hero-content">
          <h1>Deterministic Technical Job Readiness &amp; Gap Analysis</h1>
          <p>
            Evaluate your technical proficiencies against verified industry standards. Extract requirement gaps from job postings, validate skills with adaptive evaluations, and track your progress through explainable multi-factor scoring.
          </p>
          <div className="landing-hero-actions">
            <Link to="/login" className="landing-btn-primary">
              Launch Diagnostic Dashboard →
            </Link>
            <Link to="/register" className="landing-btn-secondary">
              Create New Account
            </Link>
          </div>
        </div>

        {/* Hero Right: Deterministic Scoring Framework Specification */}
        <div className="landing-framework-card">
          <div className="landing-framework-header">
            <div>
              <span className="landing-framework-eyebrow">SCORING METHODOLOGY</span>
              <h2 className="landing-framework-title">Multi-Factor Readiness Model</h2>
            </div>
            <span className="landing-framework-badge">Deterministic</span>
          </div>

          <div className="landing-pillars-list">
            <div className="landing-pillar-item">
              <div className="landing-pillar-left">
                <span className="landing-pillar-index">01</span>
                <div>
                  <span className="landing-pillar-name">Core Skill Gap Match</span>
                  <span className="landing-pillar-desc">Coverage against target role competencies</span>
                </div>
              </div>
              <span className="landing-pillar-weight">40% Weight</span>
            </div>

            <div className="landing-pillar-item">
              <div className="landing-pillar-left">
                <span className="landing-pillar-index">02</span>
                <div>
                  <span className="landing-pillar-name">Adaptive Assessments</span>
                  <span className="landing-pillar-desc">Verified testing scores across calibrated levels</span>
                </div>
              </div>
              <span className="landing-pillar-weight">30% Weight</span>
            </div>

            <div className="landing-pillar-item">
              <div className="landing-pillar-left">
                <span className="landing-pillar-index">03</span>
                <div>
                  <span className="landing-pillar-name">Practical Assignments</span>
                  <span className="landing-pillar-desc">Hands-on tasks and repository proof of work</span>
                </div>
              </div>
              <span className="landing-pillar-weight">20% Weight</span>
            </div>

            <div className="landing-pillar-item">
              <div className="landing-pillar-left">
                <span className="landing-pillar-index">04</span>
                <div>
                  <span className="landing-pillar-name">Profile &amp; Resume Evidence</span>
                  <span className="landing-pillar-desc">Academic credentials and portfolio completeness</span>
                </div>
              </div>
              <span className="landing-pillar-weight">10% Weight</span>
            </div>
          </div>

          <div className="landing-formula-box">
            <span>Formula:</span>
            <span className="landing-formula-code">
              Score = 0.4(Skill) + 0.3(Exam) + 0.2(Work) + 0.1(Profile)
            </span>
          </div>
        </div>
      </header>

      {/* Architectural Foundations Bar */}
      <section className="landing-foundations">
        <div className="landing-foundation-item">
          <div className="landing-foundation-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <div className="landing-foundation-text">
            <h3>Explainable Mathematics</h3>
            <p>Every score is transparently derived from verified benchmarks without black-box estimations.</p>
          </div>
        </div>

        <div className="landing-foundation-item">
          <div className="landing-foundation-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className="landing-foundation-text">
            <h3>Job Description Intelligence</h3>
            <p>Parse any live job specification to dynamically calibrate your target competencies.</p>
          </div>
        </div>

        <div className="landing-foundation-item">
          <div className="landing-foundation-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="landing-foundation-text">
            <h3>Local-First Data Privacy</h3>
            <p>Your session and data remain stored in your browser with complete client-side autonomy.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="landing-steps">
        <span className="landing-section-eyebrow">SYSTEM WORKFLOW</span>
        <h2 className="landing-section-title">How Skill Point Works</h2>
        <p className="landing-section-subtitle">
          A systematic framework designed to measure and close technical readiness deficits.
        </p>

        <div className="landing-steps-grid">
          <div className="landing-step-card">
            <div className="landing-step-num">1</div>
            <h3 className="landing-step-title">Select Target Benchmark</h3>
            <p className="landing-step-desc">
              Choose from standardized engineering roles or parse an actual job posting to set your competency requirements.
            </p>
          </div>

          <div className="landing-step-card">
            <div className="landing-step-num">2</div>
            <h3 className="landing-step-title">Analyze Gaps &amp; Take Assessments</h3>
            <p className="landing-step-desc">
              Upload your resume for automated skill extraction, take adaptive evaluations, and view your quantified skill deficits.
            </p>
          </div>

          <div className="landing-step-card">
            <div className="landing-step-num">3</div>
            <h3 className="landing-step-title">Remediate &amp; Track Progress</h3>
            <p className="landing-step-desc">
              Follow curated learning paths, complete practical assignments with repository proof, and monitor your readiness growth.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="landing-features">
        <span className="landing-section-eyebrow">PLATFORM CAPABILITIES</span>
        <h2 className="landing-section-title">End-to-End Preparation Engine</h2>
        <p className="landing-section-subtitle">
          Six integrated modules working harmoniously to elevate your candidate profile.
        </p>

        <div className="landing-features-grid">
          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="22" y1="12" x2="18" y2="12" />
                <line x1="6" y1="12" x2="2" y2="12" />
                <line x1="12" y1="6" x2="12" y2="2" />
                <line x1="12" y1="22" x2="12" y2="18" />
              </svg>
            </div>
            <h3 className="landing-feature-title">Skill Gap Matrix</h3>
            <p className="landing-feature-desc">
              Compare current competencies against benchmark expectations with classified gap priority breakdowns.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <h3 className="landing-feature-title">Job Description Intelligence</h3>
            <p className="landing-feature-desc">
              Extract required skills, experience tiers, and tools directly from any pasted JD or uploaded PDF/DOCX.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <h3 className="landing-feature-title">Adaptive Technical Testing</h3>
            <p className="landing-feature-desc">
              Multi-tiered assessment evaluations that automatically calibrate question difficulty based on answers.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <h3 className="landing-feature-title">Practical Project Assignments</h3>
            <p className="landing-feature-desc">
              Curated coding assignments requiring architecture decisions and live repository submission evidence.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h3 className="landing-feature-title">Curated Learning Paths</h3>
            <p className="landing-feature-desc">
              Targeted modules and official documentation links organized specifically to address weak areas.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <h3 className="landing-feature-title">Analytics &amp; Readiness History</h3>
            <p className="landing-feature-desc">
              Historical tracking across assessment attempts and project milestones to visualize growth over time.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="landing-cta">
        <h2 className="landing-cta-title">Begin Your Readiness Diagnostic</h2>
        <p className="landing-cta-desc">
          Evaluate your engineering competencies, identify gaps, and prepare with purpose.
        </p>
        <div className="landing-cta-actions">
          <Link to="/login" className="landing-cta-btn-primary">
            Sign In with Demo Account →
          </Link>
          <Link to="/register" className="landing-cta-btn-secondary">
            Create New Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div>&copy; 2026 Skill Point. Job Readiness &amp; Gap Analysis Platform.</div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/privacy" style={{ color: '#64748b', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/terms" style={{ color: '#64748b', textDecoration: 'none' }}>Terms of Service</Link>
          <Link to="/login" style={{ color: '#64748b', textDecoration: 'none' }}>Sign In</Link>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
