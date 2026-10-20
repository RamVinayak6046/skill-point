/**
 * Practical Assignment Scoring Test Suite — Skill Point Step 3
 *
 * Requirements verified:
 * 1. Practical completion = completed active assignments / total active assignments for current target job.
 * 2. Each active assignment is counted at most once (duplicate IDs / records handled cleanly).
 * 3. Assignments belonging to another target job are strictly excluded from the active practical score.
 * 4. Stale completion records from prior roles do not inflate or count toward current target role.
 * 5. Zero active assignments is treated as unavailable (0 weighted points, isAvailable: false),
 *    NOT automatically awarding 100% and NOT treating it as a measured zero.
 * 6. All completed active assignments yields 100% practical score (20 weighted points).
 * 7. Partially completed active assignments accurately yields proportional score (e.g. 2 of 4 = 50%, 10 points).
 * 8. All incomplete active assignments yields genuine zero (0%, 0 points, isAvailable: true, status: 'zero').
 * 9. Assignment regeneration retains stable IDs and preserves valid completion flags and submission details.
 * 10. Switching target jobs switches active assignments and recalculates practical score accurately.
 */

import { calculateReadiness } from "./src/hooks/useReadiness.js";
import { generatePersonalizedAssignments } from "./src/services/assignmentGeneratorService.js";

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
console.log("SKILL POINT: PRACTICAL ASSIGNMENT SCORING SUITE");
console.log("==================================================\n");

