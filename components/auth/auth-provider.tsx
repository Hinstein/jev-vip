'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  ApiEnvelope,
  AuthBundle,
  NewApiUser,
} from '@/lib/new-api/types';

type RegisterInput = {
  username: string;
  password: string;
  email?: string;
  verificationCode?: string;
};

type AuthContextValue = {
  user: NewApiUser | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<NewApiUser | null>;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!payload) {
    throw new Error(`Backend returned HTTP ${response.status}.`);
  }
  return payload;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<NewApiUser | null>(null);
  const [ready, setReady] = useState(false);
  const accessTokenRef = useRef<string | null>(null);
  const refreshPromiseRef = useRef<Promise<AuthBundle | null> | null>(null);

  const applyBundle = useCallback((bundle: AuthBundle | null) => {
    accessTokenRef.current = bundle?.access_token ?? null;
    setUser(bundle?.user ?? null);
  }, []);

  const refreshSession = useCallback(async (): Promise<AuthBundle | null> => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const task = (async () => {
      try {
        const response = await fetch('/api/user/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
        });
        if (!response.ok) {
          applyBundle(null);
          return null;
        }

        const payload = await readEnvelope<AuthBundle>(response);
        if (!payload.success || !payload.data?.access_token) {
          applyBundle(null);
          return null;
        }

        applyBundle(payload.data);
        return payload.data;
      } catch {
        applyBundle(null);
        return null;
      }
    })();

    refreshPromiseRef.current = task;
    try {
      return await task;
    } finally {
      refreshPromiseRef.current = null;
    }
  }, [applyBundle]);

  useEffect(() => {
    void refreshSession().finally(() => setReady(true));
  }, [refreshSession]);

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init: RequestInit = {}) => {
      let accessToken = accessTokenRef.current;
      if (!accessToken) {
        accessToken = (await refreshSession())?.access_token ?? null;
      }

      const makeRequest = (token: string | null) => {
        const headers = new Headers(init.headers);
        if (token) headers.set('Authorization', `Bearer ${token}`);
        return fetch(input, {
          ...init,
          headers,
          credentials: 'include',
          cache: init.cache ?? 'no-store',
        });
      };

      let response = await makeRequest(accessToken);
      if (response.status === 401) {
        const fresh = await refreshSession();
        if (fresh?.access_token) {
          response = await makeRequest(fresh.access_token);
        }
      }
      return response;
    },
    [refreshSession]
  );

  const refreshUser = useCallback(async () => {
    const response = await authFetch('/api/user/self');
    if (!response.ok) return null;
    const payload = await readEnvelope<NewApiUser>(response);
    if (!payload.success || !payload.data) return null;
    setUser(payload.data);
    return payload.data;
  }, [authFetch]);

  const login = useCallback(
    async (username: string, password: string) => {
      const encryptionResponse = await fetch('/api/user/login/encryption-key', {
        cache: 'no-store',
      }).catch(() => null);
      if (encryptionResponse?.ok) {
        const encryptionPayload = await encryptionResponse.json().catch(() => null);
        if (encryptionPayload?.data?.enabled) {
          throw new Error(
            'Password-login encryption is enabled in New API. Disable it for the ZEV custom console until encrypted login is enabled here.'
          );
        }
      }

      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const payload = await readEnvelope<AuthBundle | Record<string, unknown>>(response);

      const bundle = payload.data as AuthBundle | undefined;
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Unable to sign in.');
      }
      if (!bundle?.access_token || !bundle.user) {
        throw new Error(
          'This account requires an additional New API login verification step that the ZEV console does not support yet.'
        );
      }

      applyBundle(bundle);
      setReady(true);
    },
    [applyBundle]
  );

  const register = useCallback(
    async ({
      username,
      password,
      email,
      verificationCode,
    }: RegisterInput) => {
      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username,
          password,
          email: email || '',
          verification_code: verificationCode || '',
        }),
      });
      const payload = await readEnvelope<unknown>(response);
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Unable to create account.');
      }
      await login(username, password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    const token = accessTokenRef.current;
    try {
      const headers = new Headers();
      if (token) headers.set('Authorization', `Bearer ${token}`);
      await fetch('/api/user/auth/logout', {
        method: 'POST',
        headers,
        credentials: 'include',
      });
    } finally {
      applyBundle(null);
      setReady(true);
    }
  }, [applyBundle]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      login,
      register,
      logout,
      refreshUser,
      authFetch,
    }),
    [user, ready, login, register, logout, refreshUser, authFetch]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
