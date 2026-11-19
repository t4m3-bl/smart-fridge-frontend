"use client";

import { useState } from "react";
import { useAuth } from "@/features/auth/model/auth-context";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { BottomSheet } from "@/features/fridge/ui/bottom-sheet";
import { FullScreenSheet } from "@/features/fridge/ui/full-screen-sheet/full-screen-sheet";
import { PhotoCapture } from "@/features/fridge/ui/photo-capture/photo-capture";
import { ProductForm } from "@/features/fridge/ui/product-form/product-form";
import type { ProductFormValues } from "@/features/fridge/model/product-schema";
import styles from "./add-product-button.module.css";

type Step = "closed" | "choice" | "camera" | "form";

export interface AddProductButtonProps {
  className?: string;
}

export function AddProductButton({ className }: AddProductButtonProps) {
  const { userId } = useAuth();
  const [step, setStep] = useState<Step>("closed");
  const [prefill, setPrefill] = useState<Partial<ProductFormValues> | null>(null);

  const close = () => setStep("closed");

  const openManualForm = () => {
    setPrefill(null);
    setStep("form");
  };

  const handleRecognized = (values: Partial<ProductFormValues>) => {
    setPrefill(values);
    setStep("form");
  };

  return (
    <>
      <Button
        type="button"
        variant="primary"
        className={[styles.action, className].filter(Boolean).join(" ")}
        onClick={() => setStep("choice")}
        leadingIcon={<Icon name="plus" size={17} />}
        disabled={!userId}
      >
        Добавить продукт
      </Button>

      <BottomSheet open={step === "choice"} onClose={close} title="Добавить продукт">
        <div className={styles.options}>
          <button type="button" className={styles.option} onClick={() => setStep("camera")}>
            <span className={styles.optionIcon}>
              <Icon name="camera" size={22} />
            </span>
            <span className={styles.optionText}>
              <span className={styles.optionTitle}>Сфотографировать упаковку</span>
              <span className={styles.optionSubtitle}>Найдём название и срок годности</span>
            </span>
          </button>

          <button type="button" className={styles.option} onClick={openManualForm}>
            <span className={styles.optionIcon}>
              <Icon name="pencil" size={22} />
            </span>
            <span className={styles.optionText}>
              <span className={styles.optionTitle}>Ввести вручную</span>
              <span className={styles.optionSubtitle}>Название и дата — меньше минуты</span>
            </span>
          </button>
        </div>
      </BottomSheet>

      {step === "camera" ? (
        <PhotoCapture
          onClose={close}
          onRecognized={handleRecognized}
          onManual={openManualForm}
        />
      ) : null}

      <FullScreenSheet
        open={step === "form"}
        onClose={close}
        title={prefill ? "Проверьте данные" : "Новый продукт"}
      >
        {userId ? (
          <ProductForm
            userId={userId}
            initialValues={prefill ?? undefined}
            onDone={close}
          />
        ) : null}
      </FullScreenSheet>
    </>
  );
}