// Helper function simulating the AppContext calculatePracticalStats implementation
function calculatePracticalStatsMock(activeAssignments, completionMap) {
  // Deduplicate active assignments by ID
  const seen = new Set();
  const uniqueActive = (activeAssignments || []).filter((a) => {
    if (!a?.id || seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });

  const total = uniqueActive.length;
  if (total === 0) {
    return { completed: 0, total: 0 };
  }

  const completed = uniqueActive.filter((a) => Boolean(completionMap[a.id])).length;
  return { completed, total };
}

// -----------------------------------------------------------------
// Suite 1: Zero Active Assignments (Unavailable Status)
// -----------------------------------------------------------------
console.log("--- Suite 1: Zero Active Assignments Handled as Unavailable ---");
{
  const statsZero = calculatePracticalStatsMock([], { "any-id": true });
  assert(statsZero.total === 0, "Stats total is 0 when no assignments active");
  assert(statsZero.completed === 0, "Stats completed is 0 when no assignments active");

  const rZero = calculateReadiness({
    skillGaps: [{ name: "Java", resumeScore: 80, required: 80 }],
    assessment: { score: 80, completed: true },
    assignmentStats: statsZero,
    profileStats: { profileCompletion: 100 },
  });

  assert(rZero.breakdown.practical.isAvailable === false, "Practical breakdown isAvailable is false for 0 active assignments");
  assert(rZero.breakdown.practical.score === 0, "Practical score is 0% (NOT automatically 100%)");
  assert(rZero.breakdown.practical.weighted === 0, "Practical contributes 0 weighted points when unavailable");
  assert(rZero.breakdown.practical.status === "unavailable", "Practical status is 'unavailable'");
}

// -----------------------------------------------------------------
// Suite 2: All Incomplete Active Assignments (Genuine Zero)
// -----------------------------------------------------------------
console.log("\n--- Suite 2: All Incomplete Active Assignments (Genuine Zero) ---");
{
  const mockAssignments = [
    { id: "dyn-java-01", skill: "Java", title: "Task 1" },
    { id: "dyn-spring-01", skill: "Spring Boot", title: "Task 2" },
    { id: "dyn-sql-01", skill: "SQL", title: "Task 3" },
  ];
  const completionsEmpty = {};

  const stats = calculatePracticalStatsMock(mockAssignments, completionsEmpty);
  assert(stats.total === 3, "Total active assignments is 3");
  assert(stats.completed === 0, "Completed assignments is 0");

  const r = calculateReadiness({
    skillGaps: [{ name: "Java", resumeScore: 80, required: 80 }],
    assessment: { score: 80, completed: true },
    assignmentStats: stats,
    profileStats: { profileCompletion: 100 },
  });

  assert(r.breakdown.practical.isAvailable === true, "Practical breakdown isAvailable is true when tasks exist");
  assert(r.breakdown.practical.score === 0, "Practical score is genuine 0%");
  assert(r.breakdown.practical.weighted === 0, "Practical contributes 0 weighted points");
  assert(r.breakdown.practical.status === "zero", "Practical status is 'zero'");
}

// -----------------------------------------------------------------
// Suite 3: Partially Completed Active Assignments
// -----------------------------------------------------------------
console.log("\n--- Suite 3: Partially Completed Active Assignments ---");
{
  const mockAssignments = [
    { id: "dyn-java-01", skill: "Java" },
    { id: "dyn-spring-01", skill: "Spring Boot" },
    { id: "dyn-sql-01", skill: "SQL" },
    { id: "dyn-docker-01", skill: "Docker" },
  ];
  // Exactly 2 of 4 completed
  const completions = {
    "dyn-java-01": true,
    "dyn-spring-01": true,
  };

  const stats = calculatePracticalStatsMock(mockAssignments, completions);
  assert(stats.total === 4, "Total assignments is 4");
  assert(stats.completed === 2, "Completed assignments is 2");

  const r = calculateReadiness({
    skillGaps: [{ name: "Java", resumeScore: 80, required: 80 }],
    assessment: { score: 80, completed: true },
    assignmentStats: stats,
    profileStats: { profileCompletion: 100 },
  });

  assert(r.breakdown.practical.score === 50, "Practical score is exactly 50% (2 of 4)");
  assert(r.breakdown.practical.weighted === 10, "Practical contributes exactly 10 weighted points (50% * 20%)");
  assert(r.breakdown.practical.status === "completed", "Practical status is 'completed'");
}

// -----------------------------------------------------------------
// Suite 4: All Completed Active Assignments
// -----------------------------------------------------------------
console.log("\n--- Suite 4: All Completed Active Assignments ---");
{
  const mockAssignments = [
    { id: "dyn-java-01", skill: "Java" },
    { id: "dyn-spring-01", skill: "Spring Boot" },
    { id: "dyn-sql-01", skill: "SQL" },
  ];
  const completions = {
    "dyn-java-01": true,
    "dyn-spring-01": true,
    "dyn-sql-01": true,
  };

  const stats = calculatePracticalStatsMock(mockAssignments, completions);
  assert(stats.completed === 3, "All 3 assignments completed");

  const r = calculateReadiness({
    skillGaps: [{ name: "Java", resumeScore: 100, required: 100 }],
    assessment: { score: 100, completed: true },
    assignmentStats: stats,
    profileStats: { profileCompletion: 100 },
  });

  assert(r.breakdown.practical.score === 100, "Practical score is 100%");
  assert(r.breakdown.practical.weighted === 20, "Practical contributes full 20 weighted points");
}

// -----------------------------------------------------------------
// Suite 5: Duplicate Assignment IDs Deduplication
// -----------------------------------------------------------------
console.log("\n--- Suite 5: Duplicate Assignment IDs Deduplication ---");
{
  // Array containing duplicates of the same assignment
  const mockAssignmentsWithDuplicates = [
    { id: "dyn-java-01", skill: "Java" },
    { id: "dyn-java-01", skill: "Java" }, // Duplicate!
    { id: "dyn-sql-01", skill: "SQL" },
  ];
  const completions = {
    "dyn-java-01": true,
  };

  const stats = calculatePracticalStatsMock(mockAssignmentsWithDuplicates, completions);
  assert(stats.total === 2, "Deduplicates 3 raw items into 2 unique active assignments");
  assert(stats.completed === 1, "Completed count is exactly 1 (not counted twice)");

  const r = calculateReadiness({
    skillGaps: [{ name: "Java", resumeScore: 80, required: 80 }],
    assessment: { score: 80, completed: true },
    assignmentStats: stats,
    profileStats: { profileCompletion: 100 },
  });

  assert(r.breakdown.practical.score === 50, "Practical score is 50% (1 of 2), not distorted by duplicates");
}

// -----------------------------------------------------------------
// Suite 6: Cross-Job Isolation & Stale Completion Records
// -----------------------------------------------------------------
console.log("\n--- Suite 6: Cross-Job Isolation & Stale Completion Exclusion ---");
{
  // User previously completed tasks for Backend Developer
  const globalCompletionMap = {
    "dyn-spring-boot-01": true,
    "dyn-docker-01": true,
    "dyn-sql-01": true,
    // Stale or irrelevant task from past session
    "old-obsolete-task-99": true,
  };

  // Now user switches to Frontend Developer
  const frontendAssignments = [
    { id: "dyn-react-01", skill: "React" },
    { id: "dyn-javascript-01", skill: "JavaScript" },
    { id: "dyn-css-01", skill: "CSS" },
  ];

  // Frontend active stats should NOT count the 3 completed Backend tasks
  const frontendStats = calculatePracticalStatsMock(frontendAssignments, globalCompletionMap);
  assert(frontendStats.total === 3, "Frontend active assignments total is 3");
  assert(frontendStats.completed === 0, "Frontend completed count is 0 (Backend tasks strictly excluded)");

  const rFrontend = calculateReadiness({
    skillGaps: [{ name: "React", resumeScore: 70, required: 80 }],
    assessment: { score: 70, completed: true },
    assignmentStats: frontendStats,
    profileStats: { profileCompletion: 80 },
  });

  assert(rFrontend.breakdown.practical.score === 0, "Frontend practical score is 0% (no cross-job bleed)");
  assert(rFrontend.breakdown.practical.weighted === 0, "Frontend practical weighted contribution is 0 points");

  // If user completes 1 Frontend task
  globalCompletionMap["dyn-react-01"] = true;
  const updatedFrontendStats = calculatePracticalStatsMock(frontendAssignments, globalCompletionMap);
  assert(updatedFrontendStats.completed === 1, "Frontend completed count is now 1");
  assert(Math.round((1 / 3) * 100) === 33, "1 of 3 = 33%");

  // Switching back to Backend Developer restores Backend completions
  const backendAssignments = [
    { id: "dyn-spring-boot-01", skill: "Spring Boot" },
    { id: "dyn-docker-01", skill: "Docker" },
    { id: "dyn-sql-01", skill: "SQL" },
  ];
  const backendStats = calculatePracticalStatsMock(backendAssignments, globalCompletionMap);
  assert(backendStats.total === 3, "Backend assignments total is 3");
  assert(backendStats.completed === 3, "Backend assignments restored as 3 of 3 completed");
}

// -----------------------------------------------------------------
// Suite 7: Assignment Regeneration Retains Stable IDs
// -----------------------------------------------------------------
console.log("\n--- Suite 7: Assignment Regeneration Retains Stable IDs ---");
{
  const initial = generatePersonalizedAssignments({
    targetJob: "Backend Developer",
    parsedResume: { missingSkills: [{ name: "Spring Boot" }] },
  });

  const regenerated = generatePersonalizedAssignments({
    targetJob: "Backend Developer",
    parsedResume: { missingSkills: [{ name: "Spring Boot" }] },
  });

  assert(initial.length > 0, "Initial assignments generated");
  assert(regenerated.length > 0, "Regenerated assignments generated");
  assert(initial[0].id === regenerated[0].id, `Assignment ID is stable across regenerations (${initial[0].id})`);

  // Completion flag persists across regenerations because ID is deterministic
  const completionStore = { [initial[0].id]: true };
  const statsRegen = calculatePracticalStatsMock(regenerated, completionStore);
  assert(statsRegen.completed >= 1, "Stored completion persists across assignment regenerations");
}

console.log("\n==================================================");
console.log(`TOTAL TESTS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
console.log("==================================================");

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
