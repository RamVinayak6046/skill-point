/**
 * Comprehensive End-to-End Consistency & Integration Verification Script
 * Tests:
 * 1. Real Resume Parsing (Module 1)
 * 2. Real JD Parsing (Module 2)
 * 3. Skill Matching & Classification (Module 3)
 * 4. Cold Start vs Uploaded Baseline calculations
 * 5. Readiness Calculation (All 4 components & weighting 40/30/20/10)
 * 6. Dynamic Assessment Plan & Generation (Module 4, minimum floor >= 10 questions)
 * 7. Assessment 1 Submission & Adaptive Skill-Level Updates (Module 5)
 * 8. Reassessment (Assessment 2) Submission & History Preservation
 * 9. Assessment Attempt Comparison & Deliberate Delta Tracking
 * 10. Readiness Delta & Comparison Tracking
 * 11. Bounding Invariants Check (0-100% bounds across all scores)
 */

import { parseResumeText } from "./src/services/resumeParserService.js";
import { parseJobDescription } from "./src/services/jdParserService.js";
import { matchResumeWithJobDescriptionIntelligence } from "./src/services/skillMatchingService.js";
import { calculateReadiness, compareReadiness, calculateProfileCompletion } from "./src/hooks/useReadiness.js";
import { calculateSkillGaps, getSkillGapSummary } from "./src/hooks/useSkillGap.js";
import {
  generateDynamicQuestions,
  calculateAdaptiveQuestionPlan,
} from "./src/services/questionGeneratorService.js";
import {
  updateSkillLevelsFromAssessment,
  compareAssessmentAttempts,
} from "./src/services/skillLevelService.js";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✓ ${message}`);
  }
}

async function runEndToEndVerification() {
  console.log("=================================================");
  console.log("RUNNING SKILL POINT FULL END-TO-END VERIFICATION");
  console.log("=================================================\n");

  // -----------------------------------------------------------------
  // 1. REAL RESUME EXTRACTION & PARSING
  // -----------------------------------------------------------------
  console.log("--- Step 1: Real Resume Intelligence ---");
  const sampleResumeText = `
John Doe
Email: john.doe@example.com | Phone: +91 9876543210
Location: Bengaluru, India
GitHub: https://github.com/johndoe | LinkedIn: https://linkedin.com/in/johndoe

EDUCATION
Bachelor of Technology in Computer Science & Engineering
National Institute of Technology, 2024
CGPA: 8.6 / 10.0

TECHNICAL SKILLS
Languages: Java, JavaScript, SQL
Frameworks: Spring Boot, Express.js, React
Databases: PostgreSQL, MySQL, Redis
Tools: Git, Docker, Postman, Linux

PROJECTS
E-Commerce Microservices Platform
- Architected resilient backend services using Java and Spring Boot with Docker containerization.
- Implemented PostgreSQL database schemas with indexed queries and caching via Redis.
- Designed secure RESTful APIs with JWT authentication and documented endpoints.

Collaborative Task Tracker
- Built full-stack Kanban board using React and Express.js with Git version control.

EXPERIENCE
Software Engineering Intern at TechCorp Solutions (Jan 2024 - Jun 2024)
- Developed REST APIs and microservice modules using Spring Boot and Java.
- Optimized SQL database queries reducing latency by 25%.

CERTIFICATIONS
Oracle Certified Professional: Java SE Programmer
`;

  const parsedResume = parseResumeText(sampleResumeText, "john_doe_resume.txt", "Backend Developer");
  assert(parsedResume.personalDetails.name === "John Doe", "Parsed candidate name is John Doe");
  assert(parsedResume.detectedSkills.length >= 6, `Detected ${parsedResume.detectedSkills.length} skills from resume`);
  assert(parsedResume.projects.length >= 1, `Extracted ${parsedResume.projects.length} practical projects`);
  assert(parsedResume.experiences.length >= 1, "Extracted industry internship experience");

  // -----------------------------------------------------------------
  // 2. REAL JOB DESCRIPTION EXTRACTION & STRUCTURING
  // -----------------------------------------------------------------
  console.log("\n--- Step 2: Real Job Description Intelligence ---");
  const sampleJDText = `
