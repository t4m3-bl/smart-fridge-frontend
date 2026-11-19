"use client";

import { isApiError, isNetworkError } from "@/shared/api/api-error";
import type { AuthRequestHelpers } from "@/shared/api/http-client";
import {
  fetchProducts,
  sendProductBatch,
  type ProductBatchOperation,
  type ProductBatchResultDto,
} from "../api/fridge-api";
import { getDb } from "./db";
import { applyServerProduct, fromProductDto, toProductFields } from "./product-mapper";
import { collectOrphanPhotos, dropPhotoIfUnused } from "./photo-cache";
import type { OutboxEntry } from "./types";

export type SyncStatus = "idle" | "syncing" | "error";

export interface SyncSnapshot {
  status: SyncStatus;
  pending: number;
  conflicts: number;
  lastSyncedAt: number | null;
}

const BASE_DELAY_MS = 2_000;
const MAX_DELAY_MS = 5 * 60_000;
const MAX_ATTEMPT = 12;
const BATCH_LIMIT = 100;
const MAX_ROUNDS = 5;
const FOLLOW_UP_MS = 500;

function isRetryable(error: unknown): boolean {
  if (isNetworkError(error)) {
    return true;
  }

  if (isApiError(error)) {
    return ![400, 401, 403, 422].includes(error.status);
  }

  return false;
}

function toOperation(entry: OutboxEntry): ProductBatchOperation | null {
  if (entry.type === "delete") {
    return {
      type: "delete",
      operationId: entry.id,
      id: entry.productId,
      expectedVersion: entry.expectedVersion ?? 1,
    };
  }

  if (!entry.fields) {
    return null;
  }

  if (entry.type === "create") {
    return {
      type: "create",
      operationId: entry.id,
      id: entry.productId,
      product: entry.fields,
    };
  }

  return {
    type: "update",
    operationId: entry.id,
    id: entry.productId,
    expectedVersion: entry.expectedVersion ?? 1,
    product: entry.fields,
  };
}

interface BatchOutcome {
  needsPull: boolean;
  stop: boolean;
}

class SyncEngine {
  private userId: string | null = null;
  private helpers: AuthRequestHelpers | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private attempt = 0;
  private inFlight: Promise<void> | null = null;
  private followUp = false;
  private pullRequested = true;
  private attached = false;
  private listeners = new Set<() => void>();
  private snapshot: SyncSnapshot = {
    status: "idle",
    pending: 0,
    conflicts: 0,
    lastSyncedAt: null,
  };

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  start(userId: string, helpers: AuthRequestHelpers) {
    this.userId = userId;
    this.helpers = helpers;
    this.followUp = false;
    this.pullRequested = true;
    this.attach();
    void this.refreshCounts();
    void this.flush();
  }

  stop() {
    this.detach();
    this.clearTimer();
    this.userId = null;
    this.helpers = null;
    this.attempt = 0;
    this.followUp = false;
    this.pullRequested = true;
    this.publish({ status: "idle", pending: 0, conflicts: 0, lastSyncedAt: null });
  }

  requestSync() {
    if (!this.helpers || !this.userId) {
      return;
    }

    this.attempt = 0;

    if (this.inFlight) {
      this.followUp = true;
      return;
    }

    void this.flush();
  }

  private handleWake = () => {
    this.attempt = 0;
    this.pullRequested = true;
    void this.flush();
  };

  private handleVisibility = () => {
    if (document.visibilityState === "visible") {
      this.handleWake();
    }
  };

  private attach() {
    if (this.attached || typeof window === "undefined") {
      return;
    }

    this.attached = true;
    window.addEventListener("online", this.handleWake);
    document.addEventListener("visibilitychange", this.handleVisibility);
  }

  private detach() {
    if (!this.attached || typeof window === "undefined") {
      return;
    }

    this.attached = false;
    window.removeEventListener("online", this.handleWake);
    document.removeEventListener("visibilitychange", this.handleVisibility);
  }

