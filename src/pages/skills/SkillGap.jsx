import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { getSkillGapSummary } from "../../hooks/useSkillGap";
import DualProgressBar from "../../components/graphics/DualProgressBar";
import RoleBadgeGraphic from "../../components/graphics/RoleBadgeGraphic";

function SkillGap() {
  const {
    targetJob,
    computeSkillGaps,
    activeJD,
    parsedResume,
    resume,
    latestAssessment,
    assessmentHistory = [],
  } = useApp();

  const navigate = useNavigate();

  // Filter state
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'matched' | 'partial' | 'missing' | 'high' | 'weak'
  const [sourceFilter, setSourceFilter] = useState("all"); // 'all' | 'required' | 'preferred'
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSkill, setExpandedSkill] = useState(null);

  const hasTargetJob = Boolean((targetJob && targetJob.trim()) || (activeJD && activeJD.jobTitle));
  const hasEvidence = Boolean(
    (parsedResume?.detectedSkills && parsedResume.detectedSkills.length > 0) ||
    resume?.uploaded ||
    latestAssessment?.completed ||
    (Array.isArray(assessmentHistory) && assessmentHistory.length > 0)
  );

  // Compute intelligent skill gaps using real parsedResume, activeJD, dynamic assignments, and skill levels
  const skillsWithGap = useMemo(() => {
    if (!hasTargetJob || !hasEvidence) return [];
    return typeof computeSkillGaps === "function" ? computeSkillGaps() : [];
  }, [hasTargetJob, hasEvidence, computeSkillGaps]);

  const summary = useMemo(() => {
    return getSkillGapSummary(skillsWithGap);
  }, [skillsWithGap]);

  // Remaining weak skills (gap > 0 or Missing/Partial)
  const remainingWeakSkills = useMemo(() => {
    return skillsWithGap.filter(
      (s) => s.gap > 0 || s.matchClassification === "Missing" || s.matchClassification === "Partially Matched"
    );
  }, [skillsWithGap]);

  const topWeakSkills = useMemo(() => {
    return [...remainingWeakSkills].sort((a, b) => {
      const pOrder = { High: 3, Medium: 2, Low: 1 };
      const pDiff = (pOrder[b.priority] || 1) - (pOrder[a.priority] || 1);
      if (pDiff !== 0) return pDiff;
      return (b.gap || 0) - (a.gap || 0);
    });
  }, [remainingWeakSkills]);

  // Filtered skills list
  const filteredSkills = useMemo(() => {
    return skillsWithGap.filter((skill) => {
      // Classification filter
      if (activeFilter === "matched" && skill.matchClassification !== "Matched") return false;
      if (activeFilter === "partial" && skill.matchClassification !== "Partially Matched") return false;
      if (activeFilter === "missing" && skill.matchClassification !== "Missing") return false;
      if (activeFilter === "high" && skill.priority !== "High") return false;
      if (activeFilter === "weak" && !(skill.gap > 0 || skill.matchClassification === "Missing" || skill.matchClassification === "Partially Matched")) return false;

      // Source filter
      if (sourceFilter === "required" && skill.source === "Preferred") return false;
      if (sourceFilter === "preferred" && skill.source !== "Preferred") return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = skill.name.toLowerCase().includes(q);
        const matchesCat = (skill.category || "").toLowerCase().includes(q);
        if (!matchesName && !matchesCat) return false;
      }

      return true;
    });
  }, [skillsWithGap, activeFilter, sourceFilter, searchTerm]);

  // Helper styles
  const getClassificationBadge = (classification) => {
    switch (classification) {
      case "Matched":
        return {
          label: "Matched",
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          color: "#15803d",
        };
      case "Partially Matched":
        return {
          label: "Partially Matched",
          background: "#fff7ed",
          border: "1px solid #fed7aa",
          color: "#ea580c",
        };
      case "Missing":
      default:
        return {
          label: "Missing",
          background: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#b91c1c",
        };
    }
  };

  const getPriorityBadgeClass = (priority) => {
    if (priority === "High") return "high";
    if (priority === "Medium") return "medium";
    return "low";
  };

  const toggleExpand = (name) => {
    setExpandedSkill((prev) => (prev === name ? null : name));
  };

  return (
    <div className="skill-gap-page" style={{ maxWidth: "1280px", margin: "0 auto", padding: "30px 36px 60px" }}>
      {/* PAGE HEADER */}
      <div className="page-header" style={{ marginBottom: "20px" }}>
        <div>
          <span className="eyebrow">Skill Gap Matrix</span>
          <h1>Intelligent Skill Gap Matrix</h1>
          <p>
            Deterministic multi-source comparison connecting verified resume evidence with required and preferred job posting qualifications.
          </p>
        </div>

        <div className="page-header-actions" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            className="add-job-button"
            onClick={() => navigate("/jd")}
            style={{ fontSize: "12px", padding: "8px 14px", borderColor: "#fed7aa", color: "#ea580c", background: "#fff7ed" }}
          >
            {activeJD ? "View Active JD" : "Load Job Description"}
          </button>
          <button
            type="button"
            className="add-job-button"
            onClick={() => navigate("/resume")}
            style={{ fontSize: "12px", padding: "8px 14px" }}
          >
            {parsedResume ? "View Parsed Resume" : "Upload Resume"}
          </button>
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
            No Target Job Selected
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: "#64748b", maxWidth: "440px", lineHeight: 1.5 }}>
            Please select a target job or upload a job description to perform intelligent skill gap analysis.
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
        <>
          {/* CONTEXT BANNER: ACTIVE JD & RESUME LINKAGE */}
          <section
            className="job-card current-target-card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "20px",
              padding: "20px 24px",
              marginBottom: "22px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <RoleBadgeGraphic role={activeJD?.jobTitle || targetJob} size={48} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                  <span className="eyebrow" style={{ color: "#ea580c", margin: 0 }}>
                    {activeJD ? `TARGET POSTING: ${activeJD.company}` : "TARGET BENCHMARK ROLE"}
                  </span>
                  {activeJD && (
                    <span className="custom-badge" style={{ fontSize: "10px", padding: "2px 8px" }}>
                      Active JD Connected
                    </span>
                  )}
                </div>
                <h2 style={{ margin: "0 0 6px", fontSize: "20px", color: "#0f172a", fontWeight: "800" }}>
                  {activeJD?.jobTitle || targetJob}
                </h2>
                <div style={{ display: "flex", gap: "14px", fontSize: "12px", color: "#475569", flexWrap: "wrap" }}>
                  <span>Company: <strong>{activeJD?.company || "Standard Industry Benchmark"}</strong></span>
                  <span>
                    Candidate Resume:{" "}
                    <strong>
                      {parsedResume
                        ? `${resume.fileName || "Uploaded Resume"} (${parsedResume.detectedSkills?.length || 0} skills detected)`
                        : "No resume uploaded"}
                    </strong>
                  </span>
                  <span>
                    Experience: <strong>{activeJD?.experienceRequirements?.text || "0-2 Years"}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* OVERALL MATCH SCORE RING */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "14px 22px",
                borderRadius: "12px",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                minWidth: "140px",
              }}
            >
              <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", letterSpacing: "1px" }}>
                OVERALL MATCH
              </span>
              <div style={{ fontSize: "32px", fontWeight: "900", color: "#64748b", margin: "2px 0" }}>
                0%
              </div>
              <span
                style={{
                  fontSize: "10px",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontWeight: "700",
                  background: "#fff7ed",
                  color: "#ea580c",
                }}
              >
                Diagnostic Pending
              </span>
            </div>
          </section>

          {/* EVIDENCE PROMPT */}
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
              Diagnostic & Resume Evidence Required
            </h2>
            <p style={{ margin: 0, fontSize: "14px", color: "#64748b", maxWidth: "460px", lineHeight: 1.5 }}>
              Skill gap analysis compares your verified resume background and assessment history against <strong>{activeJD?.jobTitle || targetJob}</strong> requirements. Upload your resume or take an assessment to calibrate your demonstrated proficiencies and view genuine deficits.
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
        </>
      ) : (
        <>
          {/* CONTEXT BANNER: ACTIVE JD & RESUME LINKAGE */}
          <section
            className="job-card current-target-card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "20px",
              padding: "20px 24px",
              marginBottom: "22px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <RoleBadgeGraphic role={activeJD?.jobTitle || targetJob} size={48} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                  <span className="eyebrow" style={{ color: "#ea580c", margin: 0 }}>
                    {activeJD ? `TARGET POSTING: ${activeJD.company}` : "TARGET BENCHMARK ROLE"}
                  </span>
                  {activeJD && (
                    <span className="custom-badge" style={{ fontSize: "10px", padding: "2px 8px" }}>
                      Active JD Connected
                    </span>
                  )}
                </div>
                <h2 style={{ margin: "0 0 6px", fontSize: "20px", color: "#0f172a", fontWeight: "800" }}>
                  {activeJD?.jobTitle || targetJob}
                </h2>
                <div style={{ display: "flex", gap: "14px", fontSize: "12px", color: "#475569", flexWrap: "wrap" }}>
                  <span>Company: <strong>{activeJD?.company || "Standard Industry Benchmark"}</strong></span>
                  <span>
                    Candidate Resume:{" "}
                    <strong>
                      {parsedResume
                        ? `${resume.fileName || "Uploaded Resume"} (${parsedResume.detectedSkills?.length || 0} skills detected)`
                        : "No resume uploaded"}
                    </strong>
                  </span>
                  <span>
                    Experience: <strong>{activeJD?.experienceRequirements?.text || "0-2 Years"}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* OVERALL MATCH SCORE RING */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "14px 22px",
                borderRadius: "12px",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                minWidth: "140px",
              }}
            >
              <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", letterSpacing: "1px" }}>
                OVERALL MATCH
              </span>
              <div style={{ fontSize: "32px", fontWeight: "900", color: summary.overallMatchScore >= 70 ? "#15803d" : "#ea580c", margin: "2px 0" }}>
                {summary.overallMatchScore || 0}%
              </div>
              <span
                style={{
                  fontSize: "10px",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontWeight: "700",
                  background: summary.overallMatchScore >= 70 ? "#f0fdf4" : "#fff7ed",
                  color: summary.overallMatchScore >= 70 ? "#15803d" : "#ea580c",
                }}
              >
                {summary.matchStatus || "Analyzing"}
              </span>
            </div>
          </section>

      {/* TOP SUMMARY METRICS GRID */}
      <section className="skill-summary-grid" style={{ marginBottom: "22px" }}>
        <div className="job-card hover-matter-card">
          <span className="eyebrow" style={{ color: "#ea580c" }}>TOTAL EVALUATED</span>
          <div className="summary-number">{summary.total}</div>
          <div className="hover-matter-container">
            <div className="hover-matter-inner">
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>Required & Preferred Skills</p>
            </div>
          </div>
        </div>

        <div className="job-card hover-matter-card">
          <span className="eyebrow" style={{ color: "#059669" }}>MATCHED</span>
          <div className="summary-number" style={{ color: "#059669" }}>
            {summary.matchedCount}
          </div>
          <div className="hover-matter-container">
            <div className="hover-matter-inner">
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#059669" }}>Verified with practical evidence</p>
            </div>
          </div>
        </div>

        <div className="job-card hover-matter-card">
          <span className="eyebrow" style={{ color: "#d97706" }}>PARTIALLY MATCHED</span>
          <div className="summary-number" style={{ color: "#d97706" }}>
            {summary.partialCount}
          </div>
          <div className="hover-matter-container">
            <div className="hover-matter-inner">
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#d97706" }}>Skills list only or deficit exists</p>
            </div>
          </div>
        </div>

        <div className="job-card hover-matter-card">
          <span className="eyebrow" style={{ color: "#dc2626" }}>MISSING</span>
          <div className="summary-number" style={{ color: "#dc2626" }}>
            {summary.missingCount}
          </div>
          <div className="hover-matter-container">
            <div className="hover-matter-inner">
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#dc2626" }}>Not found in resume background</p>
            </div>
          </div>
        </div>
      </section>

      {/* VISUAL COMPETENCY DISTRIBUTION STRIP */}
      <section className="job-card" style={{ padding: "16px 22px", marginBottom: "22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#8a7966", textTransform: "uppercase", letterSpacing: "1px" }}>
            Classification Distribution Meter
          </span>
          <div style={{ display: "flex", gap: "16px", fontSize: "12px", fontWeight: "700" }}>
            <span style={{ color: "#059669" }}>● {summary.matchedCount} Matched</span>
            <span style={{ color: "#d97706" }}>● {summary.partialCount} Partially Matched</span>
            <span style={{ color: "#dc2626" }}>● {summary.missingCount} Missing</span>
          </div>
        </div>

        {/* Multi-segment distribution track */}
        <div style={{ display: "flex", height: "9px", borderRadius: "9999px", overflow: "hidden", backgroundColor: "#ede7df" }}>
          <div
            style={{
              width: `${(summary.matchedCount / (summary.total || 1)) * 100}%`,
              backgroundColor: "#059669",
              transition: "width 0.4s",
            }}
            title={`${summary.matchedCount} Matched`}
          />
          <div
            style={{
              width: `${(summary.partialCount / (summary.total || 1)) * 100}%`,
              backgroundColor: "#d97706",
              transition: "width 0.4s",
            }}
            title={`${summary.partialCount} Partially Matched`}
          />
          <div
            style={{
              width: `${(summary.missingCount / (summary.total || 1)) * 100}%`,
              backgroundColor: "#dc2626",
              transition: "width 0.4s",
            }}
            title={`${summary.missingCount} Missing`}
          />
        </div>
      </section>

      {/* REASSESSMENT STATUS & REMAINING WEAK SKILLS SUMMARY */}
      <section
        className="job-card"
        style={{
          padding: "22px 24px",
          marginBottom: "22px",
          border: "1.5px solid #fed7aa",
          background: "linear-gradient(135deg, rgba(234, 88, 12, 0.05), #ffffff 65%)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span className="eyebrow" style={{ color: "#ea580c", margin: 0 }}>
                REASSESSMENT STATUS & WEAK SKILL TARGETS
              </span>
              {latestAssessment && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    background: "#f0fdf4",
                    color: "#15803d",
                  }}
                >
                  Reassessment Synced ({latestAssessment.score}%)
                </span>
              )}
            </div>
            <h2 style={{ fontSize: "19px", color: "#0f172a", margin: "0 0 6px", fontWeight: "800" }}>
              Latest Skill Status & {remainingWeakSkills.length} Remaining Deficit{remainingWeakSkills.length === 1 ? "" : "s"}
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#475569", maxWidth: "780px", lineHeight: "1.5" }}>
              {latestAssessment
                ? `Last evaluated in Level ${latestAssessment.level || 1} Assessment (${latestAssessment.score}%) with ${assessmentHistory.length} total attempt(s) preserved. Below are the top target skills requiring reinforcement.`
                : "No assessment attempts completed yet. Take an adaptive evaluation to establish your verified competency benchmarks."}
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            style={{ background: "#ea580c", padding: "10px 18px", fontSize: "13px", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "6px" }}
            onClick={() => navigate("/assessment")}
          >
            Take Next Adaptive Assessment →
          </button>
        </div>

        {/* Top Weak Skills Pills / List */}
        {topWeakSkills.length > 0 ? (
          <div>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#8a7966", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "10px" }}>
              Top Priority Weak Skills for Reassessment:
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px" }}>
              {topWeakSkills.slice(0, 4).map((skill) => (
                <div
                  key={skill.name}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "8px",
                    background: "#ffffff",
                    border: "1px solid #ede7df",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "13px", color: "#1c1208" }}>{skill.name}</strong>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "700",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: skill.priority === "High" ? "#fee2e2" : "#fef3c7",
                        color: skill.priority === "High" ? "#dc2626" : "#d97706",
                      }}
                    >
                      {skill.priority} Deficit
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#6b5e4e" }}>
                    <span>Current: <strong>{skill.current}%</strong></span>
                    <span>Target: <strong>{skill.required}%</strong></span>
                    <strong style={{ color: "#dc2626" }}>-{skill.gap}%</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#8a7966", borderTop: "1px solid #f5f2ee", paddingTop: "6px", marginTop: "2px" }}>
                    <span>Tier: <strong>{skill.currentLevel || "Beginner"}</strong></span>
                    <span style={{ color: skill.matchClassification === "Missing" ? "#dc2626" : "#d97706", fontWeight: "600" }}>
                      {skill.matchClassification}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: "12px 16px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "13px", fontWeight: "600" }}>
            Outstanding! You have closed all major technical skill deficits for {targetJob}.
          </div>
        )}
      </section>

      {/* FILTER & CLASSIFICATION CONTROLS */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "14px",
          marginBottom: "18px",
          flexWrap: "wrap",
        }}
      >
        {/* Classification Filter Tabs */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: `All Competencies (${summary.total})` },
            { id: "weak", label: `Remaining Weak Skills (${remainingWeakSkills.length})` },
            { id: "matched", label: `Matched (${summary.matchedCount})` },
            { id: "partial", label: `Partially Matched (${summary.partialCount})` },
            { id: "missing", label: `Missing (${summary.missingCount})` },
            { id: "high", label: `High Priority (${summary.highPriority})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: activeFilter === tab.id ? "1.5px solid #ea580c" : "1px solid #e2e8f0",
                background: activeFilter === tab.id ? "#fff7ed" : "#ffffff",
                color: activeFilter === tab.id ? "#ea580c" : "#475569",
                fontWeight: activeFilter === tab.id ? "700" : "500",
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Source filter */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #e0d9d0",
              borderRadius: "8px",
              background: "#ffffff",
              fontSize: "12px",
              color: "#1c1208",
            }}
          >
            <option value="all">All Qualifications</option>
            <option value="required">Required Only (Must-Have)</option>
            <option value="preferred">Preferred Only (Bonus)</option>
          </select>

          <input
            type="text"
            placeholder="Search skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "8px 14px",
              border: "1px solid #e0d9d0",
              borderRadius: "8px",
              background: "#ffffff",
              fontSize: "12px",
              color: "#1c1208",
              width: "180px",
            }}
          />
        </div>
      </div>

      {/* DETAILED SKILL MATRIX TABLE */}
      <section className="job-card skill-analysis-card" style={{ padding: "20px 24px", marginBottom: "24px" }}>
        <div className="card-header" style={{ marginBottom: "16px" }}>
          <div>
            <span className="eyebrow" style={{ color: "#ea580c" }}>COMPETENCY BREAKDOWN</span>
            <h2 style={{ fontSize: "18px", color: "#0f172a", margin: "2px 0 0" }}>
              Skill Match Analysis ({filteredSkills.length})
            </h2>
          </div>
          <span style={{ fontSize: "11px", color: "#64748b" }}>
            Click any row to inspect concrete evidence trail & explanation
          </span>
        </div>

        {/* Table Header */}
        <div className="skill-table-header" style={{ padding: "10px 14px", fontSize: "11px", fontWeight: "700", color: "#8a7966", textTransform: "uppercase" }}>
          <span>Skill & Requirement</span>
          <span>Classification & Match</span>
          <span>Proficiency & Benchmark</span>
          <span>Target</span>
          <span>Deficit</span>
          <span>Priority</span>
        </div>

        {/* Skill List */}
        <div className="skill-list">
          {filteredSkills.map((skill) => {
            const badge = getClassificationBadge(skill.matchClassification);
            const isExpanded = expandedSkill === skill.name;

            return (
              <div
                key={skill.name}
                style={{
                  borderBottom: "1px solid #ede7df",
                  padding: "14px 12px",
                  transition: "background 0.15s ease",
                  cursor: "pointer",
                }}
                onClick={() => toggleExpand(skill.name)}
              >
                {/* Main Row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1.3fr 1.8fr 0.6fr 0.7fr 0.8fr",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  {/* Skill Name & Source Badge */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <strong style={{ fontSize: "13px", color: "#1c1208" }}>{skill.name}</strong>
                      <span
                        style={{
                          fontSize: "9px",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          fontWeight: "700",
                          background: skill.source === "Preferred" ? "#faf8f5" : "#fff7ed",
                          color: skill.source === "Preferred" ? "#8a7966" : "#ea580c",
                          border: skill.source === "Preferred" ? "1px solid #ede7df" : "1px solid #fed7aa",
                        }}
                      >
                        {skill.source || "Required"}
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#8a7966" }}>{skill.category || "Skill"}</span>
                  </div>

                  {/* Classification & Skill Level Badges */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 8px",
                          borderRadius: "14px",
                          fontSize: "11px",
                          fontWeight: "700",
                          background: badge.background,
                          border: badge.border,
                          color: badge.color,
                        }}
                      >
                        {badge.label}
                      </span>
                      {skill.skillLevel && (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 6px",
                            borderRadius: "5px",
                            fontSize: "10px",
                            fontWeight: "700",
                            background:
                              skill.skillLevel === "Advanced"
                                ? "#ecfdf5"
                                : skill.skillLevel === "Intermediate"
                                ? "#e0f2fe"
                                : "#fffbeb",
                            color:
                              skill.skillLevel === "Advanced"
                                ? "#059669"
                                : skill.skillLevel === "Intermediate"
                                ? "#0284c7"
                                : "#d97706",
                            border: "1px solid #e0d9d0",
                          }}
                        >
                          {skill.skillLevel}
                        </span>
                      )}
                      {skill.promoted && (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "1px 5px",
                            borderRadius: "4px",
                            fontSize: "9px",
                            fontWeight: "800",
                            background: "#dcfce7",
                            color: "#15803d",
                            border: "1px solid #86efac",
                          }}
                        >
                          ↑ PROMOTED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: "100%", paddingRight: "12px" }}>
                    <DualProgressBar current={skill.current} target={skill.required} height={8} />
                  </div>

                  {/* Target Benchmark */}
                  <div style={{ fontWeight: "700", color: "#4a3728", fontSize: "13px" }}>
                    {skill.required}%
                  </div>

                  {/* Deficit */}
                  <div style={{ fontWeight: "700", fontSize: "13px", color: skill.gap === 0 ? "#059669" : "#dc2626" }}>
                    {skill.gap === 0 ? "Met" : `-${skill.gap}%`}
                  </div>

                  {/* Priority Tag & Expand Icon */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className={`priority ${getPriorityBadgeClass(skill.priority)}`}>
                      {skill.priority}
                    </span>
                    <span style={{ fontSize: "11px", color: "#8a7966", display: "inline-flex", alignItems: "center" }}>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }}
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* EXPANDABLE EVIDENCE & EXPLANATION DRAWER */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "14px 16px",
                      borderRadius: "10px",
                      background: "#faf8f5",
                      border: "1px solid #ede7df",
                    }}
                  >
                    <div style={{ marginBottom: "8px" }}>
                      <strong style={{ fontSize: "11px", color: "#8a7966", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Why this was classified as {skill.matchClassification}:
                      </strong>
                      <p style={{ margin: "4px 0 8px", fontSize: "12px", color: "#1c1208", lineHeight: "1.5" }}>
                        {skill.explanation}
                      </p>
                    </div>

                    {/* Evaluated Skill Level Diagnostic Card */}
                    <div
                      style={{
                        margin: "10px 0",
                        padding: "10px 14px",
                        background: "#ffffff",
                        borderRadius: "8px",
                        border: "1px solid #ede7df",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "10px",
                      }}
                    >
                      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: "10px", color: "#8a7966", textTransform: "uppercase" }}>Evaluated Tier</span>
                          <strong
                            style={{
                              display: "block",
                              fontSize: "13px",
                              color:
                                skill.skillLevel === "Advanced"
                                  ? "#059669"
                                  : skill.skillLevel === "Intermediate"
                                  ? "#0284c7"
                                  : "#d97706",
                            }}
                          >
                            {skill.skillLevel || "Beginner"}
                          </strong>
                        </div>
                        {skill.skillTrend && (
                          <div>
                            <span style={{ fontSize: "10px", color: "#8a7966", textTransform: "uppercase" }}>Trend</span>
                            <span
                              style={{
                                display: "block",
                                fontSize: "12px",
                                fontWeight: "600",
                                color: skill.skillTrend === "Improved" ? "#059669" : "#64748b",
                              }}
                            >
                              {skill.skillTrend === "Improved" ? "▲ Improved" : skill.skillTrend}
                            </span>
                          </div>
                        )}
                        {typeof skill.skillScore === "number" && (
                          <div>
                            <span style={{ fontSize: "10px", color: "#8a7966", textTransform: "uppercase" }}>Assessment Score</span>
                            <span style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#1c1208" }}>
                              {skill.skillScore}%
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ padding: "6px 12px", fontSize: "11px", fontWeight: "600" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/assessment");
                        }}
                      >
                        Take Assessment for {skill.name} →
                      </button>
                    </div>

                    <div>
                      <strong style={{ fontSize: "11px", color: "#8a7966", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>
                        Evidence Traceability Sources:
                      </strong>
                      {skill.evidence && skill.evidence.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {skill.evidence.map((ev, i) => (
                            <span
                              key={i}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                background: "#ffffff",
                                border: "1px solid #e0d9d0",
                                fontSize: "11px",
                                color: "#4a3728",
                                fontWeight: "500",
                              }}
                            >
                              {ev}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: "11px", color: "#dc2626", fontStyle: "italic" }}>
                          No matching keywords, projects, experience, or certifications detected in candidate resume.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* RECOMMENDED FOCUS & ACTIONS */}
      <section className="job-card priority-card" style={{ padding: "22px 24px" }}>
        <div className="card-header" style={{ marginBottom: "14px" }}>
          <div>
            <span className="eyebrow" style={{ color: "#ea580c" }}>ACTIONABLE NEXT STEPS</span>
            <h2 style={{ fontSize: "18px", color: "#0f172a", margin: "2px 0 0" }}>
              High Priority Gap Remediation
            </h2>
          </div>
        </div>

        <div className="priority-grid">
          {skillsWithGap
            .filter((s) => s.priority === "High" || s.gap > 0)
            .sort((a, b) => b.gap - a.gap)
            .slice(0, 3)
            .map((skill, index) => (
              <div className="priority-item" key={skill.name}>
                <span className="priority-number">0{index + 1}</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                    <strong style={{ color: "#1c1208", fontSize: "14px" }}>{skill.name}</strong>
                    <span style={{ fontSize: "10px", color: "#ea580c", fontWeight: "700" }}>
                      Deficit: {skill.gap}%
                    </span>
                  </div>
                  <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#6b5e4e", lineHeight: "1.5" }}>
                    {skill.matchClassification === "Missing"
                      ? `Critical Missing Skill: Required benchmark is ${skill.required}%. Complete practical projects or verify with assessment.`
                      : `Partially Matched: Listed in resume, but needs practical project proof to reach ${skill.required}% benchmark.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/assessment")}
                    className="add-job-btn-inline"
                    style={{ fontSize: "10px", padding: "4px 8px" }}
                  >
                    Take Skill Assessment →
                  </button>
                </div>
              </div>
            ))}
        </div>
      </section>
        </>
      )}
    </div>
  );
}

export default SkillGap;

