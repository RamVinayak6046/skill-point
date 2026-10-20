/**
 * test-readiness.js
 * Comprehensive unit test suite for Skill Point readiness scoring logic.
 *
 * Verifies:
 * 1. Weights: 40% resume skill match, 30% assessment, 20% practical, 10% profile.
 * 2. Prevention of assessment double-counting (assessment score does not inflate skill match).
 * 3. Removal of duplicate resume credit in profile completeness.
 * 4. Distinction between unavailable inputs (not taken) and genuine zero scores.
 * 5. Provisional vs complete readiness states.
 * 6. Input validation and strict [0, 100] bounds clamping.
 * 7. Readiness delta comparison integrity.
 */

import { calculateReadiness, calculateProfileCompletion, compareReadiness, calculateLearningCompletion } from "./src/hooks/useReadiness.js";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  } else {
    console.log(`✓ PASS: ${message}`);
    passed++;
  }
}

console.log("==================================================");
console.log("SKILL POINT: READINESS SCORING LOGIC TEST SUITE");
console.log("==================================================\n");

// -----------------------------------------------------------------
// Test 1: Exact Formula Weights (40% / 30% / 20% / 10%)
// -----------------------------------------------------------------
console.log("--- Suite 1: Exact Mathematical Weight Verification ---");
{
  // Component 1 only: 100% skill match -> 40 points
  const r1 = calculateReadiness({
    skillGaps: [{ name: "Java", resumeScore: 100, required: 100 }],
    assessment: { score: 0, completed: true },
    assignmentStats: { completed: 0, total: 5 },
    profileStats: { profileCompletion: 0 },
  });
  assert(r1.overall === 40, `Skill match (100%) contributes exactly 40 points (actual: ${r1.overall})`);
  assert(r1.breakdown.skillMatch.weighted === 40, `Skill match weighted is 40`);

  // Component 2 only: 100% assessment -> 30 points
  const r2 = calculateReadiness({
    skillGaps: [{ name: "Java", resumeScore: 0, required: 100 }],
    assessment: { score: 100, completed: true },
    assignmentStats: { completed: 0, total: 5 },
    profileStats: { profileCompletion: 0 },
  });
  assert(r2.overall === 30, `Assessment (100%) contributes exactly 30 points (actual: ${r2.overall})`);
  assert(r2.breakdown.assessment.weighted === 30, `Assessment weighted is 30`);

  // Component 3 only: 100% practical -> 20 points
  const r3 = calculateReadiness({
    skillGaps: [{ name: "Java", resumeScore: 0, required: 100 }],
    assessment: { score: 0, completed: true },
    assignmentStats: { completed: 5, total: 5 },
    profileStats: { profileCompletion: 0 },
  });
  assert(r3.overall === 20, `Practical (100%) contributes exactly 20 points (actual: ${r3.overall})`);
  assert(r3.breakdown.practical.weighted === 20, `Practical weighted is 20`);

  // Component 4 only: 100% profile -> 10 points
  const r4 = calculateReadiness({
    skillGaps: [{ name: "Java", resumeScore: 0, required: 100 }],
    assessment: { score: 0, completed: true },
    assignmentStats: { completed: 0, total: 5 },
    profileStats: { profileCompletion: 100 },
  });
  assert(r4.overall === 10, `Profile (100%) contributes exactly 10 points (actual: ${r4.overall})`);
  assert(r4.breakdown.profile.weighted === 10, `Profile weighted is 10`);

  // Combined: 40 + 30 + 20 + 10 = 100
  const rFull = calculateReadiness({
    skillGaps: [{ name: "Java", resumeScore: 100, required: 100 }],
    assessment: { score: 100, completed: true },
    assignmentStats: { completed: 5, total: 5 },
    profileStats: { profileCompletion: 100 },
  });
  assert(rFull.overall === 100, `Full scores sum up to 100 (actual: ${rFull.overall})`);
}

