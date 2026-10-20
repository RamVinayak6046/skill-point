import { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import {
  getLearningPathForJob,
} from "../../data/jobData";
import CircularGauge from "../../components/graphics/CircularGauge";
import { calculateLearningCompletion } from "../../hooks/useReadiness";


function Progress() {

  const [selectedPeriod, setSelectedPeriod] = useState("All Time");

  const {
    targetJob,
    assessmentHistory,
    calculatePracticalStats,
    customJobs,
    activeJD,
    learningProgress,
    activities,
    computeSkillGaps,
    computeReadiness,
  } = useApp();


  /* =========================================
     SKILL GAPS & LEARNING PATH
  ========================================= */

  const skillGaps = useMemo(
    () => (typeof computeSkillGaps === "function" ? computeSkillGaps() : []),
    [computeSkillGaps]
  );

  const learningPath = useMemo(
    () =>
      getLearningPathForJob(targetJob, {
        skillGaps,
        learningProgress,
        customJobs,
        activeJD,
      }),
    [targetJob, skillGaps, learningProgress, customJobs, activeJD]
  );

  const practicalStats = useMemo(() => {
    return typeof calculatePracticalStats === "function"
      ? calculatePracticalStats(targetJob)
      : { completed: 0, total: 0 };
  }, [calculatePracticalStats, targetJob]);


  /* =========================================
     SKILL PROGRESS DATA
     Before = 0 (honest start - no fake pre-filled baseline)
     Current = evidence-based value from skill gaps
  ========================================= */

  const displaySkills = skillGaps
    .slice(0, 4)
    .map((skill) => ({
      name: skill.name,
      before: 0,
      current: skill.current,
      target: skill.required,
    }));


  /* =========================================
     STATS
  ========================================= */

  const completedLessons = (learningPath.lessons || []).filter((l) =>
    (learningProgress?.completedLessons || []).includes(l.id)
  ).length;

  const totalLessons =
    (learningPath.lessons || []).length;

  const completedAssignments = practicalStats.completed;

  const totalAssignments = practicalStats.total;

  const completedAssessments = assessmentHistory.length;


  /* =========================================
     AUTHORITATIVE JOB READINESS (40/30/20/10)
  ========================================= */

  const readiness = useMemo(() => {
    if (typeof computeReadiness === "function") {
      return computeReadiness(skillGaps);
    }
    return { overall: 0, status: "Getting Started" };
  }, [computeReadiness, skillGaps]);

  const readinessScore = readiness?.overall ?? 0;


  /* =========================================
     CURRICULUM / LEARNING COMPLETION
  ========================================= */

  const learningCompletion = useMemo(() => {
    return calculateLearningCompletion(completedLessons, totalLessons);
  }, [completedLessons, totalLessons]);


  /* =========================================
     IMPROVEMENT
  ========================================= */

  const totalImprovement = displaySkills.reduce(
    (sum, s) => sum + (s.current - s.before), 0
  );

  const avgImprovement = displaySkills.length > 0
    ? Math.round(totalImprovement / displaySkills.length)
    : 0;


  /* =========================================
     RECENT ACTIVITY
  ========================================= */

  const recentActivities = (activities || [])
    .slice(0, 4)
    .map((a) => ({
      title: a.title,
      type: a.type || "Activity",
      time: a.time || "",
    }));

  const displayActivities = recentActivities;


  /* =========================================
     MILESTONES
  ========================================= */

  const milestones = [
    {
      title: "First Assessment",
      description: "Completed your first skill assessment.",
      completed: completedAssessments > 0,
    },
    {
      title: "Learning Started",
      description: "Started your personalized roadmap.",
      completed: completedLessons > 0,
    },
    {
      title: "75% Readiness",
      description: "Reach 75% overall job readiness.",
      completed: readinessScore >= 75,
    },
    {
      title: "Job Ready",
      description: "Reach the 85% readiness benchmark.",
      completed: readinessScore >= 85,
    },
  ];


  /* =========================================
     NEXT TARGET
  ========================================= */

  const nextMilestone = milestones.find((m) => !m.completed);

  const nextTargetGap = nextMilestone
    ? (nextMilestone.title === "75% Readiness"
        ? Math.max(75 - readinessScore, 0)
        : nextMilestone.title === "Job Ready"
          ? Math.max(85 - readinessScore, 0)
          : 0)
    : 0;


  /* =========================================
     RENDER
  ========================================= */

  return (
    <div className="progress-page">

      {/* HEADER */}

      <div className="page-header">

        <div>

          <span className="eyebrow">
            Analytics
          </span>

          <h1>
            Progress
          </h1>

          <p>
            Track how your skills and development
            are improving over time.
          </p>

        </div>

        <div className="period-selector">

          {["Week", "Month", "All Time"].map(
            (period) => (

              <button
                key={period}
                className={
                  selectedPeriod === period
                    ? "period-active"
                    : ""
                }
                onClick={() =>
                  setSelectedPeriod(period)
                }
              >
                {period}
              </button>

            )
          )}

        </div>

      </div>


      {/* OVERALL READINESS & DEVELOPMENT */}

      <section className="job-card progress-overview">

        <div className="progress-overview-left" style={{ alignItems: "center", gap: "24px" }}>

          <CircularGauge
            value={readinessScore}
            size={136}
            strokeWidth={9}
            label="READINESS"
            colorStart="#fb923c"
            colorEnd="#ea580c"
          />


          <div>

            <span className="eyebrow">
              JOB READINESS
            </span>

            <h2>
              {readinessScore >= 85
                ? "Job Ready!"
                : readinessScore >= 70
                  ? "Almost Ready"
                  : readinessScore >= 50
                    ? "Developing"
                    : readinessScore > 0
                      ? "Getting Started"
                      : "Start Your Evaluation"}
            </h2>

            <div className="hover-matter-container">
              <div className="hover-matter-inner">
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#64748b" }}>
                  {avgImprovement > 0 ? (
                    <>
                      Your skill profile has improved by
                      <strong> {avgImprovement}%</strong> since you started
                      your development plan.
                    </>
                  ) : (
                    "40% Resume Match • 30% Assessment • 20% Practical • 10% Profile"
                  )}
                </p>
              </div>
            </div>

          </div>

        </div>


        <div className="progress-stats">

          <div>

            <strong>
              {learningCompletion}%
            </strong>

            <span>
              Curriculum ({completedLessons}/{totalLessons})
            </span>

          </div>

          <div>

            <strong>
              {completedAssignments} / {totalAssignments}
            </strong>

            <span>
              Assignments
            </span>

          </div>

          <div>

            <strong>
              {completedAssessments}
            </strong>

            <span>
              Assessments
            </span>

          </div>

        </div>

      </section>


      {/* SKILL PROGRESS */}

      <div className="progress-section-header">

        <div>

          <span className="eyebrow">
            SKILL DEVELOPMENT
          </span>

          <h2>
            Skill Progress
          </h2>

        </div>

      </div>


      <section className="job-card skill-progress-card">

        {displaySkills.map((skill) => (

          <div
            className="skill-progress-row"
            key={skill.name}
          >

            <div className="skill-progress-title">

              <strong>
                {skill.name}
              </strong>

              <span>
                {skill.current}%
              </span>

            </div>


            <div className="progress-comparison">

              <div className="progress-bar-container">

                <div
                  className="progress-bar-before"
                  style={{
                    width: `${skill.before}%`,
                  }}
                />

                <div
                  className="progress-bar-current"
                  style={{
                    width: `${skill.current}%`,
                  }}
                />

              </div>

              <span>
                Target {skill.target}%
              </span>

            </div>


            <div className="skill-progress-labels">

              <span>
                Started at {skill.before}%
              </span>

              <span className="skill-improvement">
                +{skill.current - skill.before}%
              </span>

            </div>

          </div>

        ))}

      </section>


      {/* TWO COLUMN AREA */}

      <div className="progress-two-column">


        {/* ACTIVITY */}

        <section className="job-card activity-card">

          <div className="card-header">

            <div>

              <span className="eyebrow">
                RECENT ACTIVITY
              </span>

              <h2>
                Development Activity
              </h2>

            </div>

          </div>


          <div className="activity-list">

            {displayActivities.length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                No development activity recorded yet.
              </div>
            ) : (
              displayActivities.map((activity, index) => (

                <div
                  className="activity-row"
                  key={index}
                >

                  <div className="activity-icon">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 8 7 12 13 4" />
                    </svg>
                  </div>

                  <div className="activity-info">

                    <strong>
                      {activity.title}
                    </strong>

                    <div>

                      <span>
                        {activity.type}
                      </span>

                      <span>
                        {activity.time}
                      </span>

                    </div>

                  </div>

                </div>

              ))
            )}

          </div>

        </section>


        {/* MILESTONES */}

        <section className="job-card milestones-card">

          <div className="card-header">

            <div>

              <span className="eyebrow">
                MILESTONES
              </span>

              <h2>
                Your Achievements
              </h2>

            </div>

          </div>


          <div className="milestone-list">

            {milestones.map((milestone, index) => (

              <div
                className={`milestone ${
                  milestone.completed ? "completed" : ""
                }`}
                key={milestone.title}
              >

                <div className="milestone-icon">
                  {milestone.completed ? (
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 8 7 12 13 4" />
                    </svg>
                  ) : (
                    `0${index + 1}`
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <strong>
                    {milestone.title}
                  </strong>
                  <div className="hover-matter-container">
                    <div className="hover-matter-inner">
                      <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            ))}

          </div>

        </section>

      </div>


      {/* NEXT TARGET */}

      <section className="progress-next-target hover-matter-card">

        <div className="next-target-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </div>

        <div>

          <span className="eyebrow">
            NEXT TARGET
          </span>

          <h2>
            {nextMilestone
              ? nextMilestone.title
              : "All milestones achieved!"}
          </h2>

          <div className="hover-matter-container">
            <div className="hover-matter-inner">
              <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#475569" }}>
                {nextMilestone
                  ? nextMilestone.description
                  : "Congratulations on reaching all your development milestones."}
              </p>
            </div>
          </div>

        </div>

        <div className="target-number">
          {nextTargetGap > 0
            ? `${nextTargetGap}%`
            : "100%"}
          <span>
            {nextTargetGap > 0 ? "to go" : "done"}
          </span>
        </div>

      </section>

    </div>
  );
}

export default Progress;