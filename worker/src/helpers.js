/**
 * Skill Point — Cloudflare Workers AI MCQ Generator & Persistence Helpers
 */

// Model definitions for Workers AI Free Tier
export const DEFAULT_MODEL = '@cf/meta/llama-3.1-8b-instruct-fp8';
export const FALLBACK_MODEL = '@cf/meta/llama-3.2-3b-instruct';

// Configurable bounds
export const MAX_REQUEST_BODY_BYTES = 64 * 1024; // 64 KB limit
export const MIN_QUESTIONS = 1;
export const MAX_QUESTIONS_PER_REQUEST = 30;

// Rate limiting configuration
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
export const MAX_REQUESTS_PER_WINDOW = 15;

// In-memory rate limiting map per IP/Worker instance (immediate defense layer)
const requestTracker = new Map();

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-session-token',
  'Access-Control-Max-Age': '86400',
};

// =============================================================================
// Cryptographic Password Hashing & Account Utilities (Web Crypto API)
// =============================================================================
export const PBKDF2_ITERATIONS = 100000;
export const SALT_BYTE_LENGTH = 16;

export async function hashPasswordWithSalt(password, existingSaltHex = null) {
  const cryptoObj = typeof globalThis !== 'undefined' && globalThis.crypto ? globalThis.crypto : null;
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error('Web Crypto API is not available in this environment.');
  }

  let saltBytes;
  if (existingSaltHex && typeof existingSaltHex === 'string' && existingSaltHex.length === SALT_BYTE_LENGTH * 2) {
    saltBytes = new Uint8Array(SALT_BYTE_LENGTH);
    for (let i = 0; i < SALT_BYTE_LENGTH; i++) {
      saltBytes[i] = parseInt(existingSaltHex.substr(i * 2, 2), 16);
    }
  } else {
    saltBytes = cryptoObj.getRandomValues(new Uint8Array(SALT_BYTE_LENGTH));
  }

  const saltHex = Array.from(saltBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const keyMaterial = await cryptoObj.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await cryptoObj.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return { hash: hashHex, salt: saltHex };
}

export async function verifyPassword(password, storedHash, storedSalt) {
  if (!password || !storedHash || !storedSalt) return false;
  try {
    const { hash } = await hashPasswordWithSalt(password, storedSalt);
    return hash === storedHash;
  } catch {
    return false;
  }
}

export function generateSessionToken() {
  const cryptoObj = globalThis.crypto;
  const bytes = cryptoObj.getRandomValues(new Uint8Array(32));
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `ssp_${hex}`;
}

