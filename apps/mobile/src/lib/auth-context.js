import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from './api';
import { clearTokens, getTokens, loadSession, saveTokens } from './session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Al abrir la app: si hay tokens guardados, se confirma la sesión con /me.
  useEffect(() => {
    let alive = true;
    (async () => {
      await loadSession();
      if (getTokens().accessToken) {
        try {
          const data = await apiFetch('/api/auth/me', { auth: true });
          if (alive) setUser(data.user);
        } catch (err) {
          // 401 = sesión vencida; un error de red no debe borrar los tokens.
          if (err.status === 401) await clearTokens();
        }
      }
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const start = useCallback(async (path, body) => {
    const data = await apiFetch(path, { method: 'POST', body: { ...body, client: 'mobile' } });
    await saveTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback((email, password) => start('/api/auth/login', { email, password }), [start]);

  const register = useCallback(
    (name, email, password) => start('/api/auth/register', { name, email, password }),
    [start],
  );

  const logout = useCallback(async () => {
    const { refreshToken } = getTokens();
    try {
      if (refreshToken) {
        await apiFetch('/api/auth/logout', {
          method: 'POST',
          body: { refreshToken, client: 'mobile' },
        });
      }
    } catch {
      // Aunque el servidor no responda, cerramos la sesión local.
    }
    await clearTokens();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, isAdmin: user?.role === 'admin', login, register, logout }),
    [user, ready, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
