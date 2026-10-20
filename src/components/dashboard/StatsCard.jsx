/**
 * StatsCard - Clean, Minimalist High-Density Metric Card
 * Displays primary KPI values, benchmark labels, and qualitative context
 * with generous breathing room and zero artificial decoration.
 */
function StatsCard({ label, value, description }) {
  // Determine subtle accent indicators based on semantic meaning
  const getAccent = () => {
    switch (label) {
      case "Job Readiness":
        return { dotColor: "#ea580c", badgeBg: "rgba(234, 88, 12, 0.08)" };
      case "Skill Coverage":
        return { dotColor: "#059669", badgeBg: "rgba(5, 150, 105, 0.08)" };
      case "Biggest Deficit":
      case "Top Deficit":
        return { dotColor: "#dc2626", badgeBg: "rgba(220, 38, 38, 0.08)" };
      case "Assessments":
      default:
        return { dotColor: "#0f172a", badgeBg: "rgba(15, 23, 42, 0.06)" };
    }
  };

  const accent = getAccent();

  return (
    <div
      className="stats-card"
      style={{
        position: "relative",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "10px",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
        transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Top Header: Eyebrow Label with Minimalist Accent Pill */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#64748b",
          }}
        >
          {label}
        </span>
        <span
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            backgroundColor: accent.dotColor,
            display: "inline-block",
          }}
        />
      </div>

      {/* Primary Tabular Metric */}
      <div
        style={{
          fontSize: "30px",
          fontWeight: "800",
          color: "#0f172a",
          lineHeight: "1.05",
          letterSpacing: "-0.025em",
          fontVariantNumeric: "tabular-nums",
          margin: "2px 0 0",
        }}
      >
        {value}
      </div>

      {/* Supporting Micro-Context */}
      <div
        style={{
          fontSize: "12px",
          fontWeight: "500",
          color: "#64748b",
          lineHeight: "1.4",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span>{description}</span>
      </div>
    </div>
  );
}

export default StatsCard;