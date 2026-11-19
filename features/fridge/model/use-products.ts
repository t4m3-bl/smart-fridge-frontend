"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "./db";
import type { OutboxEntry, Product } from "./types";

export function useProducts(userId: string | null): Product[] | undefined {
  return useLiveQuery(
    () =>
      userId
        ? getDb()
            .products.where("userId")
            .equals(userId)
            .filter((product) => product.deletedAt === null)
            .toArray()
        : Promise.resolve<Product[]>([]),
    [userId],
  );
}

export function useConflicts(userId: string | null): OutboxEntry[] | undefined {
  return useLiveQuery(
    () =>
      userId
        ? getDb()
            .outbox.where("userId")
            .equals(userId)
            .filter((entry) => entry.status === "conflict")
            .toArray()
        : Promise.resolve<OutboxEntry[]>([]),
    [userId],
  );
}
