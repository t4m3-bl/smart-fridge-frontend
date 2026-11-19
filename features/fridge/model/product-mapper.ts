import type { ProductDto, ProductFieldsDto } from "../api/fridge-api";
import { getLocalCategory, getServerCategoryId } from "./categories";
import { toDateOnly } from "./dates";
import type { Product } from "./types";

function optionalText(value: string | null): string | undefined {
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

function dateOnly(value: string | null | undefined): string | null {
  return value ? toDateOnly(value) : null;
}

export function toProductFields(product: Product): ProductFieldsDto {
  const fields: ProductFieldsDto = {
    name: product.name,
    categoryId: getServerCategoryId(product.category),
    expiresAt: product.expiresAt,
    imageKey: product.imageKey,
  };

  const description = optionalText(product.description);
  const quantity = optionalText(product.quantity);

  if (description !== undefined) {
    fields.description = description;
  }

  if (quantity !== undefined) {
    fields.quantity = quantity;
  }

  if (product.manufacturedAt) {
    fields.manufacturedAt = toDateOnly(product.manufacturedAt);
  }

  if (product.openedAt) {
    fields.openedAt = toDateOnly(product.openedAt);
  }

  if (product.shelfLifeAfterOpening !== null) {
    fields.shelfLifeAfterOpening = product.shelfLifeAfterOpening;
  }

  return fields;
}

export function fromProductDto(dto: ProductDto, userId: string): Product {
  return {
    id: dto.id,
    userId,
    name: dto.name,
    category: getLocalCategory(dto.categoryId),
    description: dto.description ?? null,
    quantity: dto.quantity ?? null,
    imageKey: dto.imageKey ?? null,
    imageUrl: dto.imageUrl ?? null,
    manufacturedAt: dateOnly(dto.manufacturedAt),
    expiresAt: toDateOnly(dto.expiresAt),
    openedAt: dateOnly(dto.openedAt),
    shelfLifeAfterOpening: dto.shelfLifeAfterOpening ?? null,
    version: dto.version,
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };
}

export function applyServerProduct(local: Product, dto: ProductDto): Product {
  return {
    ...fromProductDto(dto, local.userId),
    deletedAt: local.deletedAt,
  };
}
