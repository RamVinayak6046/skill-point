/**
 * test-learning-paths.js
 * Comprehensive Verification Suite for Skill Point Phase 2B: Personalized Learning Paths
 *
 * Verifies:
 * 1. Standard Job Curricula Resolution (4 standard roles: Backend, Full Stack, Software Engineer, Java)
 * 2. Case-Insensitive and Alias Resolution (swe, fullstack, backend, java, etc.)
 * 3. Custom Job Resolution with Relevant Skills (proper module matching, no Backend Developer fallback)
 * 4. Custom Job with No Catalog Matches (honest supplementary fallback, no silent Backend Dev fallback)
 * 5. Incomplete / Empty Data Handling (null, empty strings, missing skills)
 * 6. Skill Gap Prioritization (higher deficits first, satisfied demoted, proper recommendation labeling)
 * 7. Deduplication of Courses and Lessons
 * 8. Lesson Completion Integrity & Progress Across Role Switches
 * 9. Readiness Formula Invariant Preservation (40/30/20/10 unchanged)
 */

import {
  getLearningPathForJob,
  resolveStandardRole,
} from "./src/data/jobData.js";

import { calculateLearningCompletion, calculateReadiness } from "./src/hooks/useReadiness.js";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`✗ FAIL: ${message}`);
  }
}

function assertEquals(actual, expected, message) {
  totalTests++;
  if (actual === expected) {
    passedTests++;
    console.log(`✓ PASS: ${message} (actual: ${actual})`);
  } else {
    failedTests++;
    console.error(`✗ FAIL: ${message} (expected: ${expected}, actual: ${actual})`);
  }
}

console.log("==================================================");
console.log("SKILL POINT: PERSONALIZED LEARNING PATHS TEST SUITE");
console.log("==================================================\n");

// ----------------------------------------------------
// Suite 1: Standard Job Curricula Resolution
// ----------------------------------------------------
console.log("--- Suite 1: Standard Job Curricula Resolution ---");

const backendPath = getLearningPathForJob("Backend Developer");
assert(backendPath.courses.length === 4, "Backend Developer has 4 curated courses");
assert(backendPath.courses.some(c => c.skill === "Spring Boot"), "Backend Developer includes Spring Boot");
assert(backendPath.courses.some(c => c.skill === "Docker"), "Backend Developer includes Docker");
assert(backendPath.lessons.length === 4, "Backend Developer has 4 curated lessons");
assertEquals(backendPath.isCustomUnsupported, false, "Backend Developer is supported");
assertEquals(backendPath.hasSpecializedCurriculum, true, "Backend Developer has specialized curriculum");

const fullStackPath = getLearningPathForJob("Full Stack Developer");
assert(fullStackPath.courses.length === 3, "Full Stack Developer has 3 curated courses");
assert(fullStackPath.courses.some(c => c.skill === "React"), "Full Stack Developer includes React");
assert(fullStackPath.courses.some(c => c.skill === "JavaScript"), "Full Stack Developer includes JavaScript");
assertEquals(fullStackPath.isCustomUnsupported, false, "Full Stack Developer is supported");

const swePath = getLearningPathForJob("Software Engineer");
assert(swePath.courses.length === 3, "Software Engineer has 3 curated courses");
assert(swePath.courses.some(c => c.skill === "DSA"), "Software Engineer includes DSA");
assert(swePath.courses.some(c => c.skill === "OOP"), "Software Engineer includes OOP");
assertEquals(swePath.isCustomUnsupported, false, "Software Engineer is supported");

const javaPath = getLearningPathForJob("Java Developer");
assert(javaPath.courses.length === 3, "Java Developer has 3 curated courses");
assert(javaPath.courses.some(c => c.skill === "Spring"), "Java Developer includes Spring Framework");
assert(javaPath.courses.some(c => c.skill === "Hibernate"), "Java Developer includes Hibernate");
assertEquals(javaPath.isCustomUnsupported, false, "Java Developer is supported");

// ----------------------------------------------------
// Suite 2: Case-Insensitive and Alias Resolution
// ----------------------------------------------------
console.log("\n--- Suite 2: Case-Insensitive and Alias Resolution ---");

