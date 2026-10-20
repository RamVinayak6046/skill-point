import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import StatsCard from "../../components/dashboard/StatsCard";
import ReadinessCard from "../../components/dashboard/ReadinessCard";
import DevelopmentPlan from "../../components/dashboard/DevelopmentPlan";
import RecentActivity from "../../components/dashboard/RecentActivity";
import RoleBadgeGraphic from "../../components/graphics/RoleBadgeGraphic";
import DualProgressBar from "../../components/graphics/DualProgressBar";
import SkillDetailModal from "../../components/common/SkillDetailModal";

import { useApp } from "../../context/AppContext";
import {
  getSkillsForJob,
  getLearningPathForJob,
} from "../../data/jobData";
import { calculateAdaptiveQuestionPlan } from "../../services/questionGeneratorService";


function Dashboard() {
  const navigate = useNavigate();

  const {
    profile,
    targetJob,
    latestAssessment,
    assessmentHistory = [],
    calculatePracticalStats,
    customJobs,
    learningProgress,
    activities,
    computeSkillGaps,
    computeReadiness,
    getReadinessComparison,
    activeJD,
    skillLevels,
    setAssessmentLevel,
    resume,
    parsedResume,
  } = useApp();

  const [selectedSkillForModal, setSelectedSkillForModal] = useState(null);

  /* =========================================
     ACCOUNT & EVIDENCE VALIDATION
  ========================================= */

  const hasTargetJob = Boolean(targetJob && typeof targetJob === "string" && targetJob.trim().length > 0);

  const hasEvidence = useMemo(() => {
    const hasParsedSkills = Boolean(parsedResume?.detectedSkills && parsedResume.detectedSkills.length > 0);
    const hasUploadedResume = Boolean(resume?.uploaded);
    const hasCompletedAssessment = Boolean(latestAssessment?.completed || (Array.isArray(assessmentHistory) && assessmentHistory.length > 0));
    return hasParsedSkills || hasUploadedResume || hasCompletedAssessment;
  }, [parsedResume, resume, latestAssessment, assessmentHistory]);

  /* =========================================
     COMPUTED DATA
  ========================================= */

  const requiredSkills = useMemo(
    () => (hasTargetJob ? getSkillsForJob(targetJob) : []),
    [hasTargetJob, targetJob]
  );

  /* =========================================
     SKILL GAPS & LEARNING PATH
  ========================================= */

  const skillGaps = useMemo(
    () => (hasTargetJob && typeof computeSkillGaps === "function" ? computeSkillGaps() : []),
    [hasTargetJob, computeSkillGaps]
  );

  const learningPath = useMemo(
    () =>
      hasTargetJob
        ? getLearningPathForJob(targetJob, {
            skillGaps,
            learningProgress,
            customJobs,
            activeJD,
          })
        : { lessons: [], courses: [] },
    [hasTargetJob, targetJob, skillGaps, learningProgress, customJobs, activeJD]
  );

  const practicalStats = useMemo(() => {
    return hasTargetJob && typeof calculatePracticalStats === "function"
      ? calculatePracticalStats(targetJob)
      : { completed: 0, total: 0 };
  }, [hasTargetJob, calculatePracticalStats, targetJob]);

  /* =========================================
     READINESS
  ========================================= */

  const readiness = useMemo(
    () => (hasTargetJob && hasEvidence ? computeReadiness(skillGaps) : { overall: 0, status: !hasTargetJob ? "Awaiting Selection" : "Diagnostic Pending" }),
    [hasTargetJob, hasEvidence, computeReadiness, skillGaps]
  );

  /* =========================================
     STATS & ANALYTICS
  ========================================= */

  const coveredCount = hasEvidence
    ? skillGaps.filter((s) => s.current >= s.required).length
    : 0;

  const assessmentCount = assessmentHistory.length;

  const readinessComp = useMemo(() => {
    return hasTargetJob && hasEvidence && typeof getReadinessComparison === "function"
      ? getReadinessComparison()
      : null;
  }, [hasTargetJob, hasEvidence, getReadinessComparison]);

  const topWeakGaps = useMemo(() => {
    if (!hasEvidence || !hasTargetJob) return [];
    return skillGaps
      .filter((s) => s.gap > 0 || s.matchClassification === "Missing" || s.matchClassification === "Partially Matched")
      .sort((a, b) => {
        const pOrder = { High: 3, Medium: 2, Low: 1 };
        const pDiff = (pOrder[b.priority] || 1) - (pOrder[a.priority] || 1);
        if (pDiff !== 0) return pDiff;
        return (b.gap || 0) - (a.gap || 0);
      });
  }, [hasEvidence, hasTargetJob, skillGaps]);

  const adaptivePlan = useMemo(() => {
    if (!hasTargetJob) return null;
    const recommendedLvl = latestAssessment?.score >= 70
      ? Math.min((latestAssessment.level || 1) + 1, 3)
      : (latestAssessment?.level || 1);

    return calculateAdaptiveQuestionPlan({
      skills: requiredSkills.map((r) => r.name),
      skillGaps,
      level: recommendedLvl,
      assessmentHistory,
      activeJD,
      skillLevels,
    });
  }, [hasTargetJob, requiredSkills, skillGaps, latestAssessment, assessmentHistory, activeJD, skillLevels]);

  const dashboardStats = [
    {
      label: "Job Readiness",
      value: `${readiness.overall}%`,
      description: !hasTargetJob
        ? "Select a target role"
        : !hasEvidence
          ? "Diagnostic pending"
          : readinessComp?.hasPrevious
            ? `${readinessComp.deltaFormatted} vs previous`
            : readiness.status,
    },
    {
      label: "Skill Coverage",
      value: !hasTargetJob
        ? "0/0"
        : !hasEvidence
          ? `0/${requiredSkills.length}`
          : `${coveredCount}/${skillGaps.length}`,
      description: !hasTargetJob
        ? "No role selected"
        : !hasEvidence
          ? "Pending diagnostic evaluation"
          : "required skills met",
    },
    {
      label: "Biggest Deficit",
      value: !hasTargetJob || !hasEvidence || !topWeakGaps[0]
        ? "0%"
        : `-${topWeakGaps[0].gap}%`,
      description: !hasTargetJob
        ? "No active role"
        : !hasEvidence
          ? "Upload resume to detect deficits"
          : topWeakGaps[0]
            ? `${topWeakGaps[0].name} (${topWeakGaps[0].priority || "High"})`
            : "All competencies met",
    },
    {
      label: "Assessments",
      value: String(assessmentCount),
      description: latestAssessment?.score !== undefined
        ? `Last: ${latestAssessment.score}% (${latestAssessment.levelName ? `L${latestAssessment.level || 1}` : "Passed"})`
        : "Diagnostic pending",
    },
  ];

  /* =========================================
     DEVELOPMENT PLAN
  ========================================= */

  const completedAssignmentCount = practicalStats.completed;
  const totalAssignments = practicalStats.total;

  const completedLessonCount = (learningPath.lessons || []).filter((l) =>
    (learningProgress?.completedLessons || []).includes(l.id)
  ).length;

  const totalLessons = (learningPath.lessons || []).length;

  const devPlan = [
    {
      id: 1,
      title: hasTargetJob ? `${targetJob} Skill Development` : "Target Skill Development",
      category: "Skills",
      progress: hasEvidence && skillGaps.length > 0
        ? Math.round((coveredCount / skillGaps.length) * 100)
        : 0,
      status: !hasTargetJob
        ? "Awaiting Role"
        : !hasEvidence
          ? "Diagnostic Pending"
          : coveredCount === skillGaps.length ? "Complete" : "In Progress",
    },
    {
      id: 2,
      title: "Practice Assignments",
      category: "Practical",
      progress: totalAssignments > 0
        ? Math.round((completedAssignmentCount / totalAssignments) * 100)
        : 0,
      status: !hasTargetJob
        ? "Awaiting Role"
        : completedAssignmentCount === totalAssignments
          ? "Complete"
          : completedAssignmentCount > 0
            ? "In Progress"
            : "Upcoming",
    },
    {
      id: 3,
      title: "Learning Path",
      category: "Learning",
      progress: totalLessons > 0
        ? Math.round((completedLessonCount / totalLessons) * 100)
        : 0,
      status: !hasTargetJob
        ? "Awaiting Role"
        : completedLessonCount === totalLessons
          ? "Complete"
          : completedLessonCount > 0
            ? "In Progress"
            : "Upcoming",
    },
  ];

  /* =========================================
     RECENT ACTIVITY
  ========================================= */

  const recentActivities = (activities || [])
    .slice(0, 4)
    .map((a) => ({
      title: a.title,
      time: a.time,
      result: a.result || a.type,
    }));

  const displayActivities = recentActivities;

  const displayName = profile?.name || "Student";
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="dashboard-page">
      {/* HEADER */}
      <header className="dashboard-header">
        <div>
          <span className="eyebrow">OVERVIEW</span>
          <h1>Welcome back, {displayName}</h1>
          <p>Here is your current career readiness overview and priority skill gaps.</p>
        </div>

        <div className="header-actions">
          <button className="notification-button" aria-label="Notifications" title="System Notifications">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>

          <div className="header-user">
            <div className="header-avatar" style={{ background: "#ea580c", borderRadius: "6px" }}>
              {avatarInitial}
            </div>
            <div>
              <strong>{displayName}</strong>
              <span>
                {profile?.branch ? `${profile.degree || 'B.Tech'} · ${profile.branch}` : `${profile?.degree || 'B.Tech'} · CSE`}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* TARGET ROLE BAR */}
      <div className="target-role-bar">
        <div className="target-role-left" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <RoleBadgeGraphic role={hasTargetJob ? targetJob : "unassigned"} size={40} />
          <div>
            <span className="eyebrow" style={{ color: "#c2410c", background: "#fff7ed", borderColor: "#fed7aa" }}>
              Active Target Role
            </span>
            <strong style={{ fontSize: "16px", color: "#0f172a", display: "block", textTransform: "capitalize" }}>
              {hasTargetJob ? targetJob : "No Target Role Selected"}
            </strong>
          </div>
        </div>

        <div className="target-role-meta" style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          {hasTargetJob ? (
            <>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Benchmark: <strong>{requiredSkills.length} competencies</strong>
              </span>
              <button
                className="change-role-button"
                onClick={() => navigate("/job")}
              >
                Change role
              </button>
            </>
          ) : (
            <button
              className="primary-button"
              style={{ padding: "8px 16px", fontSize: "12px", borderRadius: "6px", background: "#ea580c", color: "#ffffff", border: "none", fontWeight: 700, cursor: "pointer" }}
              onClick={() => navigate("/job")}
            >
              Select Target Role →
            </button>
          )}
        </div>
      </div>

      {/* STATS GRID: 4 UNIFORM METRIC CARDS */}
      <section className="stats-grid">
        {dashboardStats.map((stat) => (
          <StatsCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            description={stat.description}
          />
        ))}
      </section>

      {/* MAIN GRID */}
      <section className="dashboard-main-grid">
        <ReadinessCard
          score={readiness.overall}
          role={hasTargetJob ? targetJob : "No Role Selected"}
          status={readiness.status}
          topDeficit={topWeakGaps[0] || null}
          recommendedLevelName={
            !hasTargetJob
              ? "Choose a target role to begin"
              : !hasEvidence
                ? "Level 1: Diagnostic Assessment (15+ Questions)"
                : (adaptivePlan?.recommendedLevelName || "Level 1: Fundamentals")
          }
          onTakeAssessment={() => {
            if (!hasTargetJob) {
              navigate("/job");
              return;
            }
            if (typeof setAssessmentLevel === "function") {
              setAssessmentLevel(adaptivePlan?.recommendedLevel || 1);
            }
            navigate("/assessment");
          }}
          onInspectDeficit={
            topWeakGaps[0] && hasEvidence
              ? () =>
                  setSelectedSkillForModal({
                    ...topWeakGaps[0],
                    required: topWeakGaps[0].required || 80,
                    current: topWeakGaps[0].current || 0,
                  })
              : null
          }
        />

        {/* COMBINED SKILL ANALYSIS & ROLE REQUIREMENTS PANEL */}
        <div className="dashboard-panel combined-skills-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">COMPETENCY MATRIX</span>
              <h2>Skill Analysis & Role Requirements</h2>
              <span className="panel-subtitle">
                {hasTargetJob
                  ? <>Target: <strong style={{ textTransform: "capitalize" }}>{targetJob}</strong> · Click any skill for evidence & details</>
                  : "Select a target role to view required competencies and benchmarks"}
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {hasTargetJob && (
                <button
                  className="primary-button"
                  style={{ padding: "6px 14px", fontSize: "12px", borderRadius: "6px", background: "#ea580c", color: "#ffffff", border: "none" }}
                  onClick={() => navigate("/skills")}
                >
                  Full Matrix →
                </button>
              )}
            </div>
          </div>

          {!hasTargetJob ? (
            /* EMPTY STATE 1: NO TARGET ROLE SELECTED */
            <div className="competency-matrix-empty" style={{ padding: "48px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#fff7ed", border: "1px solid #fed7aa", display: "flex", alignItems: "center", justifyContent: "center", color: "#ea580c" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <h3 style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                No Target Role Selected
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b", maxWidth: "420px", lineHeight: 1.5 }}>
                Choose your career target to calibrate benchmark standards, inspect required skills, and detect personalized deficits.
              </p>
              <button
                type="button"
                className="primary-button"
                style={{ marginTop: "6px", background: "#ea580c", color: "#ffffff", padding: "8px 18px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", border: "none", cursor: "pointer" }}
                onClick={() => navigate("/job")}
              >
                Select Target Role →
              </button>
            </div>
          ) : !hasEvidence ? (
            /* EMPTY STATE 2: ROLE SELECTED, BUT NO RESUME OR ASSESSMENT EVIDENCE */
            <div className="competency-matrix-empty" style={{ padding: "44px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h3 style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                Diagnostic Evidence Required
              </h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b", maxWidth: "440px", lineHeight: 1.5 }}>
                Target role set to <strong style={{ color: "#0f172a" }}>{targetJob}</strong> ({requiredSkills.length} benchmark competencies). To evaluate your current proficiency levels and identify genuine skill deficits, upload your resume or complete an adaptive technical assessment.
              </p>
              <div style={{ display: "flex", gap: "10px", marginTop: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                <button
                  type="button"
                  className="primary-button"
                  style={{ background: "#ea580c", color: "#ffffff", padding: "8px 18px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", border: "none", cursor: "pointer" }}
                  onClick={() => navigate("/resume")}
                >
                  Upload Resume →
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ background: "#ffffff", color: "#0f172a", border: "1px solid #e2e8f0", padding: "8px 18px", borderRadius: "8px", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
                  onClick={() => navigate("/assessment")}
                >
                  Take Assessment →
                </button>
              </div>
            </div>
          ) : (
            /* POPULATED MATRIX: GENUINE EVALUATED EVIDENCE EXISTS */
            <div className="combined-skills-list">
              <div className="combined-skills-table-header">
                <span>Skill & Category</span>
                <span>Benchmark & Progress</span>
                <span>Target</span>
                <span>Current</span>
                <span>Deficit</span>
              </div>

              {requiredSkills.map((req) => {
                const currentGap = skillGaps.find((g) => g.name === req.name);
                const currentScore = currentGap ? currentGap.current : 0;
                const gap = Math.max(req.required - currentScore, 0);
                const isMet = currentScore >= req.required;

                return (
                  <div
                    className="combined-skill-row clickable-skill-row"
                    key={req.name}
                    onClick={() =>
                      setSelectedSkillForModal({
                        ...req,
                        ...currentGap,
                        current: currentScore,
                        required: req.required,
                        priority: req.importance || currentGap?.priority || "High",
                      })
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedSkillForModal({
                          ...req,
                          ...currentGap,
                          current: currentScore,
                          required: req.required,
                          priority: req.importance || currentGap?.priority || "High",
                        });
                      }
                    }}
                    title="Click to inspect evidence sources and next actions"
                  >
                    <div className="combined-skill-info">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong>{req.name}</strong>
                        <span className={`importance-tag ${req.importance?.toLowerCase() || "medium"}`}>
                          {req.importance}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "3px", flexWrap: "wrap" }}>
                        <span className="category-pill">
                          {req.category}
                        </span>
                        {currentGap?.skillLevel && (
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: "4px",
                              background:
                                currentGap.skillLevel === "Advanced"
                                  ? "#ecfdf5"
                                  : currentGap.skillLevel === "Intermediate"
                                  ? "#fff7ed"
                                  : "#fffbeb",
                              color:
                                currentGap.skillLevel === "Advanced"
                                  ? "#059669"
                                  : currentGap.skillLevel === "Intermediate"
                                  ? "#ea580c"
                                  : "#d97706",
                              border: "1px solid #e2e8f0",
                            }}
                          >
                            {currentGap.skillLevel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="combined-skill-bar">
                      <DualProgressBar current={currentScore} target={req.required} height={9} />
                    </div>

                    <div className="combined-skill-target">
                      {req.required}%
                    </div>

                    <div className="combined-skill-current">
                      <strong>{currentScore}%</strong>
                    </div>

                    <div className="combined-skill-status">
                      {currentGap?.matchClassification ? (
                        <span className={`status-pill ${
                          currentGap.matchClassification === 'Matched' ? 'status-met' :
                          currentGap.matchClassification === 'Partially Matched' ? 'status-progress' :
                          'status-gap'
                        }`} title={currentGap.evidenceExplanation || ''}>
                          {currentGap.matchClassification === 'Matched' ? 'Matched' :
                           currentGap.matchClassification === 'Partially Matched' ? 'Partial' :
                           'Missing'}
                        </span>
                      ) : isMet ? (
                        <span className="status-pill status-met">Met</span>
                      ) : currentScore > 0 ? (
                        <span className="status-pill status-gap">-{gap}% Gap</span>
                      ) : (
                        <span className="status-pill status-needed">Need test</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hasTargetJob && hasEvidence && (
            <div className="combined-skills-footer">
              <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#64748b", alignItems: "center", flexWrap: "wrap" }}>
                <span>Met: <strong>{skillGaps.filter((s) => s.current >= s.required).length}</strong></span>
                <span>Needs Work: <strong>{skillGaps.filter((s) => s.gap > 0).length}</strong></span>
                <div style={{ display: "inline-flex", gap: "12px", alignItems: "center", marginLeft: "6px", fontSize: "11px", color: "#64748b" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#ea580c", display: "inline-block" }}></span>
                    Current
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "12px", height: "8px", borderRadius: "2px", background: "repeating-linear-gradient(45deg, rgba(234,88,12,0.15), rgba(234,88,12,0.15) 2px, transparent 2px, transparent 4px)", border: "1px dashed #ea580c", display: "inline-block" }}></span>
                    Deficit Gap
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "4px", height: "10px", borderRadius: "1px", background: "#0f172a", display: "inline-block" }}></span>
                    Target Benchmark
                  </span>
                </div>
              </div>
              <button
                className="text-button"
                onClick={() => navigate("/assessment")}
                style={{ fontSize: "12px", fontWeight: "700", color: "#ea580c" }}
              >
                Take Assessment to verify skills →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* LOWER GRID */}
      <section className="dashboard-lower-grid">
        <DevelopmentPlan plans={devPlan} />
        <RecentActivity activities={displayActivities} />
      </section>

      {/* PROGRESSIVE DISCLOSURE: SKILL DETAIL MODAL */}
      {selectedSkillForModal && (
        <SkillDetailModal
          skill={selectedSkillForModal}
          onClose={() => setSelectedSkillForModal(null)}
        />
      )}
    </div>
  );
}

export default Dashboard;