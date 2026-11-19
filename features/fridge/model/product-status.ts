import type { Product } from "./types";
import { addDays, daysBetween, parseDateValue, startOfLocalDay } from "./dates";
import {formatDays} from "@/shared/lib/format/pluralize";

export type ProductStatus = "fresh" | "expiring" | "ending" | "expired";

export interface ProductStatusInfo {
  status: ProductStatus;
  label: string;
  detail: string;
  daysLeft: number;
}

const EXPIRING_DAYS = 2;
const ENDING_DAYS = 7;

export function getExpiryDate(product: Product): Date {
  const expiresAt = parseDateValue(product.expiresAt) ?? startOfLocalDay(new Date());
  const openedAt = parseDateValue(product.openedAt);

  if (openedAt && product.shelfLifeAfterOpening !== null) {
    const afterOpening = addDays(openedAt, product.shelfLifeAfterOpening);

    return afterOpening < expiresAt ? afterOpening : expiresAt;
  }

  return expiresAt;
}

export function getProductStatus(product: Product, now: Date = new Date()): ProductStatusInfo {
  const daysLeft = daysBetween(startOfLocalDay(now), getExpiryDate(product));

  if (daysLeft < 0) {
    const daysAgo = Math.abs(daysLeft);

    return {
      status: "expired",
      label: "Испорчено",
      detail:
        daysAgo === 1
          ? "· истёк вчера"
          : `· истёк ${formatDays(daysAgo)} назад`,
      daysLeft,
    };
  }

  if (daysLeft <= EXPIRING_DAYS) {
    const detail =
      daysLeft === 0 ? "· сегодня" : daysLeft === 1 ? "· завтра" : "· через 2 дня";

    return { status: "expiring", label: "Скоро испортится", detail, daysLeft };
  }

  if (daysLeft <= ENDING_DAYS) {
    return {
      status: "ending",
      label: "Подходит к концу",
      detail: `· ${formatDays(daysLeft)}`,
      daysLeft,
    };
  }

  return {
    status: "fresh",
    label: "Свежий",
    detail: `· ${formatDays(daysLeft)}`,
    daysLeft,
  };
}
