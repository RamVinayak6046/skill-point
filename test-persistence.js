/**
 * Test Suite: Persistence and State Recovery
 * Covers Step 4 hardening:
 * 1. Safe JSON parsing with malformed/truncated strings and typed fallbacks
 * 2. Type mismatch resilience (e.g. string where array expected)
 * 3. User account isolation (User A vs User B data namespaces)
 * 4. Backward-compatible migration from legacy un-scoped storage keys
 * 5. Explicit progress reset vs clearing all data (preserves auth and registered accounts)
 * 6. Atomic import validation & rejection of corrupted/invalid payloads
 * 7. Storage quota / write failure graceful memory fallback
 */

import {
  KEYS,
  safeParse,
  getUserStorageKey,
  safeGetItem,
  safeSetItem,
  migrateLegacyDataToUser,
  getProfile,
  saveProfile,
  getTargetJob,
  saveTargetJob,
  getAssessmentHistory,
  saveAssessmentResult,
  getAssignmentSubmissions,
  saveAssignmentSubmissions,
  resetProgressData,
  clearAllData,
  validateImportData,
  importData,
  exportAllData,
  saveAuthUser,
  getAuthUser,
  clearAuth,
  getRegisteredUsers,
  registerUser,
  updateRegisteredUser,
  hashPasswordWithSalt,
  verifyPassword,
  PBKDF2_ITERATIONS,
  SALT_BYTE_LENGTH,
  getActivityLog,
  getSavedJDs,
  getCustomJobs,
} from './src/services/storageService.js';

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

// Mock localStorage for Node.js test environment
const mockStorage = new Map();
global.window = {
  localStorage: {
    getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
    setItem: (key, val) => mockStorage.set(key, String(val)),
    removeItem: (key) => mockStorage.delete(key),
    clear: () => mockStorage.clear(),
    get length() {
      return mockStorage.size;
    },
    key: (i) => Array.from(mockStorage.keys())[i] || null,
  },
};
global.localStorage = global.window.localStorage;

console.log("==================================================");
console.log("SKILL POINT: PERSISTENCE & STATE RECOVERY SUITE");
console.log("==================================================\n");

// --- Suite 1: Defensive JSON Parsing & Type Fallbacks ---
console.log("--- Suite 1: Defensive JSON Parsing & Type Fallbacks ---");

// 1. Malformed JSON string
const malformedJson = "{ title: 'missing quotes', broken ";
const safeObj = safeParse(malformedJson, { default: true });
assert(safeObj.default === true, "Malformed JSON safely returns object fallback without crashing");

// 2. Truncated array
const truncatedArray = "[1, 2, 3,";
const safeArr = safeParse(truncatedArray, []);
assert(Array.isArray(safeArr) && safeArr.length === 0, "Truncated array safely returns empty array fallback");

// 3. Type mismatch: expected array, got plain string
const stringInsteadOfArray = '"just a plain string"';
const typeGuardedArr = safeParse(stringInsteadOfArray, []);
assert(Array.isArray(typeGuardedArr) && typeGuardedArr.length === 0, "String stored where Array expected returns fallback Array");

// 4. Type mismatch: expected object, got number
const numberInsteadOfObj = '42';
const typeGuardedObj = safeParse(numberInsteadOfObj, {});
assert(typeof typeGuardedObj === 'object' && !Array.isArray(typeGuardedObj), "Number stored where Object expected returns fallback Object");

// 5. Null or undefined values
assert(safeParse(null, "fallback") === "fallback", "null input returns fallback");
assert(safeParse(undefined, 100) === 100, "undefined input returns fallback");


// --- Suite 2: Account Scoping & Multi-User Isolation ---
console.log("\n--- Suite 2: Account Scoping & Multi-User Isolation ---");
mockStorage.clear();

const userA = "student_alpha@example.com";
const userB = "student_beta@example.com";