assertEquals(resolveStandardRole("backend developer"), "Backend Developer", "Resolves lowercase 'backend developer'");
assertEquals(resolveStandardRole("BACKEND DEVELOPER"), "Backend Developer", "Resolves uppercase 'BACKEND DEVELOPER'");
assertEquals(resolveStandardRole("backend"), "Backend Developer", "Resolves alias 'backend'");
assertEquals(resolveStandardRole("swe"), "Software Engineer", "Resolves alias 'swe'");
assertEquals(resolveStandardRole("sde"), "Software Engineer", "Resolves alias 'sde'");
assertEquals(resolveStandardRole("fullstack"), "Full Stack Developer", "Resolves alias 'fullstack'");
assertEquals(resolveStandardRole("full-stack"), "Full Stack Developer", "Resolves alias 'full-stack'");
assertEquals(resolveStandardRole("java"), "Java Developer", "Resolves alias 'java'");

const sweAliasPath = getLearningPathForJob("swe");
assert(sweAliasPath.courses.some(c => c.skill === "DSA"), "'swe' alias resolves to Software Engineer curriculum (DSA)");
assert(!sweAliasPath.courses.some(c => c.skill === "Docker"), "'swe' alias does not fall back to Backend Developer Docker");

const fullstackAliasPath = getLearningPathForJob("fullstack");
assert(fullstackAliasPath.courses.some(c => c.skill === "React"), "'fullstack' alias resolves to Full Stack curriculum (React)");

// ----------------------------------------------------
// Suite 3: Custom Job Resolution with Relevant Skills
// ----------------------------------------------------
console.log("\n--- Suite 3: Custom Job Resolution with Relevant Skills ---");

const customFrontendJob = {
  id: "custom-fe-01",
  title: "Frontend Developer",
  skills: [
    { name: "React", required: 80, importance: "High" },
    { name: "JavaScript", required: 80, importance: "High" },
    { name: "Git", required: 75, importance: "Medium" },
    { name: "HTML/CSS", required: 70, importance: "Low" },
  ],
};

const frontendPath = getLearningPathForJob("Frontend Developer", {
  customJobs: [customFrontendJob],
});

assertEquals(frontendPath.isCustomUnsupported, false, "Frontend Developer with catalog skills is supported");
assertEquals(frontendPath.hasSpecializedCurriculum, true, "Frontend Developer has specialized curriculum");
assert(frontendPath.courses.some(c => c.skill === "React"), "Frontend Developer path includes React");
assert(frontendPath.courses.some(c => c.skill === "JavaScript"), "Frontend Developer path includes JavaScript");
assert(frontendPath.courses.some(c => c.skill === "Git"), "Frontend Developer path includes Git");
assert(!frontendPath.courses.some(c => c.skill === "Spring Boot"), "Frontend Developer does NOT include Spring Boot (No Backend Dev fallback)");
assert(!frontendPath.courses.some(c => c.skill === "Docker"), "Frontend Developer does NOT include Docker");
assert(frontendPath.unmatchedSkills.includes("HTML/CSS"), "Identifies HTML/CSS as unmatched without inventing fake courses");

// ----------------------------------------------------
// Suite 4: Custom Job with No Catalog Matches (Honest Fallback)
// ----------------------------------------------------
console.log("\n--- Suite 4: Custom Job with No Catalog Matches (Honest Fallback) ---");

const customDataScientist = {
  id: "custom-ds-01",
  title: "Data Scientist",
  skills: [
    { name: "Machine Learning", required: 85, importance: "High" },
    { name: "PyTorch", required: 80, importance: "High" },
    { name: "Statistics", required: 80, importance: "Medium" },
  ],
};

const dsPath = getLearningPathForJob("Data Scientist", {
  customJobs: [customDataScientist],
});

