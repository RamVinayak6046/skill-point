/**
 * Skill Point Storage Service
 * 
 * Abstract localStorage operations to a clean API that can be later swapped to REST APIs.
 * Includes defensive parsing, quota error resilience, account-scoped persistence,
 * backward-compatible legacy key migration, atomic import validation, and explicit progress reset.
 */

// Keys used in localStorage
export const KEYS = {
  PROFILE: 'skillPointProfile',
  TARGET_JOB: 'skillPointTargetJob',
  ASSESSMENT: 'skillPointAssessment',
  ASSESSMENT_HISTORY: 'skillPointAssessmentHistory',
  RESUME_UPLOADED: 'skillPointResumeUploaded',
  RESUME_FILE_NAME: 'skillPointResumeFileName',
  RESUME_TARGET_JOB: 'skillPointResumeTargetJob',
  ASSIGNMENTS: 'skillPointAssignments',
  LEARNING_PROGRESS: 'skillPointLearningProgress',
  PROGRESS_HISTORY: 'skillPointProgressHistory',
  ACTIVITY_LOG: 'skillPointActivityLog',
  AUTH: 'skillPointAuth',
  USERS: 'skillPointUsers',
  CUSTOM_JOBS: 'skillPointCustomJobs',
  PARSED_RESUME: 'skillPointParsedResume',
  ACTIVE_JD: 'skillPointActiveJD',
  SAVED_JDS: 'skillPointSavedJDs',
  DYNAMIC_ASSIGNMENTS: 'skillPointDynamicAssignments',
  ASSESSMENT_LEVEL: 'skillPointAssessmentLevel',
  SKILL_LEVELS: 'skillPointSkillLevels',
  ASSIGNMENT_SUBMISSIONS: 'skillPointAssignmentSubmissions',
  THEME: 'skillPointTheme',
};

// Global keys that are never scoped per user
export const GLOBAL_KEYS = new Set([
  KEYS.AUTH,
  KEYS.USERS,
  KEYS.CUSTOM_JOBS,
  KEYS.THEME,
]);

/**
 * Blank profile - new accounts start with no pre-filled personal data.
 * Only the auth-registered name/email will be seeded from AuthContext on first registration.
 */
export const DEFAULT_PROFILE = {
  name: '',
  email: '',
  phone: '',
  location: '',
  college: '',
  rollNo: '',
  degree: 'B.Tech',
  branch: '',
  semester: '',
  cgpa: '',
  graduation: '',
  experience: 'Fresher',
  github: '',
  linkedin: '',
};

// In-memory fallback cache when localStorage is unavailable or quota is exceeded
const memoryStore = new Map();

/**
 * Check if storage is available
 */
export const isStorageAvailable = () => {
  try {
    const testKey = '__skill_point_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Safely parse JSON with fallback and type validator
 * Ensures no malformed or unexpected data types crash application consumers.
 */
export const safeParse = (rawValue, fallback, validator = null) => {
  if (rawValue === null || rawValue === undefined) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(rawValue);
    if (validator && typeof validator === 'function') {
      return validator(parsed) ? parsed : fallback;
    }
    // Default type validation matching fallback shape
    if (Array.isArray(fallback)) {
      return Array.isArray(parsed) ? parsed : fallback;
    }
    if (fallback !== null && typeof fallback === 'object') {
      return (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed))
        ? parsed
        : fallback;
    }
    if (typeof fallback === 'number') {
      return typeof parsed === 'number' && !Number.isNaN(parsed) ? parsed : fallback;
    }
    if (typeof fallback === 'boolean') {
      return typeof parsed === 'boolean' ? parsed : fallback;
    }
    if (typeof fallback === 'string') {
      return typeof parsed === 'string' ? parsed : fallback;
    }
    return parsed;
  } catch (err) {
    console.warn(`[storageService] safeParse error for value:`, rawValue, err);
    return fallback;
  }
};

/**
 * Resolves current user ID from session or argument
 */
export const getActiveUserId = () => {
  try {
    const authRaw = typeof window !== 'undefined' && window.localStorage
      ? window.localStorage.getItem(KEYS.AUTH)
      : null;
    if (!authRaw) return null;
    const auth = JSON.parse(authRaw);
    return auth?.id || auth?.email || null;
  } catch {
    return null;
  }
};

/**
 * Formats a scoped key for a specific user ID or current user
 * If the key is a global key, returns key as is.
 * If no user is authenticated, returns null to prevent reading/writing shared un-scoped data.
 */
export const getUserStorageKey = (key, userId = null) => {
  if (GLOBAL_KEYS.has(key)) {
    return key;
  }
  const uid = userId || getActiveUserId();
  if (!uid) {
    return null;
  }
  // Sanitize user ID to safe string
  const safeUid = String(uid).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return `skillPoint_u_${safeUid}_${key}`;
};

/**
 * Migrates legacy un-scoped data to user-scoped key if needed, then removes the legacy key
 * so it cannot be migrated or viewed by any other account.
 */
