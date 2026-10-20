import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { calculateProfileCompletion } from "../../hooks/useReadiness";

function Profile() {
  const { profile, updateProfile, targetJob, resume, computeReadiness } = useApp();
  
  const [editing, setEditing] = useState(false);
  const [localProfile, setLocalProfile] = useState(profile);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    updateProfile(localProfile);
    setEditing(false);
  };

  const handleEditButton = () => {
    if (editing) {
      handleSave();
    } else {
      setLocalProfile(profile);
      setEditing(true);
    }
  };

  const completionPct = calculateProfileCompletion(
    profile,
    resume?.uploaded,
    targetJob,
  );

  const readiness = computeReadiness();
  const readinessScore = readiness?.overall ?? 0;

  return (
    <div className="profile-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <span className="eyebrow">Account</span>
          <h1>My Profile</h1>
          <p>Manage your personal information, academic credentials, and career trajectory.</p>
        </div>
        <button className="profile-edit-button" onClick={handleEditButton}>
          {editing ? "Save Profile" : "Edit Profile"}
        </button>
      </div>

      {/* PROFILE HERO */}
      <section className="job-card profile-hero">
        <div className="profile-avatar-large" style={{ background: "#ea580c", borderRadius: "8px" }}>
          {profile.name ? profile.name.charAt(0).toUpperCase() : "S"}
        </div>
        <div className="profile-identity">
          {editing ? (
            <input
              className="profile-name-input"
              name="name"
              value={localProfile.name || ""}
              onChange={handleChange}
              placeholder="Your Full Name"
            />
          ) : (
            <h2>{profile.name || "Student"}</h2>
          )}
          <p>
            {profile.college ? `${profile.college} · ` : ""}{profile.degree || "B.Tech"} in {profile.branch || "Computer Science & Engineering"}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
            <span className="profile-role" style={{ background: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa" }}>
              {profile.degree || "B.Tech"} · {profile.semester || "Student"}
            </span>
            {profile.rollNo && (
              <span className="profile-role" style={{ background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}>
                Roll No: {profile.rollNo}
              </span>
            )}
            {profile.cgpa && (
              <span className="profile-role" style={{ background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}>
                CGPA: {profile.cgpa}
              </span>
            )}
          </div>
        </div>
        <div className="profile-completion">
          <span style={{ color: "#64748b", fontWeight: "700" }}>PROFILE COMPLETION</span>
          <strong style={{ color: "#ea580c" }}>{completionPct}%</strong>
          <div className="completion-track">
            <div style={{ width: `${completionPct}%`, background: "#ea580c" }} />
          </div>
        </div>
      </section>

      {/* PERSONAL INFORMATION */}
      <section className="job-card profile-card">
        <div className="card-header">
          <div>
            <span className="eyebrow">PERSONAL INFORMATION</span>
            <h2>Contact & Identification</h2>
          </div>
        </div>
        <div className="profile-grid">
          <ProfileField
            label="Full Name"
            name="name"
            value={editing ? localProfile.name || "" : profile.name || ""}
            editing={editing}
            onChange={handleChange}
            placeholder="e.g. Siddharth V."
          />
          <ProfileField
            label="Institutional Email"
            name="email"
            value={editing ? localProfile.email || "" : profile.email || ""}
            editing={editing}
            onChange={handleChange}
            placeholder="e.g. rollno@student.edu"
          />
          <ProfileField
            label="Phone"
            name="phone"
            value={editing ? localProfile.phone || "" : profile.phone || ""}
            editing={editing}
            onChange={handleChange}
            placeholder="e.g. +91 98765 43210"
          />
          <ProfileField
            label="Location"
            name="location"
            value={editing ? localProfile.location || "" : profile.location || ""}
            editing={editing}
            onChange={handleChange}
            placeholder="e.g. Bangalore, India"
          />
        </div>
      </section>

      {/* ACADEMIC CREDENTIALS */}
      <section className="job-card profile-card">
        <div className="card-header">
          <div>
            <span className="eyebrow">ACADEMIC CREDENTIALS</span>
            <h2>University & Program Background</h2>
          </div>
        </div>
        <div className="profile-grid">
          <ProfileField
            label="College / Institute"
            name="college"
            value={editing ? localProfile.college || "" : profile.college || ""}
            editing={editing}
            onChange={handleChange}
            placeholder="e.g. National Institute of Technology"
          />
          <ProfileField
            label="Roll Number / Student ID"
            name="rollNo"
            value={editing ? localProfile.rollNo || "" : profile.rollNo || ""}
            editing={editing}
            onChange={handleChange}
            placeholder="e.g. 22BCSE1048"
          />
          <ProfileField
            label="Degree Program"
            name="degree"
            value={editing ? localProfile.degree || "" : profile.degree || ""}
            editing={editing}
            onChange={handleChange}
            placeholder="e.g. B.Tech"
          />
          <ProfileField
            label="Branch / Department"
            name="branch"
            value={editing ? localProfile.branch || "" : profile.branch || ""}
            editing={editing}
            onChange={handleChange}
            placeholder="e.g. Computer Science & Engineering"
          />
          <ProfileField
            label="Current Semester"
            name="semester"
            value={editing ? localProfile.semester || "" : profile.semester || ""}
            editing={editing}
            onChange={handleChange}
            placeholder="e.g. 6th Semester"
          />
          <ProfileField
            label="Cumulative CGPA"
            name="cgpa"
            value={editing ? localProfile.cgpa || "" : profile.cgpa || ""}
            editing={editing}
            onChange={handleChange}
            placeholder="e.g. 8.65 / 10"
          />
          <ProfileField
            label="Graduation / Passing Year"
            name="graduation"
            value={editing ? localProfile.graduation || "" : profile.graduation || ""}
            editing={editing}
            onChange={handleChange}
            placeholder="e.g. 2026"
          />
          <ProfileField
            label="Experience Level"
            name="experience"
            value={editing ? localProfile.experience || "" : profile.experience || ""}
            editing={editing}
            onChange={handleChange}
            placeholder="e.g. Fresher / Placement Batch 2026"
          />
        </div>
      </section>

      {/* PORTFOLIO & PROFILES */}
      <section className="job-card profile-card">
        <div className="card-header">
          <div>
            <span className="eyebrow">PORTFOLIO & ONLINE PROFILES</span>
            <h2>Coding & Professional Profiles</h2>
          </div>
        </div>
        <div className="profile-grid">
          <ProfileField
            label="GitHub Profile"
            name="github"
            value={editing ? localProfile.github || "" : profile.github || ""}
            editing={editing}
            onChange={handleChange}
            placeholder="https://github.com/your-username"
          />
          <ProfileField
            label="LinkedIn Profile"
            name="linkedin"
            value={editing ? localProfile.linkedin || "" : profile.linkedin || ""}
            editing={editing}
            onChange={handleChange}
            placeholder="https://linkedin.com/in/your-profile"
          />
        </div>
      </section>

      {/* CAREER */}
      <section className="job-card profile-card">
        <div className="card-header">
          <div>
            <span className="eyebrow">PLACEMENT TRAJECTORY</span>
            <h2>Diagnostic Benchmark Status</h2>
          </div>
        </div>
        <div className="profile-career-row">
          <div>
            <span className="career-label">ACADEMIC STATUS</span>
            <strong>{profile.experience || "Fresher / Placement Batch 2026"}</strong>
          </div>
          <div>
            <span className="career-label">CURRENT TARGET ROLE</span>
            <strong>{targetJob || "Backend Developer"}</strong>
          </div>
          <div>
            <span className="career-label">VERIFIED READINESS</span>
            <strong className="career-readiness">{readinessScore}%</strong>
          </div>
        </div>
      </section>

      {/* PROFILE CHECKLIST */}
      {completionPct < 100 && (
        <section className="profile-checklist">
          <div className="checklist-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 8 7 12 13 4" />
            </svg>
          </div>
          <div>
            <span className="eyebrow">PROFILE STATUS</span>
            <h2>Complete your profile credentials</h2>
            <p>
              Upload your resume, select a target engineering role, and complete technical diagnostics to maximize evaluation accuracy.
            </p>
          </div>
          <span className="checklist-progress">{completionPct}%</span>
        </section>
      )}
    </div>
  );
}

/* =========================================
   REUSABLE PROFILE FIELD
========================================= */

function ProfileField({ label, name, value, editing, onChange, placeholder = "" }) {
  const isUrl = typeof value === "string" && (value.startsWith("http://") || value.startsWith("https://"));

  return (
    <div className="profile-field">
      <label>{label}</label>
      {editing ? (
        <input name={name} value={value} onChange={onChange} placeholder={placeholder} />
      ) : isUrl ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#ea580c",
            textDecoration: "none",
            fontSize: "12px",
            fontWeight: "600",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          {value.replace(/^https?:\/\//, "")}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      ) : (
        <span style={{ fontSize: "13px", color: "#0f172a", fontWeight: "500" }}>
          {value || "Not provided"}
        </span>
      )}
    </div>
  );
}

export default Profile;