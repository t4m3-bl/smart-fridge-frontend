import { isApiError, isNetworkError } from "@/shared/api/api-error";

const NETWORK_ERROR_MESSAGE =
  "Не удалось связаться с сервером. Проверьте подключение и попробуйте ещё раз.";

export function getAuthErrorMessage(error: unknown, fallback: string) {
  if (!isApiError(error)) {
    return isNetworkError(error) ? NETWORK_ERROR_MESSAGE : fallback;
  }

  switch (error.status) {
    case 400:
      return error.problem?.message || fallback;
    case 401:
      return "Неверный email или пароль";
    case 409:
      return "Пользователь с таким email уже существует";
    case 429:
      return "Слишком много попыток. Попробуйте позже.";
    case 502:
    case 503:
    case 504:
      return "Сервис авторизации временно недоступен. Попробуйте позже.";
    default:
      return error.problem?.message || fallback;
  }
}
