import { useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { getLearningPathForJob } from "../../data/jobData";

function Learning() {
  const {
    targetJob,
    learningProgress,
    toggleLesson,
    skillLevels,
    computeSkillGaps,
    customJobs,
    activeJD,
  } = useApp();

  const skillGaps = useMemo(() => {
    try {
      return typeof computeSkillGaps === "function" ? computeSkillGaps() : [];
    } catch {
      return [];
    }
  }, [computeSkillGaps]);

  const learningPath = useMemo(() => {
    return getLearningPathForJob(targetJob, {
      skillGaps,
      learningProgress,
      customJobs,
      activeJD,
    });
  }, [targetJob, skillGaps, learningProgress, customJobs, activeJD]);

  const { courses, lessons, isCustomUnsupported, message } = learningPath;

  const completedLessons = Array.isArray(learningProgress?.completedLessons)
    ? learningProgress.completedLessons
    : [];
  const completedLessonsCount = lessons.filter(l => completedLessons.includes(l.id)).length;
  const overallProgress = lessons.length > 0 ? Math.round((completedLessonsCount / lessons.length) * 100) : 0;

  return (
    <div className="learning-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <span className="eyebrow">DEVELOPMENT</span>
          <h1>Learning</h1>
          <p>Follow a personalized learning path based on your current skill gaps.</p>
        </div>
      </div>

      {/* LEARNING SUMMARY */}
      <section className="job-card learning-summary">
        <div className="learning-summary-left">
          <div>
            <span className="eyebrow">Personalized Path</span>
            <h2 style={{ textTransform: "capitalize" }}>{targetJob} Roadmap</h2>
            <div className="hover-matter-container">
              <div className="hover-matter-inner">
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#64748b" }}>
                  Targeted skill modules focused on high-impact competencies for your target role.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="learning-summary-stat">
          <strong>{overallProgress}%</strong>
          <span>Overall progress</span>
        </div>
      </section>

      {/* HONEST UNSUPPORTED NOTICE */}
      {isCustomUnsupported && (
        <div
          className="job-card"
          style={{
            marginBottom: "24px",
            borderLeft: "4px solid #ea580c",
            background: "#fff7ed",
            padding: "16px 20px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <strong style={{ color: "#ea580c", fontSize: "14px" }}>
              Specialized curriculum unavailable for this role
            </strong>
            <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>
              {message || "A specialized curriculum for this role is not currently available in our course catalog. Foundational engineering modules have been recommended below."}
            </p>
          </div>
        </div>
      )}

      {/* COURSE SECTION */}
      <div className="learning-section-header">
        <div>
          <span className="eyebrow">RECOMMENDED LEARNING</span>
          <h2>Your Learning Path</h2>
        </div>
        <span className="course-count">{courses.length} courses</span>
      </div>

      <section className="course-grid">
        {courses.map((course) => {
          const userSkillRecord = skillLevels?.[course.skill];
          const assessedLevel = userSkillRecord?.currentLevel;

          return (
            <div className="job-card course-card" key={course.id}>
              <div className="course-top">
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  <span className="course-skill">{course.skill}</span>
                  {assessedLevel && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "700",
                        padding: "2px 7px",
                        borderRadius: "4px",
                        background:
                          assessedLevel === "Advanced"
                            ? "#f0fdf4"
                            : "#fff7ed",
                        color:
                          assessedLevel === "Advanced"
                            ? "#15803d"
                            : "#ea580c",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      Assessed: {assessedLevel}
                    </span>
                  )}
                </div>
                <span className={`priority ${course.priority.toLowerCase()}`}>
                  {course.priority}
                </span>
              </div>

              <div style={{ marginTop: "6px", marginBottom: "8px" }}>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "11px",
                    fontWeight: "600",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background:
                      course.recommendationType === "skill_gap"
                        ? "#fff7ed"
                        : course.recommendationType === "target_job"
                        ? "#fff7ed"
                        : "#f8fafc",
                    color:
                      course.recommendationType === "skill_gap"
                        ? "#c2410c"
                        : course.recommendationType === "target_job"
                        ? "#ea580c"
                        : "#475569",
                    border: `1px solid ${
                      course.recommendationType === "skill_gap"
                        ? "#fed7aa"
                        : course.recommendationType === "target_job"
                        ? "#fed7aa"
                        : "#e2e8f0"
                    }`,
                  }}
                >
                  {course.recommendationReason ||
                    (course.recommendationType === "skill_gap"
                      ? "Recommended to address a skill gap"
                      : course.recommendationType === "target_job"
                      ? "Recommended for your target job"
                      : "General supplementary learning")}
                </span>
              </div>

            <h3>{course.title}</h3>
            <div className="hover-matter-container">
              <div className="hover-matter-inner">
                <p className="course-description">{course.description}</p>
              </div>
            </div>

            <div className="course-meta">
              <span>{course.level}</span>
              <span>{course.duration}</span>
              <span>{course.lessons} lessons</span>
            </div>

            <div className="course-progress-header">
              <span>Progress</span>
              <strong>{course.progress}%</strong>
            </div>

            <div className="course-progress">
              <div style={{ width: `${course.progress}%` }} />
            </div>

            <button className="course-button">Continue Learning →</button>
          </div>
        );
      })}
      </section>

      {/* LESSONS */}
      <section className="job-card learning-lessons">
        <div className="card-header">
          <div>
            <span className="eyebrow">CONTINUE LEARNING</span>
            <h2>Recommended Lessons</h2>
          </div>
          <span className="lesson-count">
            {completedLessonsCount}/{lessons.length} completed
          </span>
        </div>

        <div className="lesson-list">
          {lessons.map((lesson) => {
            const completed = learningProgress.completedLessons.includes(lesson.id);

            return (
              <div
                className={`lesson-row ${completed ? "lesson-completed" : ""}`}
                key={lesson.id}
              >
                <button
                  className={`lesson-check ${completed ? "checked" : ""}`}
                  onClick={() => toggleLesson(lesson.id, lesson.title)}
                  aria-label={completed ? `Mark ${lesson.title} incomplete` : `Mark ${lesson.title} complete`}
                >
                  {completed ? (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 8 7 12 13 4" />
                    </svg>
                  ) : null}
                </button>

                <div className="lesson-info">
                  <strong>{lesson.title}</strong>
                  <div>
                    <span>{lesson.skill}</span>
                    <span>{lesson.type}</span>
                    <span>{lesson.duration}</span>
                  </div>
                </div>

                <button className="lesson-start">
                  {completed ? "Completed" : "Start →"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* LEARNING TIP */}
      <section className="learning-tip hover-matter-card">
        <div className="learning-tip-icon">i</div>
        <div style={{ flex: 1 }}>
          <strong>Focus on one skill at a time</strong>
          <div className="hover-matter-container">
            <div className="hover-matter-inner">
              <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#475569" }}>
                Your current roadmap prioritizes skills with a high impact on your {targetJob} readiness.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Learning;