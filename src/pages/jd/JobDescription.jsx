import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { extractTextFromFile } from "../../services/resumeParserService";
import RoleBadgeGraphic from "../../components/graphics/RoleBadgeGraphic";

/* =====================================================================
   REALISTIC SAMPLE JOB DESCRIPTIONS FOR INSTANT TESTING
===================================================================== */
const SAMPLE_JDS = {
  google: {
    company: "Google",
    title: "Senior Backend Engineer - Cloud Platforms",
    text: `Job Title: Senior Backend Engineer - Cloud Platforms
Company: Google
Location: Bengaluru, India / Hybrid
Level: Mid-Senior Level

About Us:
Google is an engineering-driven company building planet-scale infrastructure used by billions. Our Cloud Platforms team is seeking an experienced Backend Engineer to architect next-generation distributed systems.

Responsibilities:
• Design, develop, test, deploy, and maintain large-scale distributed backend systems and microservices.
• Build low-latency, high-throughput RESTful and gRPC APIs powering enterprise cloud workflows.
• Collaborate with cross-functional engineering teams, product managers, and site reliability engineers.
• Optimize distributed databases, caching layers, and search indexing for maximum reliability and fault tolerance.
• Participate in architectural design reviews, write clean, maintainable code, and mentor junior engineers.
• Troubleshoot complex production issues across Kubernetes clusters and microservices infrastructure.

Basic Qualifications (Required):
• Bachelor's or Master's degree in Computer Science, Engineering, or equivalent practical experience.
• 4+ years of professional software development experience in backend engineering.
• Strong proficiency in Java, Go, or C++ with deep understanding of Object-Oriented Programming (OOP).
• Solid understanding of Data Structures, Algorithms (DSA), and System Design principles.
• Hands-on experience designing and integrating scalable REST APIs and microservice architectures.
• Strong knowledge of relational databases (PostgreSQL/MySQL) and SQL query optimization.
• Practical experience with containerization technologies including Docker and Kubernetes.

Preferred Qualifications (Nice to Have):
• Experience with cloud platforms (Google Cloud Platform / GCP or AWS).
• Familiarity with message brokers such as Apache Kafka or RabbitMQ.
• Exposure to CI/CD pipelines, automated testing (JUnit/Mockito), and TDD methodologies.
• Understanding of distributed consensus algorithms and NoSQL databases (Redis, MongoDB, Cassandra).`,
  },
  amazon: {
    company: "Amazon",
    title: "Full Stack Software Development Engineer (SDE-2)",
    text: `Job Title: Full Stack Software Development Engineer (SDE-2)
Company: Amazon
Location: Hyderabad, India
Experience: 3-5 years

Role Overview:
Amazon is looking for a versatile Full Stack Developer to build mission-critical merchant services applications. You will work across both client-side interfaces and scalable cloud backend systems.

Key Responsibilities:
• Build responsive, high-performance web applications using modern React and TypeScript frameworks.
• Develop robust server-side business logic and microservices using Java and Spring Boot.
• Implement scalable cloud architectures utilizing AWS services (S3, EC2, Lambda, DynamoDB).
• Ensure high code quality through automated unit testing, code reviews, and integration testing.
• Work in an agile development environment with continuous delivery and rapid iteration.
• Translate complex business requirements into intuitive user experiences and resilient technical designs.

Required Skills:
• B.Tech / B.E. in Computer Science or related engineering field.
• 3+ years of hands-on experience building full stack web applications.
• Strong command of React, JavaScript (ES6+), and TypeScript for frontend development.
• Deep experience with Java, Spring Boot, and REST API development for backend services.
• Solid background in SQL databases (PostgreSQL/MySQL) and schema design.
• Proven proficiency with Git version control and collaborative development workflows.

Preferred Qualifications:
• Experience with Amazon Web Services (AWS) infrastructure and serverless architecture.
• Familiarity with state management libraries (Redux / Context API) and modern styling (Tailwind CSS).
• Exposure to Docker containerization and CI/CD automation with GitHub Actions.
• Knowledge of GraphQL and NoSQL data stores like DynamoDB.`,
  },
  microsoft: {
    company: "Microsoft",
    title: "Software Engineer II - Azure Core Infrastructure",
    text: `Job Title: Software Engineer II - Azure Core Infrastructure
Company: Microsoft
Location: Redmond, WA / Remote Eligible
Experience: 2-4 Years

About the Role:
The Microsoft Azure Core team delivers foundational cloud services that power global enterprises. We are looking for a Software Engineer to develop resilient cloud infrastructure and deployment tooling.

What You Will Do:
• Architect, implement, and verify core cloud infrastructure services running at massive scale.
• Build automated deployment pipelines and operational telemetry tools using Python and C#.
• Collaborate with security teams to implement robust identity management, OAuth, and data encryption.
• Conduct performance profiling, monitor system latencies, and proactively remediate bottlenecks.
• Contribute to open-source developer tooling and internal architectural standards.

Minimum Requirements:
• 2+ years of software engineering experience with C#, Python, or modern C++.
• Strong foundation in Computer Science fundamentals: Algorithms, Data Structures, and Operating Systems.
• Practical experience with Microsoft Azure or major public cloud computing environments.
• Solid understanding of Linux environments, shell scripting, and container platforms (Docker).
• Proficiency with automated testing frameworks and Git version control.

Desired Skills:
• Hands-on experience with Kubernetes and infrastructure as code (Terraform).
• Exposure to Go language, microservices networking, and modern CI/CD automation.
• Knowledge of application observability, Prometheus, and distributed tracing.`,
  },
};