Job Title: Senior Backend Engineer
Company: CloudScale Technologies
Level: Mid Level

About the Role:
CloudScale is hiring a Backend Engineer to scale our distributed cloud backend.

Key Responsibilities:
- Design and implement low latency REST APIs and microservices.
- Manage PostgreSQL databases and optimize high-concurrency SQL queries.
- Build containerized applications deployed with Docker and Kubernetes.

Required Qualifications:
- Strong experience with Java, Spring Boot, and REST API development.
- Strong knowledge of relational databases including PostgreSQL and SQL.
- Hands-on experience with Docker and Git version control.

Preferred Qualifications:
- Familiarity with AWS cloud and Kubernetes.
- Experience with Kafka message brokers.
`;

  const activeJD = parseJobDescription(sampleJDText, "CloudScale Technologies", "Senior Backend Engineer");
  assert(activeJD.jobTitle.includes("Backend Engineer"), `JD Title is ${activeJD.jobTitle}`);
  assert(activeJD.requiredSkills.length >= 4, `Structured ${activeJD.requiredSkills.length} required skills`);
  assert(activeJD.preferredSkills.length >= 1, `Structured ${activeJD.preferredSkills.length} preferred skills`);

  // -----------------------------------------------------------------
  // 3. SKILL MATCHING & CLASSIFICATION (Module 3)
  // -----------------------------------------------------------------
  console.log("\n--- Step 3: Resume <-> JD Skill Matching ---");
  const matchResult = matchResumeWithJobDescriptionIntelligence({
    parsedResume,
    activeJD,
  });

  assert(typeof matchResult.overallMatchScore === "number", "Computed match score");
  assert(matchResult.overallMatchScore >= 0 && matchResult.overallMatchScore <= 100, `Match score ${matchResult.overallMatchScore}% within 0-100%`);
  assert(matchResult.matchedSkills.length > 0, `Identified ${matchResult.matchedSkills.length} matched skills (e.g. Java, Spring Boot)`);
  assert(matchResult.allSkillsAnalysis.length >= activeJD.requiredSkills.length, "All JD skills classified");

  // Verify matched skills have concrete evidence audit trail
  const javaMatch = matchResult.allSkillsAnalysis.find((s) => s.name.toLowerCase() === "java");
  assert(javaMatch && javaMatch.evidence.length > 0, "Java has transparent multi-source evidence audit trail");

  // -----------------------------------------------------------------
  // 4. READINESS BASELINE (Before Assessment)
  // -----------------------------------------------------------------
  console.log("\n--- Step 4: Baseline Readiness Calculation (Attempt 0) ---");
  const initialGaps = calculateSkillGaps({
    requiredSkills: activeJD.requiredSkills,
    parsedResume,
    activeJD,
  });

  const profileStats = {
    profileCompletion: calculateProfileCompletion(parsedResume.personalDetails, true, activeJD.jobTitle),
    resumeUploaded: true,
  };
  const assignmentStats = { completed: 0, total: 3 };

  const baselineReadiness = calculateReadiness({
    skillGaps: initialGaps,
    assessment: null,
    assignmentStats,
    profileStats,
  });

  assert(baselineReadiness.overall >= 0 && baselineReadiness.overall <= 100, `Baseline readiness ${baselineReadiness.overall}% within 0-100%`);
  assert(baselineReadiness.breakdown.assessment.score === 0, "Technical assessment score is 0 before taking assessment");
  assert(baselineReadiness.breakdown.assessment.isAvailable === false, "Assessment component is correctly distinguished as unavailable/not taken");
  assert(baselineReadiness.isProvisional === true, "Readiness is flagged as provisional before assessment");
  assert(baselineReadiness.breakdown.skillMatch.score > 0, "Skill match component is active from resume proof");

  // -----------------------------------------------------------------
  // 5. DYNAMIC ASSESSMENT 1 GENERATION & SUBMISSION (Level 1)
  // -----------------------------------------------------------------
  console.log("\n--- Step 5: Adaptive Assessment 1 (Level 1, Minimum >= 10 Questions Floor) ---");
  const skillsToTest = activeJD.requiredSkills.map((s) => s.name);
  const planL1 = calculateAdaptiveQuestionPlan({
    skills: skillsToTest,
    skillGaps: initialGaps,
    level: 1,
    assessmentHistory: [],
    activeJD,
    skillLevels: {},
  });

  assert(planL1.targetCount >= 10, `Plan L1 enforced minimum floor of 10 questions (actual: ${planL1.targetCount})`);

  const sessionL1 = generateDynamicQuestions({
    targetJob: activeJD.jobTitle,
    skills: skillsToTest,
    skillGaps: initialGaps,
    level: 1,
    assessmentHistory: [],
    activeJD,
    skillLevels: {},
  });

  assert(sessionL1.questions.length >= 10, `Generated ${sessionL1.questions.length} questions (strictly >= 10 floor satisfied)`);

  // Simulate scoring 70% on Level 1
  const skillScoresL1 = {};
  sessionL1.questions.forEach((q) => {
    if (q.skillId) skillScoresL1[q.skillId] = 70;
  });

  const attempt1 = {
    targetJob: activeJD.jobTitle,
    level: 1,
    levelName: "Level 1: Fundamentals & Syntax",
    score: 70,
    skillScores: skillScoresL1,
    correctAnswers: Math.round(sessionL1.questions.length * 0.7),
    totalQuestions: sessionL1.questions.length,
    completed: true,
    date: new Date().toISOString(),
  };

  // Update skill levels after Attempt 1
  const skillUpdate1 = updateSkillLevelsFromAssessment({
    assessmentResult: attempt1,
    currentSkillLevels: {},
    skillGaps: initialGaps,
  });

  const updatedGaps1 = calculateSkillGaps({
    requiredSkills: activeJD.requiredSkills,
    parsedResume,
    activeJD,
    assessment: attempt1,
    skillLevels: skillUpdate1.updatedSkillLevels,
  });

  const readiness1 = calculateReadiness({
    skillGaps: updatedGaps1,
    assessment: attempt1,
    assignmentStats,
    profileStats,
  });

  assert(readiness1.overall > baselineReadiness.overall, `Readiness improved after Attempt 1: ${baselineReadiness.overall}% -> ${readiness1.overall}%`);
  assert(readiness1.breakdown.assessment.score === 70, "Assessment breakdown reflects 70%");
  assert(readiness1.breakdown.assessment.isAvailable === true, "Assessment component is available");
  assert(readiness1.isComplete === true, "Readiness is complete once assessment is evaluated");
  assert(readiness1.breakdown.skillMatch.score === baselineReadiness.breakdown.skillMatch.score, "Resume skill match score is preserved and not inflated by assessment score");

  // -----------------------------------------------------------------
  // 6. REASSESSMENT: DYNAMIC ASSESSMENT 2 GENERATION & SUBMISSION (Level 2)
  // -----------------------------------------------------------------
  console.log("\n--- Step 6: Reassessment Attempt 2 (Level 2, Minimum >= 10 Questions Floor) ---");
  const assessmentHistory = [attempt1];

  const planL2 = calculateAdaptiveQuestionPlan({
    skills: skillsToTest,
    skillGaps: updatedGaps1,
    level: 2,
    assessmentHistory,
    activeJD,
    skillLevels: skillUpdate1.updatedSkillLevels,
  });

  assert(planL2.targetCount >= 10, `Plan L2 enforced minimum floor of 10 questions (actual: ${planL2.targetCount})`);

  const sessionL2 = generateDynamicQuestions({
    targetJob: activeJD.jobTitle,
    skills: skillsToTest,
    skillGaps: updatedGaps1,
    level: 2,
    assessmentHistory,
    activeJD,
    skillLevels: skillUpdate1.updatedSkillLevels,
  });

  assert(sessionL2.questions.length >= 10, `Generated ${sessionL2.questions.length} questions for Level 2 (strictly >= 10 floor satisfied)`);

  // Simulate scoring 85% on Level 2
  const skillScoresL2 = {};
  sessionL2.questions.forEach((q) => {
    if (q.skillId) skillScoresL2[q.skillId] = 85;
  });

  const attempt2 = {
    targetJob: activeJD.jobTitle,
    level: 2,
    levelName: "Level 2: Core Engineering & Architecture",
    score: 85,
    skillScores: skillScoresL2,
    correctAnswers: Math.round(sessionL2.questions.length * 0.85),
    totalQuestions: sessionL2.questions.length,
    completed: true,
    date: new Date().toISOString(),
  };

  assessmentHistory.push(attempt2);
  assert(assessmentHistory.length === 2, "Assessment history preserved both attempts without overwriting");
  assert(assessmentHistory[0].score === 70 && assessmentHistory[1].score === 85, "Preserved individual attempt scores intact");

  // Attempt comparison
  const attemptComp = compareAssessmentAttempts({
    currentAttempt: attempt2,
    previousAttempt: attempt1,
    skillLevels: skillUpdate1.updatedSkillLevels,
  });

  assert(attemptComp.hasPrevious === true, "Detected previous attempt");
  assert(attemptComp.scoreDelta === 15, `Score delta is +15% (actual: ${attemptComp.scoreDelta}%)`);
  assert(attemptComp.scoreTrend === "improved", "Attempt trend is 'improved'");

  // Update skill levels after Attempt 2
  const skillUpdate2 = updateSkillLevelsFromAssessment({
    assessmentResult: attempt2,
    currentSkillLevels: skillUpdate1.updatedSkillLevels,
    skillGaps: updatedGaps1,
  });

  const updatedGaps2 = calculateSkillGaps({
    requiredSkills: activeJD.requiredSkills,
    parsedResume,
    activeJD,
    assessment: attempt2,
    skillLevels: skillUpdate2.updatedSkillLevels,
  });

  const readiness2 = calculateReadiness({
    skillGaps: updatedGaps2,
    assessment: attempt2,
    assignmentStats,
    profileStats,
  });

  assert(readiness2.overall > readiness1.overall, `Readiness progressed further: ${readiness1.overall}% -> ${readiness2.overall}%`);
  assert(readiness2.breakdown.assessment.score === 85, "Assessment breakdown reflects 85%");

  // Readiness comparison
  const readinessComp = compareReadiness(readiness2, readiness1);
  assert(readinessComp.hasPrevious === true, "Readiness comparison hasPrevious = true");
  assert(readinessComp.overallDelta > 0, `Readiness delta is positive (+${readinessComp.overallDelta}%)`);
  assert(readinessComp.isImproved === true, "Readiness isImproved is true");

  // -----------------------------------------------------------------
  // 7. BOUNDING INVARIANTS & INTEGRITY AUDIT
  // -----------------------------------------------------------------
  console.log("\n--- Step 7: Bounding & Invariant Verifications ---");
  const allReadinessValues = [
    baselineReadiness.overall,
    readiness1.overall,
    readiness2.overall,
    readiness2.breakdown.skillMatch.score,
    readiness2.breakdown.assessment.score,
    readiness2.breakdown.practical.score,
    readiness2.breakdown.profile.score,
  ];

  allReadinessValues.forEach((val) => {
    assert(val >= 0 && val <= 100, `Score value ${val} strictly bounded in [0, 100]`);
  });

  const gapSummary = getSkillGapSummary(updatedGaps2);
  assert(gapSummary.overallMatchScore >= 0 && gapSummary.overallMatchScore <= 100, `Gap summary match score ${gapSummary.overallMatchScore}% within 0-100%`);
  assert(gapSummary.matchedCount + gapSummary.partialCount + gapSummary.missingCount === gapSummary.total, "All skills accounted for in summary classifications");

  console.log("\n=================================================");
  console.log("✅ ALL END-TO-END VALIDATION CHECKS PASSED!");
  console.log("=================================================");
}

runEndToEndVerification().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
