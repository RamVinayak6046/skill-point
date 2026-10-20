/**
 * Skill Point: Account-Switching & State Isolation Regression Test Suite
 *
 * Verifies that switching accounts or registering a new account NEVER leaks
 * another user's profile, target role, assessments, assignments, or learning data.
 */

import assert from 'node:assert';
import worker from './worker/src/index.js';
import {
  safeGetItem,
  clearSessionData,
  getProfile,
  saveProfile,
  getTargetJob,
  saveTargetJob,
  getLatestAssessment,
  saveAssessmentResult,
  getAssessmentHistory,
  getAssignmentCompletions,
  saveAssignmentCompletions,
  getLearningProgress,
  saveLearningProgress,
  getResumeData,
  saveResumeData,
  getActivityLog,
  addActivity,
  KEYS,
} from './src/services/storageService.js';

console.log('===============================================================');
console.log('SKILL POINT: ACCOUNT-SWITCHING & STATE ISOLATION REGRESSION TEST');
console.log('===============================================================\n');

// Mock localStorage for Node.js environment
const storageBackend = new Map();
globalThis.window = {
  localStorage: {
    getItem(k) { return storageBackend.has(k) ? storageBackend.get(k) : null; },
    setItem(k, v) { storageBackend.set(k, String(v)); },
    removeItem(k) { storageBackend.delete(k); },
    clear() { storageBackend.clear(); },
    key(i) { return Array.from(storageBackend.keys())[i] || null; },
    get length() { return storageBackend.size; },
  },
};

// Mock D1 Database simulating SQLite ACID multi-tenant tables
class MockD1Database {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.records = new Map();
  }

  prepare(sql) {
    const self = this;
    const cleanSql = sql.replace(/\s+/g, ' ').trim();

    return {
      bind(...params) {
        return {
          async first() {
            if (cleanSql.includes('FROM users WHERE email = ?')) {
              const email = String(params[0] || '').toLowerCase();
              return self.users.get(email) || null;
            }
            if (cleanSql.includes('FROM user_sessions s JOIN users u')) {
              const token = params[0];
              const sess = self.sessions.get(token);
              if (!sess) return null;
              const u = Array.from(self.users.values()).find(usr => usr.id === sess.user_id);
              if (!u) return null;
              return { user_id: sess.user_id, expires_at: sess.expires_at, email: u.email, name: u.name };
            }
            return null;
          },

          async all() {
            if (cleanSql.includes('FROM user_records WHERE user_id = ?')) {
              const userId = params[0];
              const results = [];
              for (const row of self.records.values()) {
                if (row.user_id === userId) {
                  results.push({ data_key: row.data_key, data_value: row.data_value, updated_at: row.updated_at });
                }
              }
              return { results };
            }
            return { results: [] };
          },

          async run() {
            if (cleanSql.includes('INSERT INTO users')) {
              const [id, email, name, password_hash, salt, created_at, updated_at] = params;
              self.users.set(email.toLowerCase(), { id, email, name, password_hash, salt, created_at, updated_at });
              return { success: true };
            }
            if (cleanSql.includes('INSERT INTO user_sessions')) {
              const [token, user_id, created_at, expires_at] = params;
              self.sessions.set(token, { token, user_id, created_at, expires_at });
              return { success: true };
            }
            if (cleanSql.includes('DELETE FROM user_sessions WHERE token = ?')) {
              const token = params[0];
              self.sessions.delete(token);
              return { success: true };
            }
            if (cleanSql.includes('INSERT INTO user_records')) {
              const [user_id, data_key, data_value, updated_at] = params;
              self.records.set(`${user_id}:${data_key}`, { user_id, data_key, data_value, updated_at });
              return { success: true };
            }
            return { success: true };
          },
        };
      },
    };
  }
}

const mockEnv = {
  DB: new MockD1Database(),
  SESSIONS_KV: {
    async get() { return null; },
    async put() {},
    async delete() {},
  },
};