export const migrateLegacyDataToUser = (userId) => {
  if (!userId || typeof window === 'undefined' || !window.localStorage) return;
  const safeUid = String(userId).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');

  Object.values(KEYS).forEach((baseKey) => {
    if (GLOBAL_KEYS.has(baseKey)) return;
    const scopedKey = `skillPoint_u_${safeUid}_${baseKey}`;
    try {
      const scopedVal = window.localStorage.getItem(scopedKey);
      const legacyVal = window.localStorage.getItem(baseKey);

      // If scoped does not exist yet but legacy value exists, migrate it and REMOVE legacy
      if (scopedVal === null && legacyVal !== null) {
        window.localStorage.setItem(scopedKey, legacyVal);
        window.localStorage.removeItem(baseKey);
      }
    } catch (err) {
      console.warn(`[storageService] Migration warning for ${baseKey}:`, err);
    }
  });
};

/**
 * Safely read item from storage (strictly checking scoped key and memory fallback)
 */
export const safeGetItem = (key, userId = null) => {
  if (GLOBAL_KEYS.has(key)) {
    if (memoryStore.has(key)) return memoryStore.get(key);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {}
    return null;
  }

  const scopedKey = getUserStorageKey(key, userId);
  if (!scopedKey) {
    return null;
  }

  // If memoryStore has an in-memory session override, prioritize it
  if (memoryStore.has(scopedKey)) {
    return memoryStore.get(scopedKey);
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      let val = window.localStorage.getItem(scopedKey);
      // For backward compatibility only: if scoped does not exist and un-scoped exists, migrate and remove un-scoped
      if (val === null) {
        const legacyVal = window.localStorage.getItem(key);
        if (legacyVal !== null) {
          try {
            window.localStorage.setItem(scopedKey, legacyVal);
            window.localStorage.removeItem(key); // Crucial: delete legacy key so it never leaks to other accounts
          } catch {}
          return legacyVal;
        }
      }
      return val;
    }
  } catch (err) {
    console.warn(`[storageService] safeGetItem error reading ${scopedKey}:`, err);
  }
  return memoryStore.has(scopedKey) ? memoryStore.get(scopedKey) : null;
};

/**
 * Safely write item to storage with QuotaExceededError protection and memory fallback
 */
export const safeSetItem = (key, value, userId = null) => {
  const scopedKey = getUserStorageKey(key, userId);
  const strVal = typeof value === 'string' ? value : JSON.stringify(value);

  // Update in-memory fallback
  memoryStore.set(scopedKey, strVal);

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(scopedKey, strVal);
      return true;
    }
  } catch (err) {
    const isQuotaError =
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err.code === 22 ||
      err.code === 1014;

    if (isQuotaError) {
      console.warn(`[storageService] LocalStorage quota exceeded. Cached in session memory for ${scopedKey}.`);
    } else {
      console.error(`[storageService] Storage write failure for ${scopedKey}:`, err);
    }
    return false;
  }
  return false;
};

/**
 * Safely remove item from storage
 */
export const safeRemoveItem = (key, userId = null) => {
  const scopedKey = getUserStorageKey(key, userId);
  memoryStore.delete(scopedKey);
  memoryStore.delete(key);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(scopedKey);
      if (scopedKey !== key) {
        window.localStorage.removeItem(key);
      }
    }
  } catch (err) {
    console.warn(`[storageService] safeRemoveItem error for ${scopedKey}:`, err);
  }
};

// ==========================================
// Auth & Web Crypto Password Derivation
// ==========================================

/**
 * Local-First Web Crypto Password Utilities
 *
 * ARCHITECTURAL BOUNDARY:
 * Browser-only authentication provides account isolation and multi-profile separation
 * for local demonstrations. It is NOT a cryptographic boundary against an operator with
 * physical/DevTools control of browser storage or device memory.
 */
export const PBKDF2_ITERATIONS = 100000;
export const SALT_BYTE_LENGTH = 16; // 128-bit unique salt

/**
 * Derives a salted PBKDF2-SHA256 password hash using standard Web Crypto API.
 * Never stores or returns the plaintext password.
 *
 * @param {string} password Raw user password
 * @param {string|null} [existingSaltHex=null] Optional existing hex-encoded salt
 * @returns {Promise<{ hash: string, salt: string, iterations: number, algo: string }>}
 */
export async function hashPasswordWithSalt(password, existingSaltHex = null) {
  if (typeof password !== "string" || !password) {
    throw new Error("Password must be a non-empty string.");
  }

  const cryptoObj = typeof window !== "undefined" && window.crypto ? window.crypto : globalThis.crypto;
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error("Web Crypto API (crypto.subtle) is not available in this environment.");
  }

  let saltBytes;
  if (existingSaltHex && typeof existingSaltHex === "string" && existingSaltHex.length === SALT_BYTE_LENGTH * 2) {
    saltBytes = new Uint8Array(SALT_BYTE_LENGTH);
    for (let i = 0; i < SALT_BYTE_LENGTH; i++) {
      saltBytes[i] = parseInt(existingSaltHex.substr(i * 2, 2), 16);
    }
  } else {
    saltBytes = cryptoObj.getRandomValues(new Uint8Array(SALT_BYTE_LENGTH));
  }

  const saltHex = Array.from(saltBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const keyMaterial = await cryptoObj.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await cryptoObj.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256 // 256-bit derived key
  );

  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return {
    hash: hashHex,
    salt: saltHex,
    iterations: PBKDF2_ITERATIONS,
    algo: "PBKDF2-SHA256",
  };
}

