"use client";

import { useState } from "react";
import { useAuth } from "@/features/auth/model/auth-context";
import type { ProductDto } from "@/features/fridge/api/fridge-api";
import { useConflicts, useProducts } from "@/features/fridge/model/use-products";
import { getCategoryLabel, getLocalCategory, type LocalCategoryId } from "@/features/fridge/model/categories";
import { formatDayMonth, parseDateValue } from "@/features/fridge/model/dates";
import {
  resolveConflictKeepLocal,
  resolveConflictTakeServer,
} from "@/features/fridge/model/products-repository";
import type { OutboxEntry, Product } from "@/features/fridge/model/types";
import { FullScreenSheet } from "@/features/fridge/ui/full-screen-sheet/full-screen-sheet";
import styles from "./conflict-sheet.module.css";
import {formatDays} from "@/shared/lib/format/pluralize";

interface ConflictSheetProps {
  open: boolean;
  onClose: () => void;
}

export function ConflictSheet({ open, onClose }: ConflictSheetProps) {
  const { userId } = useAuth();
  const conflicts = useConflicts(userId);
  const products = useProducts(userId);
  const [busyId, setBusyId] = useState<string | null>(null);

  const productById = new Map((products ?? []).map((product) => [product.id, product] as const));

  const resolve = async (entry: OutboxEntry, keepLocal: boolean) => {
    if (!userId) {
      return;
    }

    setBusyId(entry.id);

    try {
      if (keepLocal) {
        await resolveConflictKeepLocal(userId, entry.productId);
      } else {
        await resolveConflictTakeServer(userId, entry.productId);
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <FullScreenSheet open={open} onClose={onClose} title="Конфликты синхронизации">
      <div className={styles.body}>
        {conflicts === undefined ? (
          <p className={styles.placeholder}>Загружаем…</p>
        ) : conflicts.length === 0 ? (
          <p className={styles.placeholder}>Конфликтов нет — всё синхронизировано</p>
        ) : (
          conflicts.map((entry) => (
            <ConflictCard
              key={entry.id}
              entry={entry}
              local={productById.get(entry.productId)}
              busy={busyId === entry.id}
              onKeepLocal={() => void resolve(entry, true)}
              onTakeServer={() => void resolve(entry, false)}
            />
          ))
        )}
      </div>
    </FullScreenSheet>
  );
}

interface ConflictCardProps {
  entry: OutboxEntry;
  local: Product | undefined;
  busy: boolean;
  onKeepLocal: () => void;
  onTakeServer: () => void;
}

function ConflictCard({ entry, local, busy, onKeepLocal, onTakeServer }: ConflictCardProps) {
  const server = entry.conflict;
  const isDelete = entry.type === "delete";
  const isGone = entry.conflictReason === "deleted";
  const name = (isDelete ? server?.name : local?.name ?? server?.name) ?? "Продукт";

  const subtitle = isGone
    ? "Удалён на другом устройстве"
    : isDelete
      ? "Вы удалили продукт, но на сервере он изменился"
      : "Изменён на другом устройстве";

  const keepLabel = isGone ? "Восстановить" : isDelete ? "Удалить всё равно" : "Оставить моё";
  const takeLabel = isGone ? "Удалить у меня" : isDelete ? "Оставить серверный" : "Взять серверное";

  const serverCategory = server ? getLocalCategory(server.categoryId) : null;
  const rows = isGone
    ? productRows(local, local?.category ?? null)
    : isDelete
      ? productRows(server, serverCategory)
      : comparisonRows(local, server, local?.category ?? null, serverCategory);

  return (
    <section className={styles.card} aria-label={`Конфликт: ${name}`}>
      <h3 className={styles.name}>{name}</h3>
      <p className={styles.subtitle}>{subtitle}</p>

      {isGone || isDelete ? null : (
        <div className={styles.columns} aria-hidden="true">
          <span>Моё</span>
          <span>Сервер</span>
        </div>
      )}

      <dl className={styles.compare}>
        {rows.map((row) => (
          <div key={row.label} className={styles.row}>
            <dt className={styles.label}>{row.label}</dt>
            <dd className={row.values.length === 1 ? styles.single : styles.values}>
              {row.values.map((value, index) => (
                <span
                  key={`${row.label}-${index}`}
                  className={[
                    styles.value,
                    row.values.length > 1 && index === 0 && value !== row.values[1] ? styles.mine : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {value}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.keep}
          onClick={onKeepLocal}
          disabled={busy}
        >
          {keepLabel}
        </button>
        <button
          type="button"
          className={styles.take}
          onClick={onTakeServer}
          disabled={busy}
        >
          {takeLabel}
        </button>
      </div>
    </section>
  );
}

interface CompareRow {
  label: string;
  values: string[];
}

function formatDate(value: string | null | undefined): string {
  const date = parseDateValue(value);

  return date ? `${formatDayMonth(date)} ${date.getFullYear()}` : "—";
}

function formatCategory(category: LocalCategoryId | null): string {
  return getCategoryLabel(category) ?? "Не выбрана";
}

function productRows(
  product: Product | ProductDto | null | undefined,
  category: LocalCategoryId | null,
): CompareRow[] {
  const shelfLife = product?.shelfLifeAfterOpening;

  return [
    { label: "Название", values: [product?.name ?? "—"] },
    { label: "Годен до", values: [formatDate(product?.expiresAt)] },
    { label: "Количество", values: [product?.quantity ?? "—"] },
    { label: "Категория", values: [formatCategory(category)] },
    {
      label: "После вскрытия",
      values: [shelfLife == null ? "Не указано" : formatDays(shelfLife)],
    },
  ];
}

function comparisonRows(
  local: Product | undefined,
  server: OutboxEntry["conflict"],
  localCategory: LocalCategoryId | null,
  serverCategory: LocalCategoryId | null,
): CompareRow[] {
  return [
    { label: "Название", values: [local?.name ?? "—", server?.name ?? "—"] },
    { label: "Годен до", values: [formatDate(local?.expiresAt), formatDate(server?.expiresAt)] },
    { label: "Количество", values: [local?.quantity ?? "—", server?.quantity ?? "—"] },
    { label: "Категория", values: [formatCategory(localCategory), formatCategory(serverCategory)] },
  ];
}