// -----------------------------------------------------------------
// Test 2: Double-Counting Prevention
// -----------------------------------------------------------------
console.log("\n--- Suite 2: Prevention of Assessment Double-Counting ---");
{
  // Skill match should be based on resumeScore (50%), not boosted current score (100%)
  const skillGaps = [
    {
      name: "Java",
      resumeScore: 50,    // Pure resume evidence
      current: 100,       // Boosted by test score
      required: 100,
    },
    {
      name: "Spring Boot",
      resumeScore: 50,
      current: 100,
      required: 100,
    },
  ];

  const assessment = { score: 80, completed: true };

  const r = calculateReadiness({
    skillGaps,
    assessment,
    assignmentStats: { completed: 0, total: 2 },
    profileStats: { profileCompletion: 0 },
  });

  // Skill match score should be 50% (resume-based), NOT 100%
  assert(r.breakdown.skillMatch.score === 50, `Skill match is 50% from resume, not 100% from assessment (actual: ${r.breakdown.skillMatch.score}%)`);
  // Assessment is 80%
  assert(r.breakdown.assessment.score === 80, `Assessment score is 80% (actual: ${r.breakdown.assessment.score}%)`);
  // Overall: (50 * 0.4 = 20) + (80 * 0.3 = 24) = 44
  assert(r.overall === 44, `Overall score is 44 with zero double counting (actual: ${r.overall})`);
}

// -----------------------------------------------------------------
// Test 3: Profile Completeness Duplicate Credit Removal
// -----------------------------------------------------------------
console.log("\n--- Suite 3: Profile Completeness Resume Credit (No Duplication) ---");
{
  const fullProfile = {
    name: "Jane",
    email: "jane@example.com",
    phone: "1234567890",
    location: "City",
    college: "University",
    degree: "B.Tech",
    branch: "CS",
    graduation: "2024",
    cgpa: "9.0",
  };

  // With resume uploaded: 11 of 11 checks (10 fields + targetJob + resume)
  const pctWithResume = calculateProfileCompletion(fullProfile, true, "Engineer");
  assert(pctWithResume === 100, `Complete profile with resume = 100% (actual: ${pctWithResume}%)`);

  // Without resume: 10 of 11 checks = ~91% (resume is 1 out of 11, NOT 2 out of 12)
  const pctWithoutResume = calculateProfileCompletion(fullProfile, false, "Engineer");
  assert(pctWithoutResume === 91, `Complete profile without resume = 91% (1 check missing) (actual: ${pctWithoutResume}%)`);

  // Readiness profile component should directly use profileCompletion without secondary 40% resume addition
  const rProfile = calculateReadiness({
    skillGaps: [],
    assessment: null,
    assignmentStats: { completed: 0, total: 0 },
    profileStats: { profileCompletion: 70, resumeUploaded: true },
  });
  assert(rProfile.breakdown.profile.score === 70, `Profile score in readiness is exactly 70%, no duplicate multiplier (actual: ${rProfile.breakdown.profile.score}%)`);
  assert(rProfile.breakdown.profile.weighted === 7, `Profile weighted is 7 points (actual: ${rProfile.breakdown.profile.weighted})`);
}