assertEquals(dsPath.isCustomUnsupported, true, "Data Scientist marked as isCustomUnsupported: true");
assertEquals(dsPath.hasSpecializedCurriculum, false, "Data Scientist hasSpecializedCurriculum: false");
assert(dsPath.message.includes("not currently available"), "Provides honest explanatory message");
assert(!dsPath.courses.some(c => c.skill === "Spring Boot"), "Data Scientist does NOT fall back to Spring Boot");
assert(!dsPath.courses.some(c => c.skill === "Docker"), "Data Scientist does NOT fall back to Docker");
assert(dsPath.courses.every(c => c.recommendationType === "supplementary"), "All courses labeled as supplementary");
assert(dsPath.courses.every(c => c.recommendationReason === "General supplementary learning"), "Reason labeled 'General supplementary learning'");
assert(dsPath.courses.some(c => c.skill === "Git"), "Fallback includes Git fundamentals");
assert(dsPath.courses.some(c => c.skill === "OOP"), "Fallback includes OOP design");

// ----------------------------------------------------
// Suite 5: Incomplete / Empty Data Handling
// ----------------------------------------------------
console.log("\n--- Suite 5: Incomplete / Empty Data Handling ---");

const nullTitlePath = getLearningPathForJob(null);
assertEquals(nullTitlePath.isCustomUnsupported, true, "null title handled safely");
assert(nullTitlePath.courses.length > 0, "null title returns general supplementary courses");

const emptyTitlePath = getLearningPathForJob("");
assertEquals(emptyTitlePath.isCustomUnsupported, true, "empty title handled safely");

const emptySkillsJob = { id: "empty-01", title: "Empty Role", skills: [] };
const emptySkillsPath = getLearningPathForJob("Empty Role", { customJobs: [emptySkillsJob] });
assertEquals(emptySkillsPath.isCustomUnsupported, true, "Role with empty skills falls back gracefully");
assert(!emptySkillsPath.courses.some(c => c.skill === "Spring Boot"), "Empty role does not default to Backend Developer");

// ----------------------------------------------------
// Suite 6: Skill Gap Prioritization & Recommendation Labeling
// ----------------------------------------------------
console.log("\n--- Suite 6: Skill Gap Prioritization & Recommendation Labeling ---");

// Test backend role with specific skill deficits:
// Docker: gap 60 (High deficit)
// REST API: gap 25 (Medium deficit)
// Spring Boot: gap 0 (benchmark satisfied)
// SQL: gap 0 (benchmark satisfied)
const testSkillGaps = [
  { name: "Docker", gap: 60, required: 80, current: 20 },
  { name: "REST API", gap: 25, required: 80, current: 55 },
  { name: "Spring Boot", gap: 0, required: 80, current: 85 },
  { name: "SQL", gap: 0, required: 75, current: 80 },
];

const prioritizedPath = getLearningPathForJob("Backend Developer", {
  skillGaps: testSkillGaps,
});

assertEquals(prioritizedPath.courses[0].skill, "Docker", "Top course is Docker (highest deficit: 60)");
assertEquals(prioritizedPath.courses[0].priority, "High", "Docker priority is High due to large deficit");
assertEquals(prioritizedPath.courses[0].recommendationType, "skill_gap", "Docker labeled as skill_gap");
assertEquals(prioritizedPath.courses[0].recommendationReason, "Recommended to address a skill gap", "Docker reason is 'Recommended to address a skill gap'");

assertEquals(prioritizedPath.courses[1].skill, "REST API", "Second course is REST API (deficit: 25)");
assertEquals(prioritizedPath.courses[1].priority, "Medium", "REST API priority is Medium");

const satisfiedCourse = prioritizedPath.courses.find(c => c.skill === "Spring Boot");
assertEquals(satisfiedCourse.priority, "Low", "Satisfied Spring Boot demoted to Low priority");
assertEquals(satisfiedCourse.recommendationType, "target_job", "Satisfied skill labeled target_job");
assert(satisfiedCourse.recommendationReason.includes("satisfied"), "Satisfied skill notes benchmark is satisfied");

// Lessons ordering: lessons for Docker should precede lessons for satisfied skills
const firstLesson = prioritizedPath.lessons[0];
assertEquals(firstLesson.skill, "Docker", "First lesson is for Docker (aligns with course priority)");

