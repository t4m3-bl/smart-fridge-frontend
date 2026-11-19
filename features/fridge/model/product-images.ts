"use client";

import type { AuthRequestHelpers } from "@/shared/api/http-client";
import {
  prepareProductImageUploads,
  putProductImage,
  type ProductImageContentType,
} from "../api/fridge-api";
import { createUuid } from "./uuid";
import { cachePhoto } from "./photo-cache";

const MAX_SIDE = 1280;
const QUALITY = 0.82;
const ALLOWED_TYPES: readonly ProductImageContentType[] = [
  "image/webp",
  "image/jpeg",
  "image/png",
];

export class ProductImageError extends Error {}

function isAllowedType(type: string): type is ProductImageContentType {
  return (ALLOWED_TYPES as readonly string[]).includes(type);
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: ProductImageContentType,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, QUALITY);
  });
}

export async function compressProductPhoto(
  source: Blob,
): Promise<{ blob: Blob; contentType: ProductImageContentType }> {
  const bitmap = await createImageBitmap(source).catch(() => null);

  if (!bitmap) {
    throw new ProductImageError("Не удалось прочитать снимок");
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new ProductImageError("Браузер не смог обработать снимок");
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob =
    (await canvasToBlob(canvas, "image/webp")) ?? (await canvasToBlob(canvas, "image/jpeg"));

  if (!blob) {
    throw new ProductImageError("Не удалось сжать снимок");
  }

  return { blob, contentType: isAllowedType(blob.type) ? blob.type : "image/jpeg" };
}

export async function uploadProductPhoto(
  helpers: AuthRequestHelpers,
  photo: Blob,
  userId: string,
): Promise<string> {
  const image = await compressProductPhoto(photo);
  const operationId = createUuid();
  const response = await prepareProductImageUploads(helpers, [
    { operationId, contentType: image.contentType },
  ]);
  const target = (response.uploads ?? []).find(
    (upload) => upload.operationId === operationId,
  );

  if (!target) {
    throw new ProductImageError("Сервер не выдал адрес для загрузки фото");
  }

  await putProductImage(target, image.blob);
  await cachePhoto(userId, target.imageKey, image.blob);

  return target.imageKey;
}
