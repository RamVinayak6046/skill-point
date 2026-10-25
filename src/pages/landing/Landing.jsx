import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="landing-page">
      <style>{`
        /* Skill Point - Modern Unified Brand Theme */
        .landing-page {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #0f172a;
          background-color: #f8fafc;
          line-height: 1.5;
          margin: 0;
          padding: 0;
          min-height: 100vh;
        }

        .landing-page a {
          text-decoration: none;
        }

        /* Top Navigation */
        .landing-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 6%;
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
        }

        .landing-logo-mark {
          background: #ea580c;
          color: #ffffff;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          font-size: 0.875rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          box-shadow: 0 1px 3px rgba(234, 88, 12, 0.3);
        }

        .landing-logo-text {
          display: flex;
          flex-direction: column;
        }

        .landing-logo-name {
          font-weight: 800;
          font-size: 1.125rem;
          color: #0f172a;
          line-height: 1.2;
          letter-spacing: -0.3px;
        }

        .landing-logo-sub {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #ea580c;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .landing-nav-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .landing-btn-login {
          color: #475569;
          font-weight: 600;
          font-size: 0.875rem;
          padding: 0.5rem 0.85rem;
          border-radius: 6px;
          transition: all 0.15s ease;
        }

        .landing-btn-login:hover {
          color: #0f172a;
          background: #f1f5f9;
        }

        .landing-btn-primary {
          background: #ea580c;
          color: #ffffff !important;
          padding: 0.55rem 1.25rem;
          border-radius: 7px;
          font-weight: 700;
          font-size: 0.875rem;
          border: 1px solid #ea580c;
          box-shadow: 0 1px 3px rgba(234, 88, 12, 0.25);
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .landing-btn-primary:hover {
          background: #c2410c;
          border-color: #c2410c;
          transform: translateY(-1px);
        }

        .landing-btn-secondary {
          background: #ffffff;
          color: #0f172a !important;
          padding: 0.55rem 1.25rem;
          border-radius: 7px;
          font-weight: 600;
          font-size: 0.875rem;
          border: 1px solid #cbd5e1;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .landing-btn-secondary:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        /* Hero Container */
        .landing-hero {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 3.5rem;
          padding: 4.5rem 6%;
          align-items: center;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          max-width: 1280px;
          margin: 0 auto;
        }

        .landing-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.6875rem;
          font-weight: 700;
          color: #ea580c;
          background: #fff7ed;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          border: 1px solid #ffedd5;
          margin-bottom: 1rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .landing-hero-content h1 {
          font-size: 2.75rem;
          font-weight: 800;
          line-height: 1.18;
          margin: 0 0 1rem 0;
          color: #0f172a;
          letter-spacing: -0.8px;
        }

        .landing-hero-content h1 span {
          color: #ea580c;
        }

        .landing-hero-content p {
          font-size: 1.0625rem;
          color: #475569;
          margin: 0 0 1.75rem 0;
          line-height: 1.6;
          max-width: 92%;
        }

        .landing-hero-actions {
          display: flex;
          gap: 0.85rem;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 2rem;
        }

        .landing-hero-tags {
          display: flex;
          gap: 0.6rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .landing-hero-tag {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
        }

        /* Hero Right: Multi-Factor Scoring Card */
        .landing-framework-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.02);
          padding: 1.5rem;
          position: relative;
        }

        .landing-framework-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          padding-bottom: 0.85rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .landing-framework-eyebrow {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #ea580c;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.2rem;
        }

        .landing-framework-title {
          font-weight: 800;
          font-size: 1.125rem;
          color: #0f172a;
          margin: 0;
        }

        .landing-framework-badge {
          background: #fff7ed;
          color: #ea580c;
          padding: 0.2rem 0.65rem;
          border-radius: 999px;
          border: 1px solid #fed7aa;
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* 4 Pillars List */
        .landing-pillars-list {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          margin-bottom: 1rem;
        }

        .landing-pillar-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.65rem 0.85rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          gap: 0.75rem;
          transition: border-color 0.15s;
        }

        .landing-pillar-item:hover {
          border-color: #cbd5e1;
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
          border: 1px solid #fed7aa;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6875rem;
          font-weight: 800;
          color: #ea580c;
        }

        .landing-pillar-name {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #0f172a;
          display: block;
        }

        .landing-pillar-desc {
          font-size: 0.7188rem;
          color: #64748b;
          display: block;
        }

        .landing-pillar-weight {
          background: #fff7ed;
          color: #ea580c;
          border: 1px solid #ffedd5;
          padding: 0.18rem 0.55rem;
          border-radius: 4px;
          font-size: 0.6875rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .landing-formula-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.65rem 0.85rem;
          font-size: 0.7188rem;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .landing-formula-code {
          font-family: monospace;
          color: #ea580c;
          font-weight: 700;
        }

        /* 3 Summary Highlights Bar */
        .landing-foundations {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          padding: 2.75rem 6%;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          max-width: 1280px;
          margin: 0 auto;
        }

        .landing-foundation-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .landing-foundation-icon {
          width: 38px;
          height: 38px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ea580c;
          flex-shrink: 0;
        }

        .landing-foundation-text h3 {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.25rem 0;
        }

        .landing-foundation-text p {
          font-size: 0.8125rem;
          color: #64748b;
          margin: 0;
          line-height: 1.45;
        }

        /* System Workflow / How It Works */
        .landing-steps {
          padding: 4rem 6%;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          text-align: center;
        }

        .landing-section-eyebrow {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #ea580c;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.4rem;
        }

        .landing-section-title {
          font-size: 2rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.5px;
        }

        .landing-section-subtitle {
          font-size: 0.9375rem;
          color: #64748b;
          max-width: 580px;
          margin: 0 auto 2.5rem auto;
          line-height: 1.5;
        }

        .landing-steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.75rem;
          max-width: 1080px;
          margin: 0 auto;
          text-align: left;
        }

        .landing-step-card {
          background: #ffffff;
          padding: 1.5rem;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          transition: transform 0.15s, border-color 0.15s;
        }

        .landing-step-card:hover {
          border-color: #fed7aa;
          transform: translateY(-2px);
        }

        .landing-step-num {
          width: 32px;
          height: 32px;
          background: #ea580c;
          color: #ffffff;
          font-weight: 800;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          box-shadow: 0 1px 3px rgba(234, 88, 12, 0.3);
        }

        .landing-step-title {
          font-weight: 700;
          font-size: 1.0625rem;
          color: #0f172a;
          margin: 0;
        }

        .landing-step-desc {
          color: #475569;
          font-size: 0.8438rem;
          line-height: 1.5;
          margin: 0;
        }

        /* Core Features Grid */
        .landing-features {
          padding: 4rem 6%;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          text-align: center;
        }

        .landing-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          max-width: 1120px;
          margin: 0 auto;
          text-align: left;
        }

        .landing-feature-card {
          background: #ffffff;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
        }

        .landing-feature-card:hover {
          transform: translateY(-2px);
          border-color: #fed7aa;
          box-shadow: 0 6px 16px -2px rgba(15, 23, 42, 0.05);
        }

        .landing-feature-icon {
          width: 36px;
          height: 36px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 8px;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ea580c;
        }

        .landing-feature-title {
          font-weight: 700;
          font-size: 0.9375rem;
          color: #0f172a;
          margin: 0 0 0.35rem 0;
        }

        .landing-feature-desc {
          color: #64748b;
          font-size: 0.8125rem;
          line-height: 1.5;
          margin: 0;
        }

        /* Bottom Call to Action Section */
        .landing-cta {
          padding: 4rem 6%;
          background: #0f172a;
          color: #ffffff;
          text-align: center;
          position: relative;
        }

        .landing-cta-content {
          max-width: 640px;
          margin: 0 auto;
        }

        .landing-cta-title {
          font-size: 2rem;
          font-weight: 800;
          margin: 0 0 0.65rem 0;
          color: #ffffff;
          letter-spacing: -0.5px;
        }

        .landing-cta-desc {
          font-size: 0.9375rem;
          color: #94a3b8;
          margin: 0 auto 1.75rem auto;
          line-height: 1.55;
        }

        .landing-cta-actions {
          display: flex;
          justify-content: center;
          gap: 0.85rem;
          flex-wrap: wrap;
        }

        .landing-cta-btn-primary {
          background: #ea580c;
          color: #ffffff !important;
          padding: 0.65rem 1.65rem;
          border-radius: 7px;
          font-weight: 700;
          font-size: 0.875rem;
          border: 1px solid #ea580c;
          box-shadow: 0 2px 6px rgba(234, 88, 12, 0.4);
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .landing-cta-btn-primary:hover {
          background: #c2410c;
          border-color: #c2410c;
          transform: translateY(-1px);
        }

        .landing-cta-btn-secondary {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.65rem 1.65rem;
          border-radius: 7px;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .landing-cta-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.14);
          border-color: rgba(255, 255, 255, 0.3);
        }

        /* Footer */
        .landing-footer {
          padding: 1.75rem 6%;
          background: #ffffff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #64748b;
          font-size: 0.8125rem;
          flex-wrap: wrap;
          gap: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        /* Responsive Breakpoints */
        @media (max-width: 900px) {
          .landing-hero {
            grid-template-columns: 1fr;
            gap: 2.25rem;
            padding: 3rem 6%;
          }
          .landing-foundations {
            grid-template-columns: 1fr;
            gap: 1.25rem;
            padding: 2rem 6%;
          }
          .landing-steps-grid,
          .landing-features-grid {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }
        }

        @media (max-width: 640px) {
          .landing-hero {
            padding: 2rem 5%;
            gap: 1.75rem;
          }
          .landing-hero-content h1 {
            font-size: clamp(1.65rem, 6.5vw, 2.15rem);
          }
          .landing-framework-card {
            padding: 1.25rem 1rem;
          }
          .landing-features,
          .landing-steps {
            padding: 2.5rem 5%;
          }
          .landing-formula-box {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
          .landing-formula-code {
            font-size: 0.6875rem;
            word-break: break-all;
          }
        }

        @media (max-width: 480px) {
          .landing-nav {
            padding: 0.75rem 4%;
            gap: 0.5rem;
          }
          .landing-logo-sub {
            display: none;
          }
          .landing-nav-actions {
            gap: 0.5rem;
          }
          .landing-btn-login {
            font-size: 0.8125rem;
            padding: 0.4rem 0.5rem;
            white-space: nowrap;
          }
          .landing-btn-primary,
          .landing-btn-secondary {
            padding: 0.45rem 0.85rem;
            font-size: 0.8125rem;
            white-space: nowrap;
          }
          .landing-hero-actions {
            flex-direction: column;
            width: 100%;
          }
          .landing-hero-actions a {
            width: 100%;
            height: 44px;
            justify-content: center;
            box-sizing: border-box;
          }
          .landing-framework-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
          .landing-framework-badge {
            font-size: 0.625rem;
            padding: 0.15rem 0.5rem;
          }
          .landing-footer {
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 1.5rem 4%;
          }
        }
      `}</style>

      {/* Navigation Bar */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="landing-logo-mark">SP</div>
          <div className="landing-logo-text">
            <span className="landing-logo-name">Skill Point</span>
            <span className="landing-logo-sub">Career Readiness</span>
          </div>
        </div>
        <div className="landing-nav-actions">
          <Link to="/login" className="landing-btn-login">Sign In</Link>
          <Link to="/register" className="landing-btn-primary">Create Account</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="landing-hero">
        <div className="landing-hero-content">
          <span className="landing-eyebrow">Technical Job Readiness &amp; Gap Analysis</span>
          <h1>
            Bridge Your Skill Gap.<br />
            <span>Get Job Ready.</span>
          </h1>
          <p>
            Assess your technical competencies against target software roles, take adaptive evaluations, complete hands-on assignments, and track your job readiness score in one unified platform.
          </p>
          <div className="landing-hero-actions">
            <Link to="/login" className="landing-btn-primary">
              Launch Dashboard &rarr;
            </Link>
            <Link to="/register" className="landing-btn-secondary">
              Create Free Account
            </Link>
          </div>
          <div className="landing-hero-tags">
            <span className="landing-hero-tag">Target Role Benchmarks</span>
            <span className="landing-hero-tag">Adaptive AI Testing</span>
            <span className="landing-hero-tag">40/30/20/10 Readiness Score</span>
          </div>
        </div>

        {/* Hero Right: Multi-Factor Scoring Card */}
        <div className="landing-framework-card">
          <div className="landing-framework-header">
            <div>
              <span className="landing-framework-eyebrow">SCORING METHODOLOGY</span>
              <h2 className="landing-framework-title">Multi-Factor Readiness Model</h2>
            </div>
            <span className="landing-framework-badge">40 / 30 / 20 / 10</span>
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
                  <span className="landing-pillar-desc">Diagnostic test scores across difficulty levels</span>
                </div>
              </div>
              <span className="landing-pillar-weight">30% Weight</span>
            </div>

            <div className="landing-pillar-item">
              <div className="landing-pillar-left">
                <span className="landing-pillar-index">03</span>
                <div>
                  <span className="landing-pillar-name">Practical Assignments</span>
                  <span className="landing-pillar-desc">Hands-on coding tasks and repository proof</span>
                </div>
              </div>
              <span className="landing-pillar-weight">20% Weight</span>
            </div>

            <div className="landing-pillar-item">
              <div className="landing-pillar-left">
                <span className="landing-pillar-index">04</span>
                <div>
                  <span className="landing-pillar-name">Profile &amp; Resume Evidence</span>
                  <span className="landing-pillar-desc">Academic credentials and profile completeness</span>
                </div>
              </div>
              <span className="landing-pillar-weight">10% Weight</span>
            </div>
          </div>

          <div className="landing-formula-box">
            <span>Readiness Formula:</span>
            <span className="landing-formula-code">
              Score = 0.4(Skill) + 0.3(Exam) + 0.2(Project) + 0.1(Profile)
            </span>
          </div>
        </div>
      </header>

      {/* 3 Summary Highlights Bar */}
      <section className="landing-foundations">
        <div className="landing-foundation-item">
          <div className="landing-foundation-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="22" y1="12" x2="18" y2="12" />
              <line x1="6" y1="12" x2="2" y2="12" />
              <line x1="12" y1="6" x2="12" y2="2" />
              <line x1="12" y1="22" x2="12" y2="18" />
            </svg>
          </div>
          <div className="landing-foundation-text">
            <h3>Target Role &amp; JD Reader</h3>
            <p>Select industry software roles or paste real job descriptions to calibrate competency benchmarks.</p>
          </div>
        </div>

        <div className="landing-foundation-item">
          <div className="landing-foundation-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div className="landing-foundation-text">
            <h3>Adaptive AI Assessments</h3>
            <p>Diagnostic testing calibrated to your level with shuffled multiple-choice questions.</p>
          </div>
        </div>

        <div className="landing-foundation-item">
          <div className="landing-foundation-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <div className="landing-foundation-text">
            <h3>Progress &amp; Score Tracking</h3>
            <p>Track your verified skill levels, assignment completions, and overall job readiness.</p>
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
            <h3 className="landing-step-title">Select Target Role</h3>
            <p className="landing-step-desc">
              Choose your target engineering career path or paste a live job description to set required competencies.
            </p>
          </div>

          <div className="landing-step-card">
            <div className="landing-step-num">2</div>
            <h3 className="landing-step-title">Analyze Gaps &amp; Test</h3>
            <p className="landing-step-desc">
              Upload your resume for automated skill extraction, take adaptive evaluations, and view missing skills.
            </p>
          </div>

          <div className="landing-step-card">
            <div className="landing-step-num">3</div>
            <h3 className="landing-step-title">Practice &amp; Improve</h3>
            <p className="landing-step-desc">
              Follow curated learning paths, complete practical assignments with repo submissions, and boost your score.
            </p>
          </div>
        </div>
      </section>

      {/* Core Platform Modules */}
      <section id="features" className="landing-features">
        <span className="landing-section-eyebrow">PLATFORM MODULES</span>
        <h2 className="landing-section-title">Core Preparation Capabilities</h2>
        <p className="landing-section-subtitle">
          Six integrated tools designed to guide you from initial skill gap diagnosis to placement readiness.
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
            <h3 className="landing-feature-title">Target Job Benchmarking</h3>
            <p className="landing-feature-desc">
              Explore standardized software roles and configure target proficiency benchmarks.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <h3 className="landing-feature-title">Resume &amp; JD Intelligence</h3>
            <p className="landing-feature-desc">
              Parse resumes and job descriptions to compare skills against actual industry postings.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            </div>
            <h3 className="landing-feature-title">Skill Gap Analysis</h3>
            <p className="landing-feature-desc">
              Identify missing competencies with prioritized high, medium, and low gap classifications.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <h3 className="landing-feature-title">Adaptive Assessments</h3>
            <p className="landing-feature-desc">
              Test technical proficiency with dynamic questions across Beginner, Intermediate, and Advanced tiers.
            </p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <h3 className="landing-feature-title">Practical Assignments</h3>
            <p className="landing-feature-desc">
              Build domain projects with step-by-step guidance and submit repository proof of work.
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
              Access targeted learning topics and documentation to systematically improve deficient areas.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="landing-cta">
        <div className="landing-cta-content">
          <h2 className="landing-cta-title">Begin Your Readiness Assessment</h2>
          <p className="landing-cta-desc">
            Evaluate your engineering competencies, identify gaps, and prepare systematically for software placements.
          </p>
          <div className="landing-cta-actions">
            <Link to="/login" className="landing-cta-btn-primary">
              Launch Diagnostic Dashboard &rarr;
            </Link>
            <Link to="/register" className="landing-cta-btn-secondary">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div>&copy; 2026 Skill Point &middot; Job Readiness &amp; Personalized Development System.</div>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <Link to="/privacy" style={{ color: '#64748b', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/terms" style={{ color: '#64748b', textDecoration: 'none' }}>Terms of Service</Link>
          <Link to="/login" style={{ color: '#64748b', textDecoration: 'none' }}>Sign In</Link>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
