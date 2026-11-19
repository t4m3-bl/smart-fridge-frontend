"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useAuth } from "@/features/auth/model/auth-context";
import { syncEngine, type SyncSnapshot } from "./sync-engine";
import { collectOrphanPhotos } from "./photo-cache";

const INITIAL_SNAPSHOT: SyncSnapshot = {
  status: "idle",
  pending: 0,
  conflicts: 0,
  lastSyncedAt: null,
};

const SyncContext = createContext<SyncSnapshot>(INITIAL_SNAPSHOT);

export function FridgeSyncProvider({ children }: { children: ReactNode }) {
  const { status, userId, accessToken, refreshSession } = useAuth();
  const tokenRef = useRef(accessToken);

  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const snapshot = useSyncExternalStore(
    syncEngine.subscribe,
    syncEngine.getSnapshot,
    () => INITIAL_SNAPSHOT,
  );

  useEffect(() => {
    if (status !== "authenticated" || !userId) {
      syncEngine.stop();
      return;
    }

    syncEngine.start(userId, {
      getAccessToken: () => tokenRef.current,
      refreshSession,
    });

    return () => syncEngine.stop();
  }, [status, userId, refreshSession]);

  useEffect(() => {
    if (status !== "authenticated" || !userId) {
      return;
    }

    void collectOrphanPhotos(userId);
  }, [status, userId]);

  return <SyncContext.Provider value={snapshot}>{children}</SyncContext.Provider>;
}

export function useSyncStatus() {
  return useContext(SyncContext);
}
