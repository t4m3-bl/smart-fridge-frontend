import Dexie, { type EntityTable } from "dexie";
import type { CachedPhoto, OutboxEntry, Product } from "./types";

class FridgeDatabase extends Dexie {
  products!: EntityTable<Product, "id">;
  outbox!: EntityTable<OutboxEntry, "id">;
  photos!: EntityTable<CachedPhoto, "imageKey">;

  constructor() {
    super("smart-fridge");
    this.version(1).stores({
      products: "id, userId, expiresAt, deletedAt, imageKey",
      outbox: "id, userId, productId, status, createdAt",
      photos: "imageKey, userId, cachedAt",
    });
  }
}

let instance: FridgeDatabase | null = null;

export function getDb(): FridgeDatabase {
  if (typeof window === "undefined") {
    throw new Error("Dexie доступен только в браузере");
  }

  instance ??= new FridgeDatabase();

  return instance;
}
