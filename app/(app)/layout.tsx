import type { ReactNode } from "react";
import { FridgeSyncProvider } from "@/features/fridge/model/sync-provider";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <FridgeSyncProvider>{children}</FridgeSyncProvider>;
}
