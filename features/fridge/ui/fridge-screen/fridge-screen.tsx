"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/shared/ui/icon";
import { useAuth } from "@/features/auth/model/auth-context";
import { useProducts } from "@/features/fridge/model/use-products";
import { useSyncStatus } from "@/features/fridge/model/sync-provider";
import { getProductStatus } from "@/features/fridge/model/product-status";
import { AddProductButton } from "@/features/fridge/ui/add-product-button/add-product-button";
import { ConflictSheet } from "@/features/fridge/ui/conflict-sheet/conflict-sheet";
import { EmptyFridge } from "@/features/fridge/ui/empty-fridge";
import { FilterSheet } from "@/features/fridge/ui/filter-sheet/filter-sheet";
import { ProductCard } from "@/features/fridge/ui/product-card/product-card";
import { ChipId, ProductChips } from "@/features/fridge/ui/product-chips/product-chips";
import { ProductSearch } from "@/features/fridge/ui/product-search/product-search";
import {
  EMPTY_FILTERS,
  hasActiveFilters,
  matchesFilters,
  matchesSearch,
  type FridgeFilters,
} from "@/features/fridge/model/filters";
import styles from "./fridge-screen.module.css";
import {formatProducts} from "@/shared/lib/format/pluralize";

type FridgeScreenProps = {
  email: string | null;
  isOffline: boolean;
};

export function FridgeScreen({ email, isOffline }: FridgeScreenProps) {
  const { userId } = useAuth();
  const products = useProducts(userId);
  const sync = useSyncStatus();
  const [search, setSearch] = useState("");
  const [chip, setChip] = useState<ChipId>("all");
  const [filters, setFilters] = useState<FridgeFilters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [conflictsOpen, setConflictsOpen] = useState(false);

  const avatarLetter = email?.trim().charAt(0).toUpperCase() || null;

  const items = useMemo(
    () => (products ?? []).map((product) => ({ product, status: getProductStatus(product) })),
    [products],
  );

  const counts = useMemo(
    () => ({
      all: items.length,
      expiring: items.filter((item) => item.status.status === "expiring").length,
      ending: items.filter((item) => item.status.status === "ending").length,
    }),
    [items],
  );

  const visibleItems = useMemo(() => {
    return items
      .filter(({ product, status }) => {
        if (chip === "expiring" && status.status !== "expiring") {
          return false;
        }

        if (chip === "ending" && status.status !== "ending") {
          return false;
        }

        return matchesFilters(product, filters) && matchesSearch(product, search);
      })
      .sort((a, b) => a.status.daysLeft - b.status.daysLeft);
  }, [chip, filters, items, search]);

  const syncState =
    sync.conflicts > 0
      ? "conflict"
      : isOffline
        ? "offline"
        : sync.status === "error"
          ? "error"
          : sync.status === "syncing"
            ? "syncing"
            : sync.pending > 0
              ? "pending"
              : "synced";

  const syncLabel =
    sync.conflicts > 0
      ? `Конфликты · ${sync.conflicts}`
      : isOffline
        ? "Офлайн · изменения сохранятся"
        : sync.status === "error"
          ? `Не удалось синхронизировать${sync.pending > 0 ? ` · ${sync.pending}` : ""}`
          : sync.status === "syncing"
            ? "Синхронизируем…"
            : sync.pending > 0
              ? `Ждут отправки · ${sync.pending}`
              : "Синхронизировано";

  const isLoading = products === undefined;

  return (
    <main className={styles.screen}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.status} data-state={syncState}>
            <Icon
              name={
                syncState === "offline" || syncState === "error" || syncState === "conflict"
                  ? "cloud-off"
                  : "check"
              }
              size={13}
              className={styles.statusIcon}
            />
            <span>{syncLabel}</span>
          </p>

          <div className={styles.headerActions}>
            <Link
              href="/settings"
              className={styles.avatar}
              aria-label={avatarLetter ? `Настройки, ${avatarLetter}` : "Настройки"}
            >
              {avatarLetter ?? <Icon name="settings" size={18} />}
            </Link>
          </div>
        </header>

        {sync.conflicts > 0 ? (
          <button type="button" className={styles.conflictBanner} onClick={() => setConflictsOpen(true)}>
            <span className={styles.conflictText}>
              <Icon name="cloud-off" size={16} />
              <span>
                {sync.conflicts === 1
                  ? "1 продукт изменён в другом месте"
                  : `${formatProducts(sync.conflicts)} изменены в другом месте`}
              </span>
            </span>
            <span className={styles.conflictAction}>Разобрать</span>
          </button>
        ) : null}

        <h1 className={styles.title}>Холодильник</h1>

        <div className={styles.controls}>
          <ProductSearch
            value={search}
            onChange={setSearch}
            onFilterClick={() => setFiltersOpen(true)}
            filtersActive={hasActiveFilters(filters)}
          />
          <ProductChips active={chip} onChange={setChip} counts={counts} />
        </div>

        {isLoading ? (
          <p className={styles.placeholder}>Загружаем продукты…</p>
        ) : items.length === 0 ? (
          <EmptyFridge />
        ) : visibleItems.length === 0 ? (
          <section className={styles.empty} aria-labelledby="fridge-empty-title">
            <div className={styles.emptyIcon}>
              <Icon name="refrigerator" size={36} />
            </div>
            <h2 id="fridge-empty-title" className={styles.emptyTitle}>
              Ничего не найдено
            </h2>
            <p className={styles.emptyText}>Попробуйте изменить поиск или фильтр</p>
          </section>
        ) : (
          <section className={styles.list} aria-label="Продукты">
            {visibleItems.map(({ product, status }) => (
              <ProductCard key={product.id} product={product} status={status} />
            ))}
          </section>
        )}

        {items.length > 0 ? (
          <div className={styles.fabWrap}>
            <AddProductButton />
          </div>
        ) : null}
      </div>

      <FilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={filters}
        onChange={setFilters}
        onReset={() => setFilters(EMPTY_FILTERS)}
        count={visibleItems.length}
      />

      <ConflictSheet open={conflictsOpen} onClose={() => setConflictsOpen(false)} />
    </main>
  );
}
