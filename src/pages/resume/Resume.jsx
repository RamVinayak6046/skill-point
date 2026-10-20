import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import CircularGauge from "../../components/graphics/CircularGauge";
import DualProgressBar from "../../components/graphics/DualProgressBar";
import { extractTextFromFile } from "../../services/resumeParserService";

function Resume() {
  const navigate = useNavigate();
  const {
    resume,
    parsedResume,
    parseAndSaveResume,
    updateParsedResume,
    removeResume,
    targetJob,
    activeJD,
    analyzeJobDescription,
    clearActiveJobDescription,
    skillLevels,
  } = useApp();

  const [dragging, setDragging] = useState(false);
  const [activeTab, setActiveTab] = useState("file"); // "file" | "paste"
  const [pastedText, setPastedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [skillCategoryFilter, setSkillCategoryFilter] = useState("all");
  const [expandedEvidenceMap, setExpandedEvidenceMap] = useState({});

  const toggleEvidenceExpand = (skillName) => {
    setExpandedEvidenceMap((prev) => ({
      ...prev,
      [skillName]: !prev[skillName],
    }));
  };

  // Edit / Correction Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editTab, setEditTab] = useState("personal");
  const [editForm, setEditForm] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Skill Input in Modal
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("Language");

  // JD Matcher Form State
  const [companyName, setCompanyName] = useState(activeJD?.companyName || "");
  const [jdRole, setJdRole] = useState(activeJD?.jobTitle || targetJob || "");
  const [jdText, setJdText] = useState(activeJD?.rawText || "");
  const [jdAnalyzing, setJdAnalyzing] = useState(false);

  // File handler - routes to pdfjs (PDF), mammoth (DOCX), or FileReader (TXT)
  const handleFile = async (file) => {
    if (!file) return;
    setIsProcessing(true);
    setUploadError("");

    try {
      const text = await extractTextFromFile(file);
      if (!text || text.trim().length < 20) {
        setUploadError(
          "Could not extract readable text from this file. It may be a scanned image PDF. Please paste your resume text directly instead."
        );
        return;
      }
      parseAndSaveResume(text, file.name);
    } catch (err) {
      const msg = err?.message || "Unknown error reading file.";
      setUploadError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) {
      setUploadError("Please paste your resume content before analyzing.");
      return;
    }
    setIsProcessing(true);
    setUploadError("");
    try {
      parseAndSaveResume(pastedText, "pasted-resume.txt");
    } finally {
      setIsProcessing(false);
    }
  };

  // Job Description Matcher Submit
  const handleJdSubmit = (e) => {
    e.preventDefault();
    if (!jdText.trim()) return;
    setJdAnalyzing(true);
    try {
      analyzeJobDescription(jdText, companyName || "Target Company", jdRole || targetJob);
    } finally {
      setJdAnalyzing(false);
    }
  };

  // --- EDIT MODAL HANDLERS ---
  const handleOpenEdit = (tab = "personal") => {
    if (!parsedResume) return;
    // Deep clone parsedResume for editing
    setEditForm(JSON.parse(JSON.stringify(parsedResume)));
    setEditTab(tab);
    setIsEditing(true);
    setSaveSuccess(false);
  };

  const handleCloseEdit = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    updateParsedResume(editForm);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 5000);
  };

  // Skill Add / Remove in Edit Form
  const handleAddSkill = () => {
    if (!newSkillName.trim() || !editForm) return;
    const name = newSkillName.trim();
    const existing = editForm.detectedSkills.some(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) return;

    const newSkill = {
      id: name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
      name,
      category: newSkillCategory,
      occurrences: 1,
      score: 75,
      status: "Strong",
      evidence: ["Added by Student"],
    };

    setEditForm((prev) => ({
      ...prev,
      detectedSkills: [newSkill, ...prev.detectedSkills],
    }));
    setNewSkillName("");
  };

  const handleRemoveSkill = (skillName) => {
    if (!editForm) return;
    setEditForm((prev) => ({
      ...prev,
      detectedSkills: prev.detectedSkills.filter((s) => s.name !== skillName),
    }));
  };

  // Project Add / Remove / Change in Edit Form
  const handleAddProject = () => {
    if (!editForm) return;
    const newProj = {
      title: "New Project",
      technologies: ["React", "Node.js"],
      description: "Briefly describe your project deliverables and impact.",
      link: "",
    };
    setEditForm((prev) => ({
      ...prev,
      projects: [...(prev.projects || []), newProj],
    }));
  };

  const handleUpdateProject = (index, field, value) => {
    if (!editForm) return;
    const updated = [...(editForm.projects || [])];
    if (field === "technologies") {
      updated[index][field] = typeof value === "string" ? value.split(",").map((s) => s.trim()).filter(Boolean) : value;
    } else {
      updated[index][field] = value;
    }
    setEditForm((prev) => ({ ...prev, projects: updated }));
  };

  const handleRemoveProject = (index) => {
    if (!editForm) return;
    setEditForm((prev) => ({
      ...prev,
      projects: (prev.projects || []).filter((_, i) => i !== index),
    }));
  };

  // Experience Add / Remove in Edit Form
  const handleAddExperience = () => {
    if (!editForm) return;
    const newExp = {
      role: "Software Development Engineer Intern",
      company: "Company Name",
      duration: "June 2024 - August 2024",
      description: "Implemented features, collaborated with team, and resolved bugs.",
      technologies: ["Java", "Spring Boot", "MySQL"],
    };
    setEditForm((prev) => ({
      ...prev,
      experiences: [...(prev.experiences || []), newExp],
    }));
  };

  const handleUpdateExperience = (index, field, value) => {
    if (!editForm) return;
    const updated = [...(editForm.experiences || [])];
    if (field === "technologies") {
      updated[index][field] = typeof value === "string" ? value.split(",").map((s) => s.trim()).filter(Boolean) : value;
    } else {
      updated[index][field] = value;
    }
    setEditForm((prev) => ({ ...prev, experiences: updated }));
  };

  const handleRemoveExperience = (index) => {
    if (!editForm) return;
    setEditForm((prev) => ({
      ...prev,
      experiences: (prev.experiences || []).filter((_, i) => i !== index),
    }));
  };

  // Education Add / Remove in Edit Form
  const handleAddEducation = () => {
    if (!editForm) return;
    const newEdu = {
      degree: "B.Tech (Computer Science)",
      institution: "College Name",
      year: "2024",
      score: "8.5 CGPA",
    };
    setEditForm((prev) => ({
      ...prev,
      education: [...(prev.education || []), newEdu],
    }));
  };

  const handleUpdateEducation = (index, field, value) => {
    if (!editForm) return;
    const updated = [...(editForm.education || [])];
    updated[index][field] = value;
    setEditForm((prev) => ({ ...prev, education: updated }));
  };

  const handleRemoveEducation = (index) => {
    if (!editForm) return;
    setEditForm((prev) => ({
      ...prev,
      education: (prev.education || []).filter((_, i) => i !== index),
    }));
  };

  // Certifications & Achievements in Edit Form
  const handleAddCertification = () => {
    if (!editForm) return;
    const newCert = {
      name: "AWS Certified Cloud Practitioner",
      issuer: "Amazon Web Services",
      date: "2024",
    };
    setEditForm((prev) => ({
      ...prev,
      certifications: [...(prev.certifications || []), newCert],
    }));
  };

  const handleUpdateCertification = (index, field, value) => {
    if (!editForm) return;
    const updated = [...(editForm.certifications || [])];
    updated[index][field] = value;
    setEditForm((prev) => ({ ...prev, certifications: updated }));
  };

  const handleRemoveCertification = (index) => {
    if (!editForm) return;
    setEditForm((prev) => ({
      ...prev,
      certifications: (prev.certifications || []).filter((_, i) => i !== index),
    }));
  };

  const handleAddAchievement = () => {
    if (!editForm) return;
    setEditForm((prev) => ({
      ...prev,
      achievements: [...(prev.achievements || []), "New achievement or award"],
    }));
  };

  const handleUpdateAchievement = (index, value) => {
    if (!editForm) return;
    const updated = [...(editForm.achievements || [])];
    updated[index] = value;
    setEditForm((prev) => ({ ...prev, achievements: updated }));
  };

  const handleRemoveAchievement = (index) => {
    if (!editForm) return;
    setEditForm((prev) => ({
      ...prev,
      achievements: (prev.achievements || []).filter((_, i) => i !== index),
    }));
  };

  // Structured Data derived from parsedResume
  const personal = parsedResume?.personalDetails || {
    name: "Candidate",
    email: "",
    phone: "",
    location: "",
    github: "",
    linkedin: "",
    portfolio: "",
  };

  const detectedSkills = parsedResume?.detectedSkills || [];
  const matchScore = parsedResume?.matchScore || 0;
  const strengths = parsedResume?.strengths || [];
  const improvementAreas = parsedResume?.improvementAreas || [];
  const educationList = parsedResume?.education || [];
  const projectsList = parsedResume?.projects || [];
  const experiencesList = parsedResume?.experiences || [];
  const certsList = parsedResume?.certifications || [];
  const achievementsList = parsedResume?.achievements || [];

  // Filter skills by active category
  const filteredSkills = detectedSkills.filter((s) => {
    if (skillCategoryFilter === "all") return true;
    const cat = (s.category || "").toLowerCase();
    if (skillCategoryFilter === "languages") return cat.includes("lang");
    if (skillCategoryFilter === "frameworks") return cat.includes("frame") || cat.includes("lib");
    if (skillCategoryFilter === "databases") return cat.includes("data");
    if (skillCategoryFilter === "tools") return cat.includes("tool") || cat.includes("devops") || cat.includes("plat");
    if (skillCategoryFilter === "concepts") return cat.includes("concept") || cat.includes("arch");
    return true;
  });

  return (
    <div className="resume-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <span className="eyebrow">Resume Intelligence</span>
          <h1>Resume Intelligence &amp; Profile</h1>
          <p>
            Extract, verify, and fine-tune your structured engineering profile with real-time parsing and skill evidence tracking.
          </p>
        </div>
        {resume?.uploaded && (
          <div className="resume-status">
            <span></span>
            RESUME ACTIVE ({detectedSkills.length} SKILLS PARSED)
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="save-success-banner">
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 8 7 12 13 4" /></svg>
          </span>
          <span>Resume profile and manual corrections successfully saved to local storage!</span>
        </div>
      )}

      {/* UPLOAD & INPUT SECTION */}
      <section className="job-card resume-upload-card" style={{ padding: "24px 28px" }}>
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span className="eyebrow">RESUME INPUT SOURCE</span>
            <h2>{resume?.uploaded ? "Active Resume File" : "Upload or Paste Resume"}</h2>
          </div>
          {!resume?.uploaded && (
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className={`secondary-button ${activeTab === "file" ? "active" : ""}`}
                style={{
                  padding: "6px 14px",
                  fontSize: "12px",
                  borderRadius: "6px",
                  background: activeTab === "file" ? "#fff7ed" : "#ffffff",
                  borderColor: activeTab === "file" ? "#fed7aa" : "#e2e8f0",
                  color: activeTab === "file" ? "#ea580c" : "#475569",
                  fontWeight: "700",
                }}
                onClick={() => setActiveTab("file")}
              >
                File Upload
              </button>
              <button
                type="button"
                className={`secondary-button ${activeTab === "paste" ? "active" : ""}`}
                style={{
                  padding: "6px 14px",
                  fontSize: "12px",
                  borderRadius: "6px",
                  background: activeTab === "paste" ? "#fff7ed" : "#ffffff",
                  borderColor: activeTab === "paste" ? "#fed7aa" : "#e2e8f0",
                  color: activeTab === "paste" ? "#ea580c" : "#475569",
                  fontWeight: "700",
                }}
                onClick={() => setActiveTab("paste")}
              >
                Paste Text
              </button>
            </div>
          )}
        </div>

        {uploadError && (
          <div style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#b91c1c", fontSize: "13px", marginBottom: "16px" }}>
            {uploadError}
          </div>
        )}

        {!resume?.uploaded ? (
          activeTab === "file" ? (
            <div
              className={`resume-drop-zone ${dragging ? "resume-dragging" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <div className="upload-icon" style={{ background: "#fff7ed", color: "#ea580c" }}>↑</div>
              <h3>Drag &amp; drop your resume file here</h3>
              <p>Supports <strong>PDF</strong> (text-layer), <strong>DOCX</strong>, and <strong>TXT / MD</strong> · Max 10 MB</p>
              <label className="upload-button" style={{ background: "#ea580c" }}>
                {isProcessing ? "Extracting text…" : "Choose File to Analyze"}
                <input type="file" accept=".pdf,.txt,.md,.docx" onChange={handleInputChange} hidden disabled={isProcessing} />
              </label>
              <span className="upload-hint">Real PDF text-layer &amp; DOCX XML extraction · skill taxonomy &amp; section analysis</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <textarea
                rows={8}
                placeholder="Paste your raw resume text here (Skills, Projects, Education, Work Experience)..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  outline: "none",
                }}
              />
              <button
                type="button"
                className="primary-button"
                onClick={handlePasteSubmit}
                disabled={isProcessing || !pastedText.trim()}
                style={{ alignSelf: "flex-start", padding: "10px 24px" }}
              >
                {isProcessing ? "Parsing Text..." : "Analyze Resume Text →"}
              </button>
            </div>
          )
        ) : (
          <div className="uploaded-resume" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
            <div className="resume-file-icon" style={{ background: "#ea580c", color: "#ffffff" }}>DOC</div>
            <div className="uploaded-file-info">
              <strong style={{ color: "#0f172a" }}>{resume?.fileName}</strong>
              <span style={{ color: "#64748b" }}>
                {parsedResume?.wordCount || 0} words parsed · {detectedSkills.length} skills verified · Experience: {parsedResume?.experienceLevel || "Fresher"}
              </span>
            </div>
            <div className="uploaded-file-actions" style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="primary-button"
                onClick={() => handleOpenEdit("personal")}
                style={{ padding: "6px 14px", fontSize: "12px", background: "#ea580c" }}
              >
                Edit / Correct Details
              </button>
              <button
                type="button"
                onClick={() => removeResume()}
                style={{ padding: "6px 14px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "6px", color: "#b91c1c", fontWeight: "700", cursor: "pointer" }}
              >
                Re-upload / Clear
              </button>
            </div>
          </div>
        )}
      </section>

      {/* PARSED RESUME DETAILS */}
      {resume?.uploaded && parsedResume && (
        <>
          {/* 1. PERSONAL DETAILS CARD */}
          <section className="resume-personal-card">
            <div className="personal-header-row">
              <div className="personal-name-block">
                <span className="eyebrow" style={{ color: "#ea580c" }}>CANDIDATE PROFILE</span>
                <h2>{personal.name || "Candidate"}</h2>
                <p>
                  Target Role: <strong>{targetJob}</strong> · Experience: <strong>{parsedResume.experienceLevel}</strong>
                </p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => handleOpenEdit("personal")}
                style={{ fontSize: "12px", padding: "6px 12px" }}
              >
                Edit Personal Info
              </button>
            </div>

            <div className="personal-contact-grid">
              {personal.email && (
                <div className="contact-item">
                  <span className="contact-icon" style={{ display: "inline-flex", alignItems: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                  </span>
                  <div>
                    <small style={{ display: "block", color: "#94a3b8", fontSize: "10px", fontWeight: "700" }}>EMAIL</small>
                    <span>{personal.email}</span>
                  </div>
                </div>
              )}
              {personal.phone && (
                <div className="contact-item">
                  <span className="contact-icon" style={{ display: "inline-flex", alignItems: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  </span>
                  <div>
                    <small style={{ display: "block", color: "#94a3b8", fontSize: "10px", fontWeight: "700" }}>PHONE</small>
                    <span>{personal.phone}</span>
                  </div>
                </div>
              )}
              {personal.location && (
                <div className="contact-item">
                  <span className="contact-icon" style={{ display: "inline-flex", alignItems: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  </span>
                  <div>
                    <small style={{ display: "block", color: "#94a3b8", fontSize: "10px", fontWeight: "700" }}>LOCATION</small>
                    <span>{personal.location}</span>
                  </div>
                </div>
              )}
              {personal.github && (
                <div className="contact-item">
                  <span className="contact-icon" style={{ display: "inline-flex", alignItems: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
                  </span>
                  <div>
                    <small style={{ display: "block", color: "#94a3b8", fontSize: "10px", fontWeight: "700" }}>GITHUB</small>
                    <a href={personal.github} target="_blank" rel="noopener noreferrer" className="contact-link">
                      {personal.github.replace(/https?:\/\/(www\.)?github\.com\//, "")}
                    </a>
                  </div>
                </div>
              )}
              {personal.linkedin && (
                <div className="contact-item">
                  <span className="contact-icon" style={{ display: "inline-flex", alignItems: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                  </span>
                  <div>
                    <small style={{ display: "block", color: "#94a3b8", fontSize: "10px", fontWeight: "700" }}>LINKEDIN</small>
                    <a href={personal.linkedin} target="_blank" rel="noopener noreferrer" className="contact-link">
                      {personal.linkedin.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, "")}
                    </a>
                  </div>
                </div>
              )}
              {personal.portfolio && (
                <div className="contact-item">
                  <span className="contact-icon" style={{ display: "inline-flex", alignItems: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                  </span>
                  <div>
                    <small style={{ display: "block", color: "#94a3b8", fontSize: "10px", fontWeight: "700" }}>PORTFOLIO</small>
                    <a href={personal.portfolio} target="_blank" rel="noopener noreferrer" className="contact-link">
                      {personal.portfolio.replace(/https?:\/\/(www\.)?/, "")}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 2. ATS BENCHMARK & READINESS METRICS */}
          <section className="job-card resume-analysis-card">
            <div className="card-header">
              <div>
                <span className="eyebrow">ATS READINESS BENCHMARK</span>
                <h2>Target Job Match: {targetJob}</h2>
              </div>
              <span className="analysis-badge" style={{ background: "#fff7ed", color: "#ea580c", borderColor: "#fed7aa" }}>
                EVALUATED
              </span>
            </div>
            <div className="resume-analysis-grid" style={{ alignItems: "center" }}>
              <div className="resume-match-score" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <CircularGauge
                  value={matchScore}
                  size={132}
                  strokeWidth={9}
                  label="MATCH"
                  colorStart={matchScore >= 70 ? "#34d399" : "#f59e0b"}
                  colorEnd={matchScore >= 70 ? "#10b981" : "#ea580c"}
                />
                <h3 style={{ marginTop: "12px", color: "#0f172a" }}>
                  {matchScore >= 75 ? "Strong Role Alignment" : matchScore >= 50 ? "Moderate Alignment" : "Developing Profile"}
                </h3>
                <p style={{ textAlign: "center", color: "#64748b", fontSize: "12px", maxWidth: "260px" }}>
                  Your resume demonstrates foundational knowledge for {targetJob}.
                </p>
              </div>

              <div className="resume-metrics">
                <div className="resume-metric">
                  <span>SKILLS DETECTED</span>
                  <strong>{detectedSkills.length}</strong>
                  <small>Verified technologies</small>
                </div>
                <div className="resume-metric">
                  <span>EXPERIENCE</span>
                  <strong>{parsedResume.experienceLevel}</strong>
                  <small>Industry exposure</small>
                </div>
                <div className="resume-metric">
                  <span>CORE MATCH</span>
                  <strong>{parsedResume.matchedSkills?.length || 0} / {(parsedResume.matchedSkills?.length || 0) + (parsedResume.missingSkills?.length || 0)}</strong>
                  <small>Job competencies</small>
                </div>
                <div className="resume-metric">
                  <span>PROJECT DEPTH</span>
                  <strong>{projectsList.length}</strong>
                  <small>Extracted projects</small>
                </div>
              </div>
            </div>
          </section>

          {/* 3. CATEGORIZED TECHNICAL SKILLS WITH EVIDENCE */}
          <div className="resume-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span className="eyebrow">EXTRACTED COMPETENCIES &amp; SKILL EVIDENCE</span>
              <h2>Verified Technical Skills ({detectedSkills.length})</h2>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => handleOpenEdit("skills")}
              style={{ fontSize: "12px", padding: "6px 14px" }}
            >
              ＋ Add / Remove Skills
            </button>
          </div>

          <section className="job-card resume-skills-card" style={{ padding: "20px 24px" }}>
            {/* Category Filter Pills */}
            <div className="category-filter-bar">
              <button
                type="button"
                className={`category-pill-btn ${skillCategoryFilter === "all" ? "active" : ""}`}
                onClick={() => setSkillCategoryFilter("all")}
              >
                All Skills ({detectedSkills.length})
              </button>
              <button
                type="button"
                className={`category-pill-btn ${skillCategoryFilter === "languages" ? "active" : ""}`}
                onClick={() => setSkillCategoryFilter("languages")}
              >
                Languages ({detectedSkills.filter((s) => (s.category || "").toLowerCase().includes("lang")).length})
              </button>
              <button
                type="button"
                className={`category-pill-btn ${skillCategoryFilter === "frameworks" ? "active" : ""}`}
                onClick={() => setSkillCategoryFilter("frameworks")}
              >
                Frameworks &amp; Libs ({detectedSkills.filter((s) => (s.category || "").toLowerCase().includes("frame") || (s.category || "").toLowerCase().includes("lib")).length})
              </button>
              <button
                type="button"
                className={`category-pill-btn ${skillCategoryFilter === "databases" ? "active" : ""}`}
                onClick={() => setSkillCategoryFilter("databases")}
              >
                Databases ({detectedSkills.filter((s) => (s.category || "").toLowerCase().includes("data")).length})
              </button>
              <button
                type="button"
                className={`category-pill-btn ${skillCategoryFilter === "tools" ? "active" : ""}`}
                onClick={() => setSkillCategoryFilter("tools")}
              >
                Tools &amp; DevOps ({detectedSkills.filter((s) => (s.category || "").toLowerCase().includes("tool") || (s.category || "").toLowerCase().includes("plat")).length})
              </button>
              <button
                type="button"
                className={`category-pill-btn ${skillCategoryFilter === "concepts" ? "active" : ""}`}
                onClick={() => setSkillCategoryFilter("concepts")}
              >
                Concepts ({detectedSkills.filter((s) => (s.category || "").toLowerCase().includes("concept")).length})
              </button>
            </div>

            {filteredSkills.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {filteredSkills.map((skill) => (
                  <div
                    key={skill.name}
                    style={{
                      padding: "12px 16px",
                      background: "#ffffff",
                      border: "1px solid #f1f5f9",
                      borderRadius: "10px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 60px", alignItems: "center", gap: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <strong style={{ fontSize: "14px", color: "#0f172a" }}>{skill.name}</strong>
                        <span className={`skill-level ${skill.status.toLowerCase()}`}>{skill.status}</span>
                        {skillLevels?.[skill.name]?.currentLevel && (
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: "700",
                              padding: "1px 6px",
                              borderRadius: "4px",
                              background:
                                skillLevels[skill.name].currentLevel === "Advanced"
                                  ? "#ecfdf5"
                                  : skillLevels[skill.name].currentLevel === "Intermediate"
                                  ? "#e0f2fe"
                                  : "#fffbeb",
                              color:
                                skillLevels[skill.name].currentLevel === "Advanced"
                                  ? "#059669"
                                  : skillLevels[skill.name].currentLevel === "Intermediate"
                                  ? "#0284c7"
                                  : "#d97706",
                              border: "1px solid #e0d9d0",
                            }}
                          >
                            {skillLevels[skill.name].currentLevel}
                          </span>
                        )}
                      </div>

                      <div style={{ width: "100%" }}>
                        <DualProgressBar current={skill.score} target={75} height={7} />
                      </div>

                      <strong style={{ textAlign: "right", fontSize: "14px", color: "#0f172a" }}>
                        {skill.score}%
                      </strong>
                    </div>

                    {/* Skill Evidence Traceability */}
                    {skill.evidence && skill.evidence.length > 0 && (
                      <div className="skill-evidence-box">
                        <span className="evidence-label">EVIDENCE SOURCES:</span>
                        <div className="evidence-pills-wrap">
                          {(expandedEvidenceMap[skill.name] ? skill.evidence : skill.evidence.slice(0, 3)).map((ev, i) => {
                            let evClass = "evidence-pill";
                            if (ev.startsWith("Project:")) evClass += " project";
                            else if (ev.startsWith("Experience:")) evClass += " experience";
                            else if (ev.startsWith("Certification:")) evClass += " cert";
                            else if (ev.startsWith("Assessment Verified:")) evClass += " assessment";
                            return (
                              <span key={i} className={evClass}>
                                {ev}
                              </span>
                            );
                          })}
                          {skill.evidence.length > 3 && (
                            <button
                              type="button"
                              onClick={() => toggleEvidenceExpand(skill.name)}
                              className="evidence-toggle-btn"
                              style={{
                                background: "none",
                                border: "1px dashed #cbd5e1",
                                borderRadius: "4px",
                                fontSize: "10px",
                                fontWeight: "700",
                                color: "#ea580c",
                                cursor: "pointer",
                                padding: "2px 7px",
                                lineHeight: "1.4",
                              }}
                            >
                              {expandedEvidenceMap[skill.name]
                                ? "Show less ↑"
                                : `+${skill.evidence.length - 3} more sources ↓`}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ padding: "16px 0", color: "#64748b" }}>
                No skills detected in this category. You can add them using the &quot;Add / Remove Skills&quot; button above.
              </p>
            )}
          </section>

          {/* 4. EXTRACTED PROJECTS SECTION */}
          <div className="resume-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "28px" }}>
            <div>
              <span className="eyebrow">PRACTICAL APPLICATION EVIDENCE</span>
              <h2>Extracted Engineering Projects ({projectsList.length})</h2>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => handleOpenEdit("projects")}
              style={{ fontSize: "12px", padding: "6px 14px" }}
            >
              Edit Projects
            </button>
          </div>

          {projectsList.length > 0 ? (
            <div className="resume-items-grid">
              {projectsList.map((proj, idx) => (
                <div className="resume-card-box hover-matter-card" key={idx}>
                  <div>
                    <div className="card-title-row">
                      <h3>{proj.title}</h3>
                      {proj.link && (
                        <a href={proj.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#ea580c", fontWeight: "700" }}>
                          Link ↗
                        </a>
                      )}
                    </div>

                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="tech-tag-wrap">
                        {proj.technologies.map((t, i) => (
                          <span key={i} className="tech-tag">{t}</span>
                        ))}
                      </div>
                    )}

                    <div className="hover-matter-container">
                      <div className="hover-matter-inner">
                        <p className="card-desc-text">{proj.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <section className="job-card" style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
              <p>No project section found in resume. Click &quot;Edit Projects&quot; to add your technical projects.</p>
            </section>
          )}

          {/* 5. WORK EXPERIENCE & INTERNSHIPS */}
          <div className="resume-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "28px" }}>
            <div>
              <span className="eyebrow">PROFESSIONAL EXPOSURE</span>
              <h2>Experience &amp; Internships ({experiencesList.length})</h2>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => handleOpenEdit("experience")}
              style={{ fontSize: "12px", padding: "6px 14px" }}
            >
              Edit Experience
            </button>
          </div>

          {experiencesList.length > 0 ? (
            <div className="resume-items-grid">
              {experiencesList.map((exp, idx) => (
                <div className="resume-card-box hover-matter-card" key={idx}>
                  <div>
                    <div className="card-title-row">
                      <h3>{exp.role}</h3>
                      <span style={{ fontSize: "12px", color: "#ea580c", fontWeight: "700" }}>{exp.duration}</span>
                    </div>
                    <span className="card-meta-subtitle">{exp.company}</span>

                    {exp.technologies && exp.technologies.length > 0 && (
                      <div className="tech-tag-wrap">
                        {exp.technologies.map((t, i) => (
                          <span key={i} className="tech-tag">{t}</span>
                        ))}
                      </div>
                    )}

                    <div className="hover-matter-container">
                      <div className="hover-matter-inner">
                        <p className="card-desc-text">{exp.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <section className="job-card" style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
              <p>Fresher profile. Click &quot;Edit Experience&quot; to add any internships, freelance work, or open-source roles.</p>
            </section>
          )}

          {/* 6. EDUCATION & CREDENTIALS */}
          <div className="resume-section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "28px" }}>
            <div>
              <span className="eyebrow">ACADEMIC FOUNDATION</span>
              <h2>Education History ({educationList.length})</h2>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => handleOpenEdit("education")}
              style={{ fontSize: "12px", padding: "6px 14px" }}
            >
              Edit Education
            </button>
          </div>

          <div className="resume-items-grid">
            {educationList.map((edu, idx) => (
              <div className="resume-card-box" key={idx}>
                <div>
                  <div className="card-title-row">
                    <h3>{edu.degree}</h3>
                    <span style={{ fontSize: "12px", color: "#ea580c", fontWeight: "700" }}>{edu.year}</span>
                  </div>
                  <span className="card-meta-subtitle">{edu.institution}</span>
                  <div style={{ marginTop: "10px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>CGPA / SCORE: </span>
                    <strong style={{ fontSize: "13px", color: "#0f172a" }}>{edu.score}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 7. CERTIFICATIONS & ACHIEVEMENTS */}
          <div className="resume-two-column" style={{ marginTop: "28px" }}>
            <section className="job-card resume-content-card">
              <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span className="eyebrow">CREDENTIALS</span>
                  <h2>Certifications ({certsList.length})</h2>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => handleOpenEdit("certifications")}
                  style={{ fontSize: "11px", padding: "4px 10px" }}
                >
                  Edit
                </button>
              </div>
              {certsList.length > 0 ? (
                certsList.map((cert, idx) => (
                  <div className="resume-point" key={idx}>
                    <span style={{ display: "inline-flex", alignItems: "center", color: "#ea580c" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>
                    </span>
                    <div>
                      <strong style={{ color: "#0f172a" }}>{cert.name}</strong>
                      <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "12px" }}>
                        {cert.issuer} · {cert.date}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: "#64748b", fontSize: "13px", padding: "10px 0" }}>
                  No certifications detected. Click Edit to add course certifications or badges.
                </p>
              )}
            </section>

            <section className="job-card resume-content-card">
              <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span className="eyebrow">HONORS &amp; RECOGNITION</span>
                  <h2>Achievements ({achievementsList.length})</h2>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => handleOpenEdit("certifications")}
                  style={{ fontSize: "11px", padding: "4px 10px" }}
                >
                  Edit
                </button>
              </div>
              {achievementsList.length > 0 ? (
                achievementsList.map((ach, idx) => (
                  <div className="resume-point" key={idx}>
                    <span style={{ display: "inline-flex", alignItems: "center", color: "#ea580c" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2z" /></svg>
                    </span>
                    <div>
                      <strong style={{ color: "#0f172a" }}>Achievement</strong>
                      <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "13px" }}>{ach}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: "#64748b", fontSize: "13px", padding: "10px 0" }}>
                  No achievements listed. Click Edit to add hackathons, coding contests, or college ranks.
                </p>
              )}
            </section>
          </div>

          {/* 8. STRENGTHS & IMPROVEMENT AREAS */}
          <div className="resume-two-column" style={{ marginTop: "24px" }}>
            <section className="job-card resume-content-card">
              <div className="card-header">
                <div>
                  <span className="eyebrow">RESUME HIGHLIGHTS</span>
                  <h2>What Works Well</h2>
                </div>
              </div>
              {strengths.map((point, index) => (
                <div className="resume-point" key={index}>
                  <span style={{ display: "inline-flex", alignItems: "center", color: "#16a34a" }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 8 7 12 13 4" /></svg>
                  </span>
                  <div>
                    <strong style={{ color: "#0f172a" }}>Verified Asset</strong>
                    <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "13px" }}>{point}</p>
                  </div>
                </div>
              ))}
            </section>

            <section className="job-card resume-content-card">
              <div className="card-header">
                <div>
                  <span className="eyebrow">CRITICAL GAPS</span>
                  <h2>What To Improve for {targetJob}</h2>
                </div>
              </div>
              {improvementAreas.map((point, index) => (
                <div className="resume-point warning" key={index}>
                  <span>!</span>
                  <div>
                    <strong style={{ color: "#0f172a" }}>Action Needed</strong>
                    <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "13px" }}>{point}</p>
                  </div>
                </div>
              ))}
            </section>
          </div>
        </>
      )}

      {/* JOB DESCRIPTION & COMPANY MATCHER */}
      <section className="job-card jd-matcher-card" style={{ padding: "28px", marginTop: "28px", border: "1px solid #e2e8f0", background: "#ffffff" }}>
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span className="eyebrow" style={{ color: "#ea580c" }}>TARGET COMPANY &amp; SPECIFIC JOB POSTING</span>
            <h2>Job Description (JD) Reader &amp; ATS Match Prediction</h2>
            <p className="jd-reader-subtitle" style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
              Paste the actual job description from LinkedIn, Naukri, or company careers page to test your resume alignment.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              className="primary-button jd-open-module-btn"
              onClick={() => navigate("/jd")}
              style={{ fontSize: "12px", padding: "8px 14px", background: "#ea580c" }}
              aria-label="Open Full JD Intelligence Module"
              title="Open Full JD Intelligence Module"
            >
              <span className="jd-btn-text">Open Full JD Intelligence Module </span>
              <span className="jd-btn-arrow">→</span>
            </button>
            {activeJD && (
              <button
                className="text-button"
                onClick={clearActiveJobDescription}
                style={{ fontSize: "12px", color: "#ef4444" }}
              >
                Clear JD
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleJdSubmit} style={{ marginTop: "18px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", marginBottom: "6px" }}>
                Company Name
              </label>
              <input
                type="text"
                placeholder="e.g. Google, Amazon, Infosys, TCS, Startup"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", marginBottom: "6px" }}>
                Role Title
              </label>
              <input
                type="text"
                placeholder="e.g. Backend Software Engineer"
                value={jdRole}
                onChange={(e) => setJdRole(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", marginBottom: "6px" }}>
              Paste Full Job Description (Requirements, Qualifications &amp; Tech Stack)
            </label>
            <textarea
              rows={6}
              placeholder="Paste the complete job description text here..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              style={{ width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", fontFamily: "inherit" }}
            />
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={jdAnalyzing || !jdText.trim()}
            style={{ alignSelf: "flex-start", padding: "12px 28px", fontSize: "14px", fontWeight: "700" }}
          >
            {jdAnalyzing ? "Extracting Requirements & Matching..." : "Analyze Job Description & Predict Match →"}
          </button>
        </form>

        {/* ACTIVE JD MATCH REPORT */}
        {activeJD && activeJD.matchResult && (
          <div style={{ marginTop: "28px", paddingTop: "24px", borderTop: "1.5px solid #fed7aa" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <span className="eyebrow" style={{ color: "#ea580c" }}>SPECIFIC COMPANY PREDICTION</span>
                <h3 style={{ fontSize: "18px", color: "#0f172a", margin: "2px 0 0" }}>
                  {activeJD.companyName} - {activeJD.jobTitle}
                </h3>
              </div>
              <span className={`status-pill ${activeJD.matchResult.predictionScore >= 70 ? "status-met" : "status-progress"}`} style={{ fontSize: "13px", padding: "5px 14px" }}>
                {activeJD.matchResult.readinessStatus} ({activeJD.matchResult.predictionScore}%)
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "16px" }}>
              {/* Matched Skills */}
              <div style={{ padding: "16px 20px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px" }}>
                <strong style={{ color: "#166534", fontSize: "13px", display: "block", marginBottom: "8px" }}>
                  Matched Company Requirements ({activeJD.matchResult.matchedSkills.length})
                </strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {activeJD.matchResult.matchedSkills.length > 0 ? (
                    activeJD.matchResult.matchedSkills.map((s) => (
                      <span key={s.name} style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>
                        {s.name} ({s.userScore}%)
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: "12px", color: "#64748b" }}>No direct keyword overlaps detected yet.</span>
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              <div style={{ padding: "16px 20px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "10px" }}>
                <strong style={{ color: "#9a3412", fontSize: "13px", display: "block", marginBottom: "8px" }}>
                  Missing from Resume for {activeJD.companyName} ({activeJD.matchResult.missingSkills.length})
                </strong>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {activeJD.matchResult.missingSkills.length > 0 ? (
                    activeJD.matchResult.missingSkills.map((s) => (
                      <span key={s.name} style={{ background: "#ffedd5", color: "#c2410c", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>
                        {s.name} (Req: {s.requiredScore}%)
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: "12px", color: "#15803d" }}>All key technologies matched!</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================
          EDIT & CORRECTION MODAL
      ========================================================= */}
      {isEditing && editForm && (
        <div className="resume-edit-backdrop">
          <div className="resume-edit-modal">
            <div className="edit-modal-header">
              <div>
                <h2>Edit &amp; Correct Extracted Resume Data</h2>
                <small style={{ color: "#64748b" }}>Review, edit, add, or remove information to keep your profile 100% accurate.</small>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                aria-label="Close edit modal"
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="edit-modal-tabs">
              <button
                type="button"
                className={`edit-tab-btn ${editTab === "personal" ? "active" : ""}`}
                onClick={() => setEditTab("personal")}
              >
                Personal Details
              </button>
              <button
                type="button"
                className={`edit-tab-btn ${editTab === "skills" ? "active" : ""}`}
                onClick={() => setEditTab("skills")}
              >
                Skills ({editForm.detectedSkills?.length || 0})
              </button>
              <button
                type="button"
                className={`edit-tab-btn ${editTab === "projects" ? "active" : ""}`}
                onClick={() => setEditTab("projects")}
              >
                Projects ({editForm.projects?.length || 0})
              </button>
              <button
                type="button"
                className={`edit-tab-btn ${editTab === "experience" ? "active" : ""}`}
                onClick={() => setEditTab("experience")}
              >
                Experience ({editForm.experiences?.length || 0})
              </button>
              <button
                type="button"
                className={`edit-tab-btn ${editTab === "education" ? "active" : ""}`}
                onClick={() => setEditTab("education")}
              >
                Education ({editForm.education?.length || 0})
              </button>
              <button
                type="button"
                className={`edit-tab-btn ${editTab === "certifications" ? "active" : ""}`}
                onClick={() => setEditTab("certifications")}
              >
                Certs &amp; Awards
              </button>
            </div>

            {/* Modal Body */}
            <div className="edit-modal-body">
              {/* TAB 1: PERSONAL DETAILS */}
              {editTab === "personal" && (
                <div className="edit-form-grid">
                  <div className="edit-field-group">
                    <label>Candidate Full Name</label>
                    <input
                      type="text"
                      value={editForm.personalDetails?.name || ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          personalDetails: { ...prev.personalDetails, name: e.target.value },
                        }))
                      }
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>

                  <div className="edit-field-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={editForm.personalDetails?.email || ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          personalDetails: { ...prev.personalDetails, email: e.target.value },
                        }))
                      }
                      placeholder="e.g. rahul@example.com"
                    />
                  </div>

                  <div className="edit-field-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      value={editForm.personalDetails?.phone || ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          personalDetails: { ...prev.personalDetails, phone: e.target.value },
                        }))
                      }
                      placeholder="e.g. +91 9876543210"
                    />
                  </div>

                  <div className="edit-field-group">
                    <label>Location (City, State / Country)</label>
                    <input
                      type="text"
                      value={editForm.personalDetails?.location || ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          personalDetails: { ...prev.personalDetails, location: e.target.value },
                        }))
                      }
                      placeholder="e.g. Hyderabad, India"
                    />
                  </div>

                  <div className="edit-field-group">
                    <label>GitHub Profile URL</label>
                    <input
                      type="text"
                      value={editForm.personalDetails?.github || ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          personalDetails: { ...prev.personalDetails, github: e.target.value },
                        }))
                      }
                      placeholder="e.g. https://github.com/rahul"
                    />
                  </div>

                  <div className="edit-field-group">
                    <label>LinkedIn Profile URL</label>
                    <input
                      type="text"
                      value={editForm.personalDetails?.linkedin || ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          personalDetails: { ...prev.personalDetails, linkedin: e.target.value },
                        }))
                      }
                      placeholder="e.g. https://linkedin.com/in/rahul"
                    />
                  </div>

                  <div className="edit-field-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Portfolio / Personal Website</label>
                    <input
                      type="text"
                      value={editForm.personalDetails?.portfolio || ""}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          personalDetails: { ...prev.personalDetails, portfolio: e.target.value },
                        }))
                      }
                      placeholder="e.g. https://rahulsharma.dev"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: SKILLS */}
              {editTab === "skills" && (
                <div>
                  <div style={{ display: "flex", gap: "10px", marginBottom: "18px", background: "#fff7ed", padding: "14px", borderRadius: "10px", border: "1px solid #fed7aa" }}>
                    <input
                      type="text"
                      placeholder="Skill name (e.g. Spring Boot, Docker, Redis)"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    />
                    <select
                      value={newSkillCategory}
                      onChange={(e) => setNewSkillCategory(e.target.value)}
                      style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    >
                      <option value="Language">Programming Language</option>
                      <option value="Framework">Framework / Library</option>
                      <option value="Database">Database</option>
                      <option value="Tool">Tool / DevOps</option>
                      <option value="Concept">Core Concept</option>
                    </select>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={handleAddSkill}
                      style={{ padding: "8px 16px", background: "#ea580c" }}
                    >
                      ＋ Add Skill
                    </button>
                  </div>

                  <div style={{ maxHeight: "360px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {editForm.detectedSkills?.map((skill) => (
                      <div className="edit-item-row" key={skill.name}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <strong>{skill.name}</strong>
                          <span className="tech-tag" style={{ fontSize: "10px" }}>{skill.category}</span>
                          <span style={{ fontSize: "11px", color: "#64748b" }}>Score: {skill.score}%</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill.name)}
                          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", fontSize: "11px", fontWeight: "700" }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: PROJECTS */}
              {editTab === "projects" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleAddProject}
                    style={{ alignSelf: "flex-start", padding: "8px 16px", background: "#ea580c" }}
                  >
                    ＋ Add Project
                  </button>

                  {editForm.projects?.map((proj, idx) => (
                    <div key={idx} style={{ padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                        <span style={{ fontWeight: "700", color: "#ea580c" }}>Project #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProject(idx)}
                          style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: "700" }}
                        >
                          Delete Project
                        </button>
                      </div>

                      <div className="edit-form-grid">
                        <div className="edit-field-group">
                          <label>Project Title</label>
                          <input
                            type="text"
                            value={proj.title || ""}
                            onChange={(e) => handleUpdateProject(idx, "title", e.target.value)}
                          />
                        </div>
                        <div className="edit-field-group">
                          <label>Project Link / GitHub</label>
                          <input
                            type="text"
                            value={proj.link || ""}
                            onChange={(e) => handleUpdateProject(idx, "link", e.target.value)}
                            placeholder="https://github.com/..."
                          />
                        </div>
                        <div className="edit-field-group" style={{ gridColumn: "1 / -1" }}>
                          <label>Technologies Used (comma separated)</label>
                          <input
                            type="text"
                            value={Array.isArray(proj.technologies) ? proj.technologies.join(", ") : proj.technologies || ""}
                            onChange={(e) => handleUpdateProject(idx, "technologies", e.target.value)}
                            placeholder="e.g. React, Node.js, Express, MongoDB"
                          />
                        </div>
                        <div className="edit-field-group" style={{ gridColumn: "1 / -1" }}>
                          <label>Description &amp; Key Features</label>
                          <textarea
                            rows={3}
                            value={proj.description || ""}
                            onChange={(e) => handleUpdateProject(idx, "description", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: EXPERIENCE */}
              {editTab === "experience" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleAddExperience}
                    style={{ alignSelf: "flex-start", padding: "8px 16px", background: "#ea580c" }}
                  >
                    ＋ Add Experience / Internship
                  </button>

                  {editForm.experiences?.map((exp, idx) => (
                    <div key={idx} style={{ padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                        <span style={{ fontWeight: "700", color: "#ea580c" }}>Experience #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExperience(idx)}
                          style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: "700" }}
                        >
                          Delete
                        </button>
                      </div>

                      <div className="edit-form-grid">
                        <div className="edit-field-group">
                          <label>Role / Position</label>
                          <input
                            type="text"
                            value={exp.role || ""}
                            onChange={(e) => handleUpdateExperience(idx, "role", e.target.value)}
                          />
                        </div>
                        <div className="edit-field-group">
                          <label>Company / Organization</label>
                          <input
                            type="text"
                            value={exp.company || ""}
                            onChange={(e) => handleUpdateExperience(idx, "company", e.target.value)}
                          />
                        </div>
                        <div className="edit-field-group">
                          <label>Duration</label>
                          <input
                            type="text"
                            value={exp.duration || ""}
                            onChange={(e) => handleUpdateExperience(idx, "duration", e.target.value)}
                            placeholder="e.g. May 2024 - July 2024"
                          />
                        </div>
                        <div className="edit-field-group">
                          <label>Technologies Used</label>
                          <input
                            type="text"
                            value={Array.isArray(exp.technologies) ? exp.technologies.join(", ") : exp.technologies || ""}
                            onChange={(e) => handleUpdateExperience(idx, "technologies", e.target.value)}
                          />
                        </div>
                        <div className="edit-field-group" style={{ gridColumn: "1 / -1" }}>
                          <label>Contributions &amp; Description</label>
                          <textarea
                            rows={3}
                            value={exp.description || ""}
                            onChange={(e) => handleUpdateExperience(idx, "description", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 5: EDUCATION */}
              {editTab === "education" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleAddEducation}
                    style={{ alignSelf: "flex-start", padding: "8px 16px", background: "#ea580c" }}
                  >
                    ＋ Add Education Entry
                  </button>

                  {editForm.education?.map((edu, idx) => (
                    <div key={idx} style={{ padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                        <span style={{ fontWeight: "700", color: "#ea580c" }}>Education #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEducation(idx)}
                          style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: "700" }}
                        >
                          Delete
                        </button>
                      </div>

                      <div className="edit-form-grid">
                        <div className="edit-field-group">
                          <label>Degree / Qualification</label>
                          <input
                            type="text"
                            value={edu.degree || ""}
                            onChange={(e) => handleUpdateEducation(idx, "degree", e.target.value)}
                          />
                        </div>
                        <div className="edit-field-group">
                          <label>College / Institution</label>
                          <input
                            type="text"
                            value={edu.institution || ""}
                            onChange={(e) => handleUpdateEducation(idx, "institution", e.target.value)}
                          />
                        </div>
                        <div className="edit-field-group">
                          <label>Year / Duration</label>
                          <input
                            type="text"
                            value={edu.year || ""}
                            onChange={(e) => handleUpdateEducation(idx, "year", e.target.value)}
                          />
                        </div>
                        <div className="edit-field-group">
                          <label>CGPA / Percentage</label>
                          <input
                            type="text"
                            value={edu.score || ""}
                            onChange={(e) => handleUpdateEducation(idx, "score", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 6: CERTS & ACHIEVEMENTS */}
              {editTab === "certifications" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Certifications Block */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <strong style={{ fontSize: "14px", color: "#0f172a" }}>Certifications</strong>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={handleAddCertification}
                        style={{ fontSize: "11px", padding: "4px 10px" }}
                      >
                        ＋ Add Certification
                      </button>
                    </div>

                    {editForm.certifications?.map((c, idx) => (
                      <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                        <input
                          type="text"
                          value={c.name || ""}
                          placeholder="Certification name"
                          onChange={(e) => handleUpdateCertification(idx, "name", e.target.value)}
                          style={{ flex: 2, padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                        />
                        <input
                          type="text"
                          value={c.issuer || ""}
                          placeholder="Issuer (AWS, Oracle, etc.)"
                          onChange={(e) => handleUpdateCertification(idx, "issuer", e.target.value)}
                          style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                        />
                        <input
                          type="text"
                          value={c.date || ""}
                          placeholder="Year"
                          onChange={(e) => handleUpdateCertification(idx, "date", e.target.value)}
                          style={{ width: "80px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveCertification(idx)}
                          aria-label="Remove certification"
                          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "6px", padding: "8px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Achievements Block */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <strong style={{ fontSize: "14px", color: "#0f172a" }}>Achievements &amp; Honors</strong>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={handleAddAchievement}
                        style={{ fontSize: "11px", padding: "4px 10px" }}
                      >
                        ＋ Add Achievement
                      </button>
                    </div>

                    {editForm.achievements?.map((ach, idx) => (
                      <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                        <input
                          type="text"
                          value={ach}
                          onChange={(e) => handleUpdateAchievement(idx, e.target.value)}
                          style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveAchievement(idx)}
                          aria-label="Remove achievement"
                          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "6px", padding: "8px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="edit-modal-footer">
              <button type="button" className="secondary-button" onClick={handleCloseEdit}>
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleSaveEdit}
                style={{ background: "#ea580c", padding: "10px 24px" }}
              >
                Save &amp; Persist Corrections
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Resume;