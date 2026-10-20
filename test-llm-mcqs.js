/**
 * Test Suite: Hardened Assessment Security, D1 Atomic Quota, and Integration Suite
 *
 * Covers:
 * 1. Schema validation of LLM outputs (4 options, non-empty, distinct)
 * 2. Malformed JSON handling & corrupted output rejection
 * 3. Intra-attempt question deduplication
 * 4. Prompt construction & context minimization
 * 5. P0 Answer Security: Zero answer leakage in generate response (neither answers nor explanations returned)
 * 6. P0 Attempt Ownership: attemptId + distinct attemptSecret generated and verified
 * 7. P0 Attempt Ownership: attemptSecret mismatch rejected with HTTP 403 without consuming attempt
 * 8. P0 Submission Hardening: Oversized body rejected with HTTP 413
 * 9. P0 Submission Hardening: Too few answers rejected with HTTP 400
 * 10. P0 Submission Hardening: Too many answers rejected with HTTP 400
 * 11. P0 Submission Hardening: Non-integer, negative, or out-of-range answers rejected with HTTP 400
 * 12. P0 Submission Hardening: Malformed submission does NOT consume attempt; valid retry succeeds
 * 13. P0 Replay Prevention: Attempt submitted once cannot be re-submitted (HTTP 409 Conflict)
 * 14. P1 Atomic Quota: D1 atomic conditional reservation prevents concurrent overages at cap
 * 15. P1 Quota Storage Failure: Fails closed before invoking Workers AI
 * 16. P1 Quota Accounting: Model inference failure triggers atomic quota refund
 * 17. P1 Rate Limiting: Dual-layer (KV window + isolate-local) 15 req/min protection
 * 18. Graceful Fallback: Local question generator invoked on network/quota/storage error
 * 19. Assessment Scoring & Skill Level Promotion Compatibility
 * 20. Readiness Scoring Weight Invariant (40/30/20/10)
 */

import {
  validateLLMQuestions,
  fetchLLMGeneratedMCQs,
  generateAssessmentQuestionsAsync,
  submitLLMAssessmentAnswers,
  resolveWorkerEndpoints,
  getWorkerEndpoints,
  WORKER_AI_ENDPOINT,
  WORKER_SUBMIT_ENDPOINT,
} from './src/services/questionGeneratorService.js';

import worker from './worker/src/index.js';
import {
  buildPrompt,
  reserveDailyQuotaAtomic,
  refundDailyQuotaAtomic,
  checkRateLimit,
} from './worker/src/helpers.js';

import { calculateReadiness } from './src/hooks/useReadiness.js';
import { updateSkillLevelsFromAssessment, compareAssessmentAttempts } from './src/services/skillLevelService.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    passedTests++;
    console.log(`✓ PASS: ${message}`);
  }
}

/**
 * In-memory Mock Cloudflare KV Namespace
 */
class MockKV {
  constructor() {
    this.store = new Map();
  }
  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }
  async put(key, value, options = {}) {
    const expiresAt = options.expirationTtl ? Date.now() + options.expirationTtl * 1000 : null;
    this.store.set(key, { value: String(value), expiresAt });
  }
  async delete(key) {
    this.store.delete(key);
  }
}

/**
 * In-memory Mock Cloudflare D1 Database providing atomic single-statement semantics
 */
class MockD1 {
  constructor() {
    this.rows = new Map(); // daily_quota
    this.attempts = new Map(); // assessment_attempts
  }
  prepare(sql) {
    const self = this;
    return {
      bind(...params) {
        return {
          async all() {
            if (sql.includes('INSERT INTO daily_quota')) {
              const [day, now, maxDaily] = params;
              const existing = self.rows.get(day);
              if (!existing) {
                const row = { day, count: 1, updated_at: now };
                self.rows.set(day, row);
                return { results: [row] };
              } else {
                if (existing.count < maxDaily) {
                  existing.count += 1;
                  existing.updated_at = now;
                  self.rows.set(day, existing);
                  return { results: [{ ...existing }] };
                } else {
                  return { results: [] }; // WHERE count < maxDaily failed
                }
              }
            }

            if (sql.includes('SELECT') && sql.includes('FROM assessment_attempts')) {
              const [attemptId] = params;
              const row = self.attempts.get(attemptId);
              return { results: row ? [{ ...row }] : [] };
            }

            if (sql.includes('UPDATE assessment_attempts') && sql.includes("status = 'processing'")) {
              const [now, attemptId, checkNow] = params;
              const row = self.attempts.get(attemptId);
              // Atomic conditional check: must be pending and unexpired
              if (row && row.status === 'pending' && row.expires_at > checkNow) {
                row.status = 'processing';
                row.completed_at = now;
                self.attempts.set(attemptId, row);
                return { results: [{ attempt_id: attemptId }] };
              } else {
                return { results: [] }; // 0 rows updated
              }
            }

            return { results: [] };
          },
          async run() {
            if (sql.includes('UPDATE daily_quota') && sql.includes('MAX(0, count - 1)')) {
              const [day, now] = params;
              const existing = self.rows.get(day);
              if (existing) {
                existing.count = Math.max(0, existing.count - 1);
                existing.updated_at = now;
                self.rows.set(day, existing);
              }
              return { success: true };
            }

            if (sql.includes('INSERT INTO assessment_attempts')) {
              const [attemptId, attemptSecret, now, expiresAt] = params;
              self.attempts.set(attemptId, {
                attempt_id: attemptId,
                attempt_secret: attemptSecret,
                status: 'pending',
                created_at: now,
                expires_at: expiresAt,
                completed_at: null,
                score: null,
              });
              return { success: true };
            }

            if (sql.includes('UPDATE assessment_attempts') && sql.includes("status = 'completed'")) {
              const [score, completedAt, attemptId] = params;
              const row = self.attempts.get(attemptId);
              if (row) {
                row.status = 'completed';
                row.score = score;
                row.completed_at = completedAt;
                self.attempts.set(attemptId, row);
              }
              return { success: true };
            }

            if (sql.includes('UPDATE assessment_attempts') && sql.includes("status = 'failed'")) {
              const [completedAt, attemptId] = params;
              const row = self.attempts.get(attemptId);
              if (row) {
                row.status = 'failed';
                row.completed_at = completedAt;
                self.attempts.set(attemptId, row);
              }
              return { success: true };
            }

            if (sql.includes('DELETE FROM assessment_attempts')) {
              const [attemptId] = params;
              self.attempts.delete(attemptId);
              return { success: true };
            }

            return { success: true };
          },
        };
      },
    };
  }
}

