import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAuthUser,
  saveAuthUser,
  clearAuth,
  clearSessionData,
} from '../services/storageService';
import {
  authApi,
  getStoredSessionToken,
  setStoredSessionToken,
} from '../services/apiService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getAuthUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAuthUser() && getStoredSessionToken()));
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // ==========================================
  // Session Restoration & Backend Verification
  // ==========================================
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const token = getStoredSessionToken();
      if (!token) {
        if (isMounted) {
          clearAuth();
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await authApi.getMe();
        if (!isMounted) return;

        if (res.success && res.user) {
          saveAuthUser(res.user);
          setUser(res.user);
          setIsAuthenticated(true);
        } else if (res.isNetworkError) {
          // Server unreachable; keep cached session for offline resilience
          const cached = getAuthUser();
          if (cached) {
            setUser(cached);
            setIsAuthenticated(true);
          } else {
            clearAuth();
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          // Token expired or invalid on server
          setStoredSessionToken(null);
          clearAuth();
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.warn('[AuthContext] Session restore warning:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifySession();
    return () => {
      isMounted = false;
    };
  }, []);

  // ==========================================
  // Actions
  // ==========================================
  const login = async (email, password) => {
    try {
      clearSessionData();
      const res = await authApi.login(email, password);
      if (res.success && res.user) {
        saveAuthUser(res.user);
        setUser(res.user);
        setIsAuthenticated(true);
        return { success: true, user: res.user };
      }
      return { success: false, error: res.error || 'Invalid email or password' };
    } catch (err) {
      console.error('[AuthContext] Login error:', err);
      return { success: false, error: 'Sign in failed due to connection error.' };
    }
  };

  const register = async (name, email, password) => {
    try {
      clearSessionData();
      const res = await authApi.register(name, email, password);
      if (res.success && res.user) {
        saveAuthUser(res.user);
        setUser(res.user);
        setIsAuthenticated(true);
        return { success: true, user: res.user };
      }
      return { success: false, error: res.error || 'Registration failed' };
    } catch (err) {
      console.error('[AuthContext] Register error:', err);
      return { success: false, error: 'Registration failed due to connection error.' };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    setStoredSessionToken(null);
    clearAuth();
    clearSessionData();
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
