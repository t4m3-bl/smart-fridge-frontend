import { addDays, toDateInputValue } from "./dates";
import type { ProductFormValues } from "./product-schema";

export function mockRecognizedProduct(): Partial<ProductFormValues> {
  return {
    name: "Молоко 3,2%",
    quantity: "1 л",
    expiresAt: toDateInputValue(addDays(new Date(), 10)),
    packageOpened: "closed",
    shelfLifeAfterOpening: "none",
    category: "dairy",
    description: "",
  };
}
