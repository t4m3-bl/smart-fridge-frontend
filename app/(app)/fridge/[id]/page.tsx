"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { useAuthGuard } from "@/features/auth/model/use-auth-guard";
import { SessionCheck } from "@/features/auth/ui/session-check";
import { ProductDetails } from "@/features/fridge/ui/product-details/product-details";

export default function ProductPage() {
  return (
    <Suspense fallback={<SessionCheck />}>
      <ProductPageContent />
    </Suspense>
  );
}

function ProductPageContent() {
  const isAuthenticated = useAuthGuard();
  const params = useParams<{ id: string }>();

  if (!isAuthenticated) {
    return <SessionCheck />;
  }

  return <ProductDetails id={params.id} />;
}
