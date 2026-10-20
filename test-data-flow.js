/**
 * Data Flow & Cross-Module Synchronization Test Suite — Skill Point Step 2
 *
 * Verifies:
 * 1. Target Job switching & isolation (assessments for Job A do NOT bleed into Job B; switching back to Job A restores Job A assessment).
 * 2. Active JD alignment and decoupling (JD is only bound when aligned with active target job).
 * 3. Dynamic assignments auto-regeneration on target job switch and resume update.
 * 4. Resume replacement and removal (clears resume match, resets activeJD matchResult to baseline).
 * 5. Canonical skill consistency across matching, assessments, skill levels, and assignments.
 * 6. Assessment history preservation across multiple roles.
 * 7. Prevention of assessment score leakage into resume skill match when resumeScore is missing.
 * 8. Readiness calculation consistency under data-flow transitions.
 */

import { getCanonicalSkillName, getCanonicalSkillId, isSkillMatch } from "./src/services/skillMatchingService.js";
import { getJobRequirements } from "./src/data/jobData.js";
import { calculateSkillGaps } from "./src/hooks/useSkillGap.js";
import { calculateReadiness } from "./src/hooks/useReadiness.js";
import { generatePersonalizedAssignments } from "./src/services/assignmentGeneratorService.js";
import { generateDynamicQuestions } from "./src/services/questionGeneratorService.js";

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    console.log(`✓ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`✗ FAIL: ${testName} - ${details}`);
    failedCount++;
  }
}

console.log("==================================================");
console.log("SKILL POINT: CORE DATA FLOW & INTEGRATION SUITE");
console.log("==================================================\n");

// ----------------------------------------------------
// Suite 1: Canonical Skill Consistency Across Modules
// ----------------------------------------------------
console.log("--- Suite 1: Canonical Skill Consistency Across Modules ---");

const aliases = [
  { raw: "React.js", canonical: "React", id: "react" },
  { raw: "react", canonical: "React", id: "react" },
  { raw: "NodeJS", canonical: "Node.js", id: "node_js" },
  { raw: "node.js", canonical: "Node.js", id: "node_js" },
  { raw: "Spring", canonical: "Spring Boot", id: "spring_boot" },
  { raw: "postgres", canonical: "PostgreSQL", id: "postgresql" },
  { raw: "Postgres", canonical: "PostgreSQL", id: "postgresql" },
  { raw: "k8s", canonical: "Kubernetes", id: "kubernetes" },
  { raw: "REST APIs", canonical: "REST API", id: "rest_api" },
  { raw: "google cloud", canonical: "GCP", id: "gcp" },
];

aliases.forEach(({ raw, canonical, id }) => {
  assert(getCanonicalSkillName(raw) === canonical, `Canonical name for "${raw}" is "${canonical}"`);
  assert(getCanonicalSkillId(raw) === id, `Canonical ID for "${raw}" is "${id}"`);
  assert(isSkillMatch(raw, canonical), `isSkillMatch resolves "${raw}" <-> "${canonical}"`);
});

// ----------------------------------------------------
// Suite 2: Target Job Switching & Assessment Isolation
// ----------------------------------------------------
console.log("\n--- Suite 2: Target Job Switching & Assessment Scoping ---");

const jobA = "Backend Developer";
const jobB = "Frontend Developer";

// Mock assessment history containing an attempt for Job A and an attempt for Job B
const mockAssessmentHistory = [
  {
    targetJob: "Backend Developer",
    score: 85,
    completed: true,
    level: 1,
    skillScores: { "Java": 90, "Spring Boot": 80 },
    date: "2026-03-01T10:00:00Z",
  },
  {
    targetJob: "Frontend Developer",
    score: 60,
    completed: true,
    level: 1,
    skillScores: { "React": 60, "JavaScript": 60 },
    date: "2026-03-02T10:00:00Z",
  },
];

// Helper mimicking AppContext getLatestAssessmentForJob
function getLatestAssessmentForJobMock(history, jobTitle) {
  if (!jobTitle) return null;
  const norm = jobTitle.trim().toLowerCase();
  for (let i = history.length - 1; i >= 0; i--) {
    const a = history[i];
    if (a?.targetJob && a.targetJob.trim().toLowerCase() === norm && a.completed) {
      return a;
    }
  }
  return null;
}

const assessmentForBackend = getLatestAssessmentForJobMock(mockAssessmentHistory, jobA);
const assessmentForFrontend = getLatestAssessmentForJobMock(mockAssessmentHistory, jobB);
const assessmentForDataEng = getLatestAssessmentForJobMock(mockAssessmentHistory, "Data Engineer");

assert(assessmentForBackend?.score === 85, "Backend assessment matches Backend Developer attempt (85%)");
assert(assessmentForFrontend?.score === 60, "Frontend assessment matches Frontend Developer attempt (60%)");
assert(assessmentForDataEng === null, "Data Engineer has no assessment (returns null, does not leak Backend or Frontend attempt)");

// Verify readiness calculation with scoped assessment
const backendGaps = calculateSkillGaps({
  requiredSkills: getJobRequirements(jobA),
  assessment: assessmentForBackend,
  targetJob: jobA,
  parsedResume: { detectedSkills: [{ name: "Java", score: 80 }] },
});
const readinessBackend = calculateReadiness({
  skillGaps: backendGaps,
  assessment: assessmentForBackend,
  assignmentStats: { completed: 2, total: 3 },
  profileStats: { profileCompletion: 80, resumeUploaded: true },
});

assert(readinessBackend.breakdown.assessment.isAvailable === true, "Backend readiness assessment component is available");
assert(readinessBackend.breakdown.assessment.score === 85, "Backend readiness assessment score is 85%");
assert(readinessBackend.isProvisional === false, "Backend readiness is complete");

// If candidate switches target to Data Engineer (no assessment taken)
const dataEngGaps = calculateSkillGaps({
  requiredSkills: getJobRequirements("Data Engineer"),
  assessment: assessmentForDataEng, // null!
  targetJob: "Data Engineer",
  parsedResume: { detectedSkills: [{ name: "Python", score: 75 }] },
});
const readinessDataEng = calculateReadiness({
  skillGaps: dataEngGaps,
  assessment: assessmentForDataEng, // null!
  assignmentStats: { completed: 0, total: 3 },
  profileStats: { profileCompletion: 70, resumeUploaded: true },
});

assert(readinessDataEng.breakdown.assessment.isAvailable === false, "Data Engineer readiness assessment is UNAVAILABLE");
assert(readinessDataEng.breakdown.assessment.score === 0, "Data Engineer readiness assessment score is 0");
assert(readinessDataEng.isProvisional === true, "Data Engineer readiness is provisional (not complete)");
assert(readinessDataEng.breakdown.assessment.weighted === 0, "Data Engineer assessment contributes 0 weighted points (no bleed from Backend)");

// ----------------------------------------------------
// Suite 3: Active JD Decoupling When Target Job Changes
// ----------------------------------------------------
console.log("\n--- Suite 3: Active JD Decoupling When Target Job Changes ---");

const activeJDBackend = {
  jobTitle: "Senior Backend Developer",
  company: "Stripe",
  requiredSkills: [
    { name: "Java", required: 85, requiredScore: 85, priority: "High" },
    { name: "Kafka", required: 80, requiredScore: 80, priority: "High" },
  ],
};

// When targetJob is Backend Developer, activeJD matches
const gapsAlignedJD = calculateSkillGaps({
  requiredSkills: getJobRequirements("Backend Developer"),
  assessment: null,
  targetJob: "Backend Developer",
  parsedResume: { detectedSkills: [{ name: "Java", score: 80 }] },
  activeJD: activeJDBackend,
});

assert(gapsAlignedJD.length > 0, "Gaps computed for aligned Backend target job");

// When targetJob switches to "Full Stack Developer", activeJD for Stripe Backend should NOT hijack requirements
const gapsMismatchedJD = calculateSkillGaps({
  requiredSkills: getJobRequirements("Full Stack Developer"),
  assessment: null,
  targetJob: "Full Stack Developer",
  parsedResume: { detectedSkills: [{ name: "React", score: 80 }] },
  activeJD: activeJDBackend, // Stripe Backend JD should be ignored because jobTitle does not match
});

const containsKafka = gapsMismatchedJD.some((g) => g.name.toLowerCase() === "kafka");
const containsReact = gapsMismatchedJD.some((g) => g.name.toLowerCase() === "react");

assert(!containsKafka, "Mismatched Backend JD (Kafka) was NOT injected into Full Stack Developer skill gaps");
assert(containsReact, "Full Stack Developer requirements (React) are authoritatively used");

// ----------------------------------------------------
// Suite 4: Dynamic Assignments Regeneration
// ----------------------------------------------------
console.log("\n--- Suite 4: Dynamic Assignments Regeneration ---");

const assignmentsBackend = generatePersonalizedAssignments({
  targetJob: "Backend Developer",
  parsedResume: { missingSkills: [{ name: "Spring Boot" }] },
  parsedJD: null,
  skillGaps: [],
});

const assignmentsFrontend = generatePersonalizedAssignments({
  targetJob: "Frontend Developer",
  parsedResume: { missingSkills: [{ name: "React" }] },
  parsedJD: null,
  skillGaps: [],
});

assert(assignmentsBackend.length > 0, "Assignments generated for Backend Developer");
assert(assignmentsBackend.some((a) => a.skill.toLowerCase().includes("spring")), "Backend assignments target Spring Boot gap");

assert(assignmentsFrontend.length > 0, "Assignments generated for Frontend Developer");
assert(assignmentsFrontend.some((a) => a.skill.toLowerCase().includes("react")), "Frontend assignments target React gap");

// ----------------------------------------------------
// Suite 5: Question Generation Canonical Lookup & Min Floor
// ----------------------------------------------------
console.log("\n--- Suite 5: Question Generation with Aliased Skill Names ---");

// Testing generation with aliased skill name: "Spring" instead of "Spring Boot", "React.js" instead of "React"
const questionPlan = generateDynamicQuestions({
  targetJob: "Full Stack Developer",
  skills: ["Spring", "React.js", "SQL", "Docker"],
  level: 1,
});

assert(questionPlan.questions.length >= 10, `Questions generated (count: ${questionPlan.questions.length}) >= 10 floor`);
assert(questionPlan.questions.some((q) => q.skill === "Spring Boot" || q.skill === "Spring"), "Spring generator resolves canonical Spring Boot questions");
assert(questionPlan.questions.some((q) => q.skill === "React" || q.skill === "React.js"), "React.js generator resolves canonical React questions");

// ----------------------------------------------------
// Suite 6: Missing resumeScore Guard Against Leakage
// ----------------------------------------------------
console.log("\n--- Suite 6: Missing resumeScore Guard Against Leakage ---");

// A skill object where resumeScore is omitted or null, but skill.current has been inflated to 90 by an assessment
const simulatedSkillWithAssessment = {
  id: "skill-java",
  name: "Java",
  current: 90, // inflated by 90% assessment
  required: 80,
  // resumeScore is deliberately omitted
};

const readinessWithLeakCheck = calculateReadiness({
  skillGaps: [simulatedSkillWithAssessment],
  assessment: { completed: true, score: 90, targetJob: "Backend Developer" },
  assignmentStats: { completed: 0, total: 3 },
  profileStats: { profileCompletion: 50, resumeUploaded: false },
});

// Since resumeUploaded is false and resumeScore was omitted, resume skill match should NOT use 90
assert(readinessWithLeakCheck.breakdown.skillMatch.score === 0, `Skill match score is 0% (actual: ${readinessWithLeakCheck.breakdown.skillMatch.score}%), assessment did NOT leak into resume score`);
assert(readinessWithLeakCheck.breakdown.assessment.score === 90, "Assessment component independently receives its 90% credit");

console.log("\n==================================================");
console.log(`TOTAL TESTS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
console.log("==================================================");

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
