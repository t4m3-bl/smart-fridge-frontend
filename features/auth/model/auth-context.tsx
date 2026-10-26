"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { logoutAuth, refreshAuth, signIn, signUp } from "../api/auth-api";
import type { AuthContextValue, AuthStatus, Credentials } from "./auth-types";
import { isApiError } from "@/shared/api/api-error";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);
  const sessionVersionRef = useRef(0);

  const clearSession = useCallback(() => {
    sessionVersionRef.current += 1;
    setAccessToken(null);
    setStatus("unauthenticated");
  }, []);

  const storeSession = useCallback((token: string) => {
    setAccessToken(token);
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

        storeSession(result.accessToken);
        return result.accessToken;
      } catch (error) {
        if (sessionVersionRef.current !== versionAtStart) {
          return null;
        }

        if (isApiError(error) && error.status === 401) {
          clearSession();
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

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const signInAction = useCallback(
    async (credentials: Credentials) => {
      sessionVersionRef.current += 1;
      const result = await signIn(credentials);
      storeSession(result.accessToken);
    },
    [storeSession],
  );

  const signUpAction = useCallback(
    async (credentials: Credentials) => {
      sessionVersionRef.current += 1;
      const result = await signUp(credentials);
      storeSession(result.accessToken);
    },
    [storeSession],
  );

  const logout = useCallback(async () => {
    sessionVersionRef.current += 1;

    try {
      await logoutAuth();
    } catch {
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      accessToken,
      signIn: signInAction,
      signUp: signUpAction,
      logout,
      refreshSession,
      clearSession,
    }),
    [accessToken, clearSession, logout, refreshSession, signInAction, signUpAction, status],
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


