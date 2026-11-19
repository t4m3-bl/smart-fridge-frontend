"use client";

import { getDb } from "./db";

const MAX_CACHED_BYTES = 3 * 1024 * 1024;

const ORPHAN_MIN_AGE_MS = 15 * 60_000;

let persistRequested = false;

function requestPersistence() {
  if (persistRequested || typeof navigator === "undefined" || !navigator.storage?.persist) {
    return;
  }

  persistRequested = true;
  void navigator.storage.persist().catch(() => undefined);
}

export async function getCachedPhoto(imageKey: string | null | undefined): Promise<Blob | null> {
  if (!imageKey) {
    return null;
  }

  try {
    const row = await getDb().photos.get(imageKey);
    return row?.blob ?? null;
  } catch (error) {
    console.warn("Не удалось прочитать фото из кеша", error);
    return null;
  }
}

export async function cachePhoto(
  userId: string,
  imageKey: string,
  blob: Blob,
): Promise<void> {
  if (!userId || !imageKey || blob.size === 0 || blob.size > MAX_CACHED_BYTES) {
    return;
  }

  try {
    requestPersistence();
    await getDb().photos.put({
      imageKey,
      userId,
      blob,
      cachedAt: Date.now(),
      size: blob.size,
    });
  } catch (error) {
    console.warn("Не удалось закешировать фото продукта", error);
  }
}

export async function downloadPhoto(
  url: string,
  imageKey: string,
  userId: string,
): Promise<Blob | null> {
  try {
    const response = await fetch(url, { mode: "cors", credentials: "omit" });

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();

    if (!blob.type.startsWith("image/")) {
      return null;
    }

    await cachePhoto(userId, imageKey, blob);

    return blob;
  } catch {
    return null;
  }
}

export async function dropPhotoIfUnused(imageKey: string | null | undefined): Promise<void> {
  if (!imageKey) {
    return;
  }

  try {
    const db = getDb();

    await db.transaction("rw", db.products, db.photos, async () => {
      const used = await db.products.where("imageKey").equals(imageKey).count();

      if (used === 0) {
        await db.photos.delete(imageKey);
      }
    });
  } catch (error) {
    console.warn("Не удалось удалить фото из кеша", error);
  }
}

export async function collectOrphanPhotos(userId: string): Promise<number> {
  if (!userId) {
    return 0;
  }

  try {
    const db = getDb();

    return await db.transaction("rw", db.products, db.photos, async () => {
      const cached = await db.photos.where("userId").equals(userId).toArray();

      if (cached.length === 0) {
        return 0;
      }

      const referenced = new Set(
        (await db.products.where("userId").equals(userId).toArray())
          .map((product) => product.imageKey)
          .filter((key): key is string => Boolean(key)),
      );
      const now = Date.now();
      const orphans = cached.filter(
        (row) => !referenced.has(row.imageKey) && now - row.cachedAt > ORPHAN_MIN_AGE_MS,
      );

      if (orphans.length > 0) {
        await db.photos.bulkDelete(orphans.map((row) => row.imageKey));
      }

      return orphans.length;
    });
  } catch (error) {
    console.warn("Не удалось собрать осиротевшие фото", error);
    return 0;
  }
}
