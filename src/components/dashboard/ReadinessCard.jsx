import { useNavigate } from "react-router-dom";
import CircularGauge from "../graphics/CircularGauge";

function ReadinessCard({
  score = 0,
  role = "Backend Developer",
  status = "Getting Started",
  topDeficit = null,
  recommendedLevelName = "Level 1: Fundamentals",
  onTakeAssessment,
  onInspectDeficit,
}) {
  const navigate = useNavigate();

  const getStatusColor = (val) => {
    if (val >= 85) return { start: "#34d399", end: "#059669", text: "#047857", bg: "#ecfdf5", border: "#a7f3d0" };
    if (val >= 70) return { start: "#fb923c", end: "#ea580c", text: "#c2410c", bg: "#fff7ed", border: "#fed7aa" };
    if (val >= 50) return { start: "#fb923c", end: "#ea580c", text: "#c2410c", bg: "#fff7ed", border: "#fed7aa" };
    return { start: "#fb7185", end: "#e11d48", text: "#be123c", bg: "#fff1f2", border: "#fecdd3" };
  };

  const statusConfig = getStatusColor(score);

  return (
    <div
      className="readiness-card"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "24px 26px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
      }}
    >
      <div>
        {/* Card Header */}
        <div className="section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span className="eyebrow" style={{ color: "#ea580c", fontSize: "10px", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              CAREER BENCHMARK
            </span>
            <h2 style={{ fontSize: "19px", fontWeight: "800", color: "#0f172a", margin: "2px 0 0" }}>
              Job Readiness
            </h2>
          </div>

          <span
            className="live-badge"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 9px",
              borderRadius: "999px",
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              fontSize: "10px",
              fontWeight: "700",
              color: "#c2410c",
              letterSpacing: "0.05em",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#ea580c",
                display: "inline-block",
              }}
            />
            LIVE
          </span>
        </div>

        {/* Gauge + Core Summary */}
        <div
          className="readiness-content"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            marginTop: "20px",
          }}
        >
          {/* SVG Circular Gauge */}
          <CircularGauge
            value={score}
            size={132}
            strokeWidth={9}
            colorStart={statusConfig.start}
            colorEnd={statusConfig.end}
            label="READY"
          />

          <div className="readiness-info" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: 0, textTransform: "capitalize" }}>
                {role}
              </h3>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "6px",
                  backgroundColor: statusConfig.bg,
                  color: statusConfig.text,
                  border: `1px solid ${statusConfig.border}`,
                }}
              >
                {status}
              </span>
            </div>

            {/* Hover-reveal matter */}
            <div className="readiness-matter-wrapper">
              <div className="readiness-hover-container">
                <div className="readiness-hover-inner">
                  <p className="readiness-hover-desc" style={{ fontSize: "12px", color: "#475569", lineHeight: "1.5", margin: 0 }}>
                    {score >= 85
                      ? "Demonstrated competencies align with industry role benchmark."
                      : score >= 70
                        ? "Solid readiness foundation. Close priority deficits to reach top placement tier."
                        : score >= 50
                          ? "Developing competency baseline. Focus on high-deficit skills below."
                          : "Diagnostic baseline active. Start with recommended assessment to evaluate skills."}
                  </p>

                  <button
                    type="button"
                    className="readiness-hover-link"
                    onClick={() => navigate("/readiness")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ea580c",
                      fontSize: "12px",
                      fontWeight: "700",
                      cursor: "pointer",
                      padding: "4px 0 0",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    View Score Breakdown →
                  </button>
                </div>
              </div>

              {/* Resting cue */}
              <div className="readiness-resting-container">
                <div className="readiness-resting-inner">
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>Hover to inspect diagnostic details</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Hub - Seamless, unboxed open presentation */}
        <div
          style={{
            marginTop: "22px",
            paddingTop: "18px",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {/* Biggest Deficit Callout */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block" }}>
                BIGGEST SKILL GAP
              </span>
              {topDeficit ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
                  <strong style={{ fontSize: "14px", color: "#0f172a", fontWeight: "700" }}>{topDeficit.name}</strong>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#dc2626",
                      background: "#fef2f2",
                      padding: "2px 7px",
                      borderRadius: "4px",
                      border: "1px solid #fecaca",
                    }}
                  >
                    -{topDeficit.gap}% Deficit
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, marginTop: "3px", display: "block" }}>
                  {!role || role === "No Role Selected"
                    ? "Select a target role to analyze gaps"
                    : status === "Diagnostic Pending"
                      ? "Upload resume or take assessment to detect gaps"
                      : "All benchmark competencies met"}
                </span>
              )}
            </div>

            {topDeficit && onInspectDeficit && (
              <button
                type="button"
                onClick={onInspectDeficit}
                style={{
                  fontSize: "11px",
                  padding: "5px 11px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                Inspect Evidence
              </button>
            )}
          </div>

          {/* Recommended Action */}
          <div
            style={{
              paddingTop: "14px",
              borderTop: "1px dashed #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", display: "block" }}>
                RECOMMENDED ACTION
              </span>
              <strong style={{ fontSize: "13px", color: "#0f172a", fontWeight: "600", marginTop: "2px", display: "block" }}>
                {recommendedLevelName}
              </strong>
            </div>

            {onTakeAssessment && (
              <button
                type="button"
                onClick={onTakeAssessment}
                style={{
                  background: "#0f172a",
                  color: "#ffffff",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#ea580c")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#0f172a")}
              >
                {!role || role === "No Role Selected" ? "Select Role →" : "Take Assessment →"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div
        className="readiness-footer"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "20px",
          paddingTop: "14px",
          borderTop: "1px solid #f1f5f9",
        }}
      >
        <span style={{ fontSize: "11px", color: "#94a3b8" }}>Continuous diagnostic evaluation</span>
        <button
          type="button"
          onClick={() => navigate("/assessment")}
          style={{
            background: "none",
            border: "none",
            color: "#ea580c",
            fontWeight: 700,
            fontSize: "12px",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Assessment History →
        </button>
      </div>
    </div>
  );
}

export default ReadinessCard;