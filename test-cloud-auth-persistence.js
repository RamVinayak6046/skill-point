/**
 * Skill Point: Cloud Authentication, Persistence & Account Isolation Test Suite
 *
 * Verifies:
 *  1. Server-backed registration with Web Crypto PBKDF2-SHA256 password hashing
 *  2. Duplicate email rejection and credential validation
 *  3. Server-backed login and session token issuance
 *  4. Active session validation (GET /api/auth/me) and Bearer token parsing
 *  5. Session invalidation on logout
 *  6. User A vs User B data isolation (zero cross-account leakage)
 *  7. Cross-device synchronization (Device 1 save -> Device 2 load)
 *  8. Zero-record cold start metrics (0 assessments, 0 assignments, honest empty states)
 *  9. Progress reset scoping (resets only target user's progress records)
 * 10. Defensive error handling (unauthorized 401, malformed JSON 400, not found 404)
 */

import assert from 'node:assert';
import worker from './worker/src/index.js';
import { verifyPassword } from './worker/src/helpers.js';
import { calculateReadiness } from './src/hooks/useReadiness.js';

console.log('==================================================');
console.log('SKILL POINT: CLOUD AUTH & PERSISTENCE TEST SUITE');
console.log('==================================================\n');

/**
 * In-memory Mock Cloudflare KV
 */
class MockKV {
  constructor() {
    this.store = new Map();
  }
  async get(key) {
    return this.store.get(key) || null;
  }
  async put(key, value) {
    this.store.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
  async delete(key) {
    this.store.delete(key);
  }
}

/**
 * In-memory Mock Cloudflare D1 supporting all tables:
 * users, user_sessions, user_records, assessment_attempts, daily_quota
 */
class MockD1Full {
  constructor() {
    this.users = new Map(); // id -> userRow
    this.usersByEmail = new Map(); // email -> userRow
    this.sessions = new Map(); // token -> sessionRow
    this.records = new Map(); // `${user_id}:${data_key}` -> recordRow
    this.dailyQuota = new Map();
    this.attempts = new Map();
  }

  prepare(sql) {
    const self = this;
    const cleanSql = sql.replace(/\s+/g, ' ').trim();

    return {
      bind(...params) {
        return {
          async first() {
            // SELECT id FROM users WHERE email = ?
            if (cleanSql.includes('SELECT id FROM users WHERE email = ?')) {
              const email = String(params[0] || '').toLowerCase();
              return self.usersByEmail.get(email) || null;
            }

            // SELECT id, email, name, password_hash, salt FROM users WHERE email = ?
            if (cleanSql.includes('FROM users WHERE email = ?')) {
              const email = String(params[0] || '').toLowerCase();
              return self.usersByEmail.get(email) || null;
            }

            // SELECT s.user_id, s.expires_at, u.email, u.name FROM user_sessions s JOIN users u ...
            if (cleanSql.includes('FROM user_sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?')) {
              const token = params[0];
              const sess = self.sessions.get(token);
              if (!sess) return null;
              const u = self.users.get(sess.user_id);
              if (!u) return null;
              return {
                user_id: sess.user_id,
                expires_at: sess.expires_at,
                email: u.email,
                name: u.name,
              };
            }

            // SELECT user_id, expires_at FROM user_sessions WHERE token = ?
            if (cleanSql.includes('FROM user_sessions WHERE token = ?')) {
              const token = params[0];
              return self.sessions.get(token) || null;
            }

            return null;
          },

          async all() {
            // SELECT data_key, data_value, updated_at FROM user_records WHERE user_id = ?
            if (cleanSql.includes('FROM user_records WHERE user_id = ?')) {
              const userId = params[0];
              const results = [];
              for (const row of self.records.values()) {
                if (row.user_id === userId) {
                  results.push({
                    data_key: row.data_key,
                    data_value: row.data_value,
                    updated_at: row.updated_at,
                  });
                }
              }
              return { results };
            }

            return { results: [] };
          },

          async run() {
            // INSERT INTO users
            if (cleanSql.includes('INSERT INTO users')) {
              const [id, email, name, password_hash, salt, created_at, updated_at] = params;
              const row = { id, email, name, password_hash, salt, created_at, updated_at };
              self.users.set(id, row);
              self.usersByEmail.set(email.toLowerCase(), row);
              return { success: true };
            }

            // INSERT INTO user_sessions
            if (cleanSql.includes('INSERT INTO user_sessions')) {
              const [token, user_id, created_at, expires_at] = params;
              self.sessions.set(token, { token, user_id, created_at, expires_at });
              return { success: true };
            }

            // DELETE FROM user_sessions WHERE token = ?
            if (cleanSql.includes('DELETE FROM user_sessions WHERE token = ?')) {
              const token = params[0];
              self.sessions.delete(token);
              return { success: true };
            }

            // INSERT INTO user_records
            if (cleanSql.includes('INSERT INTO user_records')) {
              const [user_id, data_key, data_value, updated_at] = params;
              const key = `${user_id}:${data_key}`;
              self.records.set(key, { user_id, data_key, data_value, updated_at });
              return { success: true };
            }

            // DELETE FROM user_records WHERE user_id = ? AND data_key IN ...
            if (cleanSql.includes('DELETE FROM user_records WHERE user_id = ?')) {
              const userId = params[0];
              const keysToDelete = [
                'skillPointAssessment',
                'skillPointAssessmentHistory',
                'skillPointAssignments',
                'skillPointAssignmentSubmissions',
                'skillPointDynamicAssignments',
                'skillPointAssessmentLevel',
                'skillPointSkillLevels',
                'skillPointLearningProgress',
                'skillPointProgressHistory',
                'skillPointActivityLog',
              ];
              for (const key of keysToDelete) {
                self.records.delete(`${userId}:${key}`);
              }
              return { success: true };
            }

            return { success: true };
          },
        };
      },
    };
  }

