"use client";

import { getDb } from "./db";
import { toProductFields, fromProductDto } from "./product-mapper";
import type { OutboxEntry, Product, ProductDraft } from "./types";
import { requestSync, refreshSyncCounts } from "./sync-engine";
import { createUuid } from "./uuid";
import { dropPhotoIfUnused } from "./photo-cache";

function nowIso() {
  return new Date().toISOString();
}

function baseEntry(
  userId: string,
  productId: string,
  type: OutboxEntry["type"],
  fields: OutboxEntry["fields"],
  expectedVersion: number | null,
): OutboxEntry {
  const now = Date.now();

  return {
    id: createUuid(),
    userId,
    productId,
    type,
    status: "pending",
    expectedVersion,
    fields,
    conflict: null,
    conflictReason: null,
    rev: 1,
    sentAt: null,
    createdAt: now,
    updatedAt: now,
    lastError: null,
  };
}

export async function createProduct(userId: string, draft: ProductDraft): Promise<Product> {
  const db = getDb();
  const now = nowIso();

  const product: Product = {
    id: createUuid(),
    userId,
    name: draft.name,
    category: draft.category,
    description: draft.description,
    quantity: draft.quantity,
    imageKey: draft.imageKey,
    imageUrl: null,
    manufacturedAt: null,
    expiresAt: draft.expiresAt,
    openedAt: draft.openedAt,
    shelfLifeAfterOpening: draft.shelfLifeAfterOpening,
    version: 0,
    updatedAt: now,
    deletedAt: null,
  };

  const entry = baseEntry(userId, product.id, "create", toProductFields(product), null);

  await db.transaction("rw", db.products, db.outbox, async () => {
    await db.products.add(product);
    await db.outbox.add(entry);
  });

  requestSync();

  return product;
}

export async function updateProduct(
  userId: string,
  id: string,
  patch: Partial<ProductDraft>,
): Promise<Product | null> {
  const db = getDb();
  let previousImageKey: string | null = null;

  const updated = await db.transaction("rw", db.products, db.outbox, async () => {
    const current = await db.products.get(id);

    if (!current || current.userId !== userId || current.deletedAt) {
      return null;
    }

    previousImageKey = current.imageKey;

    const next: Product = {
      ...current,
      ...patch,
      imageUrl:
        patch.imageKey === undefined || patch.imageKey === current.imageKey
          ? (current.imageUrl ?? null)
          : null,
      updatedAt: nowIso(),
    };

    const fields = toProductFields(next);
    const existing = await db.outbox.where("productId").equals(id).first();
    const now = Date.now();

    if (!existing) {
      const type = next.version > 0 ? "update" : "create";

      await db.products.put(next);
      await db.outbox.add(
        baseEntry(userId, id, type, fields, type === "update" ? next.version : null),
      );

      return next;
    }

    const isConflict = existing.status === "conflict";
    const type = next.version === 0 ? "create" : existing.type === "create" ? "update" : existing.type;

    const entry: OutboxEntry = {
      ...existing,
      type,
      fields,
      expectedVersion: isConflict
        ? existing.expectedVersion
        : type === "update"
          ? (existing.expectedVersion ?? next.version)
          : null,
      rev: existing.rev + 1,
      updatedAt: now,
      lastError: isConflict ? existing.lastError : null,
    };

    await db.products.put(next);
    await db.outbox.put(entry);

    return next;
  });

  if (updated) {
    if (updated.imageKey !== previousImageKey) {
      await dropPhotoIfUnused(previousImageKey);
    }

    requestSync();
  }

  return updated;
}

export async function removeProduct(userId: string, id: string): Promise<void> {
  const db = getDb();
  let removedImageKey: string | null = null;

  const removed = await db.transaction("rw", db.products, db.outbox, async () => {
    const current = await db.products.get(id);
    const existing = await db.outbox.where("productId").equals(id).first();

    if (!current || current.userId !== userId) {
      return false;
    }

    if (existing?.conflictReason === "deleted") {
      removedImageKey = current.imageKey;
      await db.outbox.delete(existing.id);
      await db.products.delete(id);
      return true;
    }

    const now = nowIso();
    const nowMs = Date.now();

    if (current.version === 0) {
      const inFlight = existing?.type === "create" && existing.sentAt !== null;

      if (!inFlight) {
        if (existing) {
          await db.outbox.delete(existing.id);
        }

        removedImageKey = current.imageKey;
        await db.products.delete(id);
        return true;
      }

      await db.products.put({
        ...current,
        deletedAt: now,
        updatedAt: now,
      });
      await db.outbox.put({
        ...existing,
        type: "delete",
        status: "pending",
        expectedVersion: null,
        fields: null,
        conflict: null,
        conflictReason: null,
        rev: existing.rev + 1,
        sentAt: null,
        updatedAt: nowMs,
        lastError: null,
      });

      return true;
    }

    await db.products.put({
      ...current,
      deletedAt: now,
      updatedAt: now,
    });

    const entry: OutboxEntry = existing
      ? {
          ...existing,
          type: "delete",
          status: "pending",
          expectedVersion: existing.conflict?.version ?? current.version,
          fields: null,
          conflict: null,
          conflictReason: null,
          rev: existing.rev + 1,
          sentAt: null,
          updatedAt: nowMs,
          lastError: null,
        }
      : baseEntry(userId, id, "delete", null, current.version);

    await db.outbox.put(entry);

    return true;
  });

  if (removed) {
    await dropPhotoIfUnused(removedImageKey);
    requestSync();
  }
}

export async function resolveConflictKeepLocal(userId: string, productId: string): Promise<void> {
  const db = getDb();

  await db.transaction("rw", db.products, db.outbox, async () => {
    const entry = await db.outbox.where("productId").equals(productId).first();
    const product = await db.products.get(productId);

    if (!entry || !product || entry.userId !== userId || product.userId !== userId) {
      return;
    }

    const now = Date.now();
    const isDelete = entry.type === "delete";

    if (isDelete) {
      await db.outbox.put({
        ...entry,
        status: "pending",
        expectedVersion: entry.conflict?.version ?? product.version,
        conflict: null,
        conflictReason: null,
        rev: entry.rev + 1,
        sentAt: null,
        updatedAt: now,
        lastError: null,
      });
      return;
    }

    const restored: Product = {
      ...product,
      version: entry.conflict?.version ?? 0,
      deletedAt: null,
      updatedAt: nowIso(),
    };
    const type = entry.conflict ? "update" : "create";

    await db.products.put(restored);
    await db.outbox.put({
      ...entry,
      type,
      status: "pending",
      expectedVersion: type === "update" ? (entry.conflict?.version ?? product.version) : null,
      fields: toProductFields(restored),
      conflict: null,
      conflictReason: null,
      rev: entry.rev + 1,
      sentAt: null,
      updatedAt: now,
      lastError: null,
    });
  });

  requestSync();
}

export async function resolveConflictTakeServer(userId: string, productId: string): Promise<void> {
  const db = getDb();
  let previousImageKey: string | null = null;

  await db.transaction("rw", db.products, db.outbox, async () => {
    const entry = await db.outbox.where("productId").equals(productId).first();

    if (!entry || entry.userId !== userId) {
      return;
    }

    previousImageKey = (await db.products.get(productId))?.imageKey ?? null;

    if (entry.conflict) {
      await db.products.put(fromProductDto(entry.conflict, userId));
    } else {
      await db.products.delete(productId);
    }

    await db.outbox.delete(entry.id);
  });

  await dropPhotoIfUnused(previousImageKey);

  refreshSyncCounts();
}