// Verify key format
const keyA = getUserStorageKey(KEYS.ASSESSMENT, userA);
const keyB = getUserStorageKey(KEYS.ASSESSMENT, userB);
assert(keyA !== keyB, "Storage keys for different users are strictly isolated");
assert(keyA.includes("student_alpha"), "Key A is namespaced to User A");
assert(keyB.includes("student_beta"), "Key B is namespaced to User B");

// Global keys are not scoped
assert(getUserStorageKey(KEYS.USERS, userA) === KEYS.USERS, "Global KEYS.USERS is not scoped per user");
assert(getUserStorageKey(KEYS.CUSTOM_JOBS, userA) === KEYS.CUSTOM_JOBS, "Global KEYS.CUSTOM_JOBS is shared");

// Save distinct assessment result for User A
saveAssessmentResult({
  targetJob: "Backend Developer",
  score: 85,
  completed: true,
}, userA);

// User B should not see User A's assessment
const historyA = getAssessmentHistory(userA);
const historyB = getAssessmentHistory(userB);

assert(historyA.length === 1 && historyA[0].score === 85, "User A retrieved their saved assessment (85%)");
assert(historyB.length === 0, "User B has 0 assessments (no cross-account data leak)");

// Save distinct profile for User B
saveProfile({ name: "Beta Tester", college: "IIT Delhi" }, userB);
const profileA = getProfile(userA);
const profileB = getProfile(userB);

assert(profileB.name === "Beta Tester", "User B profile has 'Beta Tester'");
assert(profileA.name === "", "User A profile remains clean and unpolluted");


// --- Suite 3: Backward-Compatible Legacy Key Migration ---
console.log("\n--- Suite 3: Backward-Compatible Legacy Key Migration ---");
mockStorage.clear();

// Simulate legacy un-scoped data from previous version
const legacyUserId = "user_v1@test.com";
mockStorage.set(KEYS.TARGET_JOB, "Data Engineer");
mockStorage.set(KEYS.PROFILE, JSON.stringify({ name: "Legacy User", college: "NIT Warangal" }));
mockStorage.set(KEYS.ASSESSMENT_HISTORY, JSON.stringify([{ targetJob: "Data Engineer", score: 92, completed: true }]));

// Read with user ID — should transparently read and migrate to scoped key
const targetJobMigrated = getTargetJob(legacyUserId);
assert(targetJobMigrated === "Data Engineer", "Target job read transparently from legacy key");

const profileMigrated = getProfile(legacyUserId);
assert(profileMigrated.name === "Legacy User", "Profile read transparently from legacy key");

// Explicitly run migration
migrateLegacyDataToUser(legacyUserId);
const scopedAssessmentKey = getUserStorageKey(KEYS.ASSESSMENT_HISTORY, legacyUserId);
assert(mockStorage.has(scopedAssessmentKey), "Legacy assessment history migrated to user-scoped key in localStorage");

const historyMigrated = getAssessmentHistory(legacyUserId);
assert(historyMigrated.length === 1 && historyMigrated[0].score === 92, "Migrated assessment history intact");


// --- Suite 4: Progress Reset vs Full Data Wipe ---
console.log("\n--- Suite 4: Progress Reset vs Full Data Wipe ---");
mockStorage.clear();

const testUser = "active_student@domain.com";

// Setup state
saveProfile({ name: "John Active", email: testUser }, testUser);
saveTargetJob("Frontend Developer", testUser);
saveAssessmentResult({ targetJob: "Frontend Developer", score: 75, completed: true }, testUser);
saveAssignmentSubmissions({ "task-01": { url: "https://github.com/john/task", notes: "done" } }, testUser);
mockStorage.set(KEYS.USERS, JSON.stringify([{ email: testUser, password: "hash" }]));
mockStorage.set(KEYS.AUTH, JSON.stringify({ email: testUser, name: "John Active" }));

// 1. Perform Reset Progress
const resetRes = resetProgressData(testUser);
assert(resetRes.success === true, "resetProgressData executed successfully");