  async batch(statements) {
    for (const stmt of statements) {
      await stmt.run();
    }
    return { success: true };
  }
}

// Setup test environment
const mockKV = new MockKV();
const mockDB = new MockD1Full();
const env = {
  DB: mockDB,
  SESSIONS_KV: mockKV,
  MAX_DAILY_REQUESTS: '100',
};

// -------------------------------------------------------------
// Suite 1: Server-Backed Registration & Password Hashing
// -------------------------------------------------------------
console.log('--- Suite 1: Server-Backed Registration & Password Hashing ---');

// 1. Valid Registration
const regReq1 = new Request('http://localhost/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Alice Developer',
    email: 'alice@example.com',
    password: 'securePassword123',
  }),
});
const regRes1 = await worker.fetch(regReq1, env);
assert(regRes1.status === 200, 'Registration returns HTTP 200 OK');
const regData1 = await regRes1.json();
assert(regData1.success === true, 'Registration reports success: true');
assert(regData1.user.name === 'Alice Developer', 'Registered name preserved');
assert(regData1.user.email === 'alice@example.com', 'Registered email preserved');
assert(typeof regData1.token === 'string' && regData1.token.startsWith('ssp_'), 'Issues high-entropy session token');

// Verify DB record
const aliceInDb = mockDB.usersByEmail.get('alice@example.com');
assert(aliceInDb !== undefined, 'User record created in database');
assert(aliceInDb.password_hash !== 'securePassword123', 'Password is NOT plaintext in database');
assert(aliceInDb.salt && aliceInDb.salt.length === 32, '16-byte random salt stored in database');
const passValid = await verifyPassword('securePassword123', aliceInDb.password_hash, aliceInDb.salt);
assert(passValid === true, 'Stored PBKDF2 hash verifies against raw password');

// 2. Duplicate Registration Rejection
const dupRegReq = new Request('http://localhost/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Alice Duplicate',
    email: 'alice@example.com', // Duplicate
    password: 'differentPassword456',
  }),
});
const dupRegRes = await worker.fetch(dupRegReq, env);
assert(dupRegRes.status === 409, 'Duplicate email rejected with HTTP 409 Conflict');

