"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./bottom-sheet.module.css";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, action, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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

  return (
    <div
      className={[styles.root, open ? styles.rootOpen : ""].filter(Boolean).join(" ")}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      aria-hidden={!open}
    >
      <div
        className={`${styles.scrim} ${open ? styles.scrimOpen : ""}`}
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className={`${styles.sheet} ${open ? styles.sheetOpen : ""}`}
      >
        <div className={styles.grab} aria-hidden="true" />
        {title || action ? (
          <div className={styles.header}>
            {title ? <h2 className={styles.title}>{title}</h2> : null}
            {action ? <div className={styles.headerAction}>{action}</div> : null}
          </div>
        ) : null}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