// Assessments and assignments cleared
const assessmentsAfterReset = getAssessmentHistory(testUser);
const submissionsAfterReset = getAssignmentSubmissions(testUser);
assert(assessmentsAfterReset.length === 0, "Assessment history cleared on progress reset");
assert(Object.keys(submissionsAfterReset).length === 0, "Assignment submissions cleared on progress reset");

// Credentials and profile preserved
const profileAfterReset = getProfile(testUser);
assert(profileAfterReset.name === "John Active", "User profile PRESERVED on progress reset");
assert(mockStorage.has(KEYS.AUTH), "Auth session PRESERVED on progress reset");
assert(mockStorage.has(KEYS.USERS), "Registered accounts list PRESERVED on progress reset");

// 2. Perform Clear All Data (Global Wipe)
const clearRes = clearAllData();
assert(clearRes.success === true, "clearAllData executed successfully");
assert(mockStorage.size === 0, "All keys wiped completely on clearAllData");


// --- Suite 5: Atomic Validated Import & Corrupted Rejection ---
console.log("\n--- Suite 5: Atomic Validated Import & Corrupted Rejection ---");
mockStorage.clear();

// Baseline data
saveProfile({ name: "Existing User", college: "Baseline College" }, testUser);

// 1. Corrupted input rejection (not an object)
const nonObjImport = validateImportData("string is not an object");
assert(nonObjImport.valid === false, "Import rejects non-object primitive");

// 2. Empty or unrecognizable structure rejection
const junkObj = validateImportData({ unknownField1: 123, randomStuff: true });
assert(junkObj.valid === false, "Import rejects JSON with no Skill Point keys");

// 3. Malformed profile field (expected object, got array)
const invalidProfilePayload = {
  data: {
    [KEYS.PROFILE]: ["array", "is", "invalid", "here"],
  },
};
const invalidProfRes = validateImportData(invalidProfilePayload);
assert(invalidProfRes.valid === false, "Import rejects payload with invalid profile structure");

// Ensure baseline was NOT modified when import was rejected
assert(getProfile(testUser).college === "Baseline College", "Baseline state unchanged after rejected import attempt");

// 4. Valid import payload
const validPayload = {
  version: "1.2.0",
  storageType: "localStorage_offline_local",
  data: {
    [KEYS.PROFILE]: { name: "Imported Student", college: "IIT Bombay" },
    [KEYS.TARGET_JOB]: "Full Stack Developer",
    [KEYS.ASSESSMENT_HISTORY]: [{ targetJob: "Full Stack Developer", score: 88, completed: true }],
  },
};
const importRes = importData(validPayload, testUser);
assert(importRes.success === true, "Valid payload imported successfully");
assert(getProfile(testUser).name === "Imported Student", "Profile updated with imported name");
assert(getTargetJob(testUser) === "Full Stack Developer", "Target job updated with imported role");
assert(getAssessmentHistory(testUser)[0].score === 88, "Assessment history restored from import");


// --- Suite 6: Graceful Quota & Storage Failure Handling ---
console.log("\n--- Suite 6: Graceful Quota & Storage Failure Handling ---");

// Simulate localStorage throwing QuotaExceededError
let quotaHit = false;
global.window.localStorage.setItem = (_k, _v) => {
  quotaHit = true;
  const err = new Error("QuotaExceededError");
  err.name = "QuotaExceededError";
  err.code = 22;
  throw err;
};

// Safe write should catch the error without throwing an uncaught exception
let threw = false;
try {
  safeSetItem(KEYS.TARGET_JOB, "Cloud Architect", testUser);
} catch {
  threw = true;
}
assert(threw === false, "safeSetItem caught QuotaExceededError safely without crashing");
assert(quotaHit === true, "Simulated quota error was triggered");

// Value should still be readable from memory fallback cache
const memoryFallbackVal = safeGetItem(KEYS.TARGET_JOB, testUser);
assert(memoryFallbackVal === "Cloud Architect", "safeGetItem served value from memory cache during storage failure");

