import type { ProductDto, ProductFieldsDto } from "../api/fridge-api";
import type { LocalCategoryId } from "./categories";

export type ProductId = string;

export interface Product {
  id: ProductId;
  userId: string;
  name: string;
  category: LocalCategoryId | null;
  description: string | null;
  quantity: string | null;
  imageKey: string | null;
  imageUrl: string | null;
  manufacturedAt: string | null;
  expiresAt: string;
  openedAt: string | null;
  shelfLifeAfterOpening: number | null;
  version: number;
  updatedAt: string;
  deletedAt: string | null;
}

export type ProductDraft = {
  name: string;
  expiresAt: string;
  quantity: string | null;
  category: LocalCategoryId | null;
  openedAt: string | null;
  shelfLifeAfterOpening: number | null;
  description: string | null;
  imageKey: string | null;
};

export interface CachedPhoto {
  imageKey: string;
  userId: string;
  blob: Blob;
  cachedAt: number;
  size: number;
}

export type OutboxOperationType = "create" | "update" | "delete";

export type OutboxStatus = "pending" | "conflict";

export type ConflictReason = "version" | "deleted";

export interface OutboxEntry {
  id: string;
  userId: string;
  productId: string;
  type: OutboxOperationType;
  status: OutboxStatus;
  expectedVersion: number | null;
  fields: ProductFieldsDto | null;
  conflict: ProductDto | null;
  conflictReason: ConflictReason | null;
  rev: number;
  sentAt: number | null;
  createdAt: number;
  updatedAt: number;
  lastError: string | null;
}