/* =====================================================================
   EDIT / CORRECTION MODAL COMPONENT
===================================================================== */
function EditJDModal({ jd, onClose, onSave }) {
  const [activeEditTab, setActiveEditTab] = useState("basic");
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(jd)));

  // Field addition inputs
  const [newReqSkill, setNewReqSkill] = useState("");
  const [newPrefSkill, setNewPrefSkill] = useState("");
  const [newTech, setNewTech] = useState("");
  const [newResp, setNewResp] = useState("");
  const [newComp, setNewComp] = useState("");

  const handleSave = (e) => {
    e.preventDefault();
    onSave(form);
  };

  // Skill Add / Remove
  const handleAddReqSkill = () => {
    if (!newReqSkill.trim()) return;
    const name = newReqSkill.trim();
    if (form.requiredSkills?.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    setForm((prev) => ({
      ...prev,
      requiredSkills: [
        ...(prev.requiredSkills || []),
        {
          id: name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
          name,
          category: "Skill",
          priority: "High",
          requiredScore: 80,
          mentions: 1,
          source: "Required",
        },
      ],
    }));
    setNewReqSkill("");
  };

  const handleRemoveReqSkill = (index) => {
    setForm((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((_, i) => i !== index),
    }));
  };

  const handleAddPrefSkill = () => {
    if (!newPrefSkill.trim()) return;
    const name = newPrefSkill.trim();
    if (form.preferredSkills?.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    setForm((prev) => ({
      ...prev,
      preferredSkills: [
        ...(prev.preferredSkills || []),
        {
          id: name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
          name,
          category: "Skill",
          priority: "Medium",
          requiredScore: 70,
          mentions: 1,
          source: "Preferred",
        },
      ],
    }));
    setNewPrefSkill("");
  };

  const handleRemovePrefSkill = (index) => {
    setForm((prev) => ({
      ...prev,
      preferredSkills: prev.preferredSkills.filter((_, i) => i !== index),
    }));
  };

  // Technologies Add / Remove
  const handleAddTech = () => {
    if (!newTech.trim()) return;
    const item = newTech.trim();
    if (form.technologiesList?.includes(item)) return;
    setForm((prev) => ({
      ...prev,
      technologiesList: [...(prev.technologiesList || []), item],
    }));
    setNewTech("");
  };

  const handleRemoveTech = (index) => {
    setForm((prev) => ({
      ...prev,
      technologiesList: prev.technologiesList.filter((_, i) => i !== index),
    }));
  };

  // Responsibilities Add / Edit / Remove
  const handleAddResp = () => {
    if (!newResp.trim()) return;
    setForm((prev) => ({
      ...prev,
      responsibilities: [...(prev.responsibilities || []), newResp.trim()],
    }));
    setNewResp("");
  };

  const handleRemoveResp = (index) => {
    setForm((prev) => ({
      ...prev,
      responsibilities: prev.responsibilities.filter((_, i) => i !== index),
    }));
  };

  // Competencies Add / Remove
  const handleAddComp = () => {
    if (!newComp.trim()) return;
    const item = newComp.trim();
    if (form.competencies?.some((c) => c.name.toLowerCase() === item.toLowerCase())) return;
    setForm((prev) => ({
      ...prev,
      competencies: [
        ...(prev.competencies || []),
        { id: item.toLowerCase().replace(/[^a-z0-9]/g, "_"), name: item, category: "Core", description: "Demonstrated competency." },
      ],
    }));
    setNewComp("");
  };

  const handleRemoveComp = (index) => {
    setForm((prev) => ({
      ...prev,
      competencies: prev.competencies.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: "680px" }}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">MODULE 2 · JD INTELLIGENCE</span>
            <h2>Edit Extracted Job Description</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: "8px", padding: "16px 26px 0", borderBottom: "1px solid #ede7df", flexWrap: "wrap" }}>
          {[
            { id: "basic", label: "Basic Info" },
            { id: "skills", label: "Skills & Tech" },
            { id: "responsibilities", label: "Responsibilities" },
            { id: "competencies", label: "Competencies" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveEditTab(tab.id)}
              style={{
                padding: "8px 14px",
                border: "none",
                borderBottom: activeEditTab === tab.id ? "2.5px solid #ea580c" : "2.5px solid transparent",
                background: "transparent",
                color: activeEditTab === tab.id ? "#ea580c" : "#64748b",
                fontWeight: activeEditTab === tab.id ? "700" : "500",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
            {/* TAB: BASIC INFO */}
            {activeEditTab === "basic" && (
              <>
                <div className="modal-field">
                  <label>Job Title <span className="req">*</span></label>
                  <input
                    type="text"
                    value={form.jobTitle || ""}
                    onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))}
                    required
                  />
                </div>

                <div className="modal-field">
                  <label>Company Name <span className="req">*</span></label>
                  <input
                    type="text"
                    value={form.company || form.companyName || ""}
                    onChange={(e) => setForm((p) => ({ ...p, company: e.target.value, companyName: e.target.value }))}
                    required
                  />
                </div>

                <div className="modal-field">
                  <label>Seniority Level</label>
                  <select
                    value={form.experienceRequirements?.level || "Entry Level"}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        experienceRequirements: { ...p.experienceRequirements, level: e.target.value },
                      }))
                    }
                  >
                    <option value="Internship">Internship</option>
                    <option value="Entry Level (0-2 Years)">Entry Level (0-2 Years)</option>
                    <option value="Associate / Junior (1-3 Years)">Associate / Junior (1-3 Years)</option>
                    <option value="Mid-Level (3-5 Years)">Mid-Level (3-5 Years)</option>
                    <option value="Senior Level (5+ Years)">Senior Level (5+ Years)</option>
                    <option value="Lead / Principal">Lead / Principal</option>
                  </select>
                </div>

                <div className="modal-field">
                  <label>Experience Text</label>
                  <input
                    type="text"
                    value={form.experienceRequirements?.text || ""}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        experienceRequirement: e.target.value,
                        experienceRequirements: { ...p.experienceRequirements, text: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="modal-field">
                  <label>Education / Degree Requirement</label>
                  <input
                    type="text"
                    value={form.experienceRequirements?.degree || ""}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        experienceRequirements: { ...p.experienceRequirements, degree: e.target.value },
                      }))
                    }
                  />
                </div>
              </>
            )}

            {/* TAB: SKILLS & TECH */}
            {activeEditTab === "skills" && (
              <>
                <div className="modal-field">
                  <label>Required Skills (Must-Have)</label>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input
                      type="text"
                      placeholder="Add required skill (e.g. Java, Docker)..."
                      value={newReqSkill}
                      onChange={(e) => setNewReqSkill(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddReqSkill())}
                    />
                    <button type="button" onClick={handleAddReqSkill} className="add-job-btn-inline">
                      + Add
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {form.requiredSkills?.map((skill, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          borderRadius: "16px",
                          background: "#fff7ed",
                          border: "1px solid #fed7aa",
                          fontSize: "11px",
                          color: "#ea580c",
                          fontWeight: "600",
                        }}
                      >
                        {skill.name} ({skill.requiredScore || 80}%)
                        <button
                          type="button"
                          onClick={() => handleRemoveReqSkill(idx)}
                          aria-label={`Remove ${skill.name}`}
                          style={{ border: "none", background: "transparent", color: "#ea580c", cursor: "pointer", padding: "0 2px", display: "inline-flex", alignItems: "center" }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="modal-field" style={{ marginTop: "14px" }}>
                  <label>Preferred Skills (Nice-to-Have)</label>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input
                      type="text"
                      placeholder="Add preferred skill (e.g. Kafka, AWS)..."
                      value={newPrefSkill}
                      onChange={(e) => setNewPrefSkill(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddPrefSkill())}
                    />
                    <button type="button" onClick={handleAddPrefSkill} className="add-job-btn-inline">
                      + Add
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {form.preferredSkills?.map((skill, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          borderRadius: "16px",
                          background: "#faf8f5",
                          border: "1px solid #ede7df",
                          fontSize: "11px",
                          color: "#6b5e4e",
                          fontWeight: "500",
                        }}
                      >
                        {skill.name}
                        <button
                          type="button"
                          onClick={() => handleRemovePrefSkill(idx)}
                          aria-label={`Remove ${skill.name}`}
                          style={{ border: "none", background: "transparent", color: "#8a7966", cursor: "pointer", padding: "0 2px", display: "inline-flex", alignItems: "center" }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="modal-field" style={{ marginTop: "14px" }}>
                  <label>Technologies & Tools</label>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input
                      type="text"
                      placeholder="Add tech/tool (e.g. Git, Kubernetes, Redis)..."
                      value={newTech}
                      onChange={(e) => setNewTech(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTech())}
                    />
                    <button type="button" onClick={handleAddTech} className="add-job-btn-inline">
                      + Add
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {form.technologiesList?.map((tech, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          borderRadius: "16px",
                          background: "#faf8f5",
                          border: "1px solid #e0d9d0",
                          fontSize: "11px",
                          color: "#1c1208",
                        }}
                      >
                        {tech}
                        <button
                          type="button"
                          onClick={() => handleRemoveTech(idx)}
                          aria-label={`Remove ${tech}`}
                          style={{ border: "none", background: "transparent", color: "#8a7966", cursor: "pointer", padding: "0 2px", display: "inline-flex", alignItems: "center" }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* TAB: RESPONSIBILITIES */}
            {activeEditTab === "responsibilities" && (
              <>
                <div className="modal-field">
                  <label>Key Responsibilities</label>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                    <textarea
                      rows={2}
                      placeholder="Add a new responsibility bullet point..."
                      value={newResp}
                      onChange={(e) => setNewResp(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleAddResp}
                      className="add-job-btn-inline"
                      style={{ alignSelf: "flex-end", height: "fit-content" }}
                    >
                      + Add
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {form.responsibilities?.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "10px",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          background: "#faf8f5",
                          border: "1px solid #ede7df",
                        }}
                      >
                        <span style={{ fontSize: "12px", color: "#1c1208", lineHeight: "1.5" }}>
                          • {item}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveResp(idx)}
                          style={{ border: "none", background: "transparent", color: "#dc2626", cursor: "pointer", fontSize: "12px", display: "inline-flex", alignItems: "center" }}
                          title="Delete responsibility"
                          aria-label="Delete responsibility"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* TAB: COMPETENCIES */}
            {activeEditTab === "competencies" && (
              <>
                <div className="modal-field">
                  <label>Core Engineering Competencies</label>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input
                      type="text"
                      placeholder="Add competency (e.g. System Design, Code Quality)..."
                      value={newComp}
                      onChange={(e) => setNewComp(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddComp())}
                    />
                    <button type="button" onClick={handleAddComp} className="add-job-btn-inline">
                      + Add
                    </button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {form.competencies?.map((comp, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          background: "#faf8f5",
                          border: "1px solid #ede7df",
                          fontSize: "12px",
                          color: "#1c1208",
                          fontWeight: "500",
                        }}
                      >
                        {comp.name}
                        <button
                          type="button"
                          onClick={() => handleRemoveComp(idx)}
                          aria-label={`Remove ${comp.name}`}
                          style={{ border: "none", background: "transparent", color: "#8a7966", cursor: "pointer", padding: "0 2px", display: "inline-flex", alignItems: "center" }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="modal-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-save">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =====================================================================
   MAIN JOB DESCRIPTION COMPONENT
===================================================================== */
function JobDescription() {
  const {
    activeJD,
    savedJDs,
    parseAndSaveJD,
    updateStructuredJD,
    selectSavedJD,
    deleteSavedJDById,
    setJDAsTargetJob,
    parsedResume,
  } = useApp();

  const navigate = useNavigate();

  // Mode and form states
  const [inputMode, setInputMode] = useState("paste"); // "paste" | "upload"
  const [pastedText, setPastedText] = useState("");
  const [companyOverride, setCompanyOverride] = useState("");
  const [titleOverride, setTitleOverride] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [dragging, setDragging] = useState(false);

  // Active view tab
  const [viewTab, setViewTab] = useState("structured"); // "structured" | "match" | "raw"

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);

  // Quick feedback toast
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  // Load sample JD
  const handleLoadSample = (sampleKey) => {
    const sample = SAMPLE_JDS[sampleKey];
    if (!sample) return;
    setInputMode("paste");
    setPastedText(sample.text);
    setCompanyOverride(sample.company);
    setTitleOverride(sample.title);
    setErrorMsg("");
    triggerToast(`Loaded real sample JD: ${sample.company} - ${sample.title}`);
  };

  // Process text extraction & structuring
  const processJDText = (text, meta = {}) => {
    if (!text || text.trim().length === 0) {
      setErrorMsg("The Job Description is empty. Please provide text or upload a valid document.");
      return;
    }

    if (text.trim().length < 30) {
      setErrorMsg("The content is too brief to analyze. Please provide a full Job Description with responsibilities and requirements.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg("");

    try {
      const structured = parseAndSaveJD(text, {
        companyName: companyOverride || meta.companyName || "",
        jobTitle: titleOverride || meta.jobTitle || "",
        fileName: meta.fileName || "",
      });

      triggerToast(`Job Description successfully structured for ${structured.company}!`);
      setPastedText("");
      setCompanyOverride("");
      setTitleOverride("");
    } catch (err) {
      setErrorMsg(`Failed to analyze Job Description: ${err?.message || "Unknown parsing error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // File Upload Handler (PDF, DOCX, TXT)
  const handleFileUpload = async (file) => {
    if (!file) return;

    // File validation checks
    if (file.size === 0) {
      setErrorMsg("The selected file is empty (0 bytes). Please upload a valid document.");
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMsg(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
      return;
    }

    const name = file.name.toLowerCase();
    const isSupported = name.endsWith(".pdf") || name.endsWith(".docx") || name.endsWith(".txt") || name.endsWith(".md");
    if (!isSupported) {
      setErrorMsg(`Unsupported file format: "${file.name}". Please upload a PDF, DOCX, or TXT file.`);
      return;
    }

    setIsProcessing(true);
    setErrorMsg("");

    try {
      const extractedText = await extractTextFromFile(file);
      if (!extractedText || extractedText.trim().length < 30) {
        setErrorMsg("Could not extract readable text from this file. It may be a scanned image or protected document. Please paste the JD text directly instead.");
        return;
      }

      processJDText(extractedText, { fileName: file.name });
    } catch (err) {
      setErrorMsg(err?.message || "Unable to read file. Please ensure it is not corrupted and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handlePasteSubmit = (e) => {
    e.preventDefault();
    processJDText(pastedText);
  };

  const handleSaveModal = (updatedForm) => {
    updateStructuredJD(updatedForm);
    setIsEditing(false);
    triggerToast("Job Description corrections saved successfully!");
  };

  const handleSetTarget = () => {
    if (!activeJD) return;
    setJDAsTargetJob(activeJD);
    triggerToast(`"${activeJD.jobTitle}" set as active Target Job! Dashboard & diagnostics updated.`);
  };

  const handleCopySummary = () => {
    if (!activeJD) return;
    const summary = `
JOB INTELLIGENCE REPORT
Role: ${activeJD.jobTitle}
Company: ${activeJD.company}
Experience: ${activeJD.experienceRequirements?.text || activeJD.experienceRequirement}
Required Skills: ${activeJD.requiredSkills?.map((s) => s.name).join(", ") || "None"}
Preferred Skills: ${activeJD.preferredSkills?.map((s) => s.name).join(", ") || "None"}
Technologies: ${activeJD.technologiesList?.join(", ") || "None"}
Core Competencies: ${activeJD.competencies?.map((c) => c.name).join(", ") || "None"}
    `.trim();

    navigator.clipboard.writeText(summary);
    triggerToast("Structured summary copied to clipboard!");
  };

  return (
    <div className="job-page" style={{ maxWidth: "1280px", margin: "0 auto", padding: "30px 36px 60px" }}>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <span className="eyebrow">Job Intelligence</span>
          <h1>Job Description Intelligence</h1>
          <p>
            Parse, structure, and analyze technical job postings. Automatically extract mandatory vs preferred skills, tools, and requirements.
          </p>
        </div>

        <div className="page-header-actions" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {activeJD && (
            <button
              type="button"
              className="primary-button"
              onClick={handleSetTarget}
              style={{
                background: "#ea580c",
                color: "#ffffff",
                border: "none",
                padding: "9px 18px",
                borderRadius: "9px",
                fontSize: "12px",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              Set as Target Job
            </button>
          )}

          <div className="target-status">
            <span></span>
            ACTIVE MODULE
          </div>
        </div>
      </div>

      {/* FEEDBACK TOAST BANNER */}
      {toastMessage && (
        <div className="job-target-toast" style={{ marginBottom: "20px" }}>
          <div className="toast-left">
            <span className="toast-check" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 8 7 12 13 4" /></svg>
            </span>
            <div>
              <strong style={{ color: "#1c1208", fontSize: "13px" }}>{toastMessage}</strong>
              <span style={{ color: "#6b5e4e", fontSize: "11px" }}>Data synchronized to storage and Skill Point state.</span>
            </div>
          </div>
          {activeJD && (
            <button
              className="primary-button"
              onClick={() => navigate("/dashboard")}
              style={{ padding: "8px 16px", fontSize: "12px" }}
            >
              View in Dashboard →
            </button>
          )}
        </div>
      )}

      {/* ERROR BANNER */}
      {errorMsg && (
        <div
          style={{
            padding: "14px 18px",
            background: "rgba(220, 38, 38, 0.08)",
            border: "1.5px solid rgba(220, 38, 38, 0.25)",
            borderRadius: "12px",
            color: "#dc2626",
            fontSize: "13px",
            fontWeight: "600",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg("")}
            aria-label="Dismiss error"
            style={{ border: "none", background: "transparent", color: "#dc2626", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      )}

      {/* INPUT / INGESTION CARD */}
      <section
        className="job-card"
        style={{
          padding: "24px",
          background: "#ffffff",
          border: "1px solid #e0d9d0",
          borderRadius: "16px",
          marginBottom: "24px",
          boxShadow: "0 2px 10px rgba(28, 18, 8, 0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "17px", color: "#1c1208", margin: 0, fontWeight: "700" }}>
              Ingest Job Description
            </h2>
            <span style={{ fontSize: "12px", color: "#8a7966" }}>
              Upload a document (PDF, DOCX, TXT) or paste raw text from any job board.
            </span>
          </div>

          {/* Quick sample buttons for 1-click testing */}
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", color: "#8a7966", fontWeight: "600", marginRight: "4px" }}>
              Test Samples:
            </span>
            <button
              type="button"
              className="add-job-btn-inline"
              onClick={() => handleLoadSample("google")}
              style={{ fontSize: "11px", padding: "5px 10px" }}
            >
              Google SDE
            </button>
            <button
              type="button"
              className="add-job-btn-inline"
              onClick={() => handleLoadSample("amazon")}
              style={{ fontSize: "11px", padding: "5px 10px" }}
            >
              Amazon Full Stack
            </button>
            <button
              type="button"
              className="add-job-btn-inline"
              onClick={() => handleLoadSample("microsoft")}
              style={{ fontSize: "11px", padding: "5px 10px" }}
            >
              Microsoft Cloud
            </button>
          </div>
        </div>

        {/* Mode Switcher */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
          <button
            type="button"
            onClick={() => setInputMode("paste")}
            style={{
              padding: "9px 18px",
              borderRadius: "9px",
              border: inputMode === "paste" ? "1.5px solid #ea580c" : "1px solid #e2e8f0",
              background: inputMode === "paste" ? "#fff7ed" : "#ffffff",
              color: inputMode === "paste" ? "#ea580c" : "#475569",
              fontWeight: "700",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Paste Job Description
          </button>
          <button
            type="button"
            onClick={() => setInputMode("upload")}
            style={{
              padding: "9px 18px",
              borderRadius: "9px",
              border: inputMode === "upload" ? "1.5px solid #ea580c" : "1px solid #e2e8f0",
              background: inputMode === "upload" ? "#fff7ed" : "#ffffff",
              color: inputMode === "upload" ? "#ea580c" : "#475569",
              fontWeight: "700",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Upload Document (PDF, DOCX, TXT)
          </button>
        </div>

        {/* Optional Metadata Overrides */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
          <div className="modal-field" style={{ margin: 0 }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "#4a3728" }}>
              Company Name (Optional Override)
            </label>
            <input
              type="text"
              placeholder="e.g. Google, Amazon, Startup (or auto-detect)"
              value={companyOverride}
              onChange={(e) => setCompanyOverride(e.target.value)}
              style={{
                padding: "9px 12px",
                border: "1px solid #e0d9d0",
                borderRadius: "8px",
                background: "#faf8f5",
                fontSize: "12px",
              }}
            />
          </div>

          <div className="modal-field" style={{ margin: 0 }}>
            <label style={{ fontSize: "11px", fontWeight: "700", color: "#4a3728" }}>
              Job Title (Optional Override)
            </label>
            <input
              type="text"
              placeholder="e.g. Backend Developer, Cloud Architect (or auto-detect)"
              value={titleOverride}
              onChange={(e) => setTitleOverride(e.target.value)}
              style={{
                padding: "9px 12px",
                border: "1px solid #e0d9d0",
                borderRadius: "8px",
                background: "#faf8f5",
                fontSize: "12px",
              }}
            />
          </div>
        </div>

        {/* PASTE TAB */}
        {inputMode === "paste" && (
          <form onSubmit={handlePasteSubmit}>
            <div style={{ marginBottom: "14px" }}>
              <textarea
                rows={7}
                placeholder="Paste the complete job description text here, including requirements, qualifications, and responsibilities…"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "10px",
                  border: "1.5px solid #e0d9d0",
                  background: "#faf8f5",
                  fontFamily: "inherit",
                  fontSize: "13px",
                  color: "#1c1208",
                  resize: "vertical",
                  lineHeight: "1.6",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "11px", color: "#8a7966" }}>
                <span>Supports bullet points, qualification sections, and full enterprise job postings.</span>
                <span>{pastedText.length} characters</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing || !pastedText.trim()}
              style={{
                padding: "10px 22px",
                borderRadius: "9px",
                background: isProcessing || !pastedText.trim() ? "#e2e8f0" : "#ea580c",
                color: "#ffffff",
                border: "none",
                fontWeight: "700",
                fontSize: "13px",
                cursor: isProcessing || !pastedText.trim() ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {isProcessing ? "Analyzing & Structuring..." : "Extract & Structure JD →"}
            </button>
          </form>
        )}

        {/* UPLOAD TAB */}
        {inputMode === "upload" && (
          <div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              style={{
                padding: "36px 20px",
                border: dragging ? "2px dashed #ea580c" : "2px dashed #e2e8f0",
                borderRadius: "14px",
                background: dragging ? "#fff7ed" : "#f8fafc",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => document.getElementById("jd-file-input")?.click()}
            >
              <input
                id="jd-file-input"
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleInputChange}
                style={{ display: "none" }}
              />
              <div style={{ marginBottom: "8px", color: "#64748b" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <strong style={{ display: "block", fontSize: "15px", color: "#1c1208", marginBottom: "4px" }}>
                {dragging ? "Drop Job Description file here" : "Click to upload or drag & drop"}
              </strong>
              <span style={{ fontSize: "12px", color: "#8a7966", display: "block" }}>
                Supported formats: <strong>PDF</strong>, <strong>DOCX</strong> (Word), <strong>TXT</strong> (Max 10 MB)
              </span>
              <span style={{ fontSize: "11px", color: "#b5a899", marginTop: "6px", display: "block" }}>
                Multi-page PDF reading layer & XML docx extraction enabled.
              </span>
            </div>

            {isProcessing && (
              <div style={{ marginTop: "12px", textAlign: "center", color: "#ea580c", fontSize: "12px", fontWeight: "600" }}>
                Extracting and parsing text from document...
              </div>
            )}
          </div>
        )}
      </section>

      {/* SAVED JDs SELECTOR (IF MULTIPLE SAVED) */}
      {savedJDs && savedJDs.length > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 18px",
            background: "#ffffff",
            border: "1px solid #ede7df",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#8a7966" }}>
              SWITCH SAVED JD:
            </span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {savedJDs.map((sJd) => (
                <button
                  key={sJd.id}
                  type="button"
                  onClick={() => selectSavedJD(sJd.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "14px",
                    border: activeJD?.id === sJd.id ? "1.5px solid #ea580c" : "1px solid #e2e8f0",
                    background: activeJD?.id === sJd.id ? "#fff7ed" : "#ffffff",
                    color: activeJD?.id === sJd.id ? "#ea580c" : "#475569",
                    fontSize: "11px",
                    fontWeight: activeJD?.id === sJd.id ? "700" : "500",
                    cursor: "pointer",
                  }}
                >
                  {sJd.company}: {sJd.jobTitle}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (activeJD?.id) deleteSavedJDById(activeJD.id);
            }}
            style={{
              border: "none",
              background: "transparent",
              color: "#dc2626",
              fontSize: "11px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Delete Active JD
          </button>
        </div>
      )}

      {/* STRUCTURED JD DISPLAY SECTION */}
      {activeJD ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          {/* HEADER CARD */}
          <section className="job-card current-target-card" style={{ padding: "26px", margin: 0 }}>
            <div className="current-target-main">
              <RoleBadgeGraphic role={activeJD.jobTitle} size={56} />
              <div>
                <span className="eyebrow" style={{ color: "#ea580c", fontWeight: "700" }}>
                  STRUCTURED INTELLIGENCE
                </span>
                <h2 style={{ fontSize: "24px", color: "#0f172a", fontWeight: "800", margin: "4px 0 6px" }}>
                  {activeJD.jobTitle}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                  <span className="current-company-badge" style={{ fontSize: "12px", padding: "3px 10px" }}>
                    Company: {activeJD.company || activeJD.companyName}
                  </span>
                  <span style={{ fontSize: "11px", color: "#475569", background: "#f8fafc", padding: "3px 10px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                    Experience: {activeJD.experienceRequirements?.text || activeJD.experienceRequirement}
                  </span>
                  <span style={{ fontSize: "11px", color: "#64748b", background: "#f8fafc", padding: "3px 10px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                    {activeJD.wordCount} words analyzed
                  </span>
                </div>
                <div className="hover-matter-container">
                  <div className="hover-matter-inner">
                    <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>
                      {activeJD.experienceRequirements?.degree || "Technical degree qualification"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end", minWidth: "180px" }}>
              <button
                type="button"
                className="primary-button"
                onClick={() => setIsEditing(true)}
                style={{
                  padding: "9px 16px",
                  borderRadius: "8px",
                  background: "#ffffff",
                  color: "#0f172a",
                  border: "1.5px solid #e2e8f0",
                  fontSize: "12px",
                  fontWeight: "700",
                  width: "100%",
                  cursor: "pointer",
                }}
              >
                Edit / Correct Details
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={handleSetTarget}
                style={{
                  padding: "9px 16px",
                  borderRadius: "8px",
                  background: "#ea580c",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: "700",
                  width: "100%",
                  cursor: "pointer",
                }}
              >
                Set as Target Job
              </button>

              <button
                type="button"
                onClick={handleCopySummary}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: "transparent",
                  color: "#6b5e4e",
                  border: "none",
                  fontSize: "11px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Copy Summary
              </button>
            </div>
          </section>

          {/* METRIC SUMMARY STRIP */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >
            {[
              { label: "Required Skills", value: activeJD.requiredSkills?.length || 0, badge: "Must-Have", color: "#ea580c" },
              { label: "Preferred Skills", value: activeJD.preferredSkills?.length || 0, badge: "Bonus", color: "#d97706" },
              { label: "Technologies / Tools", value: activeJD.technologiesList?.length || 0, badge: "Stack", color: "#0284c7" },
              { label: "Responsibilities", value: activeJD.responsibilities?.length || 0, badge: "Scope", color: "#059669" },
              { label: "Core Competencies", value: activeJD.competencies?.length || 0, badge: "Pillars", color: "#7c3aed" },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  background: "#ffffff",
                  border: "1px solid #e0d9d0",
                  boxShadow: "0 1px 4px rgba(28, 18, 8, 0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", color: "#8a7966", fontWeight: "700" }}>{stat.label}</span>
                  <span
                    style={{
                      fontSize: "9px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "#faf8f5",
                      border: "1px solid #ede7df",
                      color: stat.color,
                      fontWeight: "700",
                    }}
                  >
                    {stat.badge}
                  </span>
                </div>
                <div style={{ fontSize: "24px", fontWeight: "800", color: "#1c1208" }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* VIEW NAVIGATION TABS */}
          <div style={{ display: "flex", gap: "8px", borderBottom: "1.5px solid #ede7df", paddingBottom: "2px" }}>
            <button
              type="button"
              onClick={() => setViewTab("structured")}
              style={{
                padding: "10px 18px",
                border: "none",
                borderBottom: viewTab === "structured" ? "3px solid #ea580c" : "3px solid transparent",
                background: "transparent",
                color: viewTab === "structured" ? "#ea580c" : "#475569",
                fontWeight: viewTab === "structured" ? "800" : "600",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Structured Intelligence Breakdown
            </button>

            <button
              type="button"
              onClick={() => setViewTab("match")}
              style={{
                padding: "10px 18px",
                border: "none",
                borderBottom: viewTab === "match" ? "3px solid #ea580c" : "3px solid transparent",
                background: "transparent",
                color: viewTab === "match" ? "#ea580c" : "#475569",
                fontWeight: viewTab === "match" ? "800" : "600",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Resume Compatibility & ATS Alignment
            </button>

            <button
              type="button"
              onClick={() => setViewTab("raw")}
              style={{
                padding: "10px 18px",
                border: "none",
                borderBottom: viewTab === "raw" ? "3px solid #ea580c" : "3px solid transparent",
                background: "transparent",
                color: viewTab === "raw" ? "#ea580c" : "#475569",
                fontWeight: viewTab === "raw" ? "800" : "600",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Raw Extracted Text
            </button>
          </div>

          {/* TAB 1: STRUCTURED INTELLIGENCE */}
          {viewTab === "structured" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* REQUIRED SKILLS CARD */}
              <div className="job-card" style={{ margin: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div>
                    <span className="eyebrow" style={{ color: "#ea580c" }}>MANDATORY BENCHMARKS</span>
                    <h3 style={{ fontSize: "16px", color: "#0f172a", margin: "2px 0 0", fontWeight: "700" }}>
                      Required Skills ({activeJD.requiredSkills?.length || 0})
                    </h3>
                  </div>
                  <span style={{ fontSize: "10px", padding: "2px 8px", background: "rgba(220, 38, 38, 0.08)", color: "#dc2626", borderRadius: "12px", fontWeight: "700" }}>
                    Must-Have
                  </span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {activeJD.requiredSkills?.length > 0 ? (
                    activeJD.requiredSkills.map((skill) => (
                      <div
                        key={skill.id || skill.name}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "10px",
                          background: "#fff7ed",
                          border: "1.5px solid #fed7aa",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <strong style={{ fontSize: "12px", color: "#1c1208" }}>{skill.name}</strong>
                        <span style={{ fontSize: "10px", color: "#ea580c", fontWeight: "700" }}>
                          Target: {skill.requiredScore || 80}%
                        </span>
                        <span style={{ fontSize: "9px", background: "#ffffff", padding: "1px 5px", borderRadius: "4px", color: "#8a7966", border: "1px solid #ede7df" }}>
                          {skill.category || "Skill"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: "12px", color: "#8a7966" }}>No mandatory skills extracted.</span>
                  )}
                </div>
              </div>

              {/* PREFERRED SKILLS CARD */}
              <div className="job-card" style={{ margin: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div>
                    <span className="eyebrow" style={{ color: "#d97706" }}>DESIRED QUALIFICATIONS</span>
                    <h3 style={{ fontSize: "16px", color: "#1c1208", margin: "2px 0 0", fontWeight: "700" }}>
                      Preferred Skills ({activeJD.preferredSkills?.length || 0})
                    </h3>
                  </div>
                  <span style={{ fontSize: "10px", padding: "2px 8px", background: "rgba(215, 119, 6, 0.08)", color: "#d97706", borderRadius: "12px", fontWeight: "700" }}>
                    Nice-to-Have
                  </span>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {activeJD.preferredSkills?.length > 0 ? (
                    activeJD.preferredSkills.map((skill) => (
                      <div
                        key={skill.id || skill.name}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "10px",
                          background: "#faf8f5",
                          border: "1.5px solid #ede7df",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <strong style={{ fontSize: "12px", color: "#1c1208" }}>{skill.name}</strong>
                        <span style={{ fontSize: "10px", color: "#8a7966" }}>
                          Bonus Benchmark: {skill.requiredScore || 70}%
                        </span>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: "12px", color: "#8a7966" }}>No secondary/preferred skills specified.</span>
                  )}
                </div>
              </div>

              {/* TECHNOLOGIES & TOOLS STACK CARD */}
              <div className="job-card" style={{ margin: 0 }}>
                <div style={{ marginBottom: "14px" }}>
                  <span className="eyebrow" style={{ color: "#0284c7" }}>TECHNICAL STACK</span>
                  <h3 style={{ fontSize: "16px", color: "#1c1208", margin: "2px 0 0", fontWeight: "700" }}>
                    Technologies & Tools ({activeJD.technologiesList?.length || 0})
                  </h3>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {activeJD.technologies?.languages?.length > 0 && (
                    <div>
                      <span style={{ fontSize: "10px", fontWeight: "700", color: "#8a7966", textTransform: "uppercase", letterSpacing: "1px" }}>
                        Languages
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                        {activeJD.technologies.languages.map((l) => (
                          <span key={l} className="category-pill" style={{ color: "#1c1208", fontWeight: "600" }}>
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeJD.technologies?.frameworks?.length > 0 && (
                    <div>
                      <span style={{ fontSize: "10px", fontWeight: "700", color: "#8a7966", textTransform: "uppercase", letterSpacing: "1px" }}>
                        Frameworks & Libraries
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                        {activeJD.technologies.frameworks.map((f) => (
                          <span key={f} className="category-pill" style={{ color: "#1c1208", fontWeight: "600" }}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeJD.technologies?.databases?.length > 0 && (
                    <div>
                      <span style={{ fontSize: "10px", fontWeight: "700", color: "#8a7966", textTransform: "uppercase", letterSpacing: "1px" }}>
                        Databases & Storage
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                        {activeJD.technologies.databases.map((d) => (
                          <span key={d} className="category-pill" style={{ color: "#1c1208", fontWeight: "600" }}>
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeJD.technologies?.cloudDevOps?.length > 0 && (
                    <div>
                      <span style={{ fontSize: "10px", fontWeight: "700", color: "#8a7966", textTransform: "uppercase", letterSpacing: "1px" }}>
                        Cloud & DevOps
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                        {activeJD.technologies.cloudDevOps.map((c) => (
                          <span key={c} className="category-pill" style={{ color: "#1c1208", fontWeight: "600" }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeJD.technologies?.tools?.length > 0 && (
                    <div>
                      <span style={{ fontSize: "10px", fontWeight: "700", color: "#8a7966", textTransform: "uppercase", letterSpacing: "1px" }}>
                        Tools & Platforms
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                        {activeJD.technologies.tools.map((t) => (
                          <span key={t} className="category-pill" style={{ color: "#1c1208", fontWeight: "600" }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CORE COMPETENCIES CARD */}
              <div className="job-card" style={{ margin: 0 }}>
                <div style={{ marginBottom: "14px" }}>
                  <span className="eyebrow" style={{ color: "#7c3aed" }}>EVALUATION PILLARS</span>
                  <h3 style={{ fontSize: "16px", color: "#1c1208", margin: "2px 0 0", fontWeight: "700" }}>
                    Core Engineering Competencies ({activeJD.competencies?.length || 0})
                  </h3>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {activeJD.competencies?.map((comp, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "#faf8f5",
                        border: "1px solid #ede7df",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                        <strong style={{ fontSize: "13px", color: "#1c1208" }}>{comp.name}</strong>
                        <span style={{ fontSize: "9px", padding: "1px 6px", borderRadius: "4px", background: "#ffffff", border: "1px solid #ede7df", color: "#8a7966" }}>
                          {comp.category || "Engineering"}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "11px", color: "#6b5e4e", lineHeight: "1.4" }}>
                        {comp.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* RESPONSIBILITIES & SCOPE CARD (FULL WIDTH) */}
              <div className="job-card" style={{ gridColumn: "1 / -1", margin: 0 }}>
                <div style={{ marginBottom: "14px" }}>
                  <span className="eyebrow" style={{ color: "#059669" }}>DAILY RESPONSIBILITIES & IMPACT</span>
                  <h3 style={{ fontSize: "16px", color: "#1c1208", margin: "2px 0 0", fontWeight: "700" }}>
                    Role Responsibilities & Deliverables ({activeJD.responsibilities?.length || 0})
                  </h3>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {activeJD.responsibilities?.map((resp, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        background: "#faf8f5",
                        border: "1px solid #ede7df",
                      }}
                    >
                      <span
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          background: "rgba(5, 150, 105, 0.12)",
                          color: "#059669",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          fontWeight: "800",
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 8 7 12 13 4" /></svg>
                      </span>
                      <p style={{ margin: 0, fontSize: "12px", color: "#1c1208", lineHeight: "1.5" }}>
                        {resp}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATS RESUME MATCH */}
          {viewTab === "match" && (
            <div className="job-card" style={{ margin: 0, padding: "26px" }}>
              <div style={{ marginBottom: "20px" }}>
                <span className="eyebrow" style={{ color: "#ea580c" }}>ATS PARITY & READINESS</span>
                <h3 style={{ fontSize: "18px", color: "#0f172a", margin: "4px 0 0", fontWeight: "800" }}>
                  Resume Alignment with {activeJD.company}
                </h3>
              </div>

              {parsedResume ? (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "20px 24px",
                      background: "linear-gradient(135deg, #fff7ed, #ffffff)",
                      border: "1.5px solid #fed7aa",
                      borderRadius: "14px",
                      marginBottom: "24px",
                      gap: "20px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#ea580c", textTransform: "uppercase" }}>
                        ATS PREDICTION SCORE
                      </span>
                      <div style={{ fontSize: "36px", fontWeight: "900", color: "#1c1208", lineHeight: "1.1" }}>
                        {activeJD.matchResult?.predictionScore || 65}%
                      </div>
                      <span style={{ fontSize: "12px", color: "#6b5e4e" }}>
                        Readiness State: <strong>{activeJD.matchResult?.readinessStatus || "Developing Alignment"}</strong>
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "20px" }}>
                      <div style={{ textAlign: "center", padding: "10px 16px", background: "#ffffff", borderRadius: "10px", border: "1px solid #ede7df" }}>
                        <div style={{ fontSize: "20px", fontWeight: "800", color: "#059669" }}>
                          {activeJD.matchResult?.matchedCount || 0}
                        </div>
                        <span style={{ fontSize: "10px", color: "#8a7966", fontWeight: "700" }}>MATCHED SKILLS</span>
                      </div>

                      <div style={{ textAlign: "center", padding: "10px 16px", background: "#ffffff", borderRadius: "10px", border: "1px solid #ede7df" }}>
                        <div style={{ fontSize: "20px", fontWeight: "800", color: "#dc2626" }}>
                          {activeJD.matchResult?.missingSkills?.length || 0}
                        </div>
                        <span style={{ fontSize: "10px", color: "#8a7966", fontWeight: "700" }}>MISSING SKILLS</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {activeJD.matchResult?.recommendations?.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <h4 style={{ fontSize: "14px", color: "#1c1208", marginBottom: "10px" }}>
                        Tailoring Recommendations for {activeJD.company}:
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {activeJD.matchResult.recommendations.map((rec, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: "10px 14px",
                              borderRadius: "8px",
                              background: "#faf8f5",
                              border: "1px solid #ede7df",
                              fontSize: "12px",
                              color: "#4a3728",
                            }}
                          >
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ marginBottom: "10px", color: "#64748b" }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <h4 style={{ fontSize: "16px", color: "#1c1208", margin: "0 0 6px" }}>
                    No Resume Uploaded Yet
                  </h4>
                  <p style={{ fontSize: "13px", color: "#8a7966", maxWidth: "460px", margin: "0 auto 18px" }}>
                    Upload your resume in the Resume Intelligence module to unlock automatic ATS matching against {activeJD.company}'s requirements.
                  </p>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => navigate("/resume")}
                    style={{ padding: "9px 18px" }}
                  >
                    Go to Resume Intelligence →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RAW TEXT */}
          {viewTab === "raw" && (
            <div className="job-card" style={{ margin: 0, padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <span className="eyebrow">RAW JOB POSTING SOURCE</span>
                <button
                  type="button"
                  className="add-job-btn-inline"
                  onClick={() => {
                    navigator.clipboard.writeText(activeJD.rawText);
                    triggerToast("Raw text copied!");
                  }}
                  style={{ fontSize: "11px", padding: "4px 10px" }}
                >
                  Copy Text
                </button>
              </div>
              <pre
                style={{
                  background: "#faf8f5",
                  border: "1px solid #ede7df",
                  borderRadius: "10px",
                  padding: "16px",
                  fontSize: "12px",
                  color: "#1c1208",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                  fontFamily: "var(--font-mono, monospace)",
                  maxHeight: "500px",
                  overflowY: "auto",
                }}
              >
                {activeJD.rawText}
              </pre>
            </div>
          )}
        </div>
      ) : (
        /* EMPTY STATE WHEN NO JD PARSED */
        <div
          className="job-card"
          style={{
            textAlign: "center",
            padding: "50px 20px",
            background: "#ffffff",
            border: "1.5px dashed #e0d9d0",
            borderRadius: "16px",
          }}
        >
          <div style={{ marginBottom: "12px", color: "#64748b" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <h3 style={{ fontSize: "18px", color: "#1c1208", margin: "0 0 6px", fontWeight: "700" }}>
            No Job Description Analyzed Yet
          </h3>
          <p style={{ fontSize: "13px", color: "#8a7966", maxWidth: "520px", margin: "0 auto 20px", lineHeight: "1.6" }}>
            Paste text or upload a job posting file above, or test with one of our realistic sample JDs to extract structured technical requirements.
          </p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              type="button"
              className="primary-button"
              onClick={() => handleLoadSample("google")}
              style={{ padding: "9px 18px" }}
            >
              Test with Google SDE Sample
            </button>
            <button
              type="button"
              className="add-job-btn-inline"
              onClick={() => handleLoadSample("amazon")}
              style={{ padding: "9px 18px" }}
            >
              Test with Amazon Sample
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditing && activeJD && (
        <EditJDModal
          jd={activeJD}
          onClose={() => setIsEditing(false)}
          onSave={handleSaveModal}
        />
      )}
    </div>
  );
}

export default JobDescription;