/**
 * Verifies an entered password against a stored user record.
 * Handles both PBKDF2-salted accounts and backward-compatible legacy plaintext accounts.
 *
 * @param {string} inputPassword Entered password string
 * @param {Object} storedUser Stored user object from KEYS.USERS
 * @returns {Promise<{ verified: boolean, needsMigration: boolean }>}
 */
export async function verifyPassword(inputPassword, storedUser) {
  if (!storedUser || typeof storedUser !== "object" || typeof inputPassword !== "string") {
    return { verified: false, needsMigration: false };
  }

  // 1. Salted PBKDF2-SHA256 verification (Modern)
  if (storedUser.passwordHash && storedUser.salt) {
    try {
      const computed = await hashPasswordWithSalt(inputPassword, storedUser.salt);
      const verified = computed.hash === storedUser.passwordHash;
      return { verified, needsMigration: false };
    } catch {
      return { verified: false, needsMigration: false };
    }
  }

  // 2. Legacy plaintext verification with opportunistic migration flag
  if (typeof storedUser.password === "string") {
    const verified = storedUser.password === inputPassword;
    return { verified, needsMigration: verified };
  }

  return { verified: false, needsMigration: false };
}

/**
 * Gets the current logged-in user
 * @returns {Object|null} User object or null
 */
export const getAuthUser = () => {
  const raw = safeGetItem(KEYS.AUTH);
  return safeParse(raw, null, (val) => val && typeof val === "object" && !Array.isArray(val));
};

/**
 * Saves the current auth state
 * @param {Object} user User object
 */
export const saveAuthUser = (user) => {
  if (user) {
    // Strip any sensitive credentials before persisting active session
    const { password: _, passwordHash: __, salt: ___, ...sanitizedUser } = user;
    safeSetItem(KEYS.AUTH, sanitizedUser);
    if (sanitizedUser.id || sanitizedUser.email) {
      migrateLegacyDataToUser(sanitizedUser.id || sanitizedUser.email);
    }
  } else {
    safeRemoveItem(KEYS.AUTH);
  }
};

/**
 * Removes the auth state
 */
export const clearAuth = () => {
  safeRemoveItem(KEYS.AUTH);
};

/**
 * Clears in-memory session cache and purges any legacy un-scoped user data keys from localStorage.
 * Called on logout and before logging in to guarantee complete user account isolation.
 */
export const clearSessionData = () => {
  try {
    memoryStore.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      const unScopedUserKeys = [
        KEYS.PROFILE,
        KEYS.TARGET_JOB,
        KEYS.ASSESSMENT,
        KEYS.ASSESSMENT_HISTORY,
        KEYS.RESUME_UPLOADED,
        KEYS.RESUME_FILE_NAME,
        KEYS.RESUME_TARGET_JOB,
        KEYS.PARSED_RESUME,
        KEYS.ACTIVE_JD,
        KEYS.SAVED_JDS,
        KEYS.DYNAMIC_ASSIGNMENTS,
        KEYS.ASSESSMENT_LEVEL,
        KEYS.SKILL_LEVELS,
        KEYS.ASSIGNMENTS,
        KEYS.ASSIGNMENT_SUBMISSIONS,
        KEYS.LEARNING_PROGRESS,
        KEYS.ACTIVITY_LOG,
        KEYS.PROGRESS_HISTORY,
        KEYS.CUSTOM_JOBS,
      ];
      unScopedUserKeys.forEach((k) => {
        try {
          window.localStorage.removeItem(k);
        } catch {}
      });
    }
  } catch (err) {
    console.warn('[storageService] clearSessionData warning:', err);
  }
};

/**
 * Gets all registered users
 * @returns {Array} Array of user objects
 */
export const getRegisteredUsers = () => {
  const raw = safeGetItem(KEYS.USERS);
  const parsed = safeParse(raw, [], Array.isArray);
  return parsed.filter((u) => u && typeof u === "object");
};

/**
 * Adds a new user to registered users.
 * Strips raw password property if passwordHash exists to guarantee no raw password is saved.
 * @param {Object} user User object
 */
export const registerUser = (user) => {
  if (!user || typeof user !== "object") return;
  const users = getRegisteredUsers();
  // Ensure no duplicate email registration
  const normEmail = String(user.email || "").trim().toLowerCase();
  const exists = users.some((u) => u && String(u.email || "").trim().toLowerCase() === normEmail);
  if (exists) return;

  const toSave = { ...user };
  if (toSave.passwordHash) {
    delete toSave.password;
  }
  users.push(toSave);
  safeSetItem(KEYS.USERS, users);
};

