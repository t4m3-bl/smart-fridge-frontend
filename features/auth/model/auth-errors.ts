import { isApiError } from "@/shared/api/api-error";

export function getAuthErrorMessage(error: unknown, fallback: string) {
  if (!isApiError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  switch (error.status) {
    case 400:
      return error.problem?.detail || fallback;
    case 401:
      return "Неверный email или пароль";
    case 409:
      return "Пользователь с таким email уже существует";
    case 429:
      return "Слишком много попыток. Попробуйте позже.";
    default:
      return error.problem?.detail || fallback;
  }
}

