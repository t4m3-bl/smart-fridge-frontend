"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { logoutAuth, refreshAuth, signIn, signUp } from "../api/auth-api";
import type { AuthContextValue, AuthStatus, Credentials } from "./auth-types";
import { isApiError, isNetworkError } from "@/shared/api/api-error";
import {
  SESSION_STORAGE_KEY,
  clearPendingLogout,
  clearStoredSession,
  hasPendingLogout,
  markLogoutPending,
  readStoredSession,
  saveStoredSession,
} from "./session-storage";

const AuthContext = createContext<AuthContextValue | null>(null);

const REFRESH_LEEWAY_MS = 60_000;

const OFFLINE_RETRY_MS = 30_000;

export function AuthProvider({ children }: PropsWithChildren) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [isOffline, setIsOffline] = useState(false);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);
  const sessionVersionRef = useRef(0);
  const hasLocalSessionRef = useRef(false);

  const clearSession = useCallback(() => {
    sessionVersionRef.current += 1;
    hasLocalSessionRef.current = false;
    clearStoredSession();
    setAccessToken(null);
    setExpiresAt(null);
    setIsOffline(false);
    setStatus("unauthenticated");
  }, []);

  const storeSession = useCallback((token: string, expiresIn: number) => {
    hasLocalSessionRef.current = true;
    clearPendingLogout();
    saveStoredSession(token);
    setAccessToken(token);
    setExpiresAt(Date.now() + expiresIn * 1000);
    setIsOffline(false);
    setStatus("authenticated");
  }, []);

  const refreshSession = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const versionAtStart = sessionVersionRef.current;

    refreshPromiseRef.current = (async () => {
      try {
        const result = await refreshAuth();

        if (sessionVersionRef.current !== versionAtStart) {
          return null;
        }

        storeSession(result.accessToken, result.expiresIn);
        return result.accessToken;
      } catch (error) {
        if (sessionVersionRef.current !== versionAtStart) {
          return null;
        }

        const isTemporary = isNetworkError(error) || (isApiError(error) && error.status >= 500);

        if (isTemporary && hasLocalSessionRef.current) {
          setIsOffline(true);
          setStatus("authenticated");
          return null;
        }

        clearSession();
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, [clearSession, storeSession]);

  const flushPendingLogout = useCallback(async () => {
    try {
      await logoutAuth();
      clearPendingLogout();
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        clearPendingLogout();
      }
    }

    clearSession();
  }, [clearSession]);

  const bootstrap = useCallback(() => {
    hasLocalSessionRef.current = readStoredSession() !== null;

    return (async () => {
      if (hasPendingLogout()) {
        await flushPendingLogout();
        return;
      }

      await refreshSession();
    })();
  }, [flushPendingLogout, refreshSession]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (status !== "authenticated" || expiresAt === null) {
      return;
    }

    const delay = Math.max(expiresAt - Date.now() - REFRESH_LEEWAY_MS, 0);
    const timer = setTimeout(() => {
      void refreshSession();
    }, delay);

    return () => clearTimeout(timer);
  }, [expiresAt, refreshSession, status]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      if (expiresAt === null || expiresAt - Date.now() > REFRESH_LEEWAY_MS) {
        return;
      }

      void refreshSession();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [expiresAt, refreshSession, status]);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      void refreshSession();
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [refreshSession]);

  useEffect(() => {
    if (!isOffline || status !== "authenticated") {
      return;
    }

    const timer = setInterval(() => {
      void refreshSession();
    }, OFFLINE_RETRY_MS);

    return () => clearInterval(timer);
  }, [isOffline, refreshSession, status]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SESSION_STORAGE_KEY && event.newValue === null) {
        clearSession();
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, [clearSession]);

  const signInAction = useCallback(
    async (credentials: Credentials) => {
      sessionVersionRef.current += 1;
      const result = await signIn(credentials);
      storeSession(result.accessToken, result.expiresIn);
    },
    [storeSession],
  );

  const signUpAction = useCallback(
    async (credentials: Credentials) => {
      sessionVersionRef.current += 1;
      const result = await signUp(credentials);
      storeSession(result.accessToken, result.expiresIn);
    },
    [storeSession],
  );

  const logout = useCallback(async () => {
    sessionVersionRef.current += 1;

    try {
      await logoutAuth();
    } catch (error) {
      if (!(isApiError(error) && error.status === 401)) {
        markLogoutPending();
      }
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      accessToken,
      isOffline,
      signIn: signInAction,
      signUp: signUpAction,
      logout,
      refreshSession,
      clearSession,
    }),
    [
      accessToken,
      clearSession,
      isOffline,
      logout,
      refreshSession,
      signInAction,
      signUpAction,
      status,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
