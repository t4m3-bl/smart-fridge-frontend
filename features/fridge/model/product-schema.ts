import { z } from "zod";
import { LOCAL_CATEGORY_IDS } from "./categories";

export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Укажите название")
    .max(200, "Слишком длинное название — до 200 символов"),
  expiresAt: z.string().min(1, "Укажите срок годности"),
  quantity: z.string().trim().max(100, "Слишком длинное количество — до 100 символов").optional(),
  packageOpened: z.enum(["closed", "opened"]),
  shelfLifeAfterOpening: z.string(),
  category: z.union([z.literal("none"), z.enum(LOCAL_CATEGORY_IDS)]),
  description: z.string().trim().max(2000, "Слишком длинное описание — до 2000 символов").optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
