"use client";

import { useState } from "react";
import { useAuthGuard } from "@/features/auth/model/use-auth-guard";
import { useAuth } from "@/features/auth/model/auth-context";
import { SessionCheck } from "@/features/auth/ui/session-check";
import { Button } from "@/shared/ui/button";
import styles from "./fridge.module.css";

export default function FridgePage() {
  const isAuthenticated = useAuthGuard();
  const { isOffline, logout } = useAuth();
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

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>авторизовались ура</h1>
          {isOffline ? (
            <p className={styles.offline}>Нет сети — показываем сохранённые данные</p>
          ) : null}
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="primary" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? "Выходим..." : "Выйти"}
          </Button>
        </div>
      </section>
    </main>
  );
}
