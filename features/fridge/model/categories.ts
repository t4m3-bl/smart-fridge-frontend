export const LOCAL_CATEGORY_IDS = [
  "dairy",
  "meat-fish",
  "produce",
  "ready-meals",
  "drinks",
  "other",
] as const;

export type LocalCategoryId = (typeof LOCAL_CATEGORY_IDS)[number];

export const PRODUCT_CATEGORIES: ReadonlyArray<{ id: LocalCategoryId; label: string }> = [
  { id: "dairy", label: "Молочные" },
  { id: "meat-fish", label: "Мясо и рыба" },
  { id: "produce", label: "Овощи и фрукты" },
  { id: "ready-meals", label: "Готовая еда" },
  { id: "drinks", label: "Напитки" },
  { id: "other", label: "Другое" },
];

const SERVER_CATEGORY_IDS: Record<LocalCategoryId, number> = {
  dairy: 1,
  "meat-fish": 2,
  produce: 3,
  "ready-meals": 4,
  drinks: 5,
  other: 6,
};

const LOCAL_BY_SERVER_ID = new Map<number, LocalCategoryId>(
  LOCAL_CATEGORY_IDS.map((key) => [SERVER_CATEGORY_IDS[key], key] as const),
);

export function getServerCategoryId(category: LocalCategoryId | null): number {
  return SERVER_CATEGORY_IDS[category ?? "other"];
}

export function getLocalCategory(id: number | null | undefined): LocalCategoryId | null {
  if (id === null || id === undefined) {
    return null;
  }

  return LOCAL_BY_SERVER_ID.get(id) ?? null;
}

export function getCategoryLabel(id: LocalCategoryId | null): string | null {
  return PRODUCT_CATEGORIES.find((category) => category.id === id)?.label ?? null;
}
