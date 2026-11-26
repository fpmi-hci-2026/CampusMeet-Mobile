import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setSignedOutListener, tokens } from './api';
import { cache } from './storage';
import type { AuthResponse, User } from './types';

interface AuthState {
  user: User | null;
  ready: boolean;
  login(email: string, password: string): Promise<void>;
  register(fullName: string, email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    tokens.user().then((stored) => {
      setUser(stored);
      setReady(true);
    });
    setSignedOutListener(() => setUser(null));
    return () => {
      setSignedOutListener(null);
    };
  }, []);

  const accept = useCallback(async (auth: AuthResponse) => {
    await tokens.save(auth);
    setUser(auth.user);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => accept(await api.post<AuthResponse>('/auth/login', { email, password })),
    [accept],
  );
  const register = useCallback(
    async (fullName: string, email: string, password: string) =>
      accept(await api.post<AuthResponse>('/auth/register', { full_name: fullName, email, password })),
    [accept],
  );
  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => undefined);
    await tokens.clear();
    await cache.clearUserData();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, login, register, logout }), [user, ready, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}

export const isStaff = (user: User | null) => !!user && ['volunteer', 'organizer', 'admin'].includes(user.role);