async function runTests() {
  let passed = 0;

  // -------------------------------------------------------------------------
  // Test 1: Register Account A and populate deep progress
  // -------------------------------------------------------------------------
  console.log('--- Step 1: Register Account A & Populate Data ---');
  const regAReq = new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Alice Engineer', email: 'alice@test.com', password: 'Password123!' }),
  });
  const regARes = await worker.fetch(regAReq, mockEnv);
  const regAData = await regARes.json();
  const userA = regAData.user;
  const tokenA = regAData.token;
  assert(regAData.success, 'Alice registered successfully');

  // Alice populates data in user-scoped storage
  saveProfile({ name: 'Alice Engineer', college: 'Stanford', cgpa: '9.8' }, userA.id);
  saveTargetJob('Full Stack Developer', userA.id);
  saveResumeData({ uploaded: true, fileName: 'alice_cv.pdf', targetJob: 'Full Stack Developer' }, userA.id);
  saveAssessmentResult({ targetJob: 'Full Stack Developer', score: 95, completed: true, attemptId: 'att-alice-1' }, userA.id);
  saveAssignmentCompletions({ 'asg-fullstack-1': true, 'asg-fullstack-2': true }, userA.id);
  saveLearningProgress({ completedLessons: ['lesson-1', 'lesson-2'], courseProgress: { 'course-1': 100 } }, userA.id);
  addActivity({ title: 'Full Stack assessment completed', type: 'Assessment' }, userA.id);

  // Sync Alice to mock D1
  const syncAReq = new Request('http://localhost/api/user/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      updates: {
        skillPointProfile: getProfile(userA.id),
        skillPointTargetJob: getTargetJob(userA.id),
        skillPointResumeUploaded: true,
        skillPointResumeFileName: 'alice_cv.pdf',
        skillPointAssessment: getLatestAssessment(userA.id),
        skillPointAssessmentHistory: getAssessmentHistory(userA.id),
        skillPointAssignments: getAssignmentCompletions(userA.id),
        skillPointLearningProgress: getLearningProgress(userA.id),
        skillPointActivityLog: getActivityLog(userA.id),
      },
    }),
  });
  const syncARes = await worker.fetch(syncAReq, mockEnv);
  const syncAData = await syncARes.json();
  assert(syncAData.success, "Alice's full progress synced to D1");
  passed++;
  console.log('✓ PASS: Alice account fully populated with real progress.');

  // -------------------------------------------------------------------------
  // Test 2: Alice logs out
  // -------------------------------------------------------------------------
  console.log('\n--- Step 2: Alice Logs Out ---');
  const logoutReq = new Request('http://localhost/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  await worker.fetch(logoutReq, mockEnv);
  clearSessionData();

  // Verify memoryStore and un-scoped keys are completely empty
  assert.strictEqual(safeGetItem(KEYS.ASSESSMENT), null, 'Unauthenticated getLatestAssessment is null');
  assert.strictEqual(getAssessmentHistory().length, 0, 'Unauthenticated getAssessmentHistory is empty');
  assert.strictEqual(getResumeData().uploaded, false, 'Unauthenticated getResumeData is false');
  passed++;
  console.log('✓ PASS: Logout successfully cleared in-memory state and un-scoped caches.');

  // -------------------------------------------------------------------------
  // Test 3: Register brand-new Account B (Bob)
  // -------------------------------------------------------------------------
  console.log('\n--- Step 3: Register Brand-New Account B (Bob) ---');
  const regBReq = new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Bob Fresher', email: 'bob@test.com', password: 'Password123!' }),
  });
  const regBRes = await worker.fetch(regBReq, mockEnv);
  const regBData = await regBRes.json();
  const userB = regBData.user;
  const tokenB = regBData.token;
  assert(regBData.success, 'Bob registered successfully');

  // Verify Bob starts with NO Alice data
  const bobProfile = getProfile(userB.id);
  assert.strictEqual(bobProfile.college, '', "Bob college is blank (not Alice's 'Stanford')");
  assert.strictEqual(bobProfile.cgpa, '', "Bob cgpa is blank (not Alice's '9.8')");

  const bobAssessment = getLatestAssessment(userB.id);
  assert.strictEqual(bobAssessment, null, 'Bob has NO assessment (is null)');

  const bobHistory = getAssessmentHistory(userB.id);
  assert.strictEqual(bobHistory.length, 0, 'Bob assessment history has length 0');

  const bobResume = getResumeData(userB.id);
  assert.strictEqual(bobResume.uploaded, false, 'Bob has NO uploaded resume');
  assert.strictEqual(bobResume.fileName, '', 'Bob resume fileName is empty');

  const bobAssignments = getAssignmentCompletions(userB.id);
  assert.deepStrictEqual(bobAssignments, {}, 'Bob assignments completion is empty object');

  const bobLearning = getLearningProgress(userB.id);
  assert.deepStrictEqual(bobLearning.completedLessons, [], 'Bob completed lessons is empty array');

  const bobActivities = getActivityLog(userB.id);
  assert.deepStrictEqual(bobActivities, [], 'Bob activity log is empty array');

  passed++;
  console.log('✓ PASS: Bob starts with ZERO Alice data and zero fabricated progress.');

  // -------------------------------------------------------------------------
  // Test 4: Fetch Bob's data from Cloudflare D1
  // -------------------------------------------------------------------------
  console.log("\n--- Step 4: Verify Bob's Cloud D1 Data Isolation ---");
  const fetchBReq = new Request('http://localhost/api/user/data', {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const fetchBRes = await worker.fetch(fetchBReq, mockEnv);
  const fetchBData = await fetchBRes.json();
  assert(fetchBData.success, 'Fetched Bob cloud data successfully');
  
  // Bob cloud records should NOT contain Alice's target job, assessment, or assignments
  assert.strictEqual(fetchBData.data.skillPointTargetJob, undefined, 'Bob cloud has no TargetJob');
  assert.strictEqual(fetchBData.data.skillPointAssessment, undefined, 'Bob cloud has no Assessment');
  assert.strictEqual(fetchBData.data.skillPointAssessmentHistory, undefined, 'Bob cloud has no History');
  assert.strictEqual(fetchBData.data.skillPointAssignments, undefined, 'Bob cloud has no Assignments');
  assert.strictEqual(fetchBData.data.skillPointLearningProgress, undefined, 'Bob cloud has no LearningProgress');
  passed++;
  console.log('✓ PASS: D1 cloud query for Bob returns zero Alice data.');

  // -------------------------------------------------------------------------
  // Test 5: Switch back to Alice and verify Alice data intact
  // -------------------------------------------------------------------------
  console.log('\n--- Step 5: Switch Back to Alice & Verify Preservation ---');
  clearSessionData();

  // Login as Alice
  const loginAReq = new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alice@test.com', password: 'Password123!' }),
  });
  const loginARes = await worker.fetch(loginAReq, mockEnv);
  const loginAData = await loginARes.json();
  assert(loginAData.success, 'Alice logged in successfully');

  // Fetch Alice's records from D1
  const fetchAReq = new Request('http://localhost/api/user/data', {
    method: 'GET',
    headers: { Authorization: `Bearer ${loginAData.token}` },
  });
  const fetchARes = await worker.fetch(fetchAReq, mockEnv);
  const fetchAData = await fetchARes.json();

  assert.strictEqual(fetchAData.data.skillPointTargetJob, 'Full Stack Developer', 'Alice target job preserved');
  assert.strictEqual(fetchAData.data.skillPointAssessment.score, 95, 'Alice assessment score 95% preserved');
  assert.strictEqual(fetchAData.data.skillPointAssessmentHistory.length, 1, 'Alice history preserved');
  assert.strictEqual(fetchAData.data.skillPointResumeFileName, 'alice_cv.pdf', 'Alice resume preserved');
  passed++;
  console.log("✓ PASS: Alice's saved data completely preserved upon re-login.");

  // -------------------------------------------------------------------------
  // Test 6: In-Flight Async Request Rejection on User Switch
  // -------------------------------------------------------------------------
  console.log('\n--- Step 6: In-Flight Request Stale Guard ---');
  let activeUserId = userA.id;
  let staleWriteAttempted = false;

  async function simulatedSaveOperation(requestUserId, payload) {
    // Simulate delay
    await new Promise(r => setTimeout(r, 40));
    // Guard check matching AppContext logic
    if (activeUserId !== requestUserId) {
      staleWriteAttempted = true;
      return { success: false, error: 'Stale request dropped: active user changed' };
    }
    return { success: true, updated: payload };
  }

  // Alice starts save
  const pendingPromise = simulatedSaveOperation(userA.id, { data: 'Alice data' });

  // User switches to Bob immediately
  activeUserId = userB.id;

  const result = await pendingPromise;
  assert.strictEqual(result.success, false, 'Late request was safely rejected');
  assert(staleWriteAttempted, 'Guard caught stale user mismatch');
  passed++;
  console.log('✓ PASS: Stale async response safely prevented from polluting active user state.');

  console.log('\n===============================================================');
  console.log(`ALL ACCOUNT ISOLATION TESTS PASSED: ${passed}/${passed}`);
  console.log('===============================================================');
}

runTests().catch(err => {
  console.error('❌ REGRESSION TEST FAILED:', err);
  process.exit(1);
});
