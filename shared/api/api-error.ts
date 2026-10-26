import type { Problem } from "@/features/auth/model/auth-types";

export class ApiError extends Error {
  status: number;
  problem?: Problem;

  constructor(message: string, status: number, problem?: Problem) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

