"use client";

import styles from "./product-chips.module.css";

export type ChipId = "all" | "expiring" | "ending";

interface Chip {
  id: ChipId;
  label: string;
  count: number;
  tone?: "danger" | "warning";
}

interface ProductChipsProps {
  active: ChipId;
  onChange: (id: ChipId) => void;
  counts: { all: number; expiring: number; ending: number };
}

export function ProductChips({ active, onChange, counts }: ProductChipsProps) {
  const chips: Chip[] = [
    { id: "all", label: "Все продукты", count: counts.all },
    { id: "expiring", label: "Скоро испортится", count: counts.expiring, tone: "danger" },
    { id: "ending", label: "Подходит к концу", count: counts.ending, tone: "warning" },
  ];

  return (
    <div className={styles.chips}>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          className={[styles.chip, active === chip.id ? styles.chipActive : ""].filter(Boolean).join(" ")}
          onClick={() => onChange(chip.id)}
          aria-pressed={active === chip.id}
        >
          {chip.tone ? (
            <span className={[styles.dot, chip.tone === "danger" ? styles.dotDanger : styles.dotWarning].join(" ")} />
          ) : null}
          <span className={styles.chipLabel}>{chip.label}</span>
          <span className={styles.chipCount}>{chip.count}</span>
        </button>
      ))}
    </div>
  );
}
