import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { jobRoles, defaultUserSkills, getJobRequirements } from "../../data/jobData";
import RoleBadgeGraphic from "../../components/graphics/RoleBadgeGraphic";

/* =========================================
   ADD CUSTOM JOB MODAL
========================================= */
function AddJobModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    company: "",
    title: "",
    level: "Entry Level",
    description: "",
    skillsRaw: "",
    setAsTargetImmediately: true,
  });
  const [error, setError] = useState("");

  const handleChange = (field) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
    if (error) setError("");
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.company.trim()) {
      setError("Please enter the company name.");
      return;
    }
    if (!form.title.trim()) {
      setError("Please enter the job title / role.");
      return;
    }
    if (!form.skillsRaw.trim()) {
      setError("Please specify at least one required skill.");
      return;
    }

    const skills = form.skillsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((skillName) => ({
        name: skillName,
        required: 75,
        importance: "Medium",
        category: "Skill",
      }));

    if (skills.length === 0) {
      setError("Please enter valid skill names separated by commas.");
      return;
    }

    const newJob = {
      id: `custom-${Date.now()}`,
      title: form.title.trim(),
      company: form.company.trim(),
      companyType: form.company.trim(),
      level: form.level,
      description:
        form.description.trim() ||
        `${form.title.trim()} opportunity at ${form.company.trim()}.`,
      skills,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    onSave(newJob, form.setAsTargetImmediately);
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box">
        <div className="modal-header">
          <div>
            <span className="eyebrow">CUSTOM OPPORTUNITY</span>
            <h2>Add Target Job</h2>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="modal-field">
              <label>
                Company Name <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Google, Amazon, Microsoft, Startup"
                value={form.company}
                onChange={handleChange("company")}
                autoFocus
              />
            </div>

            <div className="modal-field">
              <label>
                Job Title / Role <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Cloud Solutions Architect, AI Engineer, SDE-1"
                value={form.title}
                onChange={handleChange("title")}
              />
            </div>

            <div className="modal-field">
              <label>Experience Level</label>
              <select value={form.level} onChange={handleChange("level")}>
                <option value="Internship">Internship</option>
                <option value="Entry Level">Entry Level</option>
                <option value="Associate / Mid Level">Associate / Mid Level</option>
                <option value="Senior Level">Senior Level</option>
              </select>
            </div>

            <div className="modal-field">
              <label>Job Description & Responsibilities</label>
              <textarea
                rows={3}
                placeholder="Enter key responsibilities, requirements, and job overview..."
                value={form.description}
                onChange={handleChange("description")}
              />
            </div>

            <div className="modal-field">
              <label>
                Required Skills <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Python, Docker, Kubernetes, AWS, PostgreSQL"
                value={form.skillsRaw}
                onChange={handleChange("skillsRaw")}
              />
              <span className="field-hint">
                Separate skills with commas (e.g. Python, Docker, Git). Skill Point will generate benchmarks and gap diagnostics for each.
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "4px",
              }}
            >
              <input
                type="checkbox"
                id="setImmediate"
                checked={form.setAsTargetImmediately}
                onChange={handleChange("setAsTargetImmediately")}
                style={{
                  width: "16px",
                  height: "16px",
                  accentColor: "#ea580c",
                  cursor: "pointer",
                }}
              />
              <label
                htmlFor="setImmediate"
                style={{
                  fontSize: "12px",
                  color: "#0f172a",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Set as active target job immediately
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="modal-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="modal-save">
              Save & Add Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================
   ROLE DETAIL POPOUT MODAL
========================================= */
function RoleDetailModal({ job, isSelected, onSelect, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!job) return null;

  return (
    <div
      className="modal-overlay popout-role-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="popout-role-card" role="dialog" aria-modal="true">
        {/* Top Banner Header with Indigo Theme */}
        <div className="popout-role-header">
          <div className="popout-role-header-left">
            <RoleBadgeGraphic role={job.title} size={46} />
            <div>
              <span className="popout-role-eyebrow">CAREER SPECIFICATION</span>
              <h2 className="popout-role-title">{job.title}</h2>
              <div className="popout-role-meta">
                <span className="popout-role-company">
                  {job.company || job.companyType || "Industry Role"}
                </span>
                <span className="meta-dot">•</span>
                <span className="popout-role-level">{job.level || "Entry Level"}</span>
                {job.isCustom && <span className="custom-badge">CUSTOM</span>}
              </div>
            </div>
          </div>

          <div className="popout-role-header-right">
            <div className="popout-role-match-box">
              <span className="popout-match-label">YOUR SKILL MATCH</span>
              <strong className="popout-match-number">{job.match}%</strong>
            </div>
            <button
              type="button"
              className="popout-role-close-btn"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="popout-role-body">
          {/* Overview Description */}
          <div className="popout-role-desc-section">
            <h4 className="popout-section-title">ROLE OVERVIEW</h4>
            <p className="popout-role-description">{job.description}</p>
          </div>

          {/* Required Competencies With Percentages and Progress Bars */}
          <div className="popout-role-skills-section">
            <div className="popout-skills-header-row">
              <h4 className="popout-section-title">
                REQUIRED COMPETENCIES ({job.skills.length})
              </h4>
              <span className="popout-skills-subtitle">Required Proficiency</span>
            </div>

            <div className="popout-skills-grid">
              {job.skills.map((skill) => (
                <div className="popout-skill-card" key={skill.name}>
                  <div className="popout-skill-top">
                    <div className="popout-skill-name-wrap">
                      <strong className="popout-skill-name">{skill.name}</strong>
                      <span className="popout-skill-category">{skill.category || "Core Competency"}</span>
                    </div>
                    <span className="popout-skill-percentage-pill">
                      {skill.required}% Required
                    </span>
                  </div>

                  <div className="popout-skill-progress-wrap">
                    <div className="popout-skill-progress-bar">
                      <div
                        className="popout-skill-progress-fill"
                        style={{ width: `${Math.min(Math.max(skill.required, 0), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer with "Set as Target" Action */}
        <div className="popout-role-footer">
          <button
            type="button"
            className="popout-cancel-btn"
            onClick={onClose}
          >
            Back to Roles
          </button>
          <button
            type="button"
            className={`popout-set-target-btn ${isSelected ? "already-active" : ""}`}
            onClick={() => {
              if (!isSelected) {
                onSelect();
              }
              onClose();
            }}
          >
            {isSelected ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Currently Active Target
              </>
            ) : (
              <>
                Set as Target Role →
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================
   MAIN JOB PAGE
========================================= */
function Job() {
  const {
    targetJob,
    selectTargetJob,
    latestAssessment,
    customJobs,
    addCustomJob,
    removeCustomJobById,
    skillLevels,
  } = useApp();

  const [search, setSearch] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [popoutJob, setPopoutJob] = useState(null);
  const navigate = useNavigate();

  // Combine built-in jobs and custom jobs
  const allRoles = useMemo(() => {
    return [...jobRoles, ...(customJobs || [])];
  }, [customJobs]);

  // Calculate dynamic match for each role based on baseline skills + assessment + verified skill levels
  const jobsWithMatch = useMemo(() => {
    return allRoles.map((job) => {
      const baselines =
        defaultUserSkills[job.title] ||
        defaultUserSkills["Backend Developer"] ||
        [];

      let totalMatch = 0;
      job.skills.forEach((skill) => {
        const found = baselines.find((b) => b.name === skill.name);
        let current = found ? found.current : 0;

        // Ingest verified skill level score
        const verifiedLevelScore = skillLevels?.[skill.name]?.score;
        if (typeof verifiedLevelScore === "number") {
          current = Math.max(current, verifiedLevelScore);
        }

        // If assessment matches this role, blend it
        if (
          latestAssessment?.completed &&
          latestAssessment.targetJob === job.title
        ) {
          const perSkill = latestAssessment.skillScores?.[skill.name];
          if (typeof perSkill === "number") {
            current = Math.max(current, perSkill);
          } else {
            current = Math.round(
              current * 0.7 + latestAssessment.score * 0.3
            );
          }
        }

        const ratio = Math.min(current / (skill.required || 80), 1.2);
        totalMatch += ratio;
      });

      const matchPct =
        job.skills.length > 0
          ? Math.min(
              Math.round((totalMatch / job.skills.length) * 100),
              98
            )
          : 0;

      return {
        ...job,
        match: matchPct,
      };
    });
  }, [allRoles, latestAssessment, skillLevels]);

  const filteredJobs = jobsWithMatch.filter((job) => {
    const q = search.toLowerCase();
    const titleMatch = job.title.toLowerCase().includes(q);
    const companyMatch = (job.company || job.companyType || "")
      .toLowerCase()
      .includes(q);
    const skillMatch = job.skills.some((s) =>
      s.name.toLowerCase().includes(q)
    );
    return titleMatch || companyMatch || skillMatch;
  });

  const currentJob = targetJob
    ? (jobsWithMatch.find((job) => job.title.trim().toLowerCase() === targetJob.trim().toLowerCase()) || null)
    : null;

  const handleSelectJob = (title) => {
    selectTargetJob(title);
    setToastMessage(
      `Target role set to "${title}"! Required skills and benchmarks have been updated on your Dashboard.`
    );
  };

  const handleSaveCustomJob = (newJob, setAsTarget) => {
    addCustomJob(newJob);
    setShowAddModal(false);
    if (setAsTarget) {
      selectTargetJob(newJob.title);
      setToastMessage(
        `Target role set to "${newJob.title}" at ${newJob.company}! Your dashboard diagnostics have updated.`
      );
    } else {
      setToastMessage(
        `New job "${newJob.title}" at ${newJob.company} saved! You can now select it as your target.`
      );
    }
  };

  const handleRemoveJob = (e, job) => {
    e.stopPropagation();
    if (
      window.confirm(
        `Are you sure you want to delete custom job "${job.title}"?`
      )
    ) {
      removeCustomJobById(job.id);
      if (targetJob === job.title) {
        selectTargetJob("");
      }
      setToastMessage(`Custom job "${job.title}" removed.`);
    }
  };

  return (
    <div className="job-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <span className="eyebrow">Career Selection</span>
          <h1>Target Job</h1>
          <p>
            Choose your preparation target role. Your diagnostics, assessments, and learning paths adapt automatically.
          </p>
        </div>
        <div className="page-header-actions job-header-actions">
          <div className="target-job-btn-group">
            <button
              className="add-job-button target-job-header-btn"
              onClick={() => navigate("/jd")}
              style={{
                borderColor: "#ea580c",
                color: "#ffffff",
                background: "#ea580c",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>Extract from JD</span>
            </button>
            <button
              className="add-job-button target-job-header-btn"
              onClick={() => setShowAddModal(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Add Custom Job</span>
            </button>
          </div>
          <div className="target-status" style={{ color: targetJob ? '#15803d' : '#ea580c', borderColor: targetJob ? '#bbf7d0' : '#fed7aa', background: targetJob ? '#f0fdf4' : '#fff7ed' }}>
            <span style={{ background: targetJob ? '#15803d' : '#ea580c' }}></span>
            {targetJob ? 'TARGET ACTIVE' : 'NO TARGET SELECTED'}
          </div>
        </div>
      </div>

      {/* FEEDBACK TOAST BANNER */}
      {toastMessage && (
        <div className="job-target-toast">
          <div className="toast-left">
            <span className="toast-check" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <div>
              <strong>{toastMessage}</strong>
              <span>
                Your Dashboard now displays the {getJobRequirements(targetJob).length} required skills and diagnostics for {targetJob}.
              </span>
            </div>
          </div>
          <button
            className="primary-button"
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "9px 18px",
              fontSize: "13px",
              fontWeight: "700",
              whiteSpace: "nowrap",
              borderRadius: "8px",
              background: "#0f172a",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
            }}
          >
            View in Dashboard →
          </button>
        </div>
      )}

      {/* CURRENT TARGET BANNER */}
      {currentJob ? (
        <section className="job-card current-target-card">
          <div className="current-target-main">
            <RoleBadgeGraphic role={currentJob.title} size={50} />
            <div>
              <span className="eyebrow">CURRENT ACTIVE TARGET</span>
              <h2>{currentJob.title}</h2>
              {currentJob.company && (
                <span className="current-company-badge">
                  {currentJob.company} · {currentJob.level || "Full-time"}
                </span>
              )}
              <div className="hover-matter-container">
                <div className="hover-matter-inner">
                  <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#64748b" }}>{currentJob.description}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="current-target-score">
            <span>SKILL MATCH</span>
            <strong>{currentJob.match}%</strong>
          </div>
        </section>
      ) : (
        <section className="job-card" style={{ padding: "20px 24px", background: "#fff7ed", border: "1px dashed #fed7aa", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: "800", fontSize: "18px" }}>
              🎯
            </div>
            <div>
              <span className="eyebrow" style={{ color: "#c2410c" }}>CAREER GOAL</span>
              <h3 style={{ margin: "2px 0 0", fontSize: "16px", color: "#0f172a", fontWeight: "700" }}>No Target Role Selected</h3>
              <p className="career-goal-helper" style={{ margin: "2px 0 0", fontSize: "13px", color: "#64748b" }}>
                Select a target career role from the list below to calibrate your skills, diagnostic assessments, and learning roadmap.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* SEARCH & FILTER */}
      <section className="job-search-section">
        <div>
          <span className="eyebrow">EXPLORE ROLES</span>
          <h2>Available Opportunities ({filteredJobs.length})</h2>
        </div>
        <div className="job-search-bar-wrap">
          <div className="job-search">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by role title, skill, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="add-job-btn-inline"
            onClick={() => setShowAddModal(true)}
          >
            + Add New Job
          </button>
        </div>
      </section>

      {/* ROLE BUTTON-CARDS GRID (CLICK ANY ROLE TO OPEN POPOUT CARD) */}
      <div className="role-buttons-grid">
        {filteredJobs.map((job) => {
          const isSelected = targetJob === job.title;
          return (
            <div
              key={job.id}
              className={`job-card role-button-card ${isSelected ? "role-card-active" : ""}`}
              onClick={() => setPopoutJob(job)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setPopoutJob(job);
                }
              }}
            >
              <div className="role-btn-left">
                <RoleBadgeGraphic role={job.title} size={32} />
                <div className="role-btn-title-row">
                  <h3 className="role-btn-title">{job.title}</h3>
                  {job.isCustom && <span className="custom-badge">CUSTOM</span>}
                </div>
              </div>

              <div className="role-btn-right">
                {isSelected ? (
                  <span className="role-btn-active-pill">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Active
                  </span>
                ) : (
                  <span className="role-btn-open-pill">
                    View Role →
                  </span>
                )}

                {job.isCustom && (
                  <button
                    type="button"
                    className="role-btn-delete"
                    title="Delete custom job"
                    aria-label="Delete custom job"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveJob(e, job);
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CLEAN ROLE REQUIREMENTS SPECIFICATION */}
      {currentJob && (
        <section className="job-requirements-panel">
          <div className="job-requirements-header">
            <div>
              <span className="job-requirements-eyebrow">ROLE SPECIFICATION</span>
              <h2 className="job-requirements-title">
                Required Competencies for {currentJob.title}
              </h2>
              <p className="job-requirements-subtitle">
                Target proficiency benchmarks mapped into your Skill Gap analysis and readiness score.
              </p>
            </div>
            <div className="job-requirements-meta-badge">
              {currentJob.skills.length} Competencies Required
            </div>
          </div>

          <div className="job-requirements-grid">
            {currentJob.skills.map((skill, index) => (
              <div className="job-req-card" key={skill.name}>
                <div className="job-req-top">
                  <div className="job-req-index-name">
                    <span className="job-req-num">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h4 className="job-req-name">{skill.name}</h4>
                      <span className="job-req-category">{skill.category || "Core Skill"}</span>
                    </div>
                  </div>
                  <span className="job-req-pill">
                    {skill.required}% Required
                  </span>
                </div>
                <div className="job-req-progress-track">
                  <div
                    className="job-req-progress-bar"
                    style={{ width: `${Math.min(Math.max(skill.required, 0), 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ADD JOB MODAL */}
      {showAddModal && (
        <AddJobModal
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveCustomJob}
        />
      )}

      {/* ROLE DETAILS POPOUT CARD */}
      {popoutJob && (
        <RoleDetailModal
          job={popoutJob}
          isSelected={targetJob === popoutJob.title}
          onSelect={() => handleSelectJob(popoutJob.title)}
          onClose={() => setPopoutJob(null)}
        />
      )}
    </div>
  );
}

export default Job;