console.log("==================================================");
console.log("SKILL POINT: HARDENED ASSESSMENT SECURITY SUITE");
console.log("==================================================\n");

// --- Suite 1: Schema Validation of LLM Questions ---
console.log("--- Suite 1: Schema Validation of LLM Questions ---");

const validRawQuestions = [
  {
    skill: "Java",
    question: "What is the primary purpose of the volatile keyword in Java memory concurrency?",
    options: [
      "Ensures visibility of variable changes across multiple threads without locking",
      "Prevents a class from being inherited or extended by subclasses",
      "Forces a variable to be serialized to disk synchronously",
      "Marks a method as running in high-priority native OS thread",
    ],
    answer: 0,
    explanation: "Volatile guarantees memory visibility so all reads read directly from main memory.",
    objective: "Java Concurrency & Memory Model",
  },
  {
    skill: "Spring Boot",
    question: "In Spring Boot Actuator, which endpoint provides information about application liveness and readiness state?",
    options: [
      "/actuator/beans",
      "/actuator/health",
      "/actuator/env",
      "/actuator/mappings",
    ],
    answer: 1,
    explanation: "The /actuator/health endpoint exposes liveness and readiness probes.",
    objective: "Production Monitoring",
  },
];

const validationResult = validateLLMQuestions(validRawQuestions, 2, ["Java", "Spring Boot"]);
assert(validationResult.valid === true, "Valid raw questions pass schema validation");
assert(validationResult.count === 2, "Count matches 2 valid questions");
assert(validationResult.questions[0].answer === 0, "Answer index 0 correctly preserved in review object");
assert(validationResult.questions[0].source === "workers_ai_llm", "Source flagged as workers_ai_llm");
assert(validationResult.questions[1].answer === 1, "Answer index 1 correctly preserved in review object");


// --- Suite 2: Malformed Output & Edge Cases Rejection ---
console.log("\n--- Suite 2: Malformed Output & Edge Cases Rejection ---");

assert(validateLLMQuestions("Not an array", 1).valid === false, "Rejects string input as invalid array");
assert(validateLLMQuestions({}, 1).valid === false, "Rejects object input as invalid array");
assert(validateLLMQuestions(null, 1).valid === false, "Rejects null input as invalid array");

const only3Options = [
  {
    skill: "Docker",
    question: "Which command lists running containers?",
    options: ["docker ps", "docker run", "docker stop"],
    answer: 0,
    explanation: "docker ps lists running containers",
  },
];
assert(validateLLMQuestions(only3Options, 1).count === 0, "Rejects question with fewer than 4 options");

const duplicateOptions = [
  {
    skill: "SQL",
    question: "Which clause groups rows?",
    options: ["GROUP BY", "ORDER BY", "GROUP BY", "WHERE"],
    answer: 0,
    explanation: "GROUP BY groups rows",
  },
];
assert(validateLLMQuestions(duplicateOptions, 1).count === 0, "Rejects question with duplicate options");

const outOfBoundsAnswer = [
  {
    skill: "SQL",
    question: "Which clause filters groups?",
    options: ["WHERE", "HAVING", "LIMIT", "OFFSET"],
    answer: 4,
    explanation: "HAVING filters groups",
  },
];
assert(validateLLMQuestions(outOfBoundsAnswer, 1).count === 0, "Rejects question with answer index >= 4");


// --- Suite 3: Intra-Attempt Question Deduplication ---
console.log("\n--- Suite 3: Intra-Attempt Question Deduplication ---");