// Restore normal mock localStorage
global.window.localStorage.setItem = (key, val) => mockStorage.set(key, String(val));


// --- Suite 7: Offline Boundary Verification ---
console.log("\n--- Suite 7: Offline Boundary Verification ---");
const exportReport = exportAllData(testUser);
assert(exportReport.storageType === "localStorage_offline_local", "Storage type explicitly identifies as offline localStorage");
assert(exportReport.data[KEYS.USERS] === undefined, "Export does not leak password database (KEYS.USERS omitted)");
assert(exportReport.data[KEYS.AUTH] === undefined, "Export does not leak session tokens (KEYS.AUTH omitted)");


// --- Suite 8: PBKDF2 Password Derivation, Account Migration & Credential Sanitization ---
console.log("\n--- Suite 8: PBKDF2 Password Derivation, Account Migration & Credential Sanitization ---");
mockStorage.clear();

// 1. PBKDF2 hash generation and salt uniqueness
const p1 = "StudentSecurePass123!";
const creds1 = await hashPasswordWithSalt(p1);
assert(creds1.hash && creds1.hash.length === 64, "PBKDF2-SHA256 produces 64-character hex hash (256 bits)");
assert(creds1.salt && creds1.salt.length === SALT_BYTE_LENGTH * 2, "Salt is 32-character hex (16 bytes / 128 bits)");
assert(creds1.iterations === PBKDF2_ITERATIONS && creds1.iterations === 100000, "Iterations is standard 100,000");

const creds2 = await hashPasswordWithSalt(p1);
assert(creds1.salt !== creds2.salt, "Two hashes of the same password produce distinct unique random salts");
assert(creds1.hash !== creds2.hash, "Two hashes of the same password produce distinct hashes due to salts");

// 2. PBKDF2 Password Verification
const testAccount = {
  id: "user-101",
  email: "alice@test.com",
  passwordHash: creds1.hash,
  salt: creds1.salt,
  iterations: creds1.iterations,
  algo: creds1.algo,
};

const okResult = await verifyPassword(p1, testAccount);
assert(okResult.verified === true && okResult.needsMigration === false, "Correct password verified against PBKDF2 record");

const wrongResult = await verifyPassword("WrongPassword999!", testAccount);
assert(wrongResult.verified === false, "Incorrect password rejected against PBKDF2 record");

// 3. Backward-Compatible Legacy Plaintext Account Verification & Opportunistic Migration
const legacyAccount = {
  id: "leg-202",
  name: "Legacy Student",
  email: "legacy@college.edu",
  password: "PlaintextPassword2024",
};
registerUser(legacyAccount);

const legCheck = await verifyPassword("PlaintextPassword2024", legacyAccount);
assert(legCheck.verified === true && legCheck.needsMigration === true, "Legacy plaintext account verified with needsMigration = true");

const legWrongCheck = await verifyPassword("InvalidGuess", legacyAccount);
assert(legWrongCheck.verified === false, "Legacy account rejects wrong password");

// Simulate AuthContext opportunistic migration
const derivedMigration = await hashPasswordWithSalt("PlaintextPassword2024");
const migratedAccount = {
  ...legacyAccount,
  passwordHash: derivedMigration.hash,
  salt: derivedMigration.salt,
  iterations: derivedMigration.iterations,
  algo: derivedMigration.algo,
};
delete migratedAccount.password;
const didUpdate = updateRegisteredUser(migratedAccount);
assert(didUpdate === true, "updateRegisteredUser updated legacy user record in KEYS.USERS");

const refreshedUsers = getRegisteredUsers();
const storedMigrated = refreshedUsers.find((u) => u.email === "legacy@college.edu");
assert(storedMigrated.password === undefined, "Stored migrated user has raw password property deleted");
assert(storedMigrated.passwordHash === derivedMigration.hash, "Stored migrated user has PBKDF2 hash stored");

