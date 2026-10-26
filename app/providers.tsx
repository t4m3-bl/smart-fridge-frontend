"use client";

import type { PropsWithChildren } from "react";
import { AuthProvider } from "@/features/auth/model/auth-context";

export function Providers({ children }: PropsWithChildren) {
  return <AuthProvider>{children}</AuthProvider>;
}

