"use client";

import { Icon } from "@/shared/ui/icon";
import styles from "./product-search.module.css";

interface ProductSearchProps {
  value: string;
  onChange: (value: string) => void;
  onFilterClick?: () => void;
  filtersActive?: boolean;
}

export function ProductSearch({
  value,
  onChange,
  onFilterClick,
  filtersActive = false,
}: ProductSearchProps) {
  return (
      <div className={styles.search}>
        <Icon name="search" size={18} className={styles.searchIcon} />
        <input
            type="search"
            className={styles.input}
            placeholder="Поиск продуктов"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Поиск продуктов"
        />
        <button
            type="button"
            className={styles.filterButton}
            aria-label="Фильтры"
            onClick={onFilterClick}
        >
          <Icon name="sliders-horizontal" size={18} />
          {filtersActive ? <span className={styles.filterDot} aria-hidden="true" /> : null}
        </button>
      </div>
  );
}
