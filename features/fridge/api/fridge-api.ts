import { requestJsonWithAuthRetry, type AuthRequestHelpers } from "@/shared/api/http-client";

export interface ProductDto {
  id: string;
  name: string;
  categoryId: number;
  description?: string | null;
  quantity?: string | null;
  imageKey: string | null;
  imageUrl: string | null;
  manufacturedAt?: string | null;
  expiresAt: string;
  openedAt?: string | null;
  shelfLifeAfterOpening?: number | null;
  version: number;
}

export interface ProductFieldsDto {
  name: string;
  categoryId: number;
  expiresAt: string;
  imageKey: string | null;
  description?: string;
  quantity?: string;
  manufacturedAt?: string;
  openedAt?: string;
  shelfLifeAfterOpening?: number;
}

export interface ProductBatchCreateOperation {
  type: "create";
  operationId: string;
  id: string;
  product: ProductFieldsDto;
}

export interface ProductBatchUpdateOperation {
  type: "update";
  operationId: string;
  id: string;
  expectedVersion: number;
  product: ProductFieldsDto;
}

export interface ProductBatchDeleteOperation {
  type: "delete";
  operationId: string;
  id: string;
  expectedVersion: number;
}

export type ProductBatchOperation =
  | ProductBatchCreateOperation
  | ProductBatchUpdateOperation
  | ProductBatchDeleteOperation;

export interface ProductBatchResultDto {
  operationId: string;
  id: string;
  product?: ProductDto;
  error?: { code: string; message: string };
}

export interface ProductBatchResponseDto {
  results: ProductBatchResultDto[];
}

export type ProductImageContentType = "image/jpeg" | "image/png" | "image/webp";

export interface ProductImageUploadOperation {
  operationId: string;
  contentType: ProductImageContentType;
}

export interface ProductImageUploadTargetDto {
  operationId: string;
  uploadUrl: string;
  objectId: string;
  imageKey: string;
  expiresAt: string;
  requiredHeaders: Record<string, string>;
}

interface ProductImageBatchResponseDto {
  uploads: ProductImageUploadTargetDto[];
}

interface ProductListDto {
  items: ProductDto[];
}

export async function fetchProducts(helpers: AuthRequestHelpers): Promise<ProductDto[]> {
  const response = await requestJsonWithAuthRetry<ProductListDto>(
    "/products",
    { method: "GET" },
    helpers,
  );

  return response.items ?? [];
}

export function sendProductBatch(
  helpers: AuthRequestHelpers,
  operations: ProductBatchOperation[],
): Promise<ProductBatchResponseDto> {
  return requestJsonWithAuthRetry<ProductBatchResponseDto>(
    "/products/batch",
    { method: "POST", body: { operations } },
    helpers,
  );
}

export function prepareProductImageUploads(
  helpers: AuthRequestHelpers,
  operations: ProductImageUploadOperation[],
): Promise<ProductImageBatchResponseDto> {
  return requestJsonWithAuthRetry<ProductImageBatchResponseDto>(
    "/products/images/batch",
    { method: "POST", body: { operations } },
    helpers,
  );
}

export async function putProductImage(target: ProductImageUploadTargetDto, body: Blob) {
  const response = await fetch(target.uploadUrl, {
    method: "PUT",
    headers: target.requiredHeaders,
    body,
  });

  if (!response.ok) {
    throw new Error(`Image upload failed: ${response.status}`);
  }
}