/**
 * Updates an existing registered user in-place (e.g. for opportunistic password migration).
 * Strips raw password when upgrading to PBKDF2 passwordHash.
 * @param {Object} updatedUser User object with matching id or email
 * @returns {boolean} True if updated, false otherwise
 */
export const updateRegisteredUser = (updatedUser) => {
  if (!updatedUser || typeof updatedUser !== "object") return false;
  const users = getRegisteredUsers();
  const uid = updatedUser.id;
  const email = String(updatedUser.email || "").trim().toLowerCase();

  const idx = users.findIndex(
    (u) => (uid && u.id === uid) || (email && String(u.email || "").trim().toLowerCase() === email)
  );

  if (idx !== -1) {
    const merged = { ...users[idx], ...updatedUser };
    if (updatedUser.passwordHash) {
      delete merged.password;
    }
    users[idx] = merged;
    safeSetItem(KEYS.USERS, users);
    return true;
  }
  return false;
};

// ==========================================
// Profile
// ==========================================

/**
 * Gets the user profile.
 * Merges DEFAULT_PROFILE with any saved data so all keys always exist.
 * Does NOT inject fake student data - new users get blank fields.
 * @returns {Object} Profile object
 */
export const getProfile = (userId = null) => {
  const raw = safeGetItem(KEYS.PROFILE, userId);
  const parsed = safeParse(raw, {}, (val) => val && typeof val === 'object' && !Array.isArray(val));
  return { ...DEFAULT_PROFILE, ...parsed };
};

/**
 * Saves the user profile
 * @param {Object} profile Profile object
 */
export const saveProfile = (profile, userId = null) => {
  const valid = profile && typeof profile === 'object' ? profile : { ...DEFAULT_PROFILE };
  safeSetItem(KEYS.PROFILE, valid, userId);
};

// ==========================================
// Target Job
// ==========================================

/**
 * Gets the target job title
 * @returns {string} Job title
 */
export const getTargetJob = (userId = null) => {
  const raw = safeGetItem(KEYS.TARGET_JOB, userId);
  return (raw && typeof raw === 'string' && raw.trim()) ? raw.trim() : '';
};

/**
 * Saves the target job title
 * @param {string} jobTitle Job title
 */
export const saveTargetJob = (jobTitle, userId = null) => {
  const title = (jobTitle && typeof jobTitle === 'string' && jobTitle.trim())
    ? jobTitle.trim()
    : '';
  safeSetItem(KEYS.TARGET_JOB, title, userId);
};

// ==========================================
// Assessment
// ==========================================

/**
 * Gets the latest assessment result
 * @returns {Object|null} Latest assessment result
 */
export const getLatestAssessment = (userId = null) => {
  const raw = safeGetItem(KEYS.ASSESSMENT, userId);
  return safeParse(raw, null, (val) => val && typeof val === 'object' && !Array.isArray(val));
};

/**
 * Saves assessment result and appends to history.
 * Defensively guards against duplicate rapid re-submissions (< 3s or matching attemptId).
 * @param {Object} result Assessment result
 * @param {string|null} userId Optional target user ID
 */
export const saveAssessmentResult = (result, userId = null) => {
  if (!result || typeof result !== 'object') return;
  safeSetItem(KEYS.ASSESSMENT, result, userId);
  
  const history = getAssessmentHistory(userId);
  const nowIso = new Date().toISOString();
  const entry = { ...result, timestamp: result.timestamp || nowIso };

  // Guard against rapid duplicate submissions
  const lastEntry = history.length > 0 ? history[history.length - 1] : null;
  if (lastEntry) {
    const isSameAttempt = entry.attemptId && lastEntry.attemptId === entry.attemptId;
    const isSameScore = lastEntry.score === entry.score;
    const isSameJob = (lastEntry.targetJob || lastEntry.job) === (entry.targetJob || entry.job);
    const lastTime = new Date(lastEntry.timestamp || 0).getTime();
    const currTime = new Date(entry.timestamp).getTime();
    const isRapidRepeat = Math.abs(currTime - lastTime) < 3000;

    if (isSameAttempt || (isSameScore && isSameJob && isRapidRepeat)) {
      history[history.length - 1] = entry;
      safeSetItem(KEYS.ASSESSMENT_HISTORY, history, userId);
      return;
    }
  }

  history.push(entry);
  safeSetItem(KEYS.ASSESSMENT_HISTORY, history, userId);
};

/**
 * Gets assessment history, filtering out any null or corrupted elements.
 * @returns {Array} Array of assessment results
 */
export const getAssessmentHistory = (userId = null) => {
  const raw = safeGetItem(KEYS.ASSESSMENT_HISTORY, userId);
  const parsed = safeParse(raw, [], Array.isArray);
  return parsed.filter((item) => item && typeof item === 'object');
};

// ==========================================
// Resume
// ==========================================

