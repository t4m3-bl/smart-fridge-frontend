"use client";

import auth from "@/features/auth/ui/auth.module.css";
import styles from "@/features/auth/ui/register-form/register-form.module.css";
import Link from "next/link";
import {Button} from "@/shared/ui/button";
import {Icon} from "@/shared/ui/icon";

export interface SettingsPageProps {
  isLoggingOut: boolean;
  handleLogout: () => void;
}

export default function SettingsScreen({isLoggingOut, handleLogout}: SettingsPageProps) {
  return (
      <div className={auth.page}>
        <div className={auth.inner}>
          <main className={auth.content}>
            <div className={styles.backRow}>
              <Link href="/fridge" className={auth.backLink}>
                <Icon name={"arrowLeft"} />
                Холодильник
              </Link>
            </div>
            <section>
              <h1>Профиль</h1>
            </section>
          </main>
          <footer>
            <Button type="button" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? "Выходим…" : "Выйти"}
            </Button>
          </footer>
        </div>
      </div>
  );
}