const postMigrationVerify = await verifyPassword("PlaintextPassword2024", storedMigrated);
assert(postMigrationVerify.verified === true && postMigrationVerify.needsMigration === false, "Post-migration verification succeeds without further migration needed");

// 4. Session & Export Zero Credential Leakage
saveAuthUser(storedMigrated);
const sessionUser = getAuthUser();
assert(sessionUser.password === undefined, "Active session in KEYS.AUTH does not contain raw password");
assert(sessionUser.passwordHash === undefined, "Active session in KEYS.AUTH does not contain passwordHash");
assert(sessionUser.salt === undefined, "Active session in KEYS.AUTH does not contain salt");

clearAuth();
assert(getAuthUser() === null, "clearAuth clears active session cleanly without affecting KEYS.USERS");
assert(getRegisteredUsers().length > 0, "Registered users remain intact after clearAuth");

const exportPayload = exportAllData("legacy@college.edu");
assert(exportPayload.data[KEYS.USERS] === undefined, "exportAllData strictly excludes KEYS.USERS (password database)");
assert(exportPayload.data[KEYS.AUTH] === undefined, "exportAllData strictly excludes KEYS.AUTH (session token)");

// 5. Corrupted / Null Collection Defensive Filtering
mockStorage.set(getUserStorageKey(KEYS.ASSESSMENT_HISTORY, "user_defense"), JSON.stringify([
  null,
  { score: 90, completed: true, targetJob: "Backend Developer" },
  "corrupted string",
  undefined,
  { score: 75, completed: true, targetJob: "Backend Developer" }
]));
const cleanAssessments = getAssessmentHistory("user_defense");
assert(cleanAssessments.length === 2 && cleanAssessments[0].score === 90 && cleanAssessments[1].score === 75, "getAssessmentHistory filters null and corrupted items");

mockStorage.set(getUserStorageKey(KEYS.ACTIVITY_LOG, "user_defense"), JSON.stringify([
  null,
  { title: "Valid Activity 1" },
  42,
  { title: "Valid Activity 2" }
]));
const cleanActivities = getActivityLog("user_defense");
assert(cleanActivities.length === 2 && cleanActivities[0].title === "Valid Activity 1", "getActivityLog filters null and corrupted items");

mockStorage.set(getUserStorageKey(KEYS.SAVED_JDS, "user_defense"), JSON.stringify([
  null,
  { id: "jd-clean", jobTitle: "Engineer" },
  { jobTitle: "Missing ID" }
]));
const cleanJDs = getSavedJDs("user_defense");
assert(cleanJDs.length === 1 && cleanJDs[0].id === "jd-clean", "getSavedJDs filters null and ID-less items");

mockStorage.set(KEYS.CUSTOM_JOBS, JSON.stringify([
  null,
  { id: "custom-1", title: "ML Engineer" },
  false
]));
const cleanJobs = getCustomJobs();
assert(cleanJobs.length === 1 && cleanJobs[0].id === "custom-1", "getCustomJobs filters null and invalid items");

// 6. Duplicate Assessment Guard
mockStorage.clear();
const nowTimestamp = new Date().toISOString();
saveAssessmentResult({ targetJob: "Data Engineer", score: 82, completed: true, timestamp: nowTimestamp }, "dup_check");
// Immediate re-save with identical score and role within same second
saveAssessmentResult({ targetJob: "Data Engineer", score: 82, completed: true, timestamp: nowTimestamp }, "dup_check");

const dedupHistory = getAssessmentHistory("dup_check");
assert(dedupHistory.length === 1, "Duplicate rapid assessment re-submission is prevented (< 3s window)");

saveAssessmentResult({ targetJob: "Data Engineer", score: 92, completed: true, timestamp: nowTimestamp }, "dup_check");
const multiHistory = getAssessmentHistory("dup_check");
assert(multiHistory.length === 2, "Assessment with different score is legitimately appended to history");

console.log("\n==================================================");
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: 0`);
console.log("==================================================");
