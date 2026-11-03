import { z } from "zod";

export const credentialsSchema = z.object({
  email: z
    .string({ required_error: "Введите email" })
    .trim()
    .min(1, "Введите email")
    .email("Введите корректный email")
    .max(254, "Email должен быть не длиннее 254 символов"),
  password: z
    .string({ required_error: "Введите пароль" })
    .min(8, "Пароль должен содержать минимум 8 символов")
    .max(72, "Пароль должен быть не длиннее 72 символов"),
});

export type CredentialsValues = z.infer<typeof credentialsSchema>;

