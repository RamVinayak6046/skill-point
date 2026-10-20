/**
 * Skill Point — Backend API Service
 * 
 * Handles client-to-backend communication for account registration,
 * session authentication, and cross-device cloud persistence.
 * Uses Cloudflare Workers D1 as the authoritative source of truth.
 */

export const SESSION_TOKEN_KEY = 'skillPointSessionToken';

/**
 * Resolves the backend API base URL from Vite environment variables or defaults to relative '/api'
 */
export function getApiBaseUrl() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return String(import.meta.env.VITE_API_BASE_URL).replace(/\/+$/, '');
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WORKERS_AI_ENDPOINT) {
    const raw = String(import.meta.env.VITE_WORKERS_AI_ENDPOINT).trim();
    try {
      const parsed = new URL(raw, 'http://localhost');
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.origin;
      }
    } catch {}
  }
  return '';
}

/**
 * Gets the stored session token
 */
export function getStoredSessionToken() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(SESSION_TOKEN_KEY) || null;
    }
  } catch {}
  return null;
}

/**
 * Sets or clears the stored session token
 */
export function setStoredSessionToken(token) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (token) {
        window.localStorage.setItem(SESSION_TOKEN_KEY, String(token).trim());
      } else {
        window.localStorage.removeItem(SESSION_TOKEN_KEY);
      }
    }
  } catch {}
}

/**
 * Core HTTP client for API requests with timeout and authentication headers
 */
export async function apiRequest(path, { method = 'GET', body = null, requireAuth = true, timeoutMs = 8000 } = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = {
    'Accept': 'application/json',
  };

  if (body !== null && method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }

  const token = getStoredSessionToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-session-token'] = token;
  } else if (requireAuth) {
    return {
      success: false,
      error: 'Not authenticated. Session token missing.',
      isAuthError: true,
      status: 401,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timer);

    let data = null;
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { rawText: text };
      }
    }

    if (response.status === 401) {
      setStoredSessionToken(null);
      return {
        success: false,
        error: data?.error || 'Session expired. Please sign in again.',
        isAuthError: true,
        status: 401,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data?.error || `Request failed with status ${response.status}`,
        status: response.status,
        data,
      };
    }

    return {
      success: true,
      data: data?.data !== undefined ? data.data : data,
      raw: data,
      status: response.status,
    };
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = err?.name === 'AbortError';
    return {
      success: false,
      error: isTimeout ? 'Request timed out. Please check your connection.' : (err?.message || 'Network error.'),
      isNetworkError: true,
      status: 0,
    };
  }
}

/**
 * Backend Authentication Methods
 */
export const authApi = {
  async register(name, email, password) {
    const res = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: { name, email, password },
      requireAuth: false,
    });
    if (res.success && res.raw?.token) {
      setStoredSessionToken(res.raw.token);
      return { success: true, user: res.raw.user, token: res.raw.token };
    }
    return { success: false, error: res.error || 'Registration failed' };
  },

  async login(email, password) {
    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      requireAuth: false,
    });
    if (res.success && res.raw?.token) {
      setStoredSessionToken(res.raw.token);
      return { success: true, user: res.raw.user, token: res.raw.token };
    }
    return { success: false, error: res.error || 'Sign in failed' };
  },

  async logout() {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST', requireAuth: false });
    } catch {}
    setStoredSessionToken(null);
    return { success: true };
  },

  async getMe() {
    const token = getStoredSessionToken();
    if (!token) return { success: false, error: 'No active session' };
    const res = await apiRequest('/api/auth/me', { method: 'GET', requireAuth: true });
    if (res.success && res.raw?.user) {
      return { success: true, user: res.raw.user };
    }
    return { success: false, error: res.error };
  },
};

/**
 * User Cloud Data Synchronization Methods
 */
export const userPersistenceApi = {
  async fetchAllUserData() {
    const res = await apiRequest('/api/user/data', { method: 'GET', requireAuth: true });
    if (res.success) {
      return { success: true, data: res.data || {}, userId: res.raw?.userId };
    }
    return { success: false, error: res.error, isNetworkError: res.isNetworkError };
  },

  async saveUserData(updates) {
    if (!updates || typeof updates !== 'object') return { success: false };
    const res = await apiRequest('/api/user/data', {
      method: 'POST',
      body: { updates },
      requireAuth: true,
    });
    return res;
  },

  async resetUserProgress() {
    return await apiRequest('/api/user/reset-progress', { method: 'POST', requireAuth: true });
  },

  async checkHealth() {
    return await apiRequest('/api/health', { method: 'GET', requireAuth: false });
  },
};

export default {
  apiRequest,
  authApi,
  userPersistenceApi,
  getStoredSessionToken,
  setStoredSessionToken,
};
