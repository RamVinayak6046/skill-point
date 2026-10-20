import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    if (!email || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await login(email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Invalid email or password.');
      }
    } catch {
      setError('An error occurred during sign-in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sp-auth-page" style={styles.page}>
      <div className="sp-auth-card" style={styles.card}>
        {/* Left Panel: Platform Architecture & Identity */}
        <div className="sp-auth-panel" style={styles.panel}>
          <div style={styles.panelContent}>
            <div style={styles.brandRow}>
              <div style={styles.brandMark}>SP</div>
              <span style={styles.brandName}>Skill Point</span>
            </div>
            
            <h1 style={styles.panelHeading}>Deterministic Job Readiness & Gap Analysis</h1>
            <p style={styles.panelTagline}>
              Evaluate your technical competency against verified industry role standards using explainable multi-factor scoring.
            </p>

            <div style={styles.featureList}>
              <div style={styles.featureItem}>
                <div style={styles.featureIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <strong style={styles.featureTitle}>40/30/20/10 Scoring</strong>
                  <span style={styles.featureDesc}>Skill match, assessments, practical projects, and profile.</span>
                </div>
              </div>

              <div style={styles.featureItem}>
                <div style={styles.featureIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <strong style={styles.featureTitle}>Adaptive Assessments</strong>
                  <span style={styles.featureDesc}>Diagnostic testing that calibrates to your skill level.</span>
                </div>
              </div>

              <div style={styles.featureItem}>
                <div style={styles.featureIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <strong style={styles.featureTitle}>Job Description Intelligence</strong>
                  <span style={styles.featureDesc}>Extract ATS requirement gaps directly from job postings.</span>
                </div>
              </div>
            </div>

            <div style={styles.privacyNote}>
              <span>Client-side local storage · Zero third-party data tracking</span>
            </div>
          </div>
        </div>

        {/* Right Panel: Sign-In Form */}
        <div className="sp-auth-form-container" style={styles.formContainer}>
          <div style={styles.formHeader}>
            <h2 style={styles.title}>Sign In</h2>
            <p className="sp-auth-subtitle" style={styles.subtitle}>Enter your account credentials to access your persistent readiness dashboard.</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu"
                autoComplete="email"
              />
            </div>

            <div style={styles.inputGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={styles.label}>Password</label>
              </div>
              <input
                type="password"
                style={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...styles.submitButton,
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div style={styles.footerRow}>
            <span style={{ fontSize: '13px', color: '#475569' }}>
              Don't have an account?{' '}
              <Link to="/register" style={styles.link}>
                Create an account
              </Link>
            </span>
            <Link to="/" style={styles.backLink}>
              ← Back to Overview
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    padding: '24px',
    boxSizing: 'border-box',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    display: 'flex',
    width: '920px',
    maxWidth: '100%',
    minHeight: '560px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.02)',
    overflow: 'hidden',
    flexWrap: 'wrap',
  },
  panel: {
    flex: '1 1 380px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '48px 40px',
    borderRight: '1px solid #1e293b',
    boxSizing: 'border-box',
  },
  panelContent: {
    maxWidth: '340px',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '28px',
  },
  brandMark: {
    width: '32px',
    height: '32px',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#ffffff',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '14px',
    letterSpacing: '0.5px',
  },
  brandName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '-0.3px',
  },
  panelHeading: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: '1.3',
    margin: '0 0 12px 0',
  },
  panelTagline: {
    fontSize: '13px',
    color: '#94a3b8',
    lineHeight: '1.6',
    margin: '0 0 32px 0',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '32px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  featureIcon: {
    width: '24px',
    height: '24px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px',
  },
  featureTitle: {
    display: 'block',
    fontSize: '13px',
    color: '#f1f5f9',
    fontWeight: '600',
    marginBottom: '2px',
  },
  featureDesc: {
    display: 'block',
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: '1.4',
  },
  privacyNote: {
    fontSize: '11px',
    color: '#64748b',
    borderTop: '1px solid #1e293b',
    paddingTop: '16px',
  },
  formContainer: {
    flex: '1 1 420px',
    padding: '48px 44px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
  },
  formHeader: {
    marginBottom: '22px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 6px 0',
    letterSpacing: '-0.3px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#475569',
    margin: 0,
    lineHeight: '1.5',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#b91c1c',
    fontSize: '13px',
    marginBottom: '18px',
  },
  demoSection: {
    marginBottom: '18px',
  },
  demoButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '11px 14px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxSizing: 'border-box',
  },
  demoIcon: {
    width: '26px',
    height: '26px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: '#0f172a',
  },
  demoBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  dividerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '0 0 18px 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#0f172a',
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  submitButton: {
    padding: '11px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '6px',
    transition: 'background-color 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  footerRow: {
    marginTop: '22px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    alignItems: 'center',
    textAlign: 'center',
  },
  link: {
    color: '#0f172a',
    fontWeight: '600',
    textDecoration: 'none',
  },
  backLink: {
    fontSize: '12px',
    color: '#64748b',
    textDecoration: 'none',
    fontWeight: '500',
  },
};

export default Login;
