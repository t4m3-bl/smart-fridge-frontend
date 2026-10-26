import { requestJson } from "@/shared/api/http-client";
import type { Credentials, TokenResponse } from "../model/auth-types";
import {DEFAULT_API_URL} from "@/shared/config/constants";

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

export function startYandexSignIn() {
  window.location.assign(
      `${DEFAULT_API_URL}/auth/yandex/sign-in`,
  );
}