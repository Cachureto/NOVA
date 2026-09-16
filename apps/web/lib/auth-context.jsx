'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from './api';

const AuthContext = createContext(null);
const STORAGE_KEY = 'nova_access_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((session) => {
    setUser(session.user);
    setAccessToken(session.accessToken);
    window.localStorage.setItem(STORAGE_KEY, session.accessToken);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Al cargar la app: si hay un access token guardado se valida contra /me;
  // si ya expiró, se intenta renovar con la cookie httpOnly de refresh.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    apiFetch('/api/auth/me', { token: stored ?? undefined })
      .then(({ user }) => {
        setUser(user);
        setAccessToken(stored);
      })
      .catch(() =>
        apiFetch('/api/auth/refresh', { method: 'POST', body: { client: 'web' }, withCredentials: true })
          .then(applySession)
          .catch(clearSession),
      )
      .finally(() => setLoading(false));
  }, [applySession, clearSession]);

  const login = useCallback(
    async (email, password) => {
      const session = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { email, password, client: 'web' },
        withCredentials: true,
      });
      applySession(session);
    },
    [applySession],
  );

  const register = useCallback(
    async (name, email, password) => {
      const session = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: { name, email, password, client: 'web' },
        withCredentials: true,
      });
      applySession(session);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST', body: { client: 'web' }, withCredentials: true });
    } catch {
      // si falla igual limpiamos la sesión local
    }
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
