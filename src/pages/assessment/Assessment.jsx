import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { getJobRequirements } from "../../data/jobData";
import CircularGauge from "../../components/graphics/CircularGauge";
import {
  generateDynamicQuestions,
  calculateAdaptiveQuestionPlan,
  generateAssessmentQuestionsAsync,
  submitLLMAssessmentAnswers,
} from "../../services/questionGeneratorService";
import { compareAssessmentAttempts } from "../../services/skillLevelService";

const LEVEL_DEFINITIONS = [
  {
    level: 1,
    title: "Fundamentals & Core Syntax",
    difficulty: "Beginner • Entry",
    description: "Evaluates language syntax, primitives, control structures, and fundamental definitions. Comprehensive breadth across all skills (25–30 questions).",
    time: "25 mins",
    minQuestions: 25,
    tag: "Level 1 • 25–30 Qs",
  },
  {
    level: 2,
    title: "Core Engineering & Architecture",
    difficulty: "Intermediate • Benchmark",
    description: "Evaluates API design, error handling, component lifecycle, transactions, and system architecture (20–25 questions).",
    time: "20 mins",
    minQuestions: 20,
    tag: "Level 2 • 20–25 Qs",
  },
  {
    level: 3,
    title: "1-to-1 Technical Interview & Production Scenarios",
    difficulty: "Advanced • Staff / Principal Interview",
    description: "Simulates an intense 1-to-1 Principal Architect interview. Tests deep concurrency race conditions, memory profiling, latency bottlenecks, and real production incidents (10–15 questions).",
    time: "15 mins",
    minQuestions: 10,
    tag: "Level 3 • 10–15 Qs (Interview)",
  },
];