// 3. Short Password Rejection
const shortPassReq = new Request('http://localhost/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Short Pass',
    email: 'short@example.com',
    password: '123',
  }),
});
const shortPassRes = await worker.fetch(shortPassReq, env);
assert(shortPassRes.status === 400, 'Short password (< 6 chars) rejected with HTTP 400');

// 4. Invalid Email Rejection
const badEmailReq = new Request('http://localhost/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Bad Email',
    email: 'not-an-email',
    password: 'validPassword123',
  }),
});
const badEmailRes = await worker.fetch(badEmailReq, env);
assert(badEmailRes.status === 400, 'Malformed email rejected with HTTP 400');
console.log('✓ PASS: Server-backed registration and PBKDF2 hashing verified.');

// -------------------------------------------------------------
// Suite 2: Server-Backed Login & Session Token Resolution
// -------------------------------------------------------------
console.log('\n--- Suite 2: Server-Backed Login & Session Token Resolution ---');

// 1. Correct Credentials Login
const loginReq1 = new Request('http://localhost/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'alice@example.com',
    password: 'securePassword123',
  }),
});
const loginRes1 = await worker.fetch(loginReq1, env);
assert(loginRes1.status === 200, 'Login returns HTTP 200 OK');
const loginData1 = await loginRes1.json();
assert(loginData1.success === true, 'Login reports success: true');
assert(loginData1.user.email === 'alice@example.com', 'Login returns authenticated user');
const aliceTokenDevice1 = loginData1.token;

// 2. Incorrect Password
const wrongPassReq = new Request('http://localhost/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'alice@example.com',
    password: 'wrongPassword999',
  }),
});
const wrongPassRes = await worker.fetch(wrongPassReq, env);
assert(wrongPassRes.status === 401, 'Incorrect password rejected with HTTP 401 Unauthorized');

// 3. Non-existent User
const nonExistentReq = new Request('http://localhost/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'ghost@example.com',
    password: 'anyPassword123',
  }),
});
const nonExistentRes = await worker.fetch(nonExistentReq, env);
assert(nonExistentRes.status === 401, 'Non-existent account rejected with HTTP 401');

// 4. Session Verification: GET /api/auth/me with Bearer token
const meReq = new Request('http://localhost/api/auth/me', {
  method: 'GET',
  headers: { Authorization: `Bearer ${aliceTokenDevice1}` },
});
const meRes = await worker.fetch(meReq, env);
assert(meRes.status === 200, 'Session verification returns HTTP 200 OK');
const meData = await meRes.json();
assert(meData.success === true, 'Session is verified');
assert(meData.user.email === 'alice@example.com', 'Resolves correct authenticated identity');

// 5. Tampered Bearer Token
const fakeTokenReq = new Request('http://localhost/api/auth/me', {
  method: 'GET',
  headers: { Authorization: 'Bearer ssp_tampered_invalid_token' },
});
const fakeTokenRes = await worker.fetch(fakeTokenReq, env);
assert(fakeTokenRes.status === 401, 'Invalid/forged token rejected with HTTP 401');
console.log('✓ PASS: Server login and Bearer token resolution verified.');

// -------------------------------------------------------------
// Suite 3: Session Invalidation & Logout
// -------------------------------------------------------------
console.log('\n--- Suite 3: Session Invalidation & Logout ---');

const logoutReq = new Request('http://localhost/api/auth/logout', {
  method: 'POST',
  headers: { Authorization: `Bearer ${aliceTokenDevice1}` },
});
const logoutRes = await worker.fetch(logoutReq, env);
assert(logoutRes.status === 200, 'Logout returns HTTP 200 OK');

// Verify token is now dead
const postLogoutReq = new Request('http://localhost/api/auth/me', {
  method: 'GET',
  headers: { Authorization: `Bearer ${aliceTokenDevice1}` },
});
const postLogoutRes = await worker.fetch(postLogoutReq, env);
assert(postLogoutRes.status === 401, 'Invalidated token rejected after logout with HTTP 401');
console.log('✓ PASS: Token invalidation on logout verified.');

// -------------------------------------------------------------
// Suite 4: Cross-Device Synchronization (Device 1 Save -> Device 2 Read)
// -------------------------------------------------------------
console.log('\n--- Suite 4: Cross-Device Synchronization ---');