// -----------------------------------------------------------------
// Test 4: Distinguish Unavailable Inputs from Genuine Zero Scores
// -----------------------------------------------------------------
console.log("\n--- Suite 4: Unavailable Inputs vs Genuine Zero Scores ---");
{
  // Case A: Assessment NOT TAKEN (assessment: null)
  const rUnassessed = calculateReadiness({
    skillGaps: [{ name: "Java", resumeScore: 80, required: 80 }],
    assessment: null,
    assignmentStats: { completed: 0, total: 2 },
    profileStats: { profileCompletion: 80 },
  });

  assert(rUnassessed.breakdown.assessment.isAvailable === false, `Assessment isAvailable is false when not taken`);
  assert(rUnassessed.breakdown.assessment.status === "not_taken", `Assessment status is "not_taken"`);
  assert(rUnassessed.isProvisional === true, `Readiness is provisional when assessment is not taken`);
  assert(rUnassessed.readinessType === "provisional", `Readiness type is "provisional"`);

  // Case B: Assessment COMPLETED with genuine ZERO score (0%)
  const rZeroScore = calculateReadiness({
    skillGaps: [{ name: "Java", resumeScore: 80, required: 80 }],
    assessment: { score: 0, completed: true },
    assignmentStats: { completed: 0, total: 2 },
    profileStats: { profileCompletion: 80 },
  });

  assert(rZeroScore.breakdown.assessment.isAvailable === true, `Assessment isAvailable is true when completed with 0%`);
  assert(rZeroScore.breakdown.assessment.score === 0, `Assessment score is 0%`);
  assert(rZeroScore.breakdown.assessment.status === "zero", `Assessment status is "zero" (genuine zero)`);
  assert(rZeroScore.isProvisional === false, `Readiness is complete (not provisional) when all evaluated`);
  assert(rZeroScore.readinessType === "complete", `Readiness type is "complete"`);

  // Case C: Practical assignments with 0 total (unavailable) vs 0 of 5 completed (genuine zero)
  const rNoAssignments = calculateReadiness({
    assignmentStats: { completed: 0, total: 0 },
  });
  assert(rNoAssignments.breakdown.practical.isAvailable === false, `Practical is unavailable when total is 0`);

  const rZeroAssignments = calculateReadiness({
    assignmentStats: { completed: 0, total: 5 },
  });
  assert(rZeroAssignments.breakdown.practical.isAvailable === true, `Practical is available when total > 0`);
  assert(rZeroAssignments.breakdown.practical.status === "zero", `Practical status is "zero" when 0 completed`);
}

// -----------------------------------------------------------------
// Test 5: Input Validation & Boundary Clamping [0, 100]
// -----------------------------------------------------------------
console.log("\n--- Suite 5: Input Validation & Boundary Clamping [0, 100] ---");
{
  const rOutlier = calculateReadiness({
    skillGaps: [{ name: "Java", resumeScore: 150, required: 100 }],
    assessment: { score: 999, completed: true },
    assignmentStats: { completed: 20, total: 10 },
    profileStats: { profileCompletion: 250 },
  });

  assert(rOutlier.breakdown.skillMatch.score <= 100, `Skill match clamped to <= 100 (${rOutlier.breakdown.skillMatch.score})`);
  assert(rOutlier.breakdown.assessment.score <= 100, `Assessment clamped to <= 100 (${rOutlier.breakdown.assessment.score})`);
  assert(rOutlier.breakdown.practical.score <= 100, `Practical clamped to <= 100 (${rOutlier.breakdown.practical.score})`);
  assert(rOutlier.breakdown.profile.score <= 100, `Profile clamped to <= 100 (${rOutlier.breakdown.profile.score})`);
  assert(rOutlier.overall <= 100, `Overall clamped to <= 100 (${rOutlier.overall})`);

  const rNegative = calculateReadiness({
    skillGaps: [{ name: "Java", resumeScore: -50, required: 100 }],
    assessment: { score: -20, completed: true },
    assignmentStats: { completed: -2, total: 10 },
    profileStats: { profileCompletion: -100 },
  });

  assert(rNegative.breakdown.skillMatch.score >= 0, `Skill match clamped to >= 0 (${rNegative.breakdown.skillMatch.score})`);
  assert(rNegative.breakdown.assessment.score >= 0, `Assessment clamped to >= 0 (${rNegative.breakdown.assessment.score})`);
  assert(rNegative.breakdown.practical.score >= 0, `Practical clamped to >= 0 (${rNegative.breakdown.practical.score})`);
  assert(rNegative.breakdown.profile.score >= 0, `Profile clamped to >= 0 (${rNegative.breakdown.profile.score})`);
  assert(rNegative.overall >= 0, `Overall clamped to >= 0 (${rNegative.overall})`);

  const rNaN = calculateReadiness({
    skillGaps: [{ name: "Java", resumeScore: NaN, required: 0 }],
    assessment: { score: NaN, completed: true },
    assignmentStats: { completed: NaN, total: NaN },
    profileStats: { profileCompletion: NaN },
  });

  assert(!isNaN(rNaN.overall), `Overall handles NaN safely (is ${rNaN.overall})`);
  assert(!isNaN(rNaN.breakdown.skillMatch.score), `Skill match handles NaN safely`);
  assert(!isNaN(rNaN.breakdown.assessment.score), `Assessment handles NaN safely`);
}