function Assessment() {
  const {
    targetJob,
    activeJD,
    getSkillMatchingAnalysis,
    submitAssessment,
    latestAssessment,
    assessmentHistory,
    assessmentLevel,
    setAssessmentLevel,
    skillLevels,
  } = useApp();

  const navigate = useNavigate();

  /* STATES */
  const [started, setStarted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [tempScore, setTempScore] = useState(null);
  const [tempCorrect, setTempCorrect] = useState(null);
  const [tempSkillScores, setTempSkillScores] = useState({});
  const [showReview, setShowReview] = useState(false);
  const [previousAttemptData, setPreviousAttemptData] = useState(null);

  // Active question pool from dynamic generation session
  const questions = activeSession?.questions || [];

  // Retrieve Module 3 skill matching analysis if available
  const skillMatching = useMemo(() => {
    if (typeof getSkillMatchingAnalysis === "function") {
      try {
        return getSkillMatchingAnalysis();
      } catch (err) {
        console.warn("Could not retrieve skill matching analysis:", err);
      }
    }
    return null;
  }, [getSkillMatchingAnalysis]);

  // Active skills to evaluate
  const activeSkillsList = useMemo(() => {
    const jobReqs = getJobRequirements(targetJob) || [];
    const skillList = jobReqs.map((r) => r.name || r.id || r);

    if (activeJD?.requiredSkills && activeJD.requiredSkills.length > 0) {
      activeJD.requiredSkills.forEach((s) => {
        const sName = typeof s === "string" ? s : s.name;
        if (sName && !skillList.includes(sName)) {
          skillList.push(sName);
        }
      });
    }

    if (activeJD?.preferredSkills && activeJD.preferredSkills.length > 0) {
      activeJD.preferredSkills.forEach((s) => {
        const sName = typeof s === "string" ? s : s.name;
        if (sName && !skillList.includes(sName)) {
          skillList.push(sName);
        }
      });
    }

    return skillList.length > 0 ? skillList : ["Java", "Spring Boot", "REST API", "SQL", "Docker"];
  }, [targetJob, activeJD]);

  // Compute real-time preview plan for the currently selected level
  const currentLvl = assessmentLevel || 1;
  const previewPlan = useMemo(() => {
    return calculateAdaptiveQuestionPlan({
      skills: activeSkillsList,
      skillGaps: skillMatching?.allSkillsAnalysis || [],
      level: currentLvl,
      assessmentHistory,
      activeJD,
      skillLevels,
    });
  }, [activeSkillsList, skillMatching, currentLvl, assessmentHistory, activeJD, skillLevels]);

  /**
   * Generates dynamic questions for the specified level.
   * Invokes Cloudflare Workers AI for fresh LLM questions with seamless question-bank fallback.
   * Enforces a minimum of 10 questions per level.
   */
  const startAssessment = async (targetLvl) => {
    const lvl = targetLvl !== undefined ? targetLvl : (assessmentLevel || 1);
    if (targetLvl !== undefined && setAssessmentLevel) {
      setAssessmentLevel(targetLvl);
    }

    setIsGenerating(true);

    try {
      const session = await generateAssessmentQuestionsAsync({
        targetJob,
        skills: activeSkillsList,
        skillGaps: skillMatching?.allSkillsAnalysis || [],
        level: lvl,
        assessmentHistory,
        activeJD,
        skillLevels,
      });

      setActiveSession(session);
      setCurrentQuestion(0);
      setSelectedAnswers([]);
      setTempScore(null);
      setTempCorrect(null);
      setTempSkillScores({});
      setSubmitted(false);
      setShowReview(false);
      setStarted(true);
    } catch (err) {
      console.error("Error starting assessment:", err);
      // Fallback directly
      const fallback = generateDynamicQuestions({
        targetJob,
        skills: activeSkillsList,
        skillGaps: skillMatching?.allSkillsAnalysis || [],
        level: lvl,
        assessmentHistory,
        activeJD,
        skillLevels,
      });
      setActiveSession(fallback);
      setCurrentQuestion(0);
      setSelectedAnswers([]);
      setSubmitted(false);
      setStarted(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectAnswer = (index) => {
    const updatedAnswers = [...selectedAnswers];
    updatedAnswers[currentQuestion] = index;
    setSelectedAnswers(updatedAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateCorrectAnswers = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.answer) {
        correct++;
      }
    });
    return correct;
  };

  /**
   * Compute per-skill scores from selected answers.
   * score = (correct answers for that skill / total questions for that skill) * 100.
   */
  const calculateSkillScores = () => {
    const skillQuestions = {};
    questions.forEach((q, idx) => {
      const skillId = q.skillId;
      if (!skillId) return;
      if (!skillQuestions[skillId]) {
        skillQuestions[skillId] = { total: 0, correct: 0 };
      }
      skillQuestions[skillId].total += 1;
      if (selectedAnswers[idx] === q.answer) {
        skillQuestions[skillId].correct += 1;
      }
    });

    const scores = {};
    Object.entries(skillQuestions).forEach(([skill, { total, correct }]) => {
      scores[skill] = total > 0 ? Math.round((correct / total) * 100) : 0;
    });
    return scores;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let score = 0;
      let correctAnswers = 0;
      let skillScores = {};
      let finalQuestions = questions;

      if (activeSession?.source === "workers_ai_llm" && activeSession?.attemptId) {
        // Secure server-side verification using stored answer key in SESSIONS_KV
        const result = await submitLLMAssessmentAnswers({
          attemptId: activeSession.attemptId,
          attemptSecret: activeSession.attemptSecret,
          answers: selectedAnswers,
          endpoint: activeSession.submitEndpoint,
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to verify assessment on server.");
        }

        score = result.score;
        correctAnswers = result.correctAnswers;
        skillScores = result.skillScores || {};
        if (Array.isArray(result.reviewQuestions) && result.reviewQuestions.length > 0) {
          finalQuestions = result.reviewQuestions;
          setActiveSession((prev) => ({
            ...prev,
            questions: result.reviewQuestions,
          }));
        }
      } else {
        // Local procedural question bank evaluation
        correctAnswers = calculateCorrectAnswers();
        score = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
        skillScores = calculateSkillScores();
      }

      const currentLevelNum = activeSession?.level || assessmentLevel || 1;
      const currentLevelMeta = LEVEL_DEFINITIONS.find((l) => l.level === currentLevelNum) || LEVEL_DEFINITIONS[0];

      // Capture previous attempt prior to submission for comparative analytics
      const prevAttempt = latestAssessment || (assessmentHistory && assessmentHistory.length > 0 ? assessmentHistory[assessmentHistory.length - 1] : null);
      setPreviousAttemptData(prevAttempt);

      const assessmentResult = {
        targetJob: targetJob,
        level: currentLevelNum,
        levelName: currentLevelMeta.title,
        score: score,
        skillScores: skillScores,
        correctAnswers: correctAnswers,
        totalQuestions: finalQuestions.length,
        completed: true,
        date: new Date().toISOString(),
      };

      submitAssessment(assessmentResult);

      setTempScore(score);
      setTempCorrect(correctAnswers);
      setTempSkillScores(skillScores);
      setSubmitted(true);
    } catch (err) {
      console.error("Assessment submission error:", err);
      alert(`Submission Error: ${err.message || "Failed to verify answers"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const restartAssessment = () => {
    setStarted(false);
    setActiveSession(null);
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setSubmitted(false);
    setShowReview(false);
    setTempSkillScores({});
    setPreviousAttemptData(null);
  };

  /* =========================================================
     1. INTRO / DASHBOARD VIEW (NOT STARTED)
  ========================================================= */
  if (!started) {
    const currentSelectedLevel = LEVEL_DEFINITIONS.find((l) => l.level === (assessmentLevel || 1)) || LEVEL_DEFINITIONS[0];
    const hasPreviousBest = latestAssessment && latestAssessment.targetJob === targetJob && latestAssessment.score !== undefined;

    return (
      <div className="assessment-page">
        <div className="page-header">
          <div>
            <span className="assessment-engine-tag" style={{ marginBottom: "8px" }}>
              Diagnostic Hub
            </span>
            <h1>Diagnostic Assessments</h1>
            <p>
              Test your engineering proficiencies with dynamic, adaptive challenges aligned with your target role.
            </p>
          </div>
        </div>

        {/* 1. RECENT ASSESSMENT CARD (LATEST SCORE & TYPE TAKEN) */}
        {latestAssessment && latestAssessment.completed && (
          <section className="job-card recent-assessment-card">
            <div className="recent-assessment-badge-bar">
              <span className="assessment-engine-tag">Latest Result</span>
              <span className={`recent-assessment-tag ${latestAssessment.score >= 70 ? "" : "review"}`}>
                {latestAssessment.score >= 70 ? "Passed" : "Review Recommended"}
              </span>
            </div>

            <div className="recent-assessment-content">
              <div className="recent-assessment-gauge">
                <CircularGauge
                  value={latestAssessment.score}
                  size={108}
                  strokeWidth={9}
                  colorStart={latestAssessment.score >= 70 ? "#34d399" : "#f59e0b"}
                  colorEnd={latestAssessment.score >= 70 ? "#10b981" : "#ef4444"}
                  label="SCORE"
                />
              </div>

              <div className="recent-assessment-meta">
                <h2 className="recent-assessment-title">{latestAssessment.targetJob} Assessment</h2>

                <div className="recent-assessment-stats">
                  <div>
                    <span>SCORE</span>
                    <strong>{latestAssessment.score}%</strong>
                  </div>
                  <div>
                    <span>CORRECT</span>
                    <strong>{latestAssessment.correctAnswers} / {latestAssessment.totalQuestions}</strong>
                  </div>
                  <div>
                    <span>LEVEL</span>
                    <strong>Level {latestAssessment.level || 1}</strong>
                  </div>
                  <div>
                    <span>TAKEN ON</span>
                    <strong>
                      {latestAssessment.date
                        ? new Date(latestAssessment.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Recently"}
                    </strong>
                  </div>
                </div>

                {latestAssessment.skillScores && Object.keys(latestAssessment.skillScores).length > 0 && (
                  <div className="recent-skill-scores">
                    <span className="recent-skill-label">SKILL BREAKDOWN:</span>
                    <div className="recent-skill-pills">
                      {Object.entries(latestAssessment.skillScores).map(([skill, score]) => (
                        <span
                          key={skill}
                          className={`skill-score-pill ${score >= 70 ? "high" : score >= 40 ? "mid" : "low"}`}
                        >
                          {skill}: <strong>{score}%</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 2. PROCEDURAL ASSESSMENT LAUNCHER & LEVEL SELECTOR */}
        <section className="job-card assessment-intro assessment-intro-card">
          <div className="assessment-engine-header">
            <span className="assessment-engine-tag">Adaptive Engine</span>
            <h2 className="assessment-engine-title">{targetJob} Assessment</h2>
          </div>

          {/* LEVEL SELECTOR */}
          <div className="assessment-level-selector">
            <div className="level-selector-header">
              <span className="level-selector-title">Select Assessment Level:</span>
            </div>

            <div className="level-buttons-group" role="group" aria-label="Select Assessment Level">
              {LEVEL_DEFINITIONS.map((def) => {
                const isActive = (assessmentLevel || 1) === def.level;
                const isRecommended = previewPlan.recommendedLevel === def.level;
                return (
                  <button
                    key={def.level}
                    type="button"
                    className={`level-btn ${isActive ? "active" : ""}`}
                    onClick={() => setAssessmentLevel(def.level)}
                    aria-pressed={isActive}
                  >
                    <div className="level-btn-top">
                      <span className="level-btn-number">Level {def.level}</span>
                      {isRecommended && (
                        <span className="level-btn-recommended-badge">RECOMMENDED</span>
                      )}
                    </div>
                    <span className="level-btn-difficulty">
                      {def.difficulty.split("•")[0].trim()}
                    </span>
                    {isActive && <span className="level-btn-active-indicator" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            {(() => {
              const currentDef =
                LEVEL_DEFINITIONS.find((d) => d.level === (assessmentLevel || 1)) ||
                LEVEL_DEFINITIONS[0];
              return (
                <div className="active-level-banner">
                  <div className="active-level-banner-header">
                    <div>
                      <strong className="active-level-banner-title">
                        Level {currentDef.level}: {currentDef.title}
                      </strong>
                      <span className="active-level-banner-diff"> ({currentDef.difficulty})</span>
                    </div>
                    <span className="active-level-banner-meta">
                      {currentDef.level === 1 ? "25–30 Qs" : currentDef.level === 2 ? "20–25 Qs" : "10–15 Qs"} • {currentDef.time}
                    </span>
                  </div>
                  <p className="active-level-banner-desc">{currentDef.description}</p>
                </div>
              );
            })()}
          </div>



          <div className="assessment-details">
            <div>
              <span>QUESTIONS</span>
              <strong>{previewPlan.targetCount} Adaptive ({currentSelectedLevel.level === 1 ? "25–30" : currentSelectedLevel.level === 2 ? "20–25" : "10–15"})</strong>
            </div>
            <div>
              <span>ESTIMATED TIME</span>
              <strong>{currentSelectedLevel.time}</strong>
            </div>
            <div>
              <span>DIFFICULTY</span>
              <strong>{currentSelectedLevel.difficulty}</strong>
            </div>
            {hasPreviousBest && (
              <div>
                <span>PREV BEST</span>
                <strong>{latestAssessment.score}%</strong>
              </div>
            )}
          </div>

          <button
            className="primary-button assessment-start"
            disabled={isGenerating}
            onClick={() => startAssessment(assessmentLevel || 1)}
          >
            {isGenerating
              ? "Generating Questions..."
              : `Start Level ${assessmentLevel || 1}`}
          </button>
        </section>

        {/* 3. ASSESSMENT HISTORY BLOCK */}
        <section className="job-card assessment-history-card">
          <div className="history-card-header">
            <div className="history-header-left">
              <span className="assessment-engine-tag">Attempt Record</span>
              <h2 className="assessment-history-title">Assessment History</h2>
            </div>
            <span className="history-count-badge">
              {assessmentHistory.length} {assessmentHistory.length === 1 ? "attempt" : "attempts"}
            </span>
          </div>

          {assessmentHistory.length > 0 ? (
            <div className="history-table-container">
              <div className="history-table-header">
                <span>Assessment Type & Level</span>
                <span>Date & Time</span>
                <span>Accuracy</span>
                <span>Score</span>
                <span>Result</span>
              </div>
              <div className="history-list">
                {[...assessmentHistory].reverse().map((item, index) => {
                  const itemDate = item.date || item.timestamp;
                  const formattedDate = itemDate
                    ? new Date(itemDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Previous Attempt";
                  const isPassed = item.score >= 70;

                  return (
                    <div className="history-row" key={index}>
                      <div className="history-type">
                        <strong style={{ textTransform: "capitalize" }}>{item.targetJob} Assessment</strong>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
                          <small style={{ textTransform: "capitalize" }}>Role: {item.targetJob}</small>
                          <span className="history-level-badge">
                            {item.levelName ? `L${item.level || 1}: ${item.levelName}` : `Level ${item.level || 1}`}
                          </span>
                        </div>
                      </div>
                      <div className="history-date">
                        {formattedDate}
                      </div>
                      <div className="history-accuracy">
                        {item.correctAnswers ?? Math.round((item.score / 100) * (item.totalQuestions || 10))} / {item.totalQuestions || 10} questions
                      </div>
                      <div className="history-score">
                        <strong>{item.score}%</strong>
                      </div>
                      <div>
                        <span className={`history-status-pill ${isPassed ? "pass" : "review"}`}>
                          {isPassed ? "Passed" : "Needs Review"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="history-empty-state">
              <h3>No assessment history yet</h3>
              <p>Take your first assessment above to generate diagnostic evidence and track your history.</p>
            </div>
          )}
        </section>

        {/* 4. INFO GRID */}
        <section className="assessment-info-grid">
          <div className="job-card hover-matter-card">
            <span className="eyebrow">LEVEL PROGRESSION</span>
            <h3>Progressive Skill Validation</h3>
            <div className="hover-matter-container">
              <div className="hover-matter-inner">
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>
                  Start with Level 1 fundamentals, progress to Level 2 engineering architecture, and conquer Level 3 production scenarios.
                </p>
              </div>
            </div>
          </div>
          <div className="job-card hover-matter-card">
            <span className="eyebrow">READINESS IMPACT</span>
            <h3>Deterministic Scoring</h3>
            <div className="hover-matter-container">
              <div className="hover-matter-inner">
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>
                  Each completed assessment directly updates your Job Readiness score (30% weight) and per-skill competency matrix.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  /* =========================================================
     2. RESULT VIEW (SUBMITTED)
  ========================================================= */
  if (submitted) {
    const activeLevelNum = activeSession?.level || assessmentLevel || 1;
    const canAdvance = activeLevelNum < 3;

    const attemptComparison = compareAssessmentAttempts({
      currentAttempt: {
        score: tempScore,
        skillScores: tempSkillScores,
        level: activeLevelNum,
        targetJob,
      },
      previousAttempt: previousAttemptData,
      skillLevels,
    });

    const nextRecommendedLevel = tempScore >= 70 ? Math.min(activeLevelNum + 1, 3) : activeLevelNum;
    const nextLevelMeta = LEVEL_DEFINITIONS.find((l) => l.level === nextRecommendedLevel) || LEVEL_DEFINITIONS[0];
    const isRetake = nextRecommendedLevel === activeLevelNum && tempScore < 70;

    return (
      <div className="assessment-page">
        <div className="page-header">
          <div>
            <span className="eyebrow">DIAGNOSTIC RESULT • LEVEL {activeLevelNum}</span>
            <h1>Assessment Results & Reassessment Analysis</h1>
            <p>
              Verified technical proficiencies for <strong>{activeSession?.levelName || `Level ${activeLevelNum}`}</strong> against <strong>{targetJob}</strong> benchmarks.
            </p>
          </div>
        </div>

        {/* 1. HERO RESULT & COMPARISON CARD */}
        <section className="job-card result-card" style={{ display: "flex", alignItems: "center", gap: "32px", padding: "30px", marginBottom: "20px" }}>
          <CircularGauge
            value={tempScore}
            size={144}
            strokeWidth={10}
            label={tempScore >= 70 ? "PASSED" : "REVIEW"}
            colorStart={tempScore >= 70 ? "#34d399" : "#f59e0b"}
            colorEnd={tempScore >= 70 ? "#10b981" : "#ef4444"}
          />

          <div className="result-content" style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <span className="eyebrow">{activeSession?.levelName || `Level ${activeLevelNum} Assessment`}</span>
                <h2 style={{ margin: "4px 0 6px", fontSize: "22px", color: "#0f172a" }}>
                  {tempScore >= 70 ? "Benchmark Met: Verified Competency!" : "Skill Gaps Detected: Reassessment Recommended"}
                </h2>
                <p style={{ margin: "0 0 12px", color: "#475569", fontSize: "13px" }}>
                  Answered <strong>{tempCorrect}</strong> of <strong>{questions.length}</strong> questions correctly across <strong>{targetJob}</strong> skills.
                </p>
              </div>

              {/* REASSESSMENT SCORE COMPARISON BADGE */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  minWidth: "160px",
                }}
              >
                <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", letterSpacing: "1px" }}>
                  ATTEMPT COMPARISON
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px", margin: "4px 0" }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>
                    Prev: <strong>{attemptComparison?.hasPrevious ? `${attemptComparison.previousScore}%` : "None"}</strong>
                  </span>
                  <span style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                    → {tempScore}%
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background:
                      !attemptComparison?.hasPrevious
                        ? "#fff7ed"
                        : attemptComparison.scoreDelta > 0
                        ? "#f0fdf4"
                        : attemptComparison.scoreDelta < 0
                        ? "#fef2f2"
                        : "#f1f5f9",
                    color:
                      !attemptComparison?.hasPrevious
                        ? "#ea580c"
                        : attemptComparison.scoreDelta > 0
                        ? "#15803d"
                        : attemptComparison.scoreDelta < 0
                        ? "#b91c1c"
                        : "#64748b",
                    border:
                      !attemptComparison?.hasPrevious
                        ? "1px solid #fed7aa"
                        : attemptComparison.scoreDelta > 0
                        ? "1px solid #bbf7d0"
                        : attemptComparison.scoreDelta < 0
                        ? "1px solid #fecaca"
                        : "1px solid #e2e8f0",
                  }}
                >
                  {!attemptComparison?.hasPrevious
                    ? "Baseline Attempt"
                    : attemptComparison.scoreDelta > 0
                    ? `+${attemptComparison.scoreDelta}% Improved`
                    : attemptComparison.scoreDelta < 0
                    ? `${attemptComparison.scoreDelta}% Declined`
                    : "Score Maintained"}
                </span>
              </div>
            </div>

            {/* ADAPTIVE METRICS */}
            <div className="result-score-details" style={{ marginTop: "8px" }}>
              <div>
                <span>CORRECT</span>
                <strong>{tempCorrect}</strong>
              </div>
              <div>
                <span>QUESTIONS</span>
                <strong>{questions.length} Adaptive</strong>
              </div>
              <div>
                <span>LEVEL</span>
                <strong>Level {activeLevelNum}</strong>
              </div>
              <div>
                <span>BENCHMARK</span>
                <strong>{tempScore >= 70 ? "Pass (≥70%)" : "Review Required"}</strong>
              </div>
              <div>
                <span>ATTEMPT</span>
                <strong>#{assessmentHistory.length} Recorded</strong>
              </div>
            </div>

            {/* ACTION ROW */}
            <div className="result-actions" style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "16px" }}>
              <button
                className="primary-button"
                style={{ background: "#ea580c", padding: "10px 20px", fontSize: "13px", fontWeight: "700" }}
                onClick={() => startAssessment(nextRecommendedLevel)}
              >
                {isRetake
                  ? `Retake Level ${nextRecommendedLevel} (Fresh Dynamic Plan) →`
                  : `Take Next Assessment: Level ${nextRecommendedLevel} (${nextLevelMeta.title}) →`}
              </button>
              {canAdvance && activeLevelNum !== nextRecommendedLevel && (
                <button
                  className="secondary-button"
                  onClick={() => startAssessment(activeLevelNum + 1)}
                >
                  Advance to Level {activeLevelNum + 1} →
                </button>
              )}
              <button
                className="secondary-button"
                onClick={() => startAssessment(activeLevelNum)}
              >
                Retake Level {activeLevelNum}
              </button>
              <button
                className="secondary-button"
                onClick={() => navigate("/readiness")}
              >
                View Job Readiness
              </button>
              <button
                className="secondary-button"
                onClick={() => navigate("/skills")}
              >
                View Skill Gap Matrix
              </button>
            </div>
          </div>
        </section>

        {/* 2. SKILL-WISE CHANGES & REASSESSMENT TABLE */}
        {attemptComparison?.skillComparisons && attemptComparison.skillComparisons.length > 0 && (
          <section className="job-card" style={{ padding: "24px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
              <div>
                <span className="eyebrow" style={{ color: "#ea580c" }}>REASSESSMENT COMPETENCY DELTAS</span>
                <h3 style={{ margin: "4px 0 0", fontSize: "18px", color: "#1c1208" }}>
                  Skill-Wise Changes & Verified Progression
                </h3>
                <p className="delta-analysis-helper" style={{ margin: "4px 0 0", fontSize: "12px", color: "#8a7966" }}>
                  Comparison of tested competencies between previous attempt and current assessment.
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px", fontSize: "11px", fontWeight: "700" }}>
                <span style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(5, 150, 105, 0.1)", color: "#059669" }}>
                  {attemptComparison.summary.promotedCount} Promoted
                </span>
                <span style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(220, 38, 38, 0.1)", color: "#dc2626" }}>
                  {attemptComparison.summary.demotedCount} Review
                </span>
                <span style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(138, 121, 102, 0.1)", color: "#8a7966" }}>
                  {attemptComparison.summary.unchangedCount} Steady
                </span>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #ede7df", textAlign: "left", color: "#8a7966", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <th style={{ padding: "10px 12px" }}>Skill</th>
                    <th style={{ padding: "10px 12px" }}>Previous Score</th>
                    <th style={{ padding: "10px 12px" }}>Current Score</th>
                    <th style={{ padding: "10px 12px" }}>Change (+/-)</th>
                    <th style={{ padding: "10px 12px" }}>Competency Tier</th>
                    <th style={{ padding: "10px 12px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attemptComparison.skillComparisons.map((item) => {
                    const isPromoted = item.status === "promoted";
                    const isDemoted = item.status === "demoted";

                    return (
                      <tr key={item.skill} style={{ borderBottom: "1px solid #f5f2ee" }}>
                        <td style={{ padding: "12px", fontWeight: "700", color: "#1c1208" }}>
                          {item.skill}
                        </td>
                        <td style={{ padding: "12px", color: "#8a7966" }}>
                          {item.previousScore !== null ? `${item.previousScore}%` : "- (First Test)"}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <strong style={{ color: item.currentScore >= 70 ? "#059669" : item.currentScore >= 50 ? "#d97706" : "#dc2626" }}>
                            {item.currentScore}%
                          </strong>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "700",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              background:
                                item.delta === null
                                  ? "transparent"
                                  : item.delta > 0
                                  ? "rgba(5, 150, 105, 0.1)"
                                  : item.delta < 0
                                  ? "rgba(220, 38, 38, 0.1)"
                                  : "rgba(138, 121, 102, 0.1)",
                              color:
                                item.delta === null
                                  ? "#8a7966"
                                  : item.delta > 0
                                  ? "#059669"
                                  : item.delta < 0
                                  ? "#dc2626"
                                  : "#8a7966",
                            }}
                          >
                            {item.deltaFormatted}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "700",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              background:
                                item.currentLevel === "Advanced"
                                  ? "#ecfdf5"
                                  : item.currentLevel === "Intermediate"
                                  ? "#e0f2fe"
                                  : "#fffbeb",
                              color:
                                item.currentLevel === "Advanced"
                                  ? "#059669"
                                  : item.currentLevel === "Intermediate"
                                  ? "#0284c7"
                                  : "#d97706",
                              border: "1px solid #e0d9d0",
                            }}
                          >
                            {item.previousLevel && item.previousLevel !== item.currentLevel
                              ? `${item.previousLevel} → ${item.currentLevel}`
                              : item.currentLevel}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "700",
                              color: isPromoted ? "#059669" : isDemoted ? "#dc2626" : "#8a7966",
                            }}
                          >
                            {isPromoted ? "Promoted" : isDemoted ? "Demoted" : "Steady"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 3. PROMOTED / DEMOTED / UNCHANGED SKILLS BREAKDOWN */}
        <section className="job-card" style={{ padding: "24px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <span className="eyebrow" style={{ color: "#ea580c" }}>COMPETENCY TRANSITION MATRIX</span>
              <h3 style={{ margin: "4px 0 0", fontSize: "18px", color: "#1c1208" }}>
                Tier Progression: Promoted, Demoted & Steady Skills
              </h3>
            </div>
            <button
              type="button"
              className="text-button"
              style={{ fontSize: "12px", color: "#ea580c", fontWeight: "700" }}
              onClick={() => navigate("/skills")}
            >
              Inspect Matrix in Skill Gap →
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {/* PROMOTED */}
            <div style={{ padding: "16px", borderRadius: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <strong style={{ fontSize: "14px", color: "#166534" }}>Promoted Skills</strong>
                <span style={{ fontSize: "11px", fontWeight: "700", background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "12px" }}>
                  {attemptComparison?.promotedSkills?.length || 0}
                </span>
              </div>
              {attemptComparison?.promotedSkills && attemptComparison.promotedSkills.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {attemptComparison.promotedSkills.map((p) => (
                    <div key={p.skill} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", background: "#ffffff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #dcfce7" }}>
                      <strong>{p.skill}</strong>
                      <span style={{ color: "#15803d", fontWeight: "700" }}>
                        {p.previousLevel} → {p.currentLevel} ({p.currentScore}%)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "12px", color: "#166534", margin: 0 }}>
                  No tier promotions in this attempt. Keep practicing to elevate competencies.
                </p>
              )}
            </div>

            {/* DEMOTED / NEEDS REVIEW */}
            <div style={{ padding: "16px", borderRadius: "10px", background: "#fef2f2", border: "1px solid #fecaca" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <strong style={{ fontSize: "14px", color: "#991b1b" }}>Needs Review</strong>
                <span style={{ fontSize: "11px", fontWeight: "700", background: "#fee2e2", color: "#b91c1c", padding: "2px 8px", borderRadius: "12px" }}>
                  {attemptComparison?.demotedSkills?.length || 0}
                </span>
              </div>
              {attemptComparison?.demotedSkills && attemptComparison.demotedSkills.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {attemptComparison.demotedSkills.map((d) => (
                    <div key={d.skill} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", background: "#ffffff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #fecaca" }}>
                      <strong>{d.skill}</strong>
                      <span style={{ color: "#b91c1c", fontWeight: "700" }}>
                        {d.currentScore}% ({d.deltaFormatted})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "12px", color: "#991b1b", margin: 0 }}>
                  None! No competencies declined in this assessment attempt.
                </p>
              )}
            </div>

            {/* UNCHANGED */}
            <div style={{ padding: "16px", borderRadius: "10px", background: "#faf8f5", border: "1px solid #ede7df" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <strong style={{ fontSize: "14px", color: "#4a3728" }}>Unchanged Competencies</strong>
                <span style={{ fontSize: "11px", fontWeight: "700", background: "#ede7df", color: "#6b5e4e", padding: "2px 8px", borderRadius: "12px" }}>
                  {attemptComparison?.unchangedSkills?.length || 0}
                </span>
              </div>
              {attemptComparison?.unchangedSkills && attemptComparison.unchangedSkills.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {attemptComparison.unchangedSkills.slice(0, 4).map((u) => (
                    <div key={u.skill} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", background: "#ffffff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ede7df" }}>
                      <strong>{u.skill}</strong>
                      <span style={{ color: "#8a7966" }}>
                        {u.currentLevel} ({u.currentScore}%)
                      </span>
                    </div>
                  ))}
                  {attemptComparison.unchangedSkills.length > 4 && (
                    <span style={{ fontSize: "11px", color: "#8a7966", textAlign: "center" }}>
                      +{attemptComparison.unchangedSkills.length - 4} more maintained skills
                    </span>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: "12px", color: "#8a7966", margin: 0 }}>
                  All tested skills registered active score movements.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 4. RECOMMENDED NEXT ASSESSMENT ACTION CARD */}
        <section
          className="job-card"
          style={{
            padding: "24px",
            marginBottom: "20px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div>
            <span className="eyebrow" style={{ color: "#ea580c" }}>NEXT STEP RECOMMENDATION</span>
            <h3 style={{ margin: "4px 0 6px", fontSize: "19px", color: "#0f172a" }}>
              {isRetake
                ? `Solidify Foundations: Retake Level ${nextRecommendedLevel}`
                : `Recommended Next Step: Level ${nextRecommendedLevel} (${nextLevelMeta.title})`}
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#475569", maxWidth: "680px", lineHeight: "1.5" }}>
              {isRetake
                ? `Target your remaining weak skills with fresh dynamic questions at Level ${nextRecommendedLevel} to raise your score past the 70% benchmark.`
                : `Your verified score of ${tempScore}% qualifies you to advance to Level ${nextRecommendedLevel}. The procedural engine will adapt difficulty accordingly.`}
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            style={{ background: "#ea580c", padding: "12px 24px", fontSize: "14px", fontWeight: "700" }}
            onClick={() => startAssessment(nextRecommendedLevel)}
          >
            Take Next Assessment (Level {nextRecommendedLevel}) →
          </button>
        </section>

        {/* DETAILED QUESTION-BY-QUESTION REVIEW WITH TECHNICAL EXPLANATIONS */}
        <section className="job-card assessment-review-section">
          <button
            type="button"
            className="review-toggle-btn"
            onClick={() => setShowReview(!showReview)}
          >
            <span>Detailed Questions & Technical Explanations ({questions.length})</span>
            <span>{showReview ? "Hide Review" : "Expand Explanations"}</span>
          </button>

          {showReview && (
            <div className="review-list">
              {questions.map((q, qIndex) => {
                const userChoice = selectedAnswers[qIndex];
                const isCorrect = userChoice === q.answer;

                return (
                  <div className="review-question-card" key={qIndex}>
                    <div className="review-question-header">
                      <span className="review-skill-tag">
                        Question {qIndex + 1} • {q.skillId}
                      </span>
                      <span className={`review-status-tag ${isCorrect ? "correct" : "incorrect"}`}>
                        {isCorrect ? "Correct" : "Incorrect"}
                      </span>
                    </div>

                    <h4 className="review-question-title">{q.question}</h4>

                    <div className="review-options-container">
                      {q.options.map((opt, optIndex) => {
                        const isUserPick = userChoice === optIndex;
                        const isActualCorrect = q.answer === optIndex;

                        let optClass = "review-option-item";
                        if (isUserPick && isCorrect) optClass += " user-correct";
                        else if (isUserPick && !isCorrect) optClass += " user-wrong";
                        else if (isActualCorrect) optClass += " actual-correct";

                        return (
                          <div className={optClass} key={optIndex}>
                            <span style={{ fontWeight: 700, width: "24px" }}>
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <span style={{ flex: 1 }}>{opt}</span>
                            {isActualCorrect && <span style={{ color: "#16a34a", fontWeight: 700 }}>Correct Answer</span>}
                            {isUserPick && !isCorrect && <span style={{ color: "#dc2626", fontWeight: 700 }}>Your Choice</span>}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="review-explanation-box">
                        <strong>Technical Rationale:</strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* FOCUS RECOMMENDATIONS */}
        <section className="job-card recommendation-card" style={{ marginTop: "20px" }}>
          <span className="eyebrow">DEVELOPMENT FOCUS</span>
          <h3>Next Recommended Steps</h3>
          <div className="recommendation-list">
            <div className="recommendation-item hover-matter-card">
              <strong>{tempScore >= 70 ? "Proceed to Practical Assignments" : "Address Core Skill Deficits"}</strong>
              <div className="hover-matter-container">
                <div className="hover-matter-inner">
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>
                    {tempScore >= 70
                      ? "Your theoretical knowledge passed the benchmark. Reinforce it with hands-on development in the Assignments tab."
                      : "Review the question rationales above and complete the curated lessons in the Learning module to improve weak areas."}
                  </p>
                </div>
              </div>
            </div>
            <div className="recommendation-item hover-matter-card">
              <strong>Level Progression</strong>
              <div className="hover-matter-container">
                <div className="hover-matter-inner">
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>
                    {canAdvance
                      ? `You are ready to attempt Level ${activeLevelNum + 1} to test more advanced engineering scenarios and concurrency.`
                      : "You have completed Level 3 assessment! Re-take to test against different randomized questions anytime."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  /* =========================================================
     3. TEST IN-PROGRESS VIEW (STARTED & NOT SUBMITTED)
  ========================================================= */
  const question = questions[currentQuestion];
  const progress = Math.round(((currentQuestion + 1) / questions.length) * 100);
  const activeLevelNum = activeSession?.level || assessmentLevel || 1;

  if (!question) {
    return (
      <div className="assessment-page">
        <div className="job-card" style={{ padding: "40px", textAlign: "center" }}>
          <h2>Loading Questions...</h2>
          <button className="primary-button" onClick={restartAssessment} style={{ marginTop: "16px" }}>
            Return to Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="assessment-page">
      <div className="assessment-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", width: "100%" }}>
          <button
            type="button"
            className="secondary-button"
            style={{ padding: "6px 14px", fontSize: "12px" }}
            onClick={restartAssessment}
          >
            ← Exit Test
          </button>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {activeSession?.source === "workers_ai_llm" ? (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "rgba(234, 88, 12, 0.12)",
                  color: "#ea580c",
                  border: "1px solid rgba(234, 88, 12, 0.25)",
                }}
              >
                Workers AI ({activeSession?.model || "@cf/meta/llama-3.1-8b-instruct"})
              </span>
            ) : (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                }}
              >
                Curated Question Bank
              </span>
            )}
            <span className="history-level-badge" style={{ fontSize: "12px", padding: "4px 12px" }}>
              {activeSession?.levelName || `Level ${activeLevelNum}`}
            </span>
          </div>
        </div>

        <div className="assessment-progress-info">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          <span className="progress-pct-badge">{progress}% Completed</span>
        </div>
        <div className="assessment-progress-bar">
          <div style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <section className="job-card question-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          {question.skillId && (
            <span className="eyebrow" style={{ margin: 0 }}>
              {question.skillId.toUpperCase()}
            </span>
          )}
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
            {question.level === 3 ? "Advanced" : question.level === 2 ? "Intermediate" : "Fundamentals"}
          </span>
        </div>

        <h2 className="question-text">{question.question}</h2>

        <div className="options-list">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswers[currentQuestion] === index;
            return (
              <button
                type="button"
                key={index}
                className={`option-button ${isSelected ? "selected" : ""}`}
                onClick={() => selectAnswer(index)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                  <span className="option-text">{option}</span>
                </div>
                <span className={`option-check-indicator ${isSelected ? "checked" : ""}`}>
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 8 7 12 13 4" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="assessment-navigation">
        <button
          type="button"
          className="secondary-button"
          onClick={previousQuestion}
          disabled={currentQuestion === 0}
        >
          Previous
        </button>

        {currentQuestion < questions.length - 1 ? (
          <button
            type="button"
            className="primary-button"
            onClick={nextQuestion}
            disabled={selectedAnswers[currentQuestion] === undefined}
          >
            Next Question →
          </button>
        ) : (
          <button
            type="button"
            className="primary-button"
            style={{ background: "#ea580c" }}
            onClick={handleSubmit}
            disabled={isSubmitting || selectedAnswers[currentQuestion] === undefined}
          >
            {isSubmitting ? "Verifying Answers..." : "Submit Assessment"}
          </button>
        )}
      </div>
    </div>
  );
}

export default Assessment;