// ----------------------------------------------------
// Suite 7: Deduplication of Courses and Lessons
// ----------------------------------------------------
console.log("\n--- Suite 7: Deduplication of Courses and Lessons ---");

const multiSkillJob = {
  id: "multi-01",
  title: "Full Stack Engineer",
  skills: [
    { name: "React" },
    { name: "react" },
    { name: "React.js" },
    { name: "JavaScript" },
    { name: "js" },
    { name: "Git" },
  ],
};

const dedupePath = getLearningPathForJob("Full Stack Engineer", {
  customJobs: [multiSkillJob],
});

const courseIds = dedupePath.courses.map(c => c.id);
const uniqueCourseIds = new Set(courseIds);
assertEquals(courseIds.length, uniqueCourseIds.size, "Zero duplicate courses in resolved path");

const lessonIds = dedupePath.lessons.map(l => l.id);
const uniqueLessonIds = new Set(lessonIds);
assertEquals(lessonIds.length, uniqueLessonIds.size, "Zero duplicate lessons in resolved path");

// ----------------------------------------------------
// Suite 8: Lesson Completion Integrity & Dynamic Progress
// ----------------------------------------------------
console.log("\n--- Suite 8: Lesson Completion Integrity & Dynamic Progress ---");

// Lesson 104 is Docker ("Docker Containers Explained")
// Lesson 114 is Git ("Git Branching and Merging Strategies")
const sampleCompletedLessons = [104, 114];

const pathWithProgress = getLearningPathForJob("Backend Developer", {
  learningProgress: { completedLessons: sampleCompletedLessons },
});

const dockerCourse = pathWithProgress.courses.find(c => c.skill === "Docker");
// Docker has 1 lesson in Backend Developer (104). 1/1 = 100%
assertEquals(dockerCourse.progress, 100, "Docker course reflects 100% progress when lesson 104 is complete");

const springCourse = pathWithProgress.courses.find(c => c.skill === "Spring Boot");
// Neither 101 nor 102 completed
assertEquals(springCourse.progress, 0, "Spring Boot reflects 0% when no lessons completed");

// Switch to custom Frontend Developer job which has Git
const fePathWithProgress = getLearningPathForJob("Frontend Developer", {
  customJobs: [customFrontendJob],
  learningProgress: { completedLessons: sampleCompletedLessons },
});

const gitCourse = fePathWithProgress.courses.find(c => c.skill === "Git");
// Git has lessons 114, 115. Lesson 114 is complete (1/2 = 50%)
assertEquals(gitCourse.progress, 50, "Git course reflects 50% progress across different target jobs");

// ----------------------------------------------------
// Suite 9: Readiness Formula Invariant Preservation
// ----------------------------------------------------
console.log("\n--- Suite 9: Readiness Formula Invariant Preservation ---");

// Verify learning completion remains independent of job readiness formula
const lrProgress = calculateLearningCompletion([101, 102, 103, 104], 4);
assertEquals(lrProgress, 100, "Learning progress calculation works correctly (100%)");

const readinessZero = calculateReadiness({
  skillGaps: [{ name: "Java", required: 80, current: 0 }],
  assessment: { completed: false, score: 0 },
  assignmentStats: { completed: 0, total: 3 },
  profileStats: { profileCompletion: 0, resumeUploaded: false },
});

assertEquals(readinessZero.overall, 0, "Readiness score is 0 with zero components");

const readinessFifty = calculateReadiness({
  skillGaps: [{ name: "Java", resumeScore: 100, required: 100 }], // 40 pts
  assessment: { completed: true, score: 100 },              // 30 pts
  assignmentStats: { completed: 3, total: 3 },              // 20 pts
  profileStats: { profileCompletion: 100, resumeUploaded: true }, // 10 pts
});

assertEquals(readinessFifty.overall, 100, "Authoritative readiness formula 40+30+20+10 = 100 maintained");

console.log("\n==================================================");
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log("==================================================");

if (failedTests > 0) {
  process.exit(1);
}