  private clearTimer() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private schedule(delay: number) {
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, delay);
  }

  private flush(): Promise<void> {
    if (this.inFlight) {
      return this.inFlight;
    }

    const run = this.run().finally(() => {
      this.inFlight = null;

      if (this.followUp) {
        this.followUp = false;
        this.schedule(FOLLOW_UP_MS);
      }
    });

    this.inFlight = run;

    return run;
  }

  private async run() {
    const userId = this.userId;
    const helpers = this.helpers;

    if (!userId || !helpers) {
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await this.refreshCounts();
      return;
    }

    this.publish({ ...this.snapshot, status: "syncing" });

    try {
      const outcome = await this.drainOutbox(userId, helpers);

      if (this.pullRequested || outcome.needsPull) {
        const remoteIds = await pull(userId, helpers);
        await reconcileOutbox(userId, remoteIds);
        await collectOrphanPhotos(userId);
      }

      this.pullRequested = false;
      this.attempt = 0;

      const counts = await this.readCounts();
      this.publish({ status: "idle", ...counts, lastSyncedAt: Date.now() });

      if (counts.pending > 0 && !outcome.halted) {
        this.schedule(FOLLOW_UP_MS);
      }
    } catch (error) {
      this.attempt = Math.min(this.attempt + 1, MAX_ATTEMPT);
      this.publish({ ...this.snapshot, status: "error", ...(await this.readCounts()) });

      if (isRetryable(error)) {
        this.schedule(this.nextDelay());
      }
    }
  }

  private nextDelay() {
    const base = Math.min(BASE_DELAY_MS * 2 ** (this.attempt - 1), MAX_DELAY_MS);
    const jitter = base * 0.25 * (Math.random() * 2 - 1);

    return Math.round(base + jitter);
  }

  private async drainOutbox(
    userId: string,
    helpers: AuthRequestHelpers,
  ): Promise<{ needsPull: boolean; halted: boolean }> {
    const db = getDb();

    for (let round = 0; round < MAX_ROUNDS; round += 1) {
      const pending = await db.outbox
        .where("userId")
        .equals(userId)
        .filter((entry) => entry.status === "pending")
        .sortBy("createdAt");

      if (pending.length === 0) {
        return { needsPull: false, halted: false };
      }

      for (let index = 0; index < pending.length; index += BATCH_LIMIT) {
        const chunk = pending.slice(index, index + BATCH_LIMIT);
        const prepared = await markSent(chunk);
        const operations = prepared
          .map((entry) => ({ entry, operation: toOperation(entry) }))
          .filter(
            (item): item is { entry: OutboxEntry; operation: ProductBatchOperation } =>
              item.operation !== null,
          );

        if (operations.length === 0) {
          continue;
        }

        const response = await sendProductBatch(
          helpers,
          operations.map((item) => item.operation),
        );
        const outcome = await applyResults(
          operations.map((item) => item.entry),
          response.results ?? [],
        );

        if (outcome.needsPull) {
          return { needsPull: true, halted: false };
        }

        if (outcome.stop) {
          return { needsPull: false, halted: true };
        }
      }
    }

    return { needsPull: false, halted: false };
  }

  private async readCounts() {
    if (!this.userId) {
      return { pending: 0, conflicts: 0 };
    }

    const entries = await getDb().outbox.where("userId").equals(this.userId).toArray();
    let pending = 0;
    let conflicts = 0;

    for (const entry of entries) {
      if (entry.status === "conflict") {
        conflicts += 1;
      } else {
        pending += 1;
      }
    }

    return { pending, conflicts };
  }

  async refreshCounts() {
    this.publish({ ...this.snapshot, ...(await this.readCounts()) });
  }

  private publish(snapshot: SyncSnapshot) {
    this.snapshot = snapshot;
    this.listeners.forEach((listener) => listener());
  }
}

export const syncEngine = new SyncEngine();

export function requestSync() {
  syncEngine.requestSync();
}

export function refreshSyncCounts() {
  void syncEngine.refreshCounts();
}