// -----------------------------------------------------------------
// Test 6: Readiness Comparison & Backward Compatibility
// -----------------------------------------------------------------
console.log("\n--- Suite 6: Readiness Comparison & Backward Compatibility ---");
{
  const baseline = calculateReadiness({
    skillGaps: [{ name: "Java", resumeScore: 60, required: 80 }],
    assessment: null,
    assignmentStats: { completed: 1, total: 4 },
    profileStats: { profileCompletion: 70 },
  });

  const current = calculateReadiness({
    skillGaps: [{ name: "Java", resumeScore: 60, required: 80 }],
    assessment: { score: 80, completed: true },
    assignmentStats: { completed: 3, total: 4 },
    profileStats: { profileCompletion: 90 },
  });

  const comp = compareReadiness(current, baseline);
  assert(comp.hasPrevious === true, `Comparison detects previous baseline`);
  assert(comp.overallDelta > 0, `Comparison overallDelta is positive (${comp.overallDelta})`);
  assert(comp.isImproved === true, `Comparison isImproved is true`);
  assert(comp.components.assessment.current === 80, `Component comparison assessment current is 80`);
  assert(comp.components.assessment.previous === 0, `Component comparison assessment previous is 0`);
}

// -----------------------------------------------------------------
// Test 7: Learning Completion Metric Independence from Job Readiness
// -----------------------------------------------------------------
console.log("\n--- Suite 7: Learning Completion Metric Independence from Job Readiness ---");
{
  // 1. Math and boundary conditions
  assert(calculateLearningCompletion(0, 0) === 0, "Empty curriculum returns 0%");
  assert(calculateLearningCompletion(0, 10) === 0, "0 completed lessons returns 0%");
  assert(calculateLearningCompletion(5, 10) === 50, "5/10 completed lessons returns 50%");
  assert(calculateLearningCompletion(10, 10) === 100, "10/10 completed lessons returns 100%");
  assert(calculateLearningCompletion(12, 10) === 100, "Completed exceeding total clamps to 100%");
  assert(calculateLearningCompletion(-2, 10) === 0, "Negative completed lessons clamps to 0%");
  assert(calculateLearningCompletion(NaN, 10) === 0, "NaN completed lessons handled safely as 0%");
  assert(calculateLearningCompletion(5, NaN) === 0, "NaN total lessons handled safely as 0%");

  // 2. Strict separation: 100% curriculum completion does NOT equate to 100% Job Readiness
  // A student who completed all lessons but has 0% resume match, 0% assessment, 0% practical, 0% profile
  // must have 0% Job Readiness, proving the Progress circular gauge does not conflate the two.
  const zeroReadinessWithFullCurriculum = calculateReadiness({
    skillGaps: [{ name: "Java", resumeScore: 0, required: 100 }],
    assessment: { score: 0, completed: true },
    assignmentStats: { completed: 0, total: 5 },
    profileStats: { profileCompletion: 0 },
  });
  const curriculumProgress = calculateLearningCompletion(10, 10); // 100%

  assert(curriculumProgress === 100, "Curriculum completion is 100%");
  assert(zeroReadinessWithFullCurriculum.overall === 0, "Job Readiness remains 0% despite 100% curriculum completion");
  assert(zeroReadinessWithFullCurriculum.overall !== curriculumProgress, "Job Readiness and Learning Completion are distinct, independent metrics");
}

console.log("\n==================================================");
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log("==================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