export async function resolveUserFromRequest(request, env) {
  if (!env || !env.DB) return null;
  const authHeader = request.headers.get('Authorization') || request.headers.get('x-session-token') || '';
  const tokenMatch = authHeader.match(/Bearer\s+([a-zA-Z0-9_-]+)/i);
  const token = tokenMatch ? tokenMatch[1] : authHeader.trim();
  if (!token) return null;

  // 1. Try KV cache if configured
  if (env.SESSIONS_KV) {
    try {
      const cached = await env.SESSIONS_KV.get(`auth_session:${token}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.expires_at > Date.now()) {
          return { id: parsed.user_id, email: parsed.email, name: parsed.name, token };
        }
      }
    } catch {
      // KV cache miss / error; fall back to D1
    }
  }

  // 2. Query D1
  try {
    const sessionRow = await env.DB.prepare(
      'SELECT s.user_id, s.expires_at, u.email, u.name FROM user_sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?'
    ).bind(token).first();

    if (!sessionRow) return null;

    if (sessionRow.expires_at <= Date.now()) {
      await env.DB.prepare('DELETE FROM user_sessions WHERE token = ?').bind(token).run();
      if (env.SESSIONS_KV) {
        await env.SESSIONS_KV.delete(`auth_session:${token}`);
      }
      return null;
    }

    const user = {
      id: sessionRow.user_id,
      email: sessionRow.email,
      name: sessionRow.name,
      token,
    };

    if (env.SESSIONS_KV) {
      const ttlSec = Math.min(3600, Math.max(60, Math.floor((sessionRow.expires_at - Date.now()) / 1000)));
      await env.SESSIONS_KV.put(
        `auth_session:${token}`,
        JSON.stringify({ user_id: sessionRow.user_id, email: sessionRow.email, name: sessionRow.name, expires_at: sessionRow.expires_at }),
        { expirationTtl: ttlSec }
      );
    }

    return user;
  } catch (err) {
    console.error('[Worker] resolveUserFromRequest error:', err);
    return null;
  }
}

/**
 * Validates and cleans raw questions generated by the LLM
 */
export function validateAndCleanQuestions(rawQuestions, requestedLevel, requestedSkills = []) {
  if (!Array.isArray(rawQuestions)) {
    return { valid: false, error: 'Model output is not an array of questions' };
  }

  const cleaned = [];
  const seenQuestionTexts = new Set();
  const validLevel = requestedLevel || 1;

  for (let i = 0; i < rawQuestions.length; i++) {
    const q = rawQuestions[i];
    if (!q || typeof q !== 'object') continue;

    const questionText = typeof q.question === 'string' ? q.question.trim() : '';
    if (!questionText || questionText.length < 15) {
      continue; // Question too short or missing
    }

    // Deduplication within attempt
    const normalizedText = questionText.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 80);
    if (seenQuestionTexts.has(normalizedText)) {
      continue;
    }

    // Validate options: exactly 4 distinct, non-empty options
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      continue;
    }

    const options = q.options.map((opt) => (typeof opt === 'string' ? opt.trim() : String(opt || '').trim()));
    if (options.some((opt) => opt.length === 0)) {
      continue;
    }

    const uniqueOptions = new Set(options.map((o) => o.toLowerCase()));
    if (uniqueOptions.size !== 4) {
      continue; // Duplicate options detected
    }

    // Validate answer index: integer 0, 1, 2, or 3
    let answerIndex = -1;
    if (typeof q.answer === 'number' && Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3) {
      answerIndex = q.answer;
    } else if (typeof q.answer === 'string') {
      const parsedAns = parseInt(q.answer, 10);
      if (!Number.isNaN(parsedAns) && parsedAns >= 0 && parsedAns <= 3) {
        answerIndex = parsedAns;
      } else {
        const letter = q.answer.trim().toUpperCase();
        if (letter === 'A') answerIndex = 0;
        else if (letter === 'B') answerIndex = 1;
        else if (letter === 'C') answerIndex = 2;
        else if (letter === 'D') answerIndex = 3;
      }
    }

    if (answerIndex < 0 || answerIndex > 3) {
      continue; // Invalid answer index
    }

    // Shuffle options so correct answer position is varied (A, B, C, D)
    const correctOptionText = options[answerIndex];
    for (let j = options.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [options[j], options[k]] = [options[k], options[j]];
    }
    const finalAnswerIndex = options.indexOf(correctOptionText);

    const explanation = typeof q.explanation === 'string' && q.explanation.trim().length > 10
      ? q.explanation.trim()
      : `Option ${String.fromCharCode(65 + finalAnswerIndex)} is the correct engineering practice.`;

    const skill = typeof q.skill === 'string' && q.skill.trim().length > 0
      ? q.skill.trim()
      : (requestedSkills[i % requestedSkills.length] || 'Engineering');

    cleaned.push({
      id: `llm-q-${Date.now()}-${i + 1}`,
      skill,
      skillId: skill,
      level: validLevel,
      question: questionText,
      options,
      answer: finalAnswerIndex >= 0 ? finalAnswerIndex : 0,
      explanation,
      objective: typeof q.objective === 'string' ? q.objective.trim() : `${skill} competency evaluation`,
      source: 'workers_ai_llm',
    });

    seenQuestionTexts.add(normalizedText);
  }

  return {
    valid: cleaned.length > 0,
    questions: cleaned,
    cleanedCount: cleaned.length,
  };
}

/**
 * Constructs prompt with strict context minimization
 */
export function buildPrompt({ targetJob, level, skills, questionCount, companyContext = '' }) {
  const levelDescriptions = {
    1: 'Level 1 (Fundamentals & Syntax • 25–30 Qs): Language primitives, core keywords, basic control flow, standard library methods, and definitions.',
    2: 'Level 2 (Core Engineering & Architecture • 20–25 Qs): Practical system design, architectural patterns, API contracts, error handling, component lifecycle, transactions, and state management.',
    3: 'Level 3 (RIGOROUS 1-TO-1 SENIOR/STAFF TECHNICAL INTERVIEW • 10–15 Qs): This is an elite live technical interview round with a Principal Architect. Questions MUST be complex, deep real-world production incident scenarios, subtle concurrency race conditions, memory profiling (heap dumps, GC pauses), deadlocks, distributed transaction failures, low-level internal JVM/runtime mechanics, and tricky architectural trade-offs where plausible distractors catch surface-level knowledge.',
  };

  const levelGuide = levelDescriptions[level] || levelDescriptions[1];
  const targetCount = Math.min(MAX_QUESTIONS_PER_REQUEST, Math.max(MIN_QUESTIONS, questionCount || 10));

  return `You are a Principal Software Engineering Assessor.
Generate exactly ${targetCount} realistic, professional multiple-choice diagnostic questions (MCQs) for a candidate targeting the role of "${targetJob}".
Target Difficulty: ${levelGuide}
Target Skills: ${skills.join(', ')}.
${companyContext ? `Role Context: ${companyContext}.` : ''}

RULES:
1. Every question must be technically precise, realistic, and test genuine understanding.
2. Provide exactly 4 distinct and plausible options per question.
3. The answer must be the 0-indexed number (0, 1, 2, or 3) indicating which option is correct. Distribute the correct answers across 0, 1, 2, and 3 (Option A, B, C, D) so it is NOT always 0.
4. Provide a clear technical explanation.
5. Return ONLY a valid JSON array of objects. No markdown formatting, no conversational text, no backticks.

REQUIRED JSON FORMAT:
[
  {
    "skill": "Skill Name",
    "question": "Clear technical question text?",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "answer": 0,
    "explanation": "Technical justification of why Option A is correct.",
    "objective": "What this evaluates"
  }
]`;
}

/**
 * Atomically reserves a daily quota slot using Cloudflare D1 (SQLite).
 */
export async function reserveDailyQuotaAtomic(env) {
  if (!env || !env.DB) {
    return {
      allowed: false,
      reason: 'Atomic quota storage (env.DB) is not configured. Failing closed for safety.',
    };
  }

  const maxDaily = parseInt(env.MAX_DAILY_REQUESTS, 10) || 100;
  const today = new Date().toISOString().slice(0, 10);
  const now = Date.now();

  try {
    const stmt = env.DB.prepare(`
      INSERT INTO daily_quota (day, count, updated_at)
      VALUES (?1, 1, ?2)
      ON CONFLICT(day) DO UPDATE
      SET count = count + 1, updated_at = ?2
      WHERE count < ?3
      RETURNING count;
    `).bind(today, now, maxDaily);

    const result = await stmt.all();
    const rows = result?.results || [];

    if (rows.length === 0) {
      return {
        allowed: false,
        quotaExceeded: true,
        reason: `Daily Workers AI inference quota of ${maxDaily} requests reached for ${today}.`,
      };
    }

    const currentCount = rows[0].count;
    return { allowed: true, current: currentCount, maxDaily, day: today };
  } catch (err) {
    console.error('Failed atomic daily quota reservation in D1:', err);
    return {
      allowed: false,
      reason: 'Failed atomic daily quota reservation in database. Failing closed for safety.',
    };
  }
}

/**
 * Refunds a reserved quota slot when inference fails, times out, or returns invalid output.
 */
export async function refundDailyQuotaAtomic(env, day) {
  if (!env || !env.DB || !day) return;
  try {
    const stmt = env.DB.prepare(`
      UPDATE daily_quota
      SET count = MAX(0, count - 1), updated_at = ?2
      WHERE day = ?1;
    `).bind(day, Date.now());
    await stmt.run();
  } catch (err) {
    console.error('Failed to refund daily quota in D1:', err);
  }
}

/**
 * Dual-layer rate limiting:
 */
export async function checkRateLimit(request, env) {
  const clientIp = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || '127.0.0.1';
  const now = Date.now();

  // Layer 2: Isolate-local in-memory check
  const tracker = requestTracker.get(clientIp) || { count: 0, windowStart: now };
  if (now - tracker.windowStart > RATE_LIMIT_WINDOW_MS) {
    tracker.count = 1;
    tracker.windowStart = now;
  } else {
    tracker.count++;
    if (tracker.count > MAX_REQUESTS_PER_WINDOW) {
      return { allowed: false, reason: 'Isolate-local rate limit exceeded (15 req/min).' };
    }
  }
  requestTracker.set(clientIp, tracker);

  // Layer 1: Distributed KV rate limiting (if SESSIONS_KV is available)
  if (env && env.SESSIONS_KV) {
    const minuteWindow = Math.floor(now / RATE_LIMIT_WINDOW_MS);
    const rlKey = `ratelimit:ip:${clientIp}:${minuteWindow}`;
    try {
      const stored = await env.SESSIONS_KV.get(rlKey);
      const count = stored ? parseInt(stored, 10) || 0 : 0;
      if (count >= MAX_REQUESTS_PER_WINDOW) {
        return { allowed: false, reason: 'Distributed rate limit exceeded (15 req/min).' };
      }
      await env.SESSIONS_KV.put(rlKey, String(count + 1), { expirationTtl: 120 });
    } catch (err) {
      console.warn('KV rate limit read error, relying on isolate-local tracker:', err);
    }
  }

  return { allowed: true };
}