const duplicateQuestionTexts = [
  {
    skill: "Git",
    question: "How do you stage all files in the current repository?",
    options: ["git add .", "git commit -a", "git push", "git pull"],
    answer: 0,
    explanation: "git add . stages current directory",
  },
  {
    skill: "Git",
    question: "How do you stage all files in the current repository?",
    options: ["git add .", "git commit", "git rebase", "git checkout"],
    answer: 0,
    explanation: "duplicate question text",
  },
];
const dedupRes = validateLLMQuestions(duplicateQuestionTexts, 1);
assert(dedupRes.count === 1, "Duplicate question texts within the same batch are deduplicated down to 1");


// --- Suite 4: Strict Context Minimization & Prompt Safety ---
console.log("\n--- Suite 4: Strict Context Minimization & Prompt Safety ---");

const prompt = buildPrompt({
  targetJob: "Backend Developer",
  level: 2,
  skills: ["Java", "Spring Boot", "Kafka"],
  questionCount: 10,
  companyContext: "FinTech Cloud Scale",
});

assert(prompt.includes("Backend Developer"), "Prompt contains target role");
assert(prompt.includes("FinTech Cloud Scale"), "Prompt contains sanitized company context");
assert(prompt.includes("Level 2 (Core Engineering & Architecture"), "Prompt includes difficulty guidelines");
assert(!prompt.includes("password"), "Prompt does NOT leak credentials");
assert(!prompt.includes("resume"), "Prompt does NOT include raw resume text");


// --- Suite 5: P0 Generation Security & Attempt Secret Generation ---
console.log("\n--- Suite 5: P0 Generation Security & Attempt Secret Generation ---");

const mockKV = new MockKV();
const mockD1 = new MockD1();
const mockAI = {
  async run() {
    return {
      response: JSON.stringify(validRawQuestions),
    };
  },
};
const mockEnv = {
  AI: mockAI,
  SESSIONS_KV: mockKV,
  DB: mockD1,
  MAX_DAILY_REQUESTS: "100",
};

const generateReq = new Request("http://localhost/api/generate-mcqs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    targetJob: "Backend Developer",
    level: 1,
    skills: ["Java", "Spring Boot"],
    questionCount: 2,
  }),
});

const generateRes = await worker.fetch(generateReq, mockEnv);
assert(generateRes.status === 200, "Worker returns 200 OK for valid generation request");

const generateData = await generateRes.json();
assert(generateData.success === true, "Generation response reports success: true");
assert(Boolean(generateData.attemptId), "Generation response includes unique attemptId");
assert(Boolean(generateData.attemptSecret), "Generation response includes high-entropy attemptSecret");
assert(generateData.questions.length === 2, "Returns 2 questions");

// Verify zero answer leakage in generation payload
const q1 = generateData.questions[0];
const q2 = generateData.questions[1];
assert(q1.answer === undefined, "Security: First question has NO answer property in client payload");
assert(q1.explanation === undefined, "Security: First question has NO explanation property in client payload");
assert(q2.answer === undefined, "Security: Second question has NO answer property in client payload");
assert(q2.explanation === undefined, "Security: Second question has NO explanation property in client payload");

// Verify answer key and attemptSecret are stored on server
const storedSessionJson = await mockKV.get(`session:${generateData.attemptId}`);
assert(storedSessionJson !== null, "Answer key is securely stored in SESSIONS_KV");
const storedSession = JSON.parse(storedSessionJson);
assert(storedSession.status === "pending", "Stored session status is pending");
assert(storedSession.attemptSecret === generateData.attemptSecret, "Server stores matching attemptSecret");
assert(storedSession.questions[0].answer === 0, "Server stores correct answer 0 for Java");

// Step 7E: Verify D1 authoritative attempt tracking
const d1AttemptRow = mockD1.attempts.get(generateData.attemptId);
assert(Boolean(d1AttemptRow), "D1 stores authoritative attempt record");
assert(d1AttemptRow.status === "pending", "D1 attempt status is pending");
assert(d1AttemptRow.attempt_secret === generateData.attemptSecret, "D1 attempt stores matching attemptSecret");
assert(d1AttemptRow.expires_at > Date.now(), "D1 attempt has future expires_at timestamp");


// --- Suite 5B: Multi-Model Resilience & Fallback Execution ---
console.log("\n--- Suite 5B: Multi-Model Resilience & Fallback Execution ---");

let calledModels = [];
const fallbackMockAI = {
  async run(model) {
    calledModels.push(model);
    if (model.includes("llama-3.1-8b-instruct-fp8")) {
      const err = new Error("5028: Model capacity exceeded or deprecated");
      err.name = "AiError";
      throw err;
    }
    // Fallback model succeeds
    return {
      response: JSON.stringify(validRawQuestions),
    };
  },
};

const fallbackEnv = {
  AI: fallbackMockAI,
  SESSIONS_KV: mockKV,
  DB: mockD1,
  MAX_DAILY_REQUESTS: "100",
};

const fbReq = new Request("http://localhost/api/generate-mcqs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    targetJob: "Backend Developer",
    level: 1,
    skills: ["Java", "Spring Boot"],
    questionCount: 2,
  }),
});

const fbRes = await worker.fetch(fbReq, fallbackEnv);
assert(fbRes.status === 200, "Worker returns 200 OK after graceful model fallback");
const fbData = await fbRes.json();
assert(fbData.success === true, "Fallback model reports success: true");
assert(calledModels[0].includes("llama-3.1-8b-instruct-fp8"), "First invoked primary model");
assert(calledModels[1].includes("llama-3.2-3b-instruct"), "Second invoked fallback model");
assert(fbData.model.includes("llama-3.2-3b-instruct"), "Response payload reports active fallback model");

