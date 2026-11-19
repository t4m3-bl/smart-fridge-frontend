"use client";

import { useEffect, type ReactNode } from "react";
import { Icon } from "@/shared/ui/icon";
import styles from "./full-screen-sheet.module.css";

interface FullScreenSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function FullScreenSheet({ open, onClose, title, children }: FullScreenSheetProps) {
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-label={title}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
            <Icon name="x" size={24} />
          </button>
          <h2 className={styles.title}>{title}</h2>
        </header>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
