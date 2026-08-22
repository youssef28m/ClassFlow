"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiClient, authApi } from "@/lib/api-client";
import type {
  AuthSession,
  AuthUser,
  LoginCredentials,
} from "@/types/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const clearSession = useCallback(() => {
    apiClient.setAuthToken(null);
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const applySession = useCallback(
    (session: AuthSession | null) => {
      if (!session) {
        clearSession();
        return;
      }
      apiClient.setAuthToken(session.accessToken);
      setAccessToken(session.accessToken);
      setUser(session.user);
      setStatus("authenticated");
    },
    [clearSession],
  );

  useEffect(() => {
    const unsubscribeSession = apiClient.onSessionChange(applySession);
    const unsubscribeUnauthorized = apiClient.onUnauthorized(clearSession);

    authApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => {
        setStatus((current) =>
          current === "loading" ? "unauthenticated" : current,
        );
      });

    return () => {
      unsubscribeSession();
      unsubscribeUnauthorized();
    };
  }, [applySession, clearSession]);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthUser> => {
      const session = await authApi.login(credentials);
      applySession(session);
      return session.user;
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAll();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const setToken = useCallback((token: string | null) => {
    apiClient.setAuthToken(token);
    setAccessToken(token);
    if (!token) {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      status,
      isAuthenticated: status === "authenticated",
      login,
      logout,
      logoutAll,
      setToken,
    }),
    [user, accessToken, status, login, logout, logoutAll, setToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