// Both models failing triggers safe error & quota refund
const allFailAI = {
  async run() {
    const err = new Error("Workers AI out of capacity");
    err.name = "AiError";
    throw err;
  },
};
const allFailEnv = {
  AI: allFailAI,
  SESSIONS_KV: mockKV,
  DB: mockD1,
  MAX_DAILY_REQUESTS: "100",
};

const failReq = new Request("http://localhost/api/generate-mcqs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    targetJob: "Backend Developer",
    level: 1,
    skills: ["Java"],
    questionCount: 2,
  }),
});
const failRes = await worker.fetch(failReq, allFailEnv);
assert(failRes.status === 500, "All models failing returns HTTP 500");
const failData = await failRes.json();
assert(failData.fallbackRecommended === true, "Reports fallbackRecommended: true");
assert(failData.error === "Workers AI inference failed or timed out.", "Preserves safe public error message");


// --- Suite 6: P0 Submission Hardening & Input Validation ---
console.log("\n--- Suite 6: P0 Submission Hardening & Input Validation ---");

// 1. Oversized submission body rejected with HTTP 413
const hugeAnswers = Array.from({ length: 10000 }, () => 0);
const oversizedReq = new Request("http://localhost/api/submit-assessment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    attemptId: generateData.attemptId,
    attemptSecret: generateData.attemptSecret,
    answers: hugeAnswers,
    extraPadding: "x".repeat(70 * 1024), // Exceeds 64 KB
  }),
});
const oversizedRes = await worker.fetch(oversizedReq, mockEnv);
assert(oversizedRes.status === 413, "Oversized submission body rejected with HTTP 413");

// 2. Too few answers rejected with HTTP 400
const tooFewReq = new Request("http://localhost/api/submit-assessment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    attemptId: generateData.attemptId,
    attemptSecret: generateData.attemptSecret,
    answers: [0], // Expected 2, sent 1
  }),
});
const tooFewRes = await worker.fetch(tooFewReq, mockEnv);
assert(tooFewRes.status === 400, "Too few answers rejected with HTTP 400");

// 3. Too many answers rejected with HTTP 400
const tooManyReq = new Request("http://localhost/api/submit-assessment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    attemptId: generateData.attemptId,
    attemptSecret: generateData.attemptSecret,
    answers: [0, 1, 2], // Expected 2, sent 3
  }),
});
const tooManyRes = await worker.fetch(tooManyReq, mockEnv);
assert(tooManyRes.status === 400, "Too many answers rejected with HTTP 400");

// 4. Out-of-range answer index rejected with HTTP 400
const outOfRangeReq = new Request("http://localhost/api/submit-assessment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    attemptId: generateData.attemptId,
    attemptSecret: generateData.attemptSecret,
    answers: [0, 4], // Option 4 does not exist (0-3 valid)
  }),
});
const outOfRangeRes = await worker.fetch(outOfRangeReq, mockEnv);
assert(outOfRangeRes.status === 400, "Out-of-range answer index (4) rejected with HTTP 400");

// 5. Negative answer index rejected with HTTP 400
const negativeReq = new Request("http://localhost/api/submit-assessment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    attemptId: generateData.attemptId,
    attemptSecret: generateData.attemptSecret,
    answers: [0, -1],
  }),
});
const negativeRes = await worker.fetch(negativeReq, mockEnv);
assert(negativeRes.status === 400, "Negative answer index (-1) rejected with HTTP 400");

// 6. Non-integer answer index rejected with HTTP 400
const nonIntReq = new Request("http://localhost/api/submit-assessment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    attemptId: generateData.attemptId,
    attemptSecret: generateData.attemptSecret,
    answers: [0, 1.5],
  }),
});
const nonIntRes = await worker.fetch(nonIntReq, mockEnv);
assert(nonIntRes.status === 400, "Non-integer answer index (1.5) rejected with HTTP 400");

// 7. Verify attempt remains 'pending' after 400 validation failures
const checkSessionAfterBadReq = JSON.parse(await mockKV.get(`session:${generateData.attemptId}`));
assert(checkSessionAfterBadReq.status === "pending", "Attempt remains pending and unconsumed after 400 error");


// --- Suite 7: P0 Attempt Ownership & Secret Verification ---
console.log("\n--- Suite 7: P0 Attempt Ownership & Secret Verification ---");

// Attempt secret mismatch rejected with HTTP 403 Forbidden
const wrongSecretReq = new Request("http://localhost/api/submit-assessment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    attemptId: generateData.attemptId,
    attemptSecret: "sec-wrong-secret-from-attacker",
    answers: [0, 1],
  }),
});
const wrongSecretRes = await worker.fetch(wrongSecretReq, mockEnv);
assert(wrongSecretRes.status === 403, "Mismatched attemptSecret rejected with HTTP 403 Forbidden");

