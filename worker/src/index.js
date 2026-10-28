/**
 * Skill Point — Cloudflare Workers AI MCQ Generator
 *
 * Dedicated Serverless API Endpoints:
 *  - POST /api/generate-mcqs     (Generates questions, stores answer key + secret on server, returns sanitized questions)
 *  - POST /api/submit-assessment (Verifies secret and answers, computes score, returns review)
 *  - GET  /api/health            (Service health check)
 *
 * Hardened Architecture:
 *  - AI Binding: env.AI (@cf/meta/llama-3.1-8b-instruct)
 *  - Session Storage: env.SESSIONS_KV (Trusted attempt storage & 1-hour expiration)
 *  - Quota Database: env.DB (Cloudflare D1 SQLite ACID atomic quota accounting)
 *  - P0 Answer Security: Zero answer leakage; submissions authenticated with separate high-entropy attemptSecret
 *  - P0 Submission Validation: Exact length check, integer option range check, 64KB body limit, non-destructive 400 errors
 *  - P1 Atomic Quota: Single-statement D1 UPSERT prevents race conditions; quota refunded on inference failure
 *  - P1 Rate Limiting: Dual-layer (distributed KV + in-memory isolate guard); documented IP & edge limitations
 */

import {
  DEFAULT_MODEL,
  FALLBACK_MODEL,
  MAX_REQUEST_BODY_BYTES,
  MIN_QUESTIONS,
  MAX_QUESTIONS_PER_REQUEST,
  CORS_HEADERS,
  hashPasswordWithSalt,
  verifyPassword,
  generateSessionToken,
  resolveUserFromRequest,
  validateAndCleanQuestions,
  buildPrompt,
  reserveDailyQuotaAtomic,
  refundDailyQuotaAtomic,
  checkRateLimit,
} from './helpers.js';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health' || url.pathname === '/api/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'skill-point-ai-worker',
          model: DEFAULT_MODEL,
          hasKV: Boolean(env?.SESSIONS_KV),
          hasDB: Boolean(env?.DB),
          hasAI: Boolean(env?.AI),
        }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // -------------------------------------------------------------
    // Auth Route: POST /api/auth/register
    // -------------------------------------------------------------
    if (url.pathname === '/api/auth/register') {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed. Send POST request.' }), { status: 405, headers: CORS_HEADERS });
      }
      if (!env || !env.DB) {
        return new Response(JSON.stringify({ success: false, error: 'Database service unavailable' }), { status: 503, headers: CORS_HEADERS });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ success: false, error: 'Invalid JSON request body' }), { status: 400, headers: CORS_HEADERS });
      }

      const { name, email, password } = body || {};
      const normEmail = String(email || '').trim().toLowerCase();
      const trimmedName = String(name || '').trim();

      if (!trimmedName || !normEmail || !password) {
        return new Response(JSON.stringify({ success: false, error: 'Name, email, and password are required' }), { status: 400, headers: CORS_HEADERS });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normEmail)) {
        return new Response(JSON.stringify({ success: false, error: 'Please enter a valid email address' }), { status: 400, headers: CORS_HEADERS });
      }

      if (typeof password !== 'string' || password.length < 6) {
        return new Response(JSON.stringify({ success: false, error: 'Password must be at least 6 characters' }), { status: 400, headers: CORS_HEADERS });
      }

      try {
        const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(normEmail).first();
        if (existing) {
          return new Response(JSON.stringify({ success: false, error: 'User with this email already exists' }), { status: 409, headers: CORS_HEADERS });
        }

        const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const now = Date.now();
        const { hash, salt } = await hashPasswordWithSalt(password);

        await env.DB.prepare(
          'INSERT INTO users (id, email, name, password_hash, salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(userId, normEmail, trimmedName, hash, salt, now, now).run();

        const token = generateSessionToken();
        const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days
        await env.DB.prepare(
          'INSERT INTO user_sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'
        ).bind(token, userId, now, expiresAt).run();

        if (env.SESSIONS_KV) {
          try {
            await env.SESSIONS_KV.put(
              `auth_session:${token}`,
              JSON.stringify({ user_id: userId, email: normEmail, name: trimmedName, expires_at: expiresAt }),
              { expirationTtl: 30 * 24 * 3600 }
            );
          } catch {}
        }

        const initialProfile = {
          name: trimmedName,
          email: normEmail,
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
          joinDate: new Date().toISOString(),
        };

        await env.DB.prepare(
          'INSERT INTO user_records (user_id, data_key, data_value, updated_at) VALUES (?, ?, ?, ?)'
        ).bind(userId, 'skillPointProfile', JSON.stringify(initialProfile), now).run();

        return new Response(
          JSON.stringify({
            success: true,
            user: { id: userId, name: trimmedName, email: normEmail },
            token,
          }),
          { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      } catch (dbErr) {
        console.error('[Worker] Register error:', dbErr);
        return new Response(JSON.stringify({ success: false, error: 'Registration failed due to server error' }), { status: 500, headers: CORS_HEADERS });
      }
    }

    // -------------------------------------------------------------
    // Auth Route: POST /api/auth/login
    // -------------------------------------------------------------
    if (url.pathname === '/api/auth/login') {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed. Send POST request.' }), { status: 405, headers: CORS_HEADERS });
      }
      if (!env || !env.DB) {
        return new Response(JSON.stringify({ success: false, error: 'Database service unavailable' }), { status: 503, headers: CORS_HEADERS });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ success: false, error: 'Invalid JSON request body' }), { status: 400, headers: CORS_HEADERS });
      }

      const { email, password } = body || {};
      const normEmail = String(email || '').trim().toLowerCase();

      if (!normEmail || !password) {
        return new Response(JSON.stringify({ success: false, error: 'Email and password are required' }), { status: 400, headers: CORS_HEADERS });
      }

      try {
        const userRow = await env.DB.prepare(
          'SELECT id, email, name, password_hash, salt FROM users WHERE email = ?'
        ).bind(normEmail).first();

        if (!userRow) {
          return new Response(JSON.stringify({ success: false, error: 'Invalid email or password' }), { status: 401, headers: CORS_HEADERS });
        }

        const isValid = await verifyPassword(password, userRow.password_hash, userRow.salt);
        if (!isValid) {
          return new Response(JSON.stringify({ success: false, error: 'Invalid email or password' }), { status: 401, headers: CORS_HEADERS });
        }

        const now = Date.now();
        const token = generateSessionToken();
        const expiresAt = now + 30 * 24 * 60 * 60 * 1000;

        await env.DB.prepare(
          'INSERT INTO user_sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'
        ).bind(token, userRow.id, now, expiresAt).run();

        if (env.SESSIONS_KV) {
          try {
            await env.SESSIONS_KV.put(
              `auth_session:${token}`,
              JSON.stringify({ user_id: userRow.id, email: userRow.email, name: userRow.name, expires_at: expiresAt }),
              { expirationTtl: 30 * 24 * 3600 }
            );
          } catch {}
        }

        return new Response(
          JSON.stringify({
            success: true,
            user: { id: userRow.id, name: userRow.name, email: userRow.email },
            token,
          }),
          { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      } catch (loginErr) {
        console.error('[Worker] Login error:', loginErr);
        return new Response(JSON.stringify({ success: false, error: 'Sign-in failed due to server error' }), { status: 500, headers: CORS_HEADERS });
      }
    }

    // -------------------------------------------------------------
    // Auth Route: POST /api/auth/logout
    // -------------------------------------------------------------
    if (url.pathname === '/api/auth/logout') {
      const authHeader = request.headers.get('Authorization') || request.headers.get('x-session-token') || '';
      const tokenMatch = authHeader.match(/Bearer\s+([a-zA-Z0-9_-]+)/i);
      const token = tokenMatch ? tokenMatch[1] : authHeader.trim();

      if (token && env && env.DB) {
        try {
          await env.DB.prepare('DELETE FROM user_sessions WHERE token = ?').bind(token).run();
          if (env.SESSIONS_KV) {
            await env.SESSIONS_KV.delete(`auth_session:${token}`);
          }
        } catch {}
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Logged out successfully' }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // -------------------------------------------------------------
    // Auth Route: GET /api/auth/me
    // -------------------------------------------------------------
    if (url.pathname === '/api/auth/me') {
      const user = await resolveUserFromRequest(request, env);
      if (!user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized: Invalid or expired session' }),
          { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ success: true, user: { id: user.id, email: user.email, name: user.name } }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // -------------------------------------------------------------
    // Persistence Route: GET & POST /api/user/data
    // -------------------------------------------------------------
    if (url.pathname === '/api/user/data') {
      const user = await resolveUserFromRequest(request, env);
      if (!user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized: Invalid or expired session' }),
          { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      if (request.method === 'GET') {
        try {
          const { results } = await env.DB.prepare(
            'SELECT data_key, data_value, updated_at FROM user_records WHERE user_id = ?'
          ).bind(user.id).all();

          const data = {};
          for (const row of results || []) {
            try {
              data[row.data_key] = JSON.parse(row.data_value);
            } catch {
              data[row.data_key] = row.data_value;
            }
          }

          return new Response(
            JSON.stringify({ success: true, data, userId: user.id }),
            { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
          );
        } catch (fetchErr) {
          console.error('[Worker] Fetch user data error:', fetchErr);
          return new Response(JSON.stringify({ success: false, error: 'Failed to retrieve user data' }), { status: 500, headers: CORS_HEADERS });
        }
      }

      if (request.method === 'POST') {
        let body;
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ success: false, error: 'Invalid JSON request body' }), { status: 400, headers: CORS_HEADERS });
        }

        const now = Date.now();
        const updates = body?.updates && typeof body.updates === 'object'
          ? body.updates
          : (body?.key ? { [body.key]: body.value } : null);

        if (!updates || Object.keys(updates).length === 0) {
          return new Response(JSON.stringify({ success: false, error: 'No update payload provided' }), { status: 400, headers: CORS_HEADERS });
        }

        try {
          const stmts = [];
          for (const [key, val] of Object.entries(updates)) {
            const serialized = typeof val === 'string' ? val : JSON.stringify(val);
            stmts.push(
              env.DB.prepare(
                `INSERT INTO user_records (user_id, data_key, data_value, updated_at)
                 VALUES (?, ?, ?, ?)
                 ON CONFLICT(user_id, data_key)
                 DO UPDATE SET data_value = excluded.data_value, updated_at = excluded.updated_at`
              ).bind(user.id, key, serialized, now)
            );
          }

          if (stmts.length > 0) {
            if (typeof env.DB.batch === 'function') {
              await env.DB.batch(stmts);
            } else {
              for (const stmt of stmts) {
                await stmt.run();
              }
            }
          }

          return new Response(
            JSON.stringify({ success: true, updatedKeys: Object.keys(updates) }),
            { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
          );
        } catch (saveErr) {
          console.error('[Worker] Save user data error:', saveErr);
          return new Response(JSON.stringify({ success: false, error: 'Failed to save user data' }), { status: 500, headers: CORS_HEADERS });
        }
      }

      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS_HEADERS });
    }

    // -------------------------------------------------------------
    // Persistence Route: POST /api/user/reset-progress
    // -------------------------------------------------------------
    if (url.pathname === '/api/user/reset-progress') {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS_HEADERS });
      }
      const user = await resolveUserFromRequest(request, env);
      if (!user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized: Invalid or expired session' }),
          { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      try {
        await env.DB.prepare(
          `DELETE FROM user_records WHERE user_id = ? AND data_key IN (
            'skillPointAssessment',
            'skillPointAssessmentHistory',
            'skillPointAssignments',
            'skillPointAssignmentSubmissions',
            'skillPointDynamicAssignments',
            'skillPointAssessmentLevel',
            'skillPointSkillLevels',
            'skillPointLearningProgress',
            'skillPointProgressHistory',
            'skillPointActivityLog'
          )`
        ).bind(user.id).run();

        return new Response(
          JSON.stringify({ success: true, message: 'Progress data reset successfully' }),
          { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      } catch (resetErr) {
        console.error('[Worker] Reset progress error:', resetErr);
        return new Response(JSON.stringify({ success: false, error: 'Failed to reset progress data' }), { status: 500, headers: CORS_HEADERS });
      }
    }

    // -------------------------------------------------------------
    // Route 1: POST /api/generate-mcqs
    // -------------------------------------------------------------
    if (url.pathname === '/api/generate-mcqs') {
      if (request.method !== 'POST') {
        return new Response(
          JSON.stringify({ error: 'Method not allowed. Send POST request.' }),
          { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // P0: Require trusted server-side session storage (SESSIONS_KV). Fail closed if unavailable.
      if (!env || !env.SESSIONS_KV) {
        return new Response(
          JSON.stringify({
            success: false,
            fallbackRecommended: true,
            error: 'Secure server-side session storage (env.SESSIONS_KV) is not configured. Falling back cleanly to local question generator.',
          }),
          { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // P1: Enforce Daily Request Quota via atomic D1 reservation
      const quotaReservation = await reserveDailyQuotaAtomic(env);
      if (!quotaReservation.allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            fallbackRecommended: true,
            error: quotaReservation.reason,
            quotaExceeded: Boolean(quotaReservation.quotaExceeded),
          }),
          { status: quotaReservation.quotaExceeded ? 429 : 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // P1: Rate Limiting Check
      const rateLimitCheck = await checkRateLimit(request, env);
      if (!rateLimitCheck.allowed) {
        // Refund reserved quota slot since request is blocked before AI invocation
        await refundDailyQuotaAtomic(env, quotaReservation.day);
        return new Response(
          JSON.stringify({
            success: false,
            fallbackRecommended: true,
            error: rateLimitCheck.reason,
          }),
          { status: 429, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // Read and parse payload safely with body size cap
      let body;
      try {
        const text = await request.text();
        if (text.length > MAX_REQUEST_BODY_BYTES) {
          await refundDailyQuotaAtomic(env, quotaReservation.day);
          return new Response(
            JSON.stringify({ error: 'Payload exceeds size limit of 64KB.' }),
            { status: 413, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
          );
        }
        body = JSON.parse(text);
      } catch {
        await refundDailyQuotaAtomic(env, quotaReservation.day);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON request payload.' }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // Context Sanitization & Minimization
      const targetJob = typeof body.targetJob === 'string' && body.targetJob.trim()
        ? body.targetJob.trim().slice(0, 80)
        : 'Software Engineer';

      const level = [1, 2, 3].includes(body.level) ? body.level : 1;

      const rawSkills = Array.isArray(body.skills) ? body.skills : [];
      const skills = rawSkills
        .filter((s) => typeof s === 'string' && s.trim().length > 0)
        .map((s) => s.trim().slice(0, 40))
        .slice(0, 10);

      const questionCount = typeof body.questionCount === 'number'
        ? Math.min(MAX_QUESTIONS_PER_REQUEST, Math.max(MIN_QUESTIONS, body.questionCount))
        : 10;

      const companyContext = typeof body.companyContext === 'string'
        ? body.companyContext.trim().slice(0, 100)
        : '';

      // Check Workers AI binding presence
      if (!env || !env.AI) {
        await refundDailyQuotaAtomic(env, quotaReservation.day);
        return new Response(
          JSON.stringify({
            success: false,
            fallbackRecommended: true,
            error: 'Workers AI binding (env.AI) is not configured in this environment.',
          }),
          { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      const prompt = buildPrompt({ targetJob, level, skills, questionCount, companyContext });

      const primaryModel = env.AI_MODEL || DEFAULT_MODEL;
      let aiResponse;
      let usedModel = primaryModel;

      try {
        try {
          aiResponse = await env.AI.run(primaryModel, {
            messages: [
              { role: 'system', content: 'You are an assessment engine that exclusively outputs raw JSON arrays.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 4096,
          });
        } catch (primaryErr) {
          const isPrimaryTimeout = primaryErr?.name === 'TimeoutError' || primaryErr?.message?.toLowerCase().includes('timeout');
          console.warn('[Workers AI] Primary model failed, attempting fallback model:', {
            primaryModel,
            error: primaryErr?.message,
            isTimeout: isPrimaryTimeout,
            fallbackModel: FALLBACK_MODEL,
          });

          // Attempt fallback model
          usedModel = FALLBACK_MODEL;
          aiResponse = await env.AI.run(FALLBACK_MODEL, {
            messages: [
              { role: 'system', content: 'You are an assessment engine that exclusively outputs raw JSON arrays.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 4096,
          });
        }

        const responseText = typeof aiResponse === 'string'
          ? aiResponse
          : (aiResponse?.response || aiResponse?.text || '');

        let jsonCandidate = responseText.trim();
        if (jsonCandidate.startsWith('```json')) {
          jsonCandidate = jsonCandidate.slice(7);
        } else if (jsonCandidate.startsWith('```')) {
          jsonCandidate = jsonCandidate.slice(3);
        }
        if (jsonCandidate.endsWith('```')) {
          jsonCandidate = jsonCandidate.slice(0, -3);
        }
        jsonCandidate = jsonCandidate.trim();

        const startBracket = jsonCandidate.indexOf('[');
        const endBracket = jsonCandidate.lastIndexOf(']');
        if (startBracket >= 0 && endBracket > startBracket) {
          jsonCandidate = jsonCandidate.substring(startBracket, endBracket + 1);
        }

        let parsedQuestions;
        try {
          parsedQuestions = JSON.parse(jsonCandidate);
        } catch (parseErr) {
          console.error('[Workers AI JSON parse error]', {
            model: usedModel,
            snippet: jsonCandidate.slice(0, 150),
            error: parseErr?.message,
          });
          await refundDailyQuotaAtomic(env, quotaReservation.day);
          return new Response(
            JSON.stringify({
              success: false,
              fallbackRecommended: true,
              error: 'Model response was not valid JSON.',
              rawSnippet: jsonCandidate.slice(0, 200),
            }),
            { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
          );
        }

        const validation = validateAndCleanQuestions(parsedQuestions, level, skills);

        if (!validation.valid || validation.cleanedCount === 0) {
          console.error('[Workers AI validation error]', {
            model: usedModel,
            error: validation.error,
          });
          await refundDailyQuotaAtomic(env, quotaReservation.day);
          return new Response(
            JSON.stringify({
              success: false,
              fallbackRecommended: true,
              error: 'Generated questions failed schema/quality validation.',
            }),
            { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
          );
        }

        // P0 Answer Protection: Generate unpredictable attemptId AND high-entropy attemptSecret
        const attemptId = 'att-' + (crypto?.randomUUID ? crypto.randomUUID() : `sec-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`);
        const attemptSecret = 'sec-' + (crypto?.randomUUID ? crypto.randomUUID() : `tok-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`);

        const now = Date.now();
        const expiresAt = now + 3600 * 1000; // 1-hour expiration

        // Step 7E: Initialize attempt-state record in Cloudflare D1 for ACID atomic lifecycle tracking
        if (!env.DB) {
          console.error('D1 database binding env.DB is missing.');
          await refundDailyQuotaAtomic(env, quotaReservation.day);
          return new Response(
            JSON.stringify({
              success: false,
              fallbackRecommended: true,
              error: 'Database binding unavailable for attempt tracking.',
            }),
            { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
          );
        }

        try {
          await env.DB.prepare(
            `INSERT INTO assessment_attempts (attempt_id, attempt_secret, status, created_at, expires_at)
             VALUES (?, ?, 'pending', ?, ?)`
          ).bind(attemptId, attemptSecret, now, expiresAt).run();
        } catch (dbErr) {
          console.error('Failed to initialize attempt in D1:', dbErr);
          await refundDailyQuotaAtomic(env, quotaReservation.day);
          return new Response(
            JSON.stringify({
              success: false,
              fallbackRecommended: true,
              error: 'Failed to initialize attempt record in database.',
            }),
            { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
          );
        }

        // Store trusted answer key and attemptSecret on the server in KV with 1-hour expiration TTL
        const sessionRecord = {
          attemptId,
          attemptSecret, // High-entropy secret required for submission
          targetJob,
          level,
          createdAt: now,
          status: 'pending',
          questions: validation.questions.map((q) => ({
            id: q.id,
            skill: q.skill,
            skillId: q.skillId,
            level: q.level,
            question: q.question,
            options: q.options,
            answer: q.answer,         // Kept strictly on server
            explanation: q.explanation // Kept strictly on server
          })),
        };

        try {
          await env.SESSIONS_KV.put(`session:${attemptId}`, JSON.stringify(sessionRecord), {
            expirationTtl: 3600, // 1 hour attempt TTL
          });
        } catch (kvErr) {
          console.error('Failed to store assessment session in SESSIONS_KV:', kvErr);
          try {
            await env.DB.prepare('DELETE FROM assessment_attempts WHERE attempt_id = ?').bind(attemptId).run();
          } catch {}
          await refundDailyQuotaAtomic(env, quotaReservation.day);
          return new Response(
            JSON.stringify({
              success: false,
              fallbackRecommended: true,
              error: 'Failed to initialize server-side session storage. Falling back cleanly to local question generator.',
            }),
            { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
          );
        }

        // P0: Strip correct answers, explanations, and revealing metadata before returning to browser!
        const sanitizedClientQuestions = validation.questions.map((q) => ({
          id: q.id,
          skill: q.skill,
          skillId: q.skillId,
          level: q.level,
          question: q.question,
          options: q.options,
          // answer: REMOVED
          // explanation: REMOVED
          objective: q.objective,
          source: 'workers_ai_llm',
        }));

        return new Response(
          JSON.stringify({
            success: true,
            source: 'workers_ai_llm',
            model: usedModel,
            level,
            targetJob,
            attemptId,
            attemptSecret, // Provided only to this client over secure response
            totalQuestions: sanitizedClientQuestions.length,
            questions: sanitizedClientQuestions,
          }),
          { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        const isTimeout = err?.name === 'TimeoutError' || err?.message?.toLowerCase().includes('timeout') || err?.name === 'AbortError';
        console.error('[Workers AI execution error]', {
          model: usedModel,
          name: err?.name,
          message: err?.message,
          isTimeout,
        });
        await refundDailyQuotaAtomic(env, quotaReservation.day);
        return new Response(
          JSON.stringify({
            success: false,
            fallbackRecommended: true,
            error: 'Workers AI inference failed or timed out.',
          }),
          { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }
    }

    // -------------------------------------------------------------
    // Route 2: POST /api/submit-assessment
    // -------------------------------------------------------------
    if (url.pathname === '/api/submit-assessment') {
      if (request.method !== 'POST') {
        return new Response(
          JSON.stringify({ error: 'Method not allowed. Send POST request.' }),
          { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      if (!env || !env.SESSIONS_KV) {
        return new Response(
          JSON.stringify({ success: false, error: 'Server session storage unavailable.' }),
          { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // P0: Enforce maximum request-body size (64KB) before parsing
      let body;
      try {
        const text = await request.text();
        if (text.length > MAX_REQUEST_BODY_BYTES) {
          return new Response(
            JSON.stringify({ success: false, error: 'Payload exceeds size limit of 64KB.' }),
            { status: 413, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
          );
        }
        body = JSON.parse(text);
      } catch {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid JSON request payload.' }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      const { attemptId, attemptSecret, answers } = body || {};

      // Validate presence and types of attemptId and attemptSecret
      if (!attemptId || typeof attemptId !== 'string') {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing or invalid attemptId.' }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      if (!attemptSecret || typeof attemptSecret !== 'string') {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing or invalid attemptSecret.' }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      if (!env.DB) {
        return new Response(
          JSON.stringify({ success: false, error: 'Database service unavailable.' }),
          { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // Step 7E: Query authoritative attempt-state record from D1
      let attemptRecord;
      try {
        const queryRes = await env.DB.prepare(
          `SELECT attempt_id, attempt_secret, status, created_at, expires_at, completed_at, score
           FROM assessment_attempts
           WHERE attempt_id = ?`
        ).bind(attemptId).all();
        attemptRecord = queryRes?.results?.[0];
      } catch (dbErr) {
        console.error('Error querying D1 attempt record:', dbErr);
        return new Response(
          JSON.stringify({ success: false, error: 'Error checking assessment status.' }),
          { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      if (!attemptRecord) {
        return new Response(
          JSON.stringify({ success: false, error: 'Assessment attempt not found or expired.' }),
          { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // P0: Verify attemptSecret ownership BEFORE claiming or modifying attempt
      if (attemptRecord.attempt_secret !== attemptSecret) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid attempt secret. Ownership mismatch.' }),
          { status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // Expiry check
      const now = Date.now();
      if (now > attemptRecord.expires_at) {
        return new Response(
          JSON.stringify({ success: false, error: 'Assessment attempt has expired.' }),
          { status: 410, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // Replay prevention check before atomic claim
      if (attemptRecord.status !== 'pending') {
        return new Response(
          JSON.stringify({ success: false, error: 'Assessment attempt has already been submitted.' }),
          { status: 409, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // Retrieve session questions and server-held answer key from KV
      let rawSession;
      try {
        rawSession = await env.SESSIONS_KV.get(`session:${attemptId}`);
      } catch {
        return new Response(
          JSON.stringify({ success: false, error: 'Error retrieving assessment session.' }),
          { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      if (!rawSession) {
        return new Response(
          JSON.stringify({ success: false, error: 'Assessment attempt not found or expired.' }),
          { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      let session;
      try {
        session = JSON.parse(rawSession);
      } catch {
        return new Response(
          JSON.stringify({ success: false, error: 'Corrupted session record.' }),
          { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // P0: Validate answers array structure
      if (!Array.isArray(answers)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing or invalid answers array.' }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      const questions = session.questions || [];

      // P0: Exact answers length check
      if (answers.length !== questions.length) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Answer count (${answers.length}) does not match question count (${questions.length}).`,
          }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // P0: Validate each answer is an integer within the option range for that question
      for (let i = 0; i < questions.length; i++) {
        const ans = answers[i];
        const q = questions[i];
        const maxOptionIndex = (q.options?.length || 4) - 1;

        if (typeof ans !== 'number' || !Number.isInteger(ans) || ans < 0 || ans > maxOptionIndex) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Answer at index ${i} must be an integer between 0 and ${maxOptionIndex}. Received: ${ans}`,
            }),
            { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Step 7E: Atomic One-Time Submission Claim in Cloudflare D1
      let claimResult;
      try {
        claimResult = await env.DB.prepare(
          `UPDATE assessment_attempts
           SET status = 'processing', completed_at = ?
           WHERE attempt_id = ? AND status = 'pending' AND expires_at > ?
           RETURNING attempt_id`
        ).bind(now, attemptId, now).all();
      } catch (claimErr) {
        console.error('Error claiming assessment attempt in D1:', claimErr);
        return new Response(
          JSON.stringify({ success: false, error: 'Error acquiring submission lock.' }),
          { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      const wasClaimed = claimResult?.results && claimResult.results.length > 0;
      if (!wasClaimed) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Assessment attempt has already been submitted or is currently being processed.',
          }),
          { status: 409, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate score and reveal review items inside the protected single-claim zone
      try {
        let correctAnswers = 0;
        const skillStats = {};
        const reviewQuestions = [];

        questions.forEach((q, idx) => {
          const userChoice = answers[idx];
          const isCorrect = userChoice === q.answer;
          if (isCorrect) correctAnswers++;

          const sId = q.skillId || q.skill;
          if (!skillStats[sId]) {
            skillStats[sId] = { total: 0, correct: 0 };
          }
          skillStats[sId].total++;
          if (isCorrect) skillStats[sId].correct++;

          // Only NOW reveal answer and explanation for review!
          reviewQuestions.push({
            id: q.id,
            skill: q.skill,
            skillId: q.skillId,
            level: q.level,
            question: q.question,
            options: q.options,
            answer: q.answer,
            explanation: q.explanation,
          });
        });

        const score = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
        const skillScores = {};
        Object.entries(skillStats).forEach(([sId, stats]) => {
          skillScores[sId] = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        });

        const completedAt = Date.now();

        // Atomically transition from 'processing' to 'completed' with final score in D1
        await env.DB.prepare(
          `UPDATE assessment_attempts
           SET status = 'completed', score = ?, completed_at = ?
           WHERE attempt_id = ?`
        ).bind(score, completedAt, attemptId).run();

        // Mark session completed in KV for backward compatibility
        try {
          session.status = 'completed';
          session.completedAt = completedAt;
          session.score = score;
          await env.SESSIONS_KV.put(`session:${attemptId}`, JSON.stringify(session), {
            expirationTtl: 300, // 5 min cleanup
          });
        } catch (kvErr) {
          console.error('Failed to update session status in KV:', kvErr);
        }

        return new Response(
          JSON.stringify({
            success: true,
            attemptId,
            score,
            correctAnswers,
            totalQuestions: questions.length,
            skillScores,
            reviewQuestions,
          }),
          { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      } catch (scoringErr) {
        console.error('Error during scoring and completion:', scoringErr);
        // Safe recovery policy: transition to 'failed' so it cannot permit duplicate scoring
        try {
          await env.DB.prepare(
            `UPDATE assessment_attempts
             SET status = 'failed', completed_at = ?
             WHERE attempt_id = ?`
          ).bind(Date.now(), attemptId).run();
        } catch {}

        return new Response(
          JSON.stringify({ success: false, error: 'Internal error processing assessment submission.' }),
          { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found.' }),
      { status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  },
};
