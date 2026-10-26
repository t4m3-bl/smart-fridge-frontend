import { ApiError } from "@/shared/api/api-error";
import type { Problem } from "@/features/auth/model/auth-types";
import {DEFAULT_API_URL} from "@/shared/config/constants";

export type JsonRequestInit = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export type AuthRequestHelpers = {
  getAccessToken: () => string | null;
  refreshSession: () => Promise<string | null>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeHeaders(initHeaders: HeadersInit | undefined, hasBody: boolean) {
  const headers = new Headers(initHeaders);

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  return headers;
}

async function parseProblem(response: Response): Promise<Problem | undefined> {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/problem+json")) {
    return undefined;
  }

  try {
    return (await response.json()) as Problem;
  } catch {
    return undefined;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json") || contentType.includes("application/problem+json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}

function buildUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${DEFAULT_API_URL}/${normalizedPath}`;
}

async function requestInternal<T>(path: string, init: JsonRequestInit = {}) {
  const body = init.body;
  const hasBody = body !== undefined;
  const headers = mergeHeaders(init.headers, hasBody);
  const response = await fetch(buildUrl(path), {
    ...init,
    credentials: init.credentials ?? "include",
    headers,
    body: hasBody
      ? typeof body === "string"
        ? body
        : JSON.stringify(body)
      : undefined,
  });

  if (!response.ok) {
    const problem = await parseProblem(response);
    const message = problem?.detail || problem?.title || response.statusText || "Request failed";
    throw new ApiError(message, response.status, problem);
  }

  return parseResponse<T>(response);
}

export async function requestJson<T>(path: string, init: JsonRequestInit = {}) {
  return requestInternal<T>(path, init);
}

export async function requestJsonWithAuthRetry<T>(
  path: string,
  init: JsonRequestInit,
  helpers: AuthRequestHelpers,
) {
  const attempt = async (token: string | null) => {
    const headers = new Headers(init.headers);

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return requestInternal<T>(path, {
      ...init,
      headers,
    });
  };

  try {
    return await attempt(helpers.getAccessToken());
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const refreshedToken = await helpers.refreshSession();

      if (refreshedToken) {
        return attempt(refreshedToken);
      }
    }

    throw error;
  }
}

export function isProblemLike(value: unknown): value is Problem {
  return isPlainObject(value) && typeof value.title === "string" && typeof value.status === "number";
}