// Missing attemptSecret rejected with HTTP 400
const missingSecretReq = new Request("http://localhost/api/submit-assessment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    attemptId: generateData.attemptId,
    answers: [0, 1],
  }),
});
const missingSecretRes = await worker.fetch(missingSecretReq, mockEnv);
assert(missingSecretRes.status === 400, "Missing attemptSecret rejected with HTTP 400");


// --- Suite 8: Valid Submission Scoring & Replay Prevention ---
console.log("\n--- Suite 8: Valid Submission Scoring & Replay Prevention ---");

// Valid submission with correct attemptSecret: answers [0, 3] (1 correct, 1 wrong = 50%)
const validSubmitReq = new Request("http://localhost/api/submit-assessment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    attemptId: generateData.attemptId,
    attemptSecret: generateData.attemptSecret,
    answers: [0, 3],
  }),
});
const validSubmitRes = await worker.fetch(validSubmitReq, mockEnv);
assert(validSubmitRes.status === 200, "Valid submission accepted with HTTP 200 OK");

const validSubmitData = await validSubmitRes.json();
assert(validSubmitData.success === true, "Submission reports success: true");
assert(validSubmitData.score === 50, "Server computed score is exactly 50%");
assert(validSubmitData.correctAnswers === 1, "Server scored exactly 1 correct answer");
assert(validSubmitData.skillScores.Java === 100, "Java skill score is 100%");
assert(validSubmitData.skillScores["Spring Boot"] === 0, "Spring Boot skill score is 0%");

// Explanations revealed ONLY post-submission
assert(validSubmitData.reviewQuestions[0].answer === 0, "Review question 1 reveals correct answer 0");
assert(Boolean(validSubmitData.reviewQuestions[0].explanation), "Review question 1 reveals technical explanation");

// Replay prevention: second submission rejected with HTTP 409 Conflict
const replayReq = new Request("http://localhost/api/submit-assessment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    attemptId: generateData.attemptId,
    attemptSecret: generateData.attemptSecret,
    answers: [0, 1],
  }),
});
const replayRes = await worker.fetch(replayReq, mockEnv);
assert(replayRes.status === 409, "Replay submission rejected with HTTP 409 Conflict");

// Step 7E: Verify D1 attempt status transitioned to completed
const d1CompletedRow = mockD1.attempts.get(generateData.attemptId);
assert(d1CompletedRow.status === "completed", "D1 attempt status transitioned to completed");
assert(d1CompletedRow.score === 50, "D1 stores authoritative score (50%)");


// --- Suite 8B: Step 7E Atomic Concurrency & State Machine Verification ---
console.log("\n--- Suite 8B: Step 7E Atomic Concurrency & State Machine Verification ---");

// 1. Generate fresh attempt for concurrency test
const concGenReq = new Request("http://localhost/api/generate-mcqs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    targetJob: "Cloud Engineer",
    level: 1,
    skills: ["Java", "Spring Boot"],
    questionCount: 2,
  }),
});
const concGenRes = await worker.fetch(concGenReq, mockEnv);
assert(concGenRes.status === 200, "Fresh attempt generated for concurrency verification");
const concGenData = await concGenRes.json();

// 2. Concurrency Race: Two simultaneous submissions for the same attempt
const concReq1 = new Request("http://localhost/api/submit-assessment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    attemptId: concGenData.attemptId,
    attemptSecret: concGenData.attemptSecret,
    answers: [0, 0],
  }),
});
const concReq2 = new Request("http://localhost/api/submit-assessment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    attemptId: concGenData.attemptId,
    attemptSecret: concGenData.attemptSecret,
    answers: [0, 0],
  }),
});

const [concRes1, concRes2] = await Promise.all([
  worker.fetch(concReq1, mockEnv),
  worker.fetch(concReq2, mockEnv),
]);

const statuses = [concRes1.status, concRes2.status];
assert(statuses.includes(200), "Concurrency: Exactly one simultaneous submission succeeds with HTTP 200 OK");
assert(statuses.includes(409), "Concurrency: Exactly one simultaneous submission is rejected with HTTP 409 Conflict");
assert(statuses.filter((s) => s === 200).length === 1, "Concurrency: Only 1 winner permitted across concurrent submissions");
assert(statuses.filter((s) => s === 409).length === 1, "Concurrency: Exactly 1 loser rejected across concurrent submissions");

// 3. Expired Attempt Rejection
const expiredGenReq = new Request("http://localhost/api/generate-mcqs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    targetJob: "Cloud Engineer",
    level: 1,
    skills: ["Java", "Spring Boot"],
    questionCount: 2,
  }),
});
const expiredGenRes = await worker.fetch(expiredGenReq, mockEnv);
const expiredGenData = await expiredGenRes.json();

// Simulate expired attempt in D1
const expiredRow = mockD1.attempts.get(expiredGenData.attemptId);
expiredRow.expires_at = Date.now() - 5000; // in the past

const expiredSubmitReq = new Request("http://localhost/api/submit-assessment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    attemptId: expiredGenData.attemptId,
    attemptSecret: expiredGenData.attemptSecret,
    answers: [0, 0],
  }),
});
const expiredSubmitRes = await worker.fetch(expiredSubmitReq, mockEnv);
assert(expiredSubmitRes.status === 410, "Expired attempt rejected with HTTP 410 Gone");

