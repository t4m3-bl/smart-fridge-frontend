"use client";

import { Button } from "@/shared/ui/button";
import { BottomSheet } from "@/features/fridge/ui/bottom-sheet";
import { PRODUCT_CATEGORIES, type LocalCategoryId } from "@/features/fridge/model/categories";
import type { FridgeFilters, PackageFilter } from "@/features/fridge/model/filters";
import styles from "./filter-sheet.module.css";
import {formatProducts} from "@/shared/lib/format/pluralize";

const PACKAGE_OPTIONS: ReadonlyArray<{ id: PackageFilter; label: string }> = [
  { id: "all", label: "Все" },
  { id: "closed", label: "Закрытые" },
  { id: "opened", label: "Открытые" },
];

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  value: FridgeFilters;
  onChange: (filters: FridgeFilters) => void;
  onReset: () => void;
  count: number;
}

export function FilterSheet({ open, onClose, value, onChange, onReset, count }: FilterSheetProps) {
  const toggleCategory = (id: LocalCategoryId) => {
    const categories = value.categories.includes(id)
      ? value.categories.filter((category) => category !== id)
      : [...value.categories, id];

    onChange({ ...value, categories });
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Фильтры"
      action={
        <button type="button" className={styles.reset} onClick={onReset}>
          Сбросить
        </button>
      }
    >
      <div className={styles.section}>
        <span className={styles.label}>Упаковка</span>
        <div className={styles.segment}>
          {PACKAGE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={[
                styles.segmentOption,
                value.package === option.id ? styles.segmentOptionActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onChange({ ...value, package: option.id })}
              aria-pressed={value.package === option.id}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.label}>Категория</span>
        <div className={styles.categories}>
          {PRODUCT_CATEGORIES.map((category) => {
            const active = value.categories.includes(category.id);

            return (
              <button
                key={category.id}
                type="button"
                className={[styles.chip, active ? styles.chipActive : ""].filter(Boolean).join(" ")}
                onClick={() => toggleCategory(category.id)}
                aria-pressed={active}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      <Button type="button" variant="primary" className={styles.apply} onClick={onClose}>
        Показать {count} {formatProducts(count)}
      </Button>
    </BottomSheet>
  );
}