async function applyResults(
  sent: OutboxEntry[],
  results: ProductBatchResultDto[],
): Promise<BatchOutcome> {
  const db = getDb();
  const byOperation = new Map(results.map((result) => [result.operationId, result] as const));
  const deletedImageKeys: string[] = [];
  let needsPull = false;
  let stop = false;

  await db.transaction("rw", db.products, db.outbox, async () => {
    for (const submitted of sent) {
      const current = await db.outbox.get(submitted.id);

      if (!current) {
        continue;
      }

      const result = byOperation.get(submitted.id);

      if (!result) {
        continue;
      }

      const now = Date.now();

      if (result.error) {
        if (result.error.code === "version_conflict") {
          await db.outbox.put({
            ...current,
            status: "conflict",
            conflict: result.product ?? null,
            conflictReason: "version",
            updatedAt: now,
            lastError: null,
          });
          continue;
        }

        if (result.error.code === "not_found") {
          if (submitted.type === "delete") {
            const doomed = await db.products.get(current.productId);

            if (doomed?.imageKey) {
              deletedImageKeys.push(doomed.imageKey);
            }

            await db.outbox.delete(current.id);
            await db.products.delete(current.productId);
            continue;
          }

          await db.outbox.put({
            ...current,
            status: "conflict",
            conflict: null,
            conflictReason: "deleted",
            updatedAt: now,
            lastError: null,
          });
          continue;
        }

        if (result.error.code === "already_exists") {
          needsPull = true;
          continue;
        }

        await db.outbox.put({
          ...current,
          lastError: result.error.message,
          updatedAt: now,
        });
        stop = true;
        continue;
      }

      if (submitted.type === "delete") {
        const doomed = await db.products.get(current.productId);

        if (doomed?.imageKey) {
          deletedImageKeys.push(doomed.imageKey);
        }

        await db.outbox.delete(current.id);
        await db.products.delete(current.productId);
        continue;
      }

      const serverProduct = result.product ?? null;
      const version =
        serverProduct?.version ??
        (submitted.type === "create" ? 1 : (submitted.expectedVersion ?? 0) + 1);
      const local = await db.products.get(submitted.productId);

      if (local && current.rev === submitted.rev) {
        if (serverProduct) {
          await db.products.put(applyServerProduct(local, serverProduct));
        } else if (version > 0) {
          await db.products.update(submitted.productId, { version });
        }

        await db.outbox.delete(current.id);
        continue;
      }

      if (local && version > 0) {
        await db.products.update(submitted.productId, { version });
      }

      if (current.type === "update") {
        await db.outbox.update(current.id, { expectedVersion: version, updatedAt: now });
      } else if (current.type === "create") {
        await db.outbox.update(current.id, {
          type: "update",
          expectedVersion: version,
          updatedAt: now,
        });
      }
    }
  });

  for (const imageKey of deletedImageKeys) {
    await dropPhotoIfUnused(imageKey);
  }

  return { needsPull, stop };
}

async function markSent(chunk: OutboxEntry[]): Promise<OutboxEntry[]> {
  const db = getDb();

  return db.transaction("rw", db.outbox, async () => {
    const ready: OutboxEntry[] = [];
    const now = Date.now();

    for (const entry of chunk) {
      const current = await db.outbox.get(entry.id);

      if (!current || current.status !== "pending" || current.rev !== entry.rev) {
        continue;
      }

      await db.outbox.update(current.id, { sentAt: now });
      ready.push({ ...current, sentAt: now });
    }

    return ready;
  });
}

async function pull(userId: string, helpers: AuthRequestHelpers): Promise<Set<string>> {
  const db = getDb();
  const remote = await fetchProducts(helpers);
  const remoteIds = new Set(remote.map((dto) => dto.id));

  await db.transaction("rw", db.products, db.outbox, async () => {
    const entries = await db.outbox.where("userId").equals(userId).toArray();
    const productsWithOutbox = new Set(entries.map((entry) => entry.productId));

    for (const dto of remote) {
      const local = await db.products.get(dto.id);

      if (!local) {
        await db.products.put(fromProductDto(dto, userId));
        continue;
      }

      if (local.userId !== userId) {
        continue;
      }

      if (productsWithOutbox.has(dto.id)) {
        await db.products.update(local.id, { version: dto.version });
        continue;
      }

      await db.products.put(fromProductDto(dto, userId));
    }

    for (const local of await db.products.where("userId").equals(userId).toArray()) {
      if (!remoteIds.has(local.id) && !productsWithOutbox.has(local.id)) {
        await db.products.delete(local.id);
      }
    }
  });

  return remoteIds;
}

async function reconcileOutbox(userId: string, remoteIds: Set<string>) {
  const db = getDb();

  await db.transaction("rw", db.products, db.outbox, async () => {
    const entries = await db.outbox.where("userId").equals(userId).toArray();

    for (const entry of entries) {
      if (entry.status !== "pending") {
        continue;
      }

      const product = await db.products.get(entry.productId);

      if (!product) {
        await db.outbox.delete(entry.id);
        continue;
      }

      if (entry.type === "delete") {
        if (!remoteIds.has(entry.productId)) {
          await db.outbox.delete(entry.id);
          await db.products.delete(entry.productId);
        } else if (entry.expectedVersion !== product.version) {
          await db.outbox.put({
            ...entry,
            expectedVersion: product.version,
            updatedAt: Date.now(),
          });
        }
        continue;
      }

      if (!remoteIds.has(entry.productId)) {
        if (entry.type === "update") {
          const next = { ...product, version: 0 };

          await db.products.put(next);
          await db.outbox.put({
            ...entry,
            type: "create",
            expectedVersion: null,
            fields: toProductFields(next),
            updatedAt: Date.now(),
          });
        }
        continue;
      }

      if (entry.type === "create") {
        await db.outbox.put({
          ...entry,
          type: "update",
          expectedVersion: product.version,
          updatedAt: Date.now(),
        });
        continue;
      }

      if (entry.expectedVersion !== product.version) {
        await db.outbox.put({
          ...entry,
          expectedVersion: product.version,
          updatedAt: Date.now(),
        });
      }
    }
  });
}