// 4. Safe Recovery Policy: Failed attempt status prevents duplicate scoring
const failedGenReq = new Request("http://localhost/api/generate-mcqs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    targetJob: "Cloud Engineer",
    level: 1,
    skills: ["Java", "Spring Boot"],
    questionCount: 2,
  }),
});
const failedGenRes = await worker.fetch(failedGenReq, mockEnv);
const failedGenData = await failedGenRes.json();

// Set status to failed in D1
const failedRow = mockD1.attempts.get(failedGenData.attemptId);
failedRow.status = "failed";

const afterFailedSubmitReq = new Request("http://localhost/api/submit-assessment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    attemptId: failedGenData.attemptId,
    attemptSecret: failedGenData.attemptSecret,
    answers: [0, 0],
  }),
});
const afterFailedSubmitRes = await worker.fetch(afterFailedSubmitReq, mockEnv);
assert(afterFailedSubmitRes.status === 409, "Failed attempt cannot be submitted or duplicate scored (HTTP 409 Conflict)");


// --- Suite 9: P1 Atomic Daily Quota (Cloudflare D1) ---
console.log("\n--- Suite 9: P1 Atomic Daily Quota (Cloudflare D1) ---");

const d1 = new MockD1();
const d1Env = {
  DB: d1,
  MAX_DAILY_REQUESTS: "3",
};

// Request 1: allowed
const q1Res = await reserveDailyQuotaAtomic(d1Env);
assert(q1Res.allowed === true, "D1 atomic reservation 1 allowed (1/3)");
assert(q1Res.current === 1, "Quota count is 1");

// Request 2: allowed
const q2Res = await reserveDailyQuotaAtomic(d1Env);
assert(q2Res.allowed === true, "D1 atomic reservation 2 allowed (2/3)");
assert(q2Res.current === 2, "Quota count is 2");

// Request 3: allowed (reaches cap)
const q3Res = await reserveDailyQuotaAtomic(d1Env);
assert(q3Res.allowed === true, "D1 atomic reservation 3 allowed (3/3)");
assert(q3Res.current === 3, "Quota count is 3");

// Request 4: atomically blocked (WHERE count < maxDaily prevents update)
const q4Res = await reserveDailyQuotaAtomic(d1Env);
assert(q4Res.allowed === false, "D1 atomic reservation 4 rejected at cap");
assert(q4Res.quotaExceeded === true, "Flagged as quotaExceeded: true");

// Fail closed when D1 binding is unavailable
const failClosedRes = await reserveDailyQuotaAtomic({});
assert(failClosedRes.allowed === false, "Quota check fails closed when env.DB is missing");

// Inference failure refund: simulate model failure and verify slot is refunded
const todayStr = new Date().toISOString().slice(0, 10);
await refundDailyQuotaAtomic(d1Env, todayStr);
const q5Res = await reserveDailyQuotaAtomic(d1Env);
assert(q5Res.allowed === true, "Quota slot refunded after model failure, allowing next request");


// --- Suite 10: P1 Rate Limiting (Dual-Layer IP Protection) ---
console.log("\n--- Suite 10: P1 Rate Limiting (Dual-Layer IP Protection) ---");

const rlKV = new MockKV();
const rlEnv = { SESSIONS_KV: rlKV };
const testClientIp = "192.0.2.99";

let lastRl;
for (let i = 0; i < 15; i++) {
  const req = new Request("http://localhost/api/generate-mcqs", {
    method: "POST",
    headers: { "cf-connecting-ip": testClientIp },
  });
  lastRl = await checkRateLimit(req, rlEnv);
}
assert(lastRl.allowed === true, "First 15 requests in window allowed");

const req16 = new Request("http://localhost/api/generate-mcqs", {
  method: "POST",
  headers: { "cf-connecting-ip": testClientIp },
});
const rlBlocked = await checkRateLimit(req16, rlEnv);
assert(rlBlocked.allowed === false, "16th request in same window blocked by rate limiter");


// --- Suite 11: Graceful Fallback & Integration ---
console.log("\n--- Suite 11: Graceful Fallback & Integration ---");

const failedFetch = await fetchLLMGeneratedMCQs({
  targetJob: "Backend Developer",
  level: 1,
  skills: ["Java", "Spring Boot"],
  questionCount: 10,
  endpoint: "http://127.0.0.1:9999/down",
});
assert(failedFetch.success === false, "Unreachable AI endpoint reports success: false");
assert(failedFetch.fallbackRecommended === true, "Flags fallbackRecommended: true on error");

const asyncSession = await generateAssessmentQuestionsAsync({
  targetJob: "Backend Developer",
  skills: ["Java", "Spring Boot", "REST API", "SQL", "Docker"],
  level: 1,
  customEndpoint: "http://127.0.0.1:9999/down",
});
assert(asyncSession.questions.length >= 15, "Fallback session satisfies Level 1 minimum 15 questions floor");
assert(asyncSession.source === "local_procedural_generator", "Session cleanly uses local procedural generator");


// --- Suite 12: Assessment Scoring & Skill Level Promotion Compatibility ---
console.log("\n--- Suite 12: Assessment Scoring & Skill Level Promotion Compatibility ---");

