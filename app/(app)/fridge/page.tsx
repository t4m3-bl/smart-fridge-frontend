"use client";

import { useAuthGuard } from "@/features/auth/model/use-auth-guard";
import { useAuth } from "@/features/auth/model/auth-context";
import { SessionCheck } from "@/features/auth/ui/session-check";
import { FridgeScreen } from "@/features/fridge/ui/fridge-screen";

export default function FridgePage() {
  const isAuthenticated = useAuthGuard();
  const { email, isOffline } = useAuth();

  if (!isAuthenticated) {
    return <SessionCheck />;
  }

  return <FridgeScreen email={email} isOffline={isOffline} />;
}
