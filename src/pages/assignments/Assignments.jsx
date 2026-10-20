import { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";

function Assignments() {
  const {
    targetJob,
    parsedResume,
    activeJD,
    assignments: contextAssignments,
    dynamicAssignments,
    assignmentCompletions,
    assignmentSubmissions,
    toggleAssignment,
    submitAssignmentSolution,
    getActiveAssignmentsForJob,
  } = useApp();

  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");

  // Use authoritative active assignments from AppContext
  const assignments = useMemo(() => {
    if (contextAssignments && contextAssignments.length > 0) {
      return contextAssignments;
    }
    return getActiveAssignmentsForJob ? getActiveAssignmentsForJob(targetJob) : (dynamicAssignments || []);
  }, [contextAssignments, getActiveAssignmentsForJob, targetJob, dynamicAssignments]);

  const completedCount = assignments.filter((a) => Boolean(assignmentCompletions[a.id])).length;

  const handleStart = (assignment) => {
    setSelectedAssignment(assignment);
    const existingSubmission = assignmentSubmissions?.[assignment.id];
    setSubmissionUrl(existingSubmission?.url || "");
    setSubmissionNotes(existingSubmission?.notes || "");
  };

  const handleCompleteSubmission = (assignmentId, title) => {
    if (submitAssignmentSolution) {
      submitAssignmentSolution(assignmentId, {
        url: submissionUrl,
        notes: submissionNotes,
        title,
      });
    } else {
      toggleAssignment(assignmentId, title);
    }
    setSelectedAssignment(null);
  };

  return (
    <div className="assignments-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <span className="eyebrow">Practical Tasks</span>
          <h1>Personalized Assignments</h1>
          <p>
            Hands-on engineering projects dynamically generated from your resume gaps and target role.
          </p>
        </div>
      </div>

      {/* SUMMARY BANNER */}
      <section className="job-card assignment-summary">
        <div className="assignment-summary-left">
          <div>
            <span className="eyebrow">Curriculum</span>
            <h2>
              {parsedResume
                ? `Personalized Tasks (${assignments.length} Gaps)`
                : `Benchmark Tasks for ${targetJob}`}
            </h2>
            <div className="hover-matter-container">
              <div className="hover-matter-inner">
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#64748b" }}>
                  {activeJD?.companyName
                    ? `Focused on direct requirement gaps for ${activeJD.companyName}.`
                    : "Tailored deficit-closing projects aligned with your target benchmarks."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="assignment-progress-info">
          <strong>
            {completedCount}/{assignments.length}
          </strong>
          <span>Completed</span>
        </div>
      </section>

      {/* TOOLBAR */}
      <div className="assignment-toolbar">
        <div>
          <span className="eyebrow">Focus Areas</span>
          <h2>Skill-Building Projects</h2>
        </div>
        <span className="assignment-count">{assignments.length} tasks</span>
      </div>

      {/* ASSIGNMENT LIST */}
      <section className="assignment-list">
        {assignments.map((assignment) => {
          const isCompleted = !!assignmentCompletions[assignment.id];

          return (
            <div
              className={`job-card assignment-card ${isCompleted ? "assignment-completed" : ""}`}
              key={assignment.id}
            >
              {/* TOP */}
              <div className="assignment-top">
                <div className="assignment-number">{assignment.number}</div>
                <div className="assignment-main">
                  <div className="assignment-title-row">
                    <h3>{assignment.title}</h3>
                    <span className={`priority ${assignment.priority?.toLowerCase() || "medium"}`}>
                      {assignment.priority || "High"} Priority
                    </span>
                  </div>

                  <div className="hover-matter-container">
                    <div className="hover-matter-inner">
                      <p className="assignment-description">{assignment.description}</p>
                    </div>
                  </div>

                  <div className="assignment-meta">
                    <span>
                      Target Skill: <strong>{assignment.skill}</strong>
                    </span>
                    <span>
                      Difficulty: <strong>{assignment.difficulty}</strong>
                    </span>
                    <span>
                      Estimated: <strong>{assignment.duration}</strong>
                    </span>
                    {assignment.targetSkillLevel && (
                      <span
                        style={{
                          color:
                            assignment.targetSkillLevel === "Advanced"
                              ? "#15803d"
                              : assignment.targetSkillLevel === "Intermediate"
                              ? "#ea580c"
                              : "#ea580c",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontWeight: "700",
                        }}
                      >
                        Target Level: {assignment.targetSkillLevel}
                      </span>
                    )}
                    {assignment.source && (
                      <span style={{ color: "#ea580c", background: "#fff7ed", padding: "2px 8px", borderRadius: "4px" }}>
                        {assignment.source}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className={`assignment-complete ${isCompleted ? "completed" : ""}`}
                  onClick={() => toggleAssignment(assignment.id, assignment.title)}
                >
                  {isCompleted ? "Completed" : "Mark Complete"}
                </button>
              </div>

              {/* STEPS PREVIEW */}
              {assignment.steps && assignment.steps.length > 0 && (
                <div style={{ marginTop: "14px", padding: "12px 16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <strong style={{ fontSize: "11px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>
                    Implementation Steps:
                  </strong>
                  <ol style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: "#334155" }}>
                    {assignment.steps.map((step, idx) => (
                      <li key={idx} style={{ marginBottom: "3px" }}>{step}</li>
                    ))}
                  </ol>
                  {assignment.deliverable && (
                    <div style={{ marginTop: "6px", fontSize: "11px", color: "#64748b" }}>
                      <strong>Deliverable:</strong> {assignment.deliverable}
                    </div>
                  )}
                </div>
              )}

              {/* BOTTOM ACTIONS */}
              <div className="assignment-bottom">
                <div className="assignment-skill-bar">
                  <span>Skill Impact</span>
                  <div className="assignment-track">
                    <div
                      style={{
                        width: assignment.priority === "High" ? "90%" : "65%",
                        background: isCompleted ? "#15803d" : "#ea580c",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="assignment-start"
                    onClick={() => handleStart(assignment)}
                  >
                    {isCompleted ? "View Submission" : "Submit Evidence / Solution →"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* SUBMISSION MODAL / DRAWER */}
      {selectedAssignment && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px",
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "14px",
            maxWidth: "600px",
            width: "100%",
            padding: "28px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            maxHeight: "90vh",
            overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span className="eyebrow" style={{ color: "#ea580c" }}>PRACTICAL ASSIGNMENT SUBMISSION</span>
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                aria-label="Close modal"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <h2 style={{ fontSize: "18px", color: "#0f172a", margin: "0 0 8px 0" }}>
              {selectedAssignment.title}
            </h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0" }}>
              {selectedAssignment.description}
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                GitHub Repository / Live Demo URL:
              </label>
              <input
                type="url"
                placeholder="https://github.com/your-username/project-repo"
                value={submissionUrl}
                onChange={(e) => setSubmissionUrl(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                Solution Notes / Architectural Decisions:
              </label>
              <textarea
                rows={4}
                placeholder="Describe key design choices, challenges solved, and how you implemented the requirements..."
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontFamily: "inherit" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedAssignment(null)}
                style={{ padding: "8px 18px", fontSize: "13px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => handleCompleteSubmission(selectedAssignment.id, selectedAssignment.title)}
                style={{ padding: "8px 22px", fontSize: "13px", background: "#ea580c" }}
              >
                Submit & Verify Solution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETION MESSAGE */}
      {completedCount > 0 && completedCount === assignments.length && (
        <section className="job-card assignment-success hover-matter-card" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <div className="success-icon" style={{ background: "#15803d", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 8 7 12 13 4" />
            </svg>
          </div>
          <div>
            <span className="eyebrow" style={{ color: "#15803d" }}>DEVELOPMENT COMPLETE</span>
            <h2 style={{ color: "#0f172a" }}>Outstanding Progress!</h2>
            <div className="hover-matter-container">
              <div className="hover-matter-inner">
                <p style={{ color: "#15803d", margin: "6px 0 0", fontSize: "13px" }}>
                  You've completed all personalized assignments for {targetJob}. Your verified practical skills and readiness score have been upgraded.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Assignments;