const { updatedSkillLevels } = updateSkillLevelsFromAssessment({
  assessmentResult: {
    level: 2,
    score: 80,
    skillScores: { Java: 88, "Spring Boot": 100 },
    date: new Date().toISOString(),
    targetJob: "Backend Developer",
  },
  currentSkillLevels: {},
});
assert(updatedSkillLevels.Java && updatedSkillLevels.Java.currentLevel === "Advanced", "SkillLevelService promotes Java based on assessment");
assert(updatedSkillLevels["Spring Boot"] && updatedSkillLevels["Spring Boot"].currentLevel === "Advanced", "SkillLevelService promotes Spring Boot based on assessment");

const attemptComp = compareAssessmentAttempts({
  currentAttempt: { score: 80, skillScores: { Java: 88 }, level: 2, targetJob: "Backend Developer" },
  previousAttempt: { score: 60, skillScores: { Java: 50 }, level: 1, targetJob: "Backend Developer" },
  skillLevels: updatedSkillLevels,
});
assert(attemptComp.scoreDelta === 20, "Attempt comparison tracks delta (+20%)");
assert(attemptComp.scoreTrend === "improved", "Attempt scoreTrend marked as improved");


// --- Suite 13: Readiness Scoring Weight Invariant (40/30/20/10) ---
console.log("\n--- Suite 13: Readiness Scoring Weight Invariant (40/30/20/10) ---");

const readinessResult = calculateReadiness({
  skillGaps: [{ name: "Java", resumeScore: 80, required: 100 }],
  assessment: { score: 80, completed: true },
  assignmentStats: { completed: 2, total: 2 },
  profileStats: { profileCompletion: 90 },
});

// Formula: (80 * 0.40) + (80 * 0.30) + (100 * 0.20) + (90 * 0.10)
// = 32 + 24 + 20 + 9 = 85
assert(readinessResult.overall === 85, "Readiness score is exactly 85 points with assessment input");
assert(readinessResult.breakdown.assessment.weighted === 24, "Assessment strictly contributes 24 weighted points (30% of 80)");
assert(readinessResult.readinessType === "complete", "Readiness state is complete, not provisional");


// --- Suite 14: Configurable Worker Base URL & Endpoint Resolution (Defect 2) ---
console.log("\n--- Suite 14: Configurable Worker Base URL & Endpoint Resolution ---");

// 1. Relative local development routes
const defaultEp = resolveWorkerEndpoints();
assert(defaultEp.generate === "/api/generate-mcqs", "Default generate endpoint is /api/generate-mcqs");
assert(defaultEp.submit === "/api/submit-assessment", "Default submit endpoint is /api/submit-assessment");
assert(defaultEp.base === "", "Default base is empty string for local relative routes");

const emptyEp = resolveWorkerEndpoints("");
assert(emptyEp.generate === "/api/generate-mcqs", "Empty string input yields default relative generate endpoint");
assert(emptyEp.submit === "/api/submit-assessment", "Empty string input yields default relative submit endpoint");

const relativeGenEp = resolveWorkerEndpoints("/api/generate-mcqs");
assert(relativeGenEp.generate === "/api/generate-mcqs", "Exact /api/generate-mcqs input resolves generate");
assert(relativeGenEp.submit === "/api/submit-assessment", "Exact /api/generate-mcqs input resolves corresponding submit");

// 2. Separately configured Worker URL (Cloudflare Worker origin)
const originEp = resolveWorkerEndpoints("https://skillpoint-worker.user.workers.dev");
assert(originEp.generate === "https://skillpoint-worker.user.workers.dev/api/generate-mcqs", "Worker base URL resolves full generate endpoint");
assert(originEp.submit === "https://skillpoint-worker.user.workers.dev/api/submit-assessment", "Worker base URL resolves full submit endpoint");
assert(originEp.base === "https://skillpoint-worker.user.workers.dev", "Worker base extracted cleanly");

// 3. Trailing slash normalization
const trailingSlashEp = resolveWorkerEndpoints("https://skillpoint-worker.user.workers.dev/");
assert(trailingSlashEp.generate === "https://skillpoint-worker.user.workers.dev/api/generate-mcqs", "Trailing slash stripped on generate endpoint");
assert(trailingSlashEp.submit === "https://skillpoint-worker.user.workers.dev/api/submit-assessment", "Trailing slash stripped on submit endpoint");

// 4. Prevention of duplicated /api/api path segments
const apiPrefixEp = resolveWorkerEndpoints("https://skillpoint-worker.user.workers.dev/api");
assert(apiPrefixEp.generate === "https://skillpoint-worker.user.workers.dev/api/generate-mcqs", "Worker URL ending in /api does not duplicate /api segment");
assert(apiPrefixEp.submit === "https://skillpoint-worker.user.workers.dev/api/submit-assessment", "Worker URL ending in /api correctly produces /api/submit-assessment");

const apiSlashEp = resolveWorkerEndpoints("https://skillpoint-worker.user.workers.dev/api/");
assert(apiSlashEp.generate === "https://skillpoint-worker.user.workers.dev/api/generate-mcqs", "Worker URL ending in /api/ does not duplicate /api segment");
assert(apiSlashEp.submit === "https://skillpoint-worker.user.workers.dev/api/submit-assessment", "Worker URL ending in /api/ correctly produces /api/submit-assessment");