/**
 * Gets resume data
 * @returns {Object} Resume data { uploaded, fileName, targetJob }
 */
export const getResumeData = (userId = null) => {
  const uploadedRaw = safeGetItem(KEYS.RESUME_UPLOADED, userId);
  const fileNameRaw = safeGetItem(KEYS.RESUME_FILE_NAME, userId);
  const targetJobRaw = safeGetItem(KEYS.RESUME_TARGET_JOB, userId);
  return {
    uploaded: uploadedRaw === 'true',
    fileName: typeof fileNameRaw === 'string' ? fileNameRaw : '',
    targetJob: typeof targetJobRaw === 'string' ? targetJobRaw : '',
  };
};

/**
 * Saves resume data
 * @param {Object} data Resume data { uploaded, fileName, targetJob }
 */
export const saveResumeData = ({ uploaded, fileName, targetJob }, userId = null) => {
  if (uploaded !== undefined) safeSetItem(KEYS.RESUME_UPLOADED, uploaded ? 'true' : 'false', userId);
  if (fileName !== undefined) safeSetItem(KEYS.RESUME_FILE_NAME, String(fileName || ''), userId);
  if (targetJob !== undefined) safeSetItem(KEYS.RESUME_TARGET_JOB, String(targetJob || ''), userId);
};

/**
 * Clears resume data
 */
export const clearResumeData = (userId = null) => {
  safeRemoveItem(KEYS.RESUME_UPLOADED, userId);
  safeRemoveItem(KEYS.RESUME_FILE_NAME, userId);
  safeRemoveItem(KEYS.RESUME_TARGET_JOB, userId);
  safeRemoveItem(KEYS.PARSED_RESUME, userId);
};

/**
 * Gets fully parsed resume data
 * @returns {Object|null}
 */
export const getParsedResume = (userId = null) => {
  const raw = safeGetItem(KEYS.PARSED_RESUME, userId);
  return safeParse(raw, null, (val) => val && typeof val === 'object' && !Array.isArray(val));
};

/**
 * Saves fully parsed resume data
 * @param {Object} parsed
 */
export const saveParsedResume = (parsed, userId = null) => {
  safeSetItem(KEYS.PARSED_RESUME, parsed || null, userId);
};

/**
 * Gets active Job Description analysis
 * @returns {Object|null}
 */
export const getActiveJD = (userId = null) => {
  const raw = safeGetItem(KEYS.ACTIVE_JD, userId);
  return safeParse(raw, null, (val) => val && typeof val === 'object' && !Array.isArray(val));
};

/**
 * Saves active Job Description analysis
 * @param {Object} jd
 */
export const saveActiveJD = (jd, userId = null) => {
  safeSetItem(KEYS.ACTIVE_JD, jd || null, userId);
};

/**
 * Clears active Job Description analysis
 */
export const clearActiveJD = (userId = null) => {
  safeRemoveItem(KEYS.ACTIVE_JD, userId);
};

/**
 * Gets all saved structured Job Descriptions, filtering corrupted entries.
 * @returns {Array}
 */
export const getSavedJDs = (userId = null) => {
  const raw = safeGetItem(KEYS.SAVED_JDS, userId);
  const parsed = safeParse(raw, [], Array.isArray);
  return parsed.filter((item) => item && typeof item === 'object' && item.id);
};

/**
 * Saves or updates a structured Job Description
 * Upserts into saved JDs list and sets as active
 * @param {Object} jd
 * @returns {Array} Updated array of saved JDs
 */
export const saveStructuredJD = (jd, userId = null) => {
  if (!jd || typeof jd !== 'object') return getSavedJDs(userId);
  const id = jd.id || `jd-${Date.now()}`;
  const structuredWithId = { ...jd, id, updatedAt: new Date().toISOString() };
  
  // Set as active
  saveActiveJD(structuredWithId, userId);

  // Upsert into saved list
  const existing = getSavedJDs(userId);
  const index = existing.findIndex((item) => item?.id === id);
  let updated;
  if (index >= 0) {
    updated = [...existing];
    updated[index] = structuredWithId;
  } else {
    updated = [structuredWithId, ...existing];
  }
  safeSetItem(KEYS.SAVED_JDS, updated, userId);
  return updated;
};

/**
 * Deletes a structured Job Description from saved list
 * @param {string} id
 * @returns {Array} Updated array of saved JDs
 */
export const deleteSavedJD = (id, userId = null) => {
  const existing = getSavedJDs(userId);
  const updated = existing.filter((item) => item?.id !== id);
  safeSetItem(KEYS.SAVED_JDS, updated, userId);

  // If deleting active JD, clear active
  const active = getActiveJD(userId);
  if (active && active.id === id) {
    clearActiveJD(userId);
  }
  return updated;
};

/**
 * Gets dynamic generated assignments, filtering corrupted entries.
 * @returns {Array}
 */
