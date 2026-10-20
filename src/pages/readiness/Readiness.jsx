import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import CircularGauge from "../../components/graphics/CircularGauge";
import CompetencyRadar from "../../components/graphics/CompetencyRadar";
import DualProgressBar from "../../components/graphics/DualProgressBar";

function Readiness() {
  const {
    targetJob,
    computeSkillGaps,
    computeReadiness,
    getReadinessComparison,
    latestAssessment,
    assessmentHistory = [],
    resume,
    parsedResume,
  } = useApp();

  const navigate = useNavigate();

  const hasTargetJob = Boolean(targetJob && typeof targetJob === "string" && targetJob.trim().length > 0);
  const hasEvidence = Boolean(
    (parsedResume?.detectedSkills && parsedResume.detectedSkills.length > 0) ||
    resume?.uploaded ||
    latestAssessment?.completed ||
    (Array.isArray(assessmentHistory) && assessmentHistory.length > 0)
  );

  const skillGaps = useMemo(() => {
    if (!hasTargetJob || !hasEvidence) return [];
    return typeof computeSkillGaps === "function" ? computeSkillGaps() : [];
  }, [hasTargetJob, hasEvidence, computeSkillGaps]);

  const readiness = useMemo(() => {
    if (!hasTargetJob || !hasEvidence) {
      return {
        overall: 0,
        status: !hasTargetJob ? "Awaiting Selection" : "Diagnostic Pending",
        breakdown: {
          skillMatch: { score: 0, label: "Skill Match" },
          assessment: { score: 0, label: "Technical Assessment" },
          practical: { score: 0, label: "Practical Assignments" },
          profile: { score: 0, label: "Profile Evidence" },
        },
      };
    }
    return computeReadiness(skillGaps);
  }, [hasTargetJob, hasEvidence, computeReadiness, skillGaps]);

  const overall = readiness?.overall ?? 0;
  const status = readiness?.status ?? "Getting Started";
  const breakdown = readiness?.breakdown || {
    skillMatch: { score: 0, label: "Skill Match" },
    assessment: { score: 0, label: "Technical Assessment" },
    practical: { score: 0, label: "Practical Assignments" },
    profile: { score: 0, label: "Profile Evidence" },
  };

  const comparison = useMemo(() => {
    return typeof getReadinessComparison === "function" ? getReadinessComparison() : null;
  }, [getReadinessComparison]);

  const radarData = [
    { label: "Skill Match", current: breakdown.skillMatch?.score || 0, target: 80 },
    { label: "Assessment", current: breakdown.assessment?.score || 0, target: 75 },
    { label: "Practical", current: breakdown.practical?.score || 0, target: 80 },
    { label: "Profile", current: breakdown.profile?.score || 0, target: 90 },
  ];

  const strengths = skillGaps
    .filter((g) => g.status === "Strong")
    .map((g) => g.name);

  const gaps = skillGaps
    .filter((g) => g.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .map((g) => ({
      skill: g.name,
      score: g.current,
      required: g.required,
      priority: g.priority,
    }));

  const recommendedActions = gaps.slice(0, 3);

  return (
    <div className="readiness-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <span className="eyebrow">DIAGNOSTIC ENGINE</span>
          <h1>Job Readiness Score</h1>
          <p>
            Deterministic, explainable readiness evaluation measured against live {targetJob} benchmarks.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            type="button"
            className="primary-button"
            style={{ background: "#ea580c", padding: "8px 16px", fontSize: "12px", fontWeight: "700" }}
            onClick={() => navigate("/assessment")}
          >
            Take Next Assessment →
          </button>
          <div className="readiness-live">
            <span className="status-dot"></span>
            LIVE ANALYSIS
          </div>
        </div>
      </div>

      {!hasTargetJob ? (
        <section className="job-card" style={{ padding: "48px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginBottom: "22px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#fff7ed", border: "1px solid #fed7aa", display: "flex", alignItems: "center", justifyContent: "center", color: "#ea580c" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <h2 style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
            No Target Role Selected
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: "#64748b", maxWidth: "440px", lineHeight: 1.5 }}>
            Select a target career role to calibrate your deterministic 40/30/20/10 career readiness score.
          </p>
          <button
            type="button"
            className="primary-button"
            style={{ marginTop: "8px", background: "#ea580c", color: "#ffffff", padding: "10px 20px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", border: "none", cursor: "pointer" }}
            onClick={() => navigate("/job")}
          >
            Select Target Role →
          </button>
        </section>
      ) : !hasEvidence ? (
        <section className="job-card" style={{ padding: "44px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginBottom: "22px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <h2 style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
            Diagnostic Assessment or Resume Evidence Required
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: "#64748b", maxWidth: "460px", lineHeight: 1.5 }}>
            Target role is set to <strong>{targetJob}</strong>. To calculate an honest, verified 40/30/20/10 readiness score without fabricated numbers, upload your resume or complete an adaptive diagnostic assessment.
          </p>
          <div style={{ display: "flex", gap: "12px", marginTop: "8px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              type="button"
              className="primary-button"
              style={{ background: "#ea580c", color: "#ffffff", padding: "10px 20px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", border: "none", cursor: "pointer" }}
              onClick={() => navigate("/resume")}
            >
              Upload Resume →
            </button>
            <button
              type="button"
              className="secondary-button"
              style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #e2e8f0", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
              onClick={() => navigate("/assessment")}
            >
              Take Assessment →
            </button>
          </div>
        </section>
      ) : (
        <>
      {/* MAIN SCORE & RADAR HERO */}
      <section className="job-card readiness-main-card" style={{ padding: "28px" }}>
        <div className="readiness-hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "28px", alignItems: "center" }}>
          <div className="readiness-score-section" style={{ alignItems: "center", gap: "28px" }}>
            <CircularGauge
              value={overall}
              size={154}
              strokeWidth={11}
              colorStart="#fb923c"
              colorEnd="#ea580c"
              label="JOB READY"
            />

            <div className="readiness-score-info" style={{ flex: 1 }}>
              <span className="eyebrow">Target Benchmark</span>
              <h2 style={{ fontSize: "24px", margin: "4px 0 8px", textTransform: "capitalize" }}>{targetJob}</h2>
              <div className="hover-matter-container">
                <div className="hover-matter-inner">
                  <p style={{ fontSize: "14px", lineHeight: "1.5", color: "#64748b", margin: "6px 0 10px" }}>
                    Your verified competencies demonstrate {status.toLowerCase()} readiness for this role.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
                <div className="readiness-status-large">
                  <span className="status-dot"></span>
                  {status}
                </div>
                {latestAssessment && (
                  <span style={{ fontSize: "11px", color: "#8a7966" }}>
                    Last Assessment: <strong>{latestAssessment.score}%</strong> ({assessmentHistory.length} attempts)
                  </span>
                )}
              </div>

              {/* REASSESSMENT SCORE PROGRESSION BADGE */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "#faf8f5",
                  border: "1px solid #e2e8f0",
                  marginTop: "6px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "700" }}>PREVIOUS READINESS</span>
                  <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                    {comparison?.hasPrevious ? `${comparison.previousOverall}%` : "Baseline"}
                  </strong>
                </div>
                <span style={{ color: "#ea580c", fontWeight: "800", fontSize: "14px" }}>→</span>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "700" }}>CURRENT READINESS</span>
                  <strong style={{ fontSize: "14px", color: "#ea580c" }}>{overall}%</strong>
                </div>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "3px 10px",
                    borderRadius: "6px",
                    background:
                      !comparison?.hasPrevious
                        ? "rgba(234, 88, 12, 0.1)"
                        : comparison.isImproved
                        ? "rgba(5, 150, 105, 0.1)"
                        : comparison.isDeclined
                        ? "rgba(220, 38, 38, 0.1)"
                        : "rgba(138, 121, 102, 0.1)",
                    color:
                      !comparison?.hasPrevious
                        ? "#0284c7"
                        : comparison.isImproved
                        ? "#059669"
                        : comparison.isDeclined
                        ? "#dc2626"
                        : "#8a7966",
                    border:
                      !comparison?.hasPrevious
                        ? "1px solid rgba(2, 132, 199, 0.2)"
                        : comparison.isImproved
                        ? "1px solid rgba(5, 150, 105, 0.2)"
                        : comparison.isDeclined
                        ? "1px solid rgba(220, 38, 38, 0.2)"
                        : "1px solid #e0d9d0",
                  }}
                >
                  {!comparison?.hasPrevious
                    ? "Baseline Established"
                    : `${comparison.deltaFormatted} ${comparison.isImproved ? "Improvement" : comparison.isDeclined ? "Decline" : "Maintained"}`}
                </span>
              </div>
            </div>
          </div>

          {/* High-tech Competency Polygon Radar */}
          <div className="readiness-radar-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", borderLeft: "1px solid #f1f5f9", paddingLeft: "24px" }}>
            <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
              DIAGNOSTIC RADAR
            </span>
            <CompetencyRadar data={radarData} size={190} />
          </div>
        </div>

        {/* 4-Pillar Metric Grid with Component-wise changes */}
        <div className="readiness-breakdown" style={{ marginTop: "24px" }}>
          {[
            { key: "skillMatch", label: "Skill Match (40%)", data: comparison?.components?.skillMatch },
            { key: "assessment", label: "Technical Assessment (30%)", data: comparison?.components?.assessment },
            { key: "practical", label: "Practical Work (20%)", data: comparison?.components?.practical },
            { key: "profile", label: "Profile Evidence (10%)", data: comparison?.components?.profile },
          ].map((item) => (
            <div key={item.key} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <strong>{item.data?.current ?? 0}%</strong>
                {comparison?.hasPrevious && item.data?.previous !== null && (
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: item.data.delta > 0 ? "#059669" : item.data.delta < 0 ? "#dc2626" : "#8a7966",
                    }}
                  >
                    {item.data.deltaFormatted}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
              {comparison?.hasPrevious && item.data?.previous !== null && (
                <small style={{ fontSize: "10px", color: "#8a7966" }}>
                  Prev: {item.data.previous}%
                </small>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* READINESS EXPLANATION */}
      <section className="readiness-explanation hover-matter-card">
        <div className="explanation-icon">i</div>
        <div style={{ flex: 1 }}>
          <strong>How is your {overall}% readiness score determined?</strong>
          <div className="hover-matter-container">
            <div className="hover-matter-inner">
              <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>
                Skill Point employs an explainable multi-factor formula combining your Skill Gap Coverage (40%), Technical Assessment results (30%), Completed Practical Assignments (20%), and Profile/Resume evidence (10%).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SKILLS */}
      <div className="readiness-section-header">
        <div>
          <span className="eyebrow">EVALUATED PROFICIENCIES</span>
          <h2>Technical Skill Readiness</h2>
        </div>
      </div>

      <section className="job-card readiness-skills-card" style={{ padding: "20px 24px" }}>
        {skillGaps.map((skill) => (
          <div
            className="readiness-skill-row"
            key={skill.name}
            style={{ display: "grid", gridTemplateColumns: "160px 1fr 60px", alignItems: "center", gap: "18px", padding: "12px 0", borderBottom: "1px solid #f8fafc" }}
          >
            <div className="readiness-skill-name" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <strong style={{ fontSize: "14px", color: "#0f172a" }}>{skill.name}</strong>
              <span className={`skill-level ${(skill.status || "developing").toLowerCase()}`}>
                {skill.status}
              </span>
            </div>

            <div style={{ width: "100%" }}>
              <DualProgressBar current={skill.current} target={skill.required} height={8} />
            </div>

            <strong className="readiness-skill-score" style={{ textAlign: "right", fontSize: "14px", color: "#0f172a" }}>
              {skill.current}%
            </strong>
          </div>
        ))}
      </section>

      {/* STRENGTHS + GAPS */}
      <div className="readiness-two-column">
        {/* STRENGTHS */}
        <section className="job-card readiness-strengths">
          <div className="card-header">
            <div>
              <span className="eyebrow">YOUR ADVANTAGES</span>
              <h2>Validated Strengths</h2>
            </div>
          </div>

          <div className="strength-list">
            {strengths.length > 0 ? (
              strengths.map((strength, index) => (
                <div className="strength-item hover-matter-card" key={strength}>
                  <div className="strength-number">0{index + 1}</div>
                  <div style={{ flex: 1 }}>
                    <strong>{strength}</strong>
                    <div className="hover-matter-container">
                      <div className="hover-matter-inner">
                        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                          Demonstrates proficiency exceeding the {targetJob} benchmark.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ padding: "12px", color: "#64748b" }}>
                Complete assessments and assignments to unlock your verified strengths.
              </p>
            )}
          </div>
        </section>

        {/* GAPS */}
        <section className="job-card readiness-gaps">
          <div className="card-header">
            <div>
              <span className="eyebrow">NEEDS ATTENTION</span>
              <h2>Priority Skill Gaps</h2>
            </div>
          </div>

          <div className="gap-list">
            {gaps.length > 0 ? (
              gaps.map((gap) => (
                <div className="gap-item" key={gap.skill}>
                  <div>
                    <strong>{gap.skill}</strong>
                    <span>Current proficiency {gap.score}% · Target {gap.required}%</span>
                  </div>
                  <span className={`priority ${(gap.priority || "medium").toLowerCase()}`}>
                    {gap.priority}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ padding: "12px", color: "#16a34a" }}>
                Outstanding! You have no major deficits for this role.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* ACTION PLAN */}
      <section className="job-card readiness-action-plan">
        <div className="card-header">
          <div>
            <span className="eyebrow">DEVELOPMENT TRAJECTORY</span>
            <h2>Recommended Next Steps</h2>
          </div>
        </div>

        {recommendedActions.length > 0 ? (
          recommendedActions.map((action, index) => (
            <div className="action-step hover-matter-card" key={action.skill}>
              <div className="action-number">0{index + 1}</div>
              <div style={{ flex: 1 }}>
                <strong>Master {action.skill} concepts</strong>
                <div className="hover-matter-container">
                  <div className="hover-matter-inner">
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                      Complete recommended assignments and coursework for {action.skill} to boost this area.
                    </p>
                  </div>
                </div>
              </div>
              <span className="action-impact">
                {action.priority === "High" ? "HIGH IMPACT" : "RECOMMENDED"}
              </span>
            </div>
          ))
        ) : (
          <div className="action-step hover-matter-card">
            <div className="action-number">01</div>
            <div style={{ flex: 1 }}>
              <strong>Maintain Peak Readiness</strong>
              <div className="hover-matter-container">
                <div className="hover-matter-inner">
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                    Keep taking reassessments to maintain your competitive placement advantage.
                  </p>
                </div>
              </div>
            </div>
            <span className="action-impact">HIGH IMPACT</span>
          </div>
        )}

        <div className="action-step hover-matter-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", gap: "14px", alignItems: "center", flex: 1 }}>
            <div className="action-number">
              0{recommendedActions.length > 0 ? recommendedActions.length + 1 : 2}
            </div>
            <div style={{ flex: 1 }}>
              <strong>Take Next Adaptive Assessment ({targetJob})</strong>
              <div className="hover-matter-container">
                <div className="hover-matter-inner">
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                    Verify your improvements, close weak skills, and elevate your Job Readiness score.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="primary-button"
            style={{ background: "#ea580c", padding: "8px 16px", fontSize: "12px", whiteSpace: "nowrap" }}
            onClick={() => navigate("/assessment")}
          >
            Start Assessment →
          </button>
        </div>
      </section>

      {/* FINAL MESSAGE */}
      <section className="readiness-final">
        <div className="final-score">{overall}%</div>
        <div>
          <span className="eyebrow">READINESS SUMMARY</span>
          <h2>{overall >= 75 ? "You're interview-ready." : "You're progressing toward readiness."}</h2>
          <p>
            Consistent practice on your high-priority skill gaps will drive your readiness score past the target 80% mark.
          </p>
        </div>
      </section>
        </>
      )}
    </div>
  );
}

export default Readiness;