const fullGenEp = resolveWorkerEndpoints("https://skillpoint-worker.user.workers.dev/api/generate-mcqs");
assert(fullGenEp.generate === "https://skillpoint-worker.user.workers.dev/api/generate-mcqs", "Full generation endpoint resolves correctly");
assert(fullGenEp.submit === "https://skillpoint-worker.user.workers.dev/api/submit-assessment", "Full generation endpoint derives matching submit endpoint");

// 5. Parity of getWorkerEndpoints and static constants
const helperEp = getWorkerEndpoints();
assert(helperEp.generate === defaultEp.generate, "getWorkerEndpoints() generate matches resolveWorkerEndpoints()");
assert(helperEp.submit === defaultEp.submit, "getWorkerEndpoints() submit matches resolveWorkerEndpoints()");
assert(typeof WORKER_AI_ENDPOINT === "string" && WORKER_AI_ENDPOINT.length > 0, "WORKER_AI_ENDPOINT constant is exported non-empty string");
assert(typeof WORKER_SUBMIT_ENDPOINT === "string" && WORKER_SUBMIT_ENDPOINT.length > 0, "WORKER_SUBMIT_ENDPOINT constant is exported non-empty string");

// 6. submitLLMAssessmentAnswers validation
const missingAttemptId = await submitLLMAssessmentAnswers({
  attemptSecret: "secret_123",
  answers: [0, 1, 2],
});
assert(missingAttemptId.success === false, "Missing attemptId rejected immediately");
assert(missingAttemptId.error.includes("attemptId"), "Missing attemptId error message specifies attemptId");

const missingSecret = await submitLLMAssessmentAnswers({
  attemptId: "attempt_123",
  answers: [0, 1, 2],
});
assert(missingSecret.success === false, "Missing attemptSecret rejected immediately");
assert(missingSecret.error.includes("attemptSecret"), "Missing attemptSecret error message specifies attemptSecret");

// 7. submitLLMAssessmentAnswers network & endpoint routing tests with mock fetch
{
  const originalFetch = globalThis.fetch;
  let interceptedUrl = null;
  let interceptedBody = null;
  let interceptedMethod = null;

  try {
    // 7a. Worker Base URL routing
    globalThis.fetch = async (url, options) => {
      interceptedUrl = String(url);
      interceptedMethod = options.method;
      interceptedBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          success: true,
          score: 85,
          correctAnswers: 9,
          totalQuestions: 10,
          skillScores: { Java: 85 },
        }),
      };
    };

    const submitWithBase = await submitLLMAssessmentAnswers({
      attemptId: "att_xyz",
      attemptSecret: "sec_abc",
      answers: [1, 2, 3],
      workerBaseUrl: "https://custom-worker.workers.dev",
    });

    assert(interceptedUrl === "https://custom-worker.workers.dev/api/submit-assessment", "submitLLMAssessmentAnswers uses workerBaseUrl when provided");
    assert(interceptedMethod === "POST", "submitLLMAssessmentAnswers sends HTTP POST");
    assert(interceptedBody.attemptId === "att_xyz", "Payload contains attemptId");
    assert(interceptedBody.attemptSecret === "sec_abc", "Payload contains attemptSecret");
    assert(Array.isArray(interceptedBody.answers) && interceptedBody.answers.length === 3, "Payload contains answers array");
    assert(submitWithBase.success === true && submitWithBase.score === 85, "Successful response returns scored result");

    // 7b. Explicit submit endpoint routing
    const submitWithExplicit = await submitLLMAssessmentAnswers({
      attemptId: "att_xyz",
      attemptSecret: "sec_abc",
      answers: [0, 1],
      endpoint: "https://dedicated-origin.example.com/api/submit-assessment",
    });
    assert(interceptedUrl === "https://dedicated-origin.example.com/api/submit-assessment", "Explicit endpoint parameter overrides default");
    assert(submitWithExplicit.success === true, "Explicit endpoint submission succeeded");

    // 7c. Error response handling (e.g. HTTP 403 secret mismatch or replay)
    globalThis.fetch = async () => ({
      ok: false,
      status: 403,
      json: async () => ({ success: false, error: "Attempt secret mismatch" }),
    });

    const forbiddenResult = await submitLLMAssessmentAnswers({
      attemptId: "att_xyz",
      attemptSecret: "wrong_sec",
      answers: [0],
    });
    assert(forbiddenResult.success === false, "HTTP 403 response parsed as success: false");
    assert(forbiddenResult.error === "Attempt secret mismatch", "Server error message preserved");

    // 7d. Network error handling
    globalThis.fetch = async () => {
      throw new Error("Worker endpoint unreachable");
    };

    const networkErrResult = await submitLLMAssessmentAnswers({
      attemptId: "att_xyz",
      attemptSecret: "sec_abc",
      answers: [0],
    });
    assert(networkErrResult.success === false, "Network error parsed as success: false");
    assert(networkErrResult.error.includes("Worker endpoint unreachable"), "Network error message captured cleanly");
  } finally {
    globalThis.fetch = originalFetch;
  }
}

console.log("\n==================================================");
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: 0`);
console.log("==================================================");