export const getDynamicAssignments = (userId = null) => {
  const raw = safeGetItem(KEYS.DYNAMIC_ASSIGNMENTS, userId);
  const parsed = safeParse(raw, [], Array.isArray);
  return parsed.filter((a) => a && typeof a === 'object');
};

/**
 * Saves dynamic generated assignments
 * @param {Array} assignments
 */
export const saveDynamicAssignments = (assignments, userId = null) => {
  safeSetItem(KEYS.DYNAMIC_ASSIGNMENTS, Array.isArray(assignments) ? assignments : [], userId);
};

/**
 * Gets current assessment difficulty level (1, 2, or 3)
 * @returns {number}
 */
export const getAssessmentLevel = (userId = null) => {
  const raw = safeGetItem(KEYS.ASSESSMENT_LEVEL, userId);
  const num = parseInt(raw, 10);
  return (num === 1 || num === 2 || num === 3) ? num : 1;
};

/**
 * Saves current assessment difficulty level
 * @param {number} level
 */
export const saveAssessmentLevel = (level, userId = null) => {
  const num = (level === 2 || level === 3) ? level : 1;
  safeSetItem(KEYS.ASSESSMENT_LEVEL, String(num), userId);
};

// ==========================================
// Skill Levels (Module 5)
// ==========================================

/**
 * Gets the current skill levels registry
 * @returns {Object} { [skillName]: skillLevelRecord }
 */
export const getSkillLevels = (userId = null) => {
  const raw = safeGetItem(KEYS.SKILL_LEVELS, userId);
  return safeParse(raw, {}, (val) => val && typeof val === 'object' && !Array.isArray(val));
};

/**
 * Saves the skill levels registry
 * @param {Object} skillLevels { [skillName]: skillLevelRecord }
 */
export const saveSkillLevels = (skillLevels, userId = null) => {
  safeSetItem(KEYS.SKILL_LEVELS, (skillLevels && typeof skillLevels === 'object') ? skillLevels : {}, userId);
};

// ==========================================
// Assignments
// ==========================================

/**
 * Gets assignment completions
 * @returns {Object} Assignment completion states object
 */
export const getAssignmentCompletions = (userId = null) => {
  const raw = safeGetItem(KEYS.ASSIGNMENTS, userId);
  return safeParse(raw, {}, (val) => val && typeof val === 'object' && !Array.isArray(val));
};

/**
 * Saves assignment completions
 * @param {Object} completions Assignment completion states
 */
export const saveAssignmentCompletions = (completions, userId = null) => {
  safeSetItem(KEYS.ASSIGNMENTS, (completions && typeof completions === 'object') ? completions : {}, userId);
};

/**
 * Gets assignment submission details (URL, notes, timestamp)
 * @returns {Object} { [assignmentId]: { url, notes, submittedAt, targetJob } }
 */
export const getAssignmentSubmissions = (userId = null) => {
  const raw = safeGetItem(KEYS.ASSIGNMENT_SUBMISSIONS, userId);
  return safeParse(raw, {}, (val) => val && typeof val === 'object' && !Array.isArray(val));
};

/**
 * Saves assignment submission details
 * @param {Object} submissions { [assignmentId]: { url, notes, submittedAt, targetJob } }
 */
export const saveAssignmentSubmissions = (submissions, userId = null) => {
  safeSetItem(KEYS.ASSIGNMENT_SUBMISSIONS, (submissions && typeof submissions === 'object') ? submissions : {}, userId);
};

// ==========================================
// Learning
// ==========================================

/**
 * Gets learning progress
 * @returns {Object} Learning progress { completedLessons: [], courseProgress: {} }
 */
export const getLearningProgress = (userId = null) => {
  const raw = safeGetItem(KEYS.LEARNING_PROGRESS, userId);
  return safeParse(raw, { completedLessons: [], courseProgress: {} }, (val) => {
    return val && typeof val === 'object' && !Array.isArray(val) && Array.isArray(val.completedLessons);
  });
};

/**
 * Saves learning progress
 * @param {Object} progress Learning progress
 */
export const saveLearningProgress = (progress, userId = null) => {
  const valid = progress && typeof progress === 'object' ? progress : { completedLessons: [], courseProgress: {} };
  safeSetItem(KEYS.LEARNING_PROGRESS, valid, userId);
};

// ==========================================
// Progress & Activity
// ==========================================

/**
 * Gets progress history, filtering corrupted entries.
 * @returns {Array} Array of progress snapshots
 */
export const getProgressHistory = (userId = null) => {
  const raw = safeGetItem(KEYS.PROGRESS_HISTORY, userId);
  const parsed = safeParse(raw, [], Array.isArray);
  return parsed.filter((item) => item && typeof item === 'object');
};

/**
 * Appends a new progress snapshot
 * @param {Object} snapshot Progress snapshot
 */
export const saveProgressSnapshot = (snapshot, userId = null) => {
  if (!snapshot || typeof snapshot !== 'object') return;
  const history = getProgressHistory(userId);
  history.push({ ...snapshot, timestamp: new Date().toISOString() });
  safeSetItem(KEYS.PROGRESS_HISTORY, history, userId);
};

