import { requestJson } from "@/shared/api/http-client";
import type { Credentials, TokenResponse } from "../model/auth-types";
import { API_BASE_PATH } from "@/shared/config/constants";

export function signUp(credentials: Credentials) {
  return requestJson<TokenResponse>("/auth/sign-up", {
    method: "POST",
    body: credentials,
  });
}

export function signIn(credentials: Credentials) {
  return requestJson<TokenResponse>("/auth/sign-in", {
    method: "POST",
    body: credentials,
  });
}

export function refreshAuth() {
  return requestJson<TokenResponse>("/auth/refresh", {
    method: "POST",
  });
}

export function logoutAuth() {
  return requestJson<void>("/auth/logout", {
    method: "POST",
  });
}

export const YANDEX_SIGN_IN_URL = `${API_BASE_PATH}/auth/yandex/sign-in`;