// Device 1: Alice logs in
const dev1LoginReq = new Request('http://localhost/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'alice@example.com', password: 'securePassword123' }),
});
const dev1LoginRes = await worker.fetch(dev1LoginReq, env);
const dev1Token = (await dev1LoginRes.json()).token;

// Device 1: Alice updates her profile, sets target job to Full Stack Developer, and logs assessment
const dev1Updates = {
  skillPointTargetJob: 'Full Stack Developer',
  skillPointProfile: {
    name: 'Alice Developer',
    email: 'alice@example.com',
    degree: 'B.Tech',
    branch: 'Computer Science',
    college: 'Engineering Institute of Technology',
    experience: '1 year internship',
  },
  skillPointAssessment: {
    targetJob: 'Full Stack Developer',
    score: 85,
    level: 2,
    completed: true,
    timestamp: new Date().toISOString(),
  },
  skillPointAssessmentHistory: [
    { targetJob: 'Full Stack Developer', score: 85, level: 2, completed: true },
  ],
  skillPointAssignments: {
    'task-fullstack-01': true,
  },
  skillPointLearningProgress: {
    completedLessons: ['lesson-react-101', 'lesson-node-102'],
    courseProgress: { 'react-fundamentals': 50 },
  },
};

const saveReq = new Request('http://localhost/api/user/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${dev1Token}`,
  },
  body: JSON.stringify({ updates: dev1Updates }),
});
const saveRes = await worker.fetch(saveReq, env);
assert(saveRes.status === 200, 'Device 1 save succeeds with HTTP 200 OK');

// Device 2: Alice logs in on another browser/device (fresh token)
const dev2LoginReq = new Request('http://localhost/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'alice@example.com', password: 'securePassword123' }),
});
const dev2Token = (await (await worker.fetch(dev2LoginReq, env)).json()).token;

// Device 2: Fetches user data from cloud
const dev2FetchReq = new Request('http://localhost/api/user/data', {
  method: 'GET',
  headers: { Authorization: `Bearer ${dev2Token}` },
});
const dev2FetchRes = await worker.fetch(dev2FetchReq, env);
assert(dev2FetchRes.status === 200, 'Device 2 fetch succeeds with HTTP 200 OK');
const dev2CloudData = (await dev2FetchRes.json()).data;

assert(dev2CloudData.skillPointTargetJob === 'Full Stack Developer', 'Device 2 synchronizes target job');
assert(dev2CloudData.skillPointProfile.college === 'Engineering Institute of Technology', 'Device 2 synchronizes college');
assert(dev2CloudData.skillPointAssessment.score === 85, 'Device 2 synchronizes assessment score (85%)');
assert(dev2CloudData.skillPointAssessmentHistory.length === 1, 'Device 2 synchronizes assessment history');
assert(dev2CloudData.skillPointAssignments['task-fullstack-01'] === true, 'Device 2 synchronizes assignment completion');
assert(dev2CloudData.skillPointLearningProgress.completedLessons.length === 2, 'Device 2 synchronizes lesson progress');
console.log('✓ PASS: Cross-device data synchronization verified.');

// -------------------------------------------------------------
// Suite 5: User A vs User B Data Isolation (Strict Account Separation)
// -------------------------------------------------------------
console.log('\n--- Suite 5: User A vs User B Data Isolation ---');

// Register Bob (User B)
const regBobReq = new Request('http://localhost/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Bob Engineer',
    email: 'bob@example.com',
    password: 'bobPassword456',
  }),
});
const regBobData = await (await worker.fetch(regBobReq, env)).json();
const bobToken = regBobData.token;

// Bob fetches his data: must be pristine, zero Alice data
const bobDataReq = new Request('http://localhost/api/user/data', {
  method: 'GET',
  headers: { Authorization: `Bearer ${bobToken}` },
});
const bobData = (await (await worker.fetch(bobDataReq, env)).json()).data;

