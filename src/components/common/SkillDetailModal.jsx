import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DualProgressBar from "../graphics/DualProgressBar";

function SkillDetailModal({ skill, onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!skill) return null;

  const targetBenchmark = skill.required || 80;
  const currentScore = skill.current !== undefined ? skill.current : (skill.score || 0);
  const gap = Math.max(targetBenchmark - currentScore, 0);
  const isMet = currentScore >= targetBenchmark;

  const statusLabel = isMet ? "Strong (Benchmark Met)" : currentScore >= 55 ? "Developing" : "Weak (High Priority Gap)";
  const statusColor = isMet ? "#16a34a" : currentScore >= 55 ? "#d97706" : "#dc2626";
  const statusBg = isMet ? "#f0fdf4" : currentScore >= 55 ? "#fffbeb" : "#fef2f2";

  return (
    <div className="skill-modal-backdrop" onClick={onClose}>
      <div className="skill-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="skill-modal-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="category-pill" style={{ textTransform: "uppercase", fontSize: "10px" }}>
                {skill.category || "Technical Skill"}
              </span>
              {skill.priority && (
                <span className={`importance-tag ${skill.priority.toLowerCase()}`}>
                  {skill.priority} Priority
                </span>
              )}
            </div>
            <h2 style={{ fontSize: "20px", color: "#0f172a", margin: 0, fontWeight: "800" }}>
              {skill.name}
            </h2>
          </div>

          <button
            type="button"
            className="skill-modal-close"
            onClick={onClose}
            aria-label="Close skill details"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="skill-modal-body">
          {/* Benchmark Progress Card */}
          <div style={{ padding: "18px 20px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                  COMPETENCY BENCHMARK
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "2px" }}>
                  <strong style={{ fontSize: "22px", color: "#0f172a" }}>{currentScore}%</strong>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>/ {targetBenchmark}% Required</span>
                </div>
              </div>

              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "700",
                  background: statusBg,
                  color: statusColor,
                  border: `1px solid ${isMet ? "#bbf7d0" : currentScore >= 55 ? "#fde68a" : "#fecaca"}`,
                }}
              >
                {statusLabel}
              </span>
            </div>

            <DualProgressBar current={currentScore} target={targetBenchmark} height={8} />

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "12px", color: "#64748b" }}>
              <span>Current Evidence: <strong>{currentScore}%</strong></span>
              <span>
                {gap > 0 ? (
                  <strong style={{ color: "#dc2626" }}>-{gap}% Deficit to Target</strong>
                ) : (
                  <strong style={{ color: "#16a34a" }}>Benchmark Achieved</strong>
                )}
              </span>
            </div>
          </div>

          {/* Evidence Sources */}
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "13px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px 0" }}>
              Validated Evidence Sources
            </h4>

            {skill.evidence && skill.evidence.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {skill.evidence.map((ev, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "13px",
                      color: "#334155",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 8 7 12 13 4" />
                    </svg>
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0, padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                No direct resume evidence detected yet. Complete adaptive assessments or practice assignments to build verified evidence.
              </p>
            )}
          </div>

          {/* Recommended Next Actions */}
          <div>
            <h4 style={{ fontSize: "13px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px 0" }}>
              Accelerate Competency
            </h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                style={{ padding: "10px 14px", fontSize: "13px", justifyContent: "center" }}
                onClick={() => {
                  onClose();
                  navigate("/assessment");
                }}
              >
                Assess {skill.name} →
              </button>

              <button
                type="button"
                className="primary-button"
                style={{ padding: "10px 14px", fontSize: "13px", justifyContent: "center", background: "#ea580c" }}
                onClick={() => {
                  onClose();
                  navigate("/assignments");
                }}
              >
                Practice Assignments →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SkillDetailModal;
