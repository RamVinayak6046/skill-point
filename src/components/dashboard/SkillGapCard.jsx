import DualProgressBar from "../graphics/DualProgressBar";

function SkillGapCard({ skill }) {
  let level = "Weak";

  if (skill.score >= 70) {
    level = "Strong";
  } else if (skill.score >= 55) {
    level = "Developing";
  }

  const targetBenchmark = 80;
  const gap = Math.max(targetBenchmark - skill.score, 0);

  return (
    <div className="skill-gap-item" style={{ padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
      {/* Top Title & Level Tag */}
      <div className="skill-gap-top" style={{ marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <strong style={{ fontSize: "14px", color: "#0f172a" }}>{skill.name}</strong>
          <span className={`skill-level ${level.toLowerCase()}`}>{level}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {skill.matchClassification ? (
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "999px",
                background:
                  skill.matchClassification === "Matched"
                    ? "#dcfce7"
                    : skill.matchClassification === "Partially Matched"
                    ? "#fef3c7"
                    : "#fee2e2",
                color:
                  skill.matchClassification === "Matched"
                    ? "#16a34a"
                    : skill.matchClassification === "Partially Matched"
                    ? "#d97706"
                    : "#dc2626",
              }}
            >
              {skill.matchClassification}
            </span>
          ) : gap > 0 ? (
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#ef4444" }}>
              -{gap}%
            </span>
          ) : (
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#10b981" }}>
              Met
            </span>
          )}
          <span className="skill-score" style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>
            {skill.score}%
          </span>
        </div>
      </div>

      {/* High-tech Dual Progress Bar with Benchmark Notch */}
      <div style={{ margin: "6px 0 10px 0" }}>
        <DualProgressBar current={skill.score} target={targetBenchmark} height={7} />
      </div>

      {/* Bottom Priority & Target Meta */}
      <div className="skill-gap-bottom">
        <span style={{ fontSize: "11px", color: "#94a3b8" }}>
          Benchmark: <strong>{targetBenchmark}%</strong>
        </span>

        <span className={`priority ${skill.priority.toLowerCase()}`}>
          {skill.priority} Priority
        </span>
      </div>
    </div>
  );
}

export default SkillGapCard;