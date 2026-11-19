"use client";

import { useState } from "react";
import { useAuthGuard } from "@/features/auth/model/use-auth-guard";
import { useAuth } from "@/features/auth/model/auth-context";
import { SessionCheck } from "@/features/auth/ui/session-check";
import SettingsScreen from "@/features/settings/ui/settings-screen/settings-screen";

export default function SettingsPage() {
  const isAuthenticated = useAuthGuard();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!isAuthenticated) {
    return <SessionCheck />;
  }

  return <SettingsScreen isLoggingOut={isLoggingOut} handleLogout={handleLogout}/>;
}