/**
 * Gets activity log, filtering corrupted entries.
 * @returns {Array} Array of activity events
 */
export const getActivityLog = (userId = null) => {
  const raw = safeGetItem(KEYS.ACTIVITY_LOG, userId);
  const parsed = safeParse(raw, [], Array.isArray);
  return parsed.filter((item) => item && typeof item === 'object');
};

/**
 * Prepends a new activity event (keeps last 20)
 * @param {Object} activity Activity event
 */
export const addActivity = (activity, userId = null) => {
  if (!activity || typeof activity !== 'object') return;
  let log = getActivityLog(userId);
  log.unshift({ ...activity, timestamp: new Date().toISOString() });
  if (log.length > 20) {
    log = log.slice(0, 20);
  }
  safeSetItem(KEYS.ACTIVITY_LOG, log, userId);
};

// ==========================================
// Custom Jobs
// ==========================================

/**
 * Gets all user-added custom jobs (global application registry), filtering corrupted entries.
 * @returns {Array} Array of custom job objects
 */
export const getCustomJobs = () => {
  const raw = safeGetItem(KEYS.CUSTOM_JOBS);
  const parsed = safeParse(raw, [], Array.isArray);
  return parsed.filter((j) => j && typeof j === 'object' && j.id);
};

/**
 * Saves a new custom job
 * @param {Object} job Custom job object
 * @returns {Array} Updated array of custom jobs
 */
export const saveCustomJob = (job) => {
  if (!job || typeof job !== 'object') return getCustomJobs();
  const existing = getCustomJobs();
  const updated = [...existing, job];
  safeSetItem(KEYS.CUSTOM_JOBS, updated);
  return updated;
};

/**
 * Deletes a custom job by id
 * @param {string} id Job id to delete
 * @returns {Array} Updated array of custom jobs
 */
export const deleteCustomJob = (id) => {
  const existing = getCustomJobs();
  const updated = existing.filter((j) => j && j.id !== id);
  safeSetItem(KEYS.CUSTOM_JOBS, updated);
  return updated;
};

// ==========================================
// Data Reset & Cleanup
// ==========================================

/**
 * Resets application progress for current user.
 * Preserves registered accounts, user auth session, user profile, and custom job roles!
 * Clears assessments, assignment completions, submissions, skill levels, and learning history.
 */
export const resetProgressData = (userId = null) => {
  const progressKeys = [
    KEYS.ASSESSMENT,
    KEYS.ASSESSMENT_HISTORY,
    KEYS.ASSIGNMENTS,
    KEYS.ASSIGNMENT_SUBMISSIONS,
    KEYS.DYNAMIC_ASSIGNMENTS,
    KEYS.ASSESSMENT_LEVEL,
    KEYS.SKILL_LEVELS,
    KEYS.LEARNING_PROGRESS,
    KEYS.PROGRESS_HISTORY,
    KEYS.ACTIVITY_LOG,
  ];

  progressKeys.forEach((key) => {
    safeRemoveItem(key, userId);
  });

  return { success: true };
};

/**
 * Completely clears all skillPoint data across all users and resets entire application.
 */
