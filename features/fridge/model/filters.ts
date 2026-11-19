import type { LocalCategoryId } from "./categories";
import type { Product } from "./types";

export type PackageFilter = "all" | "closed" | "opened";

export interface FridgeFilters {
  package: PackageFilter;
  categories: LocalCategoryId[];
}

export const EMPTY_FILTERS: FridgeFilters = { package: "all", categories: [] };

export function hasActiveFilters(filters: FridgeFilters): boolean {
  return filters.package !== "all" || filters.categories.length > 0;
}

export function matchesFilters(product: Product, filters: FridgeFilters): boolean {
  if (filters.package === "closed" && product.openedAt) {
    return false;
  }

  if (filters.package === "opened" && !product.openedAt) {
    return false;
  }

  if (filters.categories.length === 0) {
    return true;
  }

  return product.category !== null && filters.categories.includes(product.category);
}

export function matchesSearch(product: Product, query: string): boolean {
  const normalized = query.trim().toLowerCase();

  return !normalized || product.name.toLowerCase().includes(normalized);
}