assert(bobData.skillPointProfile.name === 'Bob Engineer', 'Bob gets his own profile name');
assert(bobData.skillPointProfile.email === 'bob@example.com', 'Bob gets his own email');
assert(bobData.skillPointProfile.college === '', 'Bob does not inherit Alice college');
assert(bobData.skillPointAssessment === undefined, 'Bob has zero assessments (no Alice assessment leak)');
assert(bobData.skillPointAssessmentHistory === undefined, 'Bob has empty assessment history');
assert(bobData.skillPointAssignments === undefined, 'Bob has zero completed assignments');
assert(bobData.skillPointLearningProgress === undefined, 'Bob has zero completed lessons');

// Progress Reset for Bob does NOT affect Alice
const bobResetReq = new Request('http://localhost/api/user/reset-progress', {
  method: 'POST',
  headers: { Authorization: `Bearer ${bobToken}` },
});
const bobResetRes = await worker.fetch(bobResetReq, env);
assert(bobResetRes.status === 200, 'Bob reset progress returns HTTP 200');

// Verify Alice data is completely untouched
const aliceCheckReq = new Request('http://localhost/api/user/data', {
  method: 'GET',
  headers: { Authorization: `Bearer ${dev2Token}` },
});
const aliceCheckData = (await (await worker.fetch(aliceCheckReq, env)).json()).data;
assert(aliceCheckData.skillPointAssessment.score === 85, 'Alice assessment remains intact after Bob reset');
assert(aliceCheckData.skillPointAssignments['task-fullstack-01'] === true, 'Alice assignments remain intact');
console.log('✓ PASS: Strict account isolation and scoping verified.');

// -------------------------------------------------------------
// Suite 6: Zero Data & Honest Readiness Baseline Verification
// -------------------------------------------------------------
console.log('\n--- Suite 6: Zero Data & Honest Readiness Baseline Verification ---');

// Bob has no assessments, no assignments, no resume
const bobReadiness = calculateReadiness({
  skillGaps: [
    { name: 'JavaScript', current: 0, required: 80, resumeScore: 0 },
    { name: 'React', current: 0, required: 80, resumeScore: 0 },
  ],
  assessment: null, // Not taken
  assignmentStats: { completed: 0, total: 4 },
  profileStats: { profileCompletion: 25, resumeUploaded: false },
});

assert(bobReadiness.isProvisional === true, 'Readiness is provisional when assessment is not taken');
assert(bobReadiness.breakdown.assessment.score === 0, 'Assessment score is 0%');
assert(bobReadiness.breakdown.assessment.status === 'not_taken', 'Assessment status is honestly not_taken');
assert(bobReadiness.breakdown.practical.score === 0, 'Practical score is 0%');
assert(bobReadiness.breakdown.skillMatch.score === 0, 'Skill match score is 0% with no resume');
assert(bobReadiness.overall === 3, 'Overall readiness is only honest profile credit (10% of 25 = 2.5 clamped to 3)');
console.log('✓ PASS: Honest zero-data metrics and provisional readiness verified.');

// -------------------------------------------------------------
// Suite 7: Defensive Error Handling & Input Validation
// -------------------------------------------------------------
console.log('\n--- Suite 7: Defensive Error Handling ---');

// Missing token on protected endpoint
const unauthReq = new Request('http://localhost/api/user/data', { method: 'GET' });
const unauthRes = await worker.fetch(unauthReq, env);
assert(unauthRes.status === 401, 'Protected endpoint without token returns HTTP 401');

// Malformed body on POST
const badJsonReq = new Request('http://localhost/api/user/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${bobToken}`,
  },
  body: 'this is not json',
});
const badJsonRes = await worker.fetch(badJsonReq, env);
assert(badJsonRes.status === 400, 'Malformed JSON returns HTTP 400');

// Non-existent route
const nonRouteReq = new Request('http://localhost/api/nonexistent-route', { method: 'GET' });
const nonRouteRes = await worker.fetch(nonRouteReq, env);
assert(nonRouteRes.status === 404, 'Non-existent endpoint returns HTTP 404');
console.log('✓ PASS: Error boundaries and HTTP statuses verified.');

console.log('\n==================================================');
console.log('ALL CLOUD AUTH & PERSISTENCE TESTS PASSED (100%)');
console.log('==================================================');
