export function formatProducts(products: number): string {
  return `${products} ${pluralize(products, ["продукт", "продукта", "продуктов"])}`;
}

export function formatDays(days: number): string {
  return `${days} ${pluralize(days, ["день", "дня", "дней"])}`;
}

export function pluralize(args: number, forms: readonly [string, string, string]): string {
  const mod10 = args % 10;
  const mod100 = args % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return forms[0];
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return forms[1];
  }

  return forms[2];
}