export const clearAllData = () => {
  try {
    memoryStore.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && (k.startsWith('skillPoint') || Object.values(KEYS).includes(k))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    }
    return { success: true };
  } catch (error) {
    console.error('Error clearing data from localStorage:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// Export & Atomic Validated Import
// ==========================================

/**
 * Exports all Skill Point data for the active user as JSON
 * Explicitly notes local storage boundary without false claims of cloud synchronization.
 * @returns {Object} Scoped storage data
 */
export const exportAllData = (userId = null) => {
  const exportPayload = {
    version: '1.2.0',
    exportedAt: new Date().toISOString(),
    storageType: 'localStorage_offline_local',
    data: {},
  };

  Object.values(KEYS).forEach((key) => {
    if (key === KEYS.USERS || key === KEYS.AUTH) return; // Never export password database or active session token
    const rawVal = safeGetItem(key, userId);
    if (rawVal !== null) {
      try {
        exportPayload.data[key] = JSON.parse(rawVal);
      } catch {
        exportPayload.data[key] = rawVal;
      }
    }
  });

  return exportPayload;
};

/**
 * Validates candidate import data structure before modifying state
 * Prevents partial corrupted writes.
 * @param {any} candidate Candidate import object
 * @returns {{ valid: boolean, error?: string, sanitizedData?: Object }}
 */
export const validateImportData = (candidate) => {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return { valid: false, error: 'Import payload must be a valid JSON object.' };
  }

  // Handle both direct dictionary export and enveloped format
  const dataBlock = candidate.data && typeof candidate.data === 'object' && !Array.isArray(candidate.data)
    ? candidate.data
    : candidate;

  const validKeys = Object.values(KEYS);
  const matchingKeys = Object.keys(dataBlock).filter((k) => validKeys.includes(k));

  if (matchingKeys.length === 0) {
    return { valid: false, error: 'No recognized Skill Point configuration keys found in import data.' };
  }

  // Verify critical fields if present
  if (dataBlock[KEYS.PROFILE] !== undefined) {
    if (typeof dataBlock[KEYS.PROFILE] !== 'object' || dataBlock[KEYS.PROFILE] === null || Array.isArray(dataBlock[KEYS.PROFILE])) {
      return { valid: false, error: 'Invalid profile data structure in import payload.' };
    }
  }

  if (dataBlock[KEYS.ASSESSMENT_HISTORY] !== undefined) {
    if (!Array.isArray(dataBlock[KEYS.ASSESSMENT_HISTORY])) {
      return { valid: false, error: 'Assessment history in import payload must be an array.' };
    }
  }

  if (dataBlock[KEYS.CUSTOM_JOBS] !== undefined) {
    if (!Array.isArray(dataBlock[KEYS.CUSTOM_JOBS])) {
      return { valid: false, error: 'Custom jobs in import payload must be an array.' };
    }
  }

  const sanitized = {};
  matchingKeys.forEach((key) => {
    if (key !== KEYS.USERS && key !== KEYS.AUTH) {
      sanitized[key] = dataBlock[key];
    }
  });

  return { valid: true, sanitizedData: sanitized };
};

/**
 * Atomically imports validated JSON data into storage for the active user.
 * Rejects invalid imports cleanly without partial overwrites.
 * @param {Object} data Storage data object
 * @returns {{ success: boolean, count?: number, error?: string }}
 */
export const importData = (data, userId = null) => {
  const validation = validateImportData(data);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const sanitized = validation.sanitizedData;
    let writtenCount = 0;
    Object.entries(sanitized).forEach(([key, value]) => {
      safeSetItem(key, value, userId);
      writtenCount++;
    });
    return { success: true, count: writtenCount };
  } catch (error) {
    console.error('Error during atomic import:', error);
    return { success: false, error: 'Storage write failure during import.' };
  }
};

/**
 * Retrieves the saved theme preference ('light', 'dark', or 'system')
 */
export const getThemePreference = () => {
  if (typeof window === 'undefined') return 'system';
  try {
    const saved = window.localStorage.getItem(KEYS.THEME);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
    return 'system';
  } catch {
    return 'system';
  }
};

/**
 * Saves and applies theme preference
 */
export const saveThemePreference = (theme) => {
  const validTheme = theme === 'light' || theme === 'dark' ? theme : 'system';
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(KEYS.THEME, validTheme);
      applyTheme(validTheme);
    } catch (e) {
      console.warn('[storageService] Failed to save theme:', e);
    }
  }
  return validTheme;
};

/**
 * Applies the theme to document.documentElement
 */
export const applyTheme = (theme) => {
  if (typeof document === 'undefined') return 'light';
  const effectiveTheme = theme || getThemePreference();
  let resolvedMode = effectiveTheme;

  if (effectiveTheme === 'system') {
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    resolvedMode = prefersDark ? 'dark' : 'light';
  }

  document.documentElement.setAttribute('data-theme', effectiveTheme);
  document.documentElement.setAttribute('data-color-mode', resolvedMode);
  document.documentElement.style.colorScheme = resolvedMode;

  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
  if (metaColorScheme) {
    metaColorScheme.setAttribute('content', effectiveTheme === 'system' ? 'light dark' : effectiveTheme);
  }

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', resolvedMode === 'dark' ? '#0b0f17' : '#0f172a');
  }

  return resolvedMode;
};

export default {
  KEYS,
  GLOBAL_KEYS,
  DEFAULT_PROFILE,
  safeParse,
  getActiveUserId,
  getUserStorageKey,
  migrateLegacyDataToUser,
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  PBKDF2_ITERATIONS,
  SALT_BYTE_LENGTH,
  hashPasswordWithSalt,
  verifyPassword,
  updateRegisteredUser,
  getAuthUser, saveAuthUser, clearAuth, getRegisteredUsers, registerUser,
  getProfile, saveProfile,
  getTargetJob, saveTargetJob,
  getLatestAssessment, saveAssessmentResult, getAssessmentHistory,
  getResumeData, saveResumeData, clearResumeData,
  getParsedResume, saveParsedResume,
  getActiveJD, saveActiveJD, clearActiveJD, getSavedJDs, saveStructuredJD, deleteSavedJD,
  getDynamicAssignments, saveDynamicAssignments,
  getAssessmentLevel, saveAssessmentLevel,
  getSkillLevels, saveSkillLevels,
  getAssignmentCompletions, saveAssignmentCompletions,
  getAssignmentSubmissions, saveAssignmentSubmissions,
  getLearningProgress, saveLearningProgress,
  getProgressHistory, saveProgressSnapshot,
  getActivityLog, addActivity,
  getCustomJobs, saveCustomJob, deleteCustomJob,
  resetProgressData, clearAllData, exportAllData, validateImportData, importData,
  getThemePreference, saveThemePreference, applyTheme
};


