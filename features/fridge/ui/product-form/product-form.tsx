"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { useAuth } from "@/features/auth/model/auth-context";
import { addDays, fromDateInputValue, toDateInputValue } from "@/features/fridge/model/dates";
import { PRODUCT_CATEGORIES, getCategoryLabel } from "@/features/fridge/model/categories";
import { uploadProductPhoto } from "@/features/fridge/model/product-images";
import { getCachedPhoto } from "@/features/fridge/model/photo-cache";
import { createProduct, updateProduct } from "@/features/fridge/model/products-repository";
import { productFormSchema, type ProductFormValues } from "@/features/fridge/model/product-schema";
import { useOnlineStatus } from "@/features/fridge/model/use-online-status";
import type { Product } from "@/features/fridge/model/types";
import { PhotoCapture } from "@/features/fridge/ui/photo-capture/photo-capture";
import styles from "./product-form.module.css";

const QUICK_DATES = [
  { days: 3, label: "+3 дня" },
  { days: 7, label: "+7 дней" },
  { days: 14, label: "+14 дней" },
] as const;

const SHELF_LIFE_OPTIONS = [
  { value: "none", label: "Не указано" },
  { value: "1", label: "1 день" },
  { value: "2", label: "2 дня" },
  { value: "3", label: "3 дня" },
  { value: "5", label: "5 дней" },
  { value: "7", label: "7 дней" },
  { value: "10", label: "10 дней" },
  { value: "14", label: "14 дней" },
] as const;

function quickDateLabel(days: number): string {
  return toDateInputValue(addDays(new Date(), days));
}

function createDefaultValues(overrides?: Partial<ProductFormValues>): ProductFormValues {
  return {
    name: overrides?.name ?? "",
    expiresAt: overrides?.expiresAt ?? quickDateLabel(3),
    quantity: overrides?.quantity ?? "",
    packageOpened: overrides?.packageOpened ?? "closed",
    shelfLifeAfterOpening: overrides?.shelfLifeAfterOpening ?? "none",
    category: overrides?.category ?? "none",
    description: overrides?.description ?? "",
  };
}

function toFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    expiresAt: product.expiresAt,
    quantity: product.quantity ?? "",
    packageOpened: product.openedAt ? "opened" : "closed",
    shelfLifeAfterOpening:
      product.shelfLifeAfterOpening === null ? "none" : String(product.shelfLifeAfterOpening),
    category: product.category ?? "none",
    description: product.description ?? "",
  };
}

interface ProductFormProps {
  userId: string;
  product?: Product;
  initialValues?: Partial<ProductFormValues>;
  submitLabel?: string;
  onDone: () => void;
}

export function ProductForm({
  userId,
  product,
  initialValues,
  submitLabel,
  onDone,
}: ProductFormProps) {
  const { accessToken, refreshSession } = useAuth();
  const online = useOnlineStatus();
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photo, setPhoto] = useState<{ key: string | null; url: string | null; error: string | null }>(
    {
      key: product?.imageKey ?? null,
      url: product?.imageUrl ?? null,
      error: null,
    },
  );
  const objectUrls = useRef<string[]>([]);

  useEffect(
    () => () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  useEffect(() => {
    const imageKey = product?.imageKey;

    if (!imageKey) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const blob = await getCachedPhoto(imageKey);

      if (cancelled || !blob) {
        return;
      }

      const objectUrl = URL.createObjectURL(blob);

      objectUrls.current.push(objectUrl);
      setPhoto((current) =>
        current.url?.startsWith("blob:") ? current : { ...current, url: objectUrl },
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [product?.imageKey]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product ? toFormValues(product) : createDefaultValues(initialValues),
  });

  const expiresAt = useWatch({ control, name: "expiresAt" });
  const shelfLife = useWatch({ control, name: "shelfLifeAfterOpening" });
  const category = useWatch({ control, name: "category" });
  const shelfLifeLabel =
    SHELF_LIFE_OPTIONS.find((option) => option.value === shelfLife)?.label ?? "Не указано";
  const categoryLabel =
    (category === "none" ? null : getCategoryLabel(category)) ?? "Не выбрана";

  const handlePhoto = async (blob: Blob) => {
    setPhotoOpen(false);

    const previous = photo;
    const localUrl = URL.createObjectURL(blob);

    objectUrls.current.push(localUrl);
    setPhoto({ key: previous.key, url: localUrl, error: null });
    setPhotoUploading(true);

    try {
      const key = await uploadProductPhoto(
        { getAccessToken: () => accessToken, refreshSession },
        blob,
        userId,
      );

      setPhoto({ key, url: localUrl, error: null });
    } catch {
      URL.revokeObjectURL(localUrl);
      objectUrls.current = objectUrls.current.filter((url) => url !== localUrl);
      setPhoto({ ...previous, error: "Ошибка загрузки фото" });
    } finally {
      setPhotoUploading(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    const expiresAtDate = fromDateInputValue(values.expiresAt);

    if (!expiresAtDate) {
      return;
    }

    const isOpened = values.packageOpened === "opened";

    const draft = {
      name: values.name.trim(),
      expiresAt: values.expiresAt,
      quantity: values.quantity?.trim() || null,
      category: values.category === "none" ? null : values.category,
      openedAt: isOpened ? (product?.openedAt ?? toDateInputValue(new Date())) : null,
      shelfLifeAfterOpening:
        values.shelfLifeAfterOpening === "none" ? null : Number(values.shelfLifeAfterOpening),
      description: values.description?.trim() || null,
      imageKey: photo.key,
    };

    if (product) {
      await updateProduct(userId, product.id, draft);
    } else {
      await createProduct(userId, draft);
      reset(createDefaultValues());
    }

    onDone();
  });

  return (
    <>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div className={styles.scroll}>
          {initialValues ? (
            <div className={styles.notice}>
              <Icon name="info" size={20} className={styles.noticeIcon} />
              <p className={styles.noticeText}>
                Заполнили то, что нашли на упаковке. Любые поля можно изменить.
              </p>
            </div>
          ) : null}

          <div className={styles.nameRow}>
            <label className={styles.nameLabel} htmlFor="product-name">
              Название<span className={styles.required}> *</span>
            </label>
            <button
              type="button"
              className={styles.photo}
              onClick={() => setPhotoOpen(true)}
              disabled={!online || photoUploading}
              title={online ? "Добавить фото" : "Фото можно добавить только с интернетом"}
              aria-label="Добавить фото"
              data-loading={photoUploading || undefined}
            >
              {photo.url ? (
                <img
                  src={photo.url}
                  alt=""
                  className={styles.photoImage}
                  onError={() => setPhoto((current) => ({ ...current, url: null }))}
                />
              ) : (
                <Icon name="camera" size={22} />
              )}
            </button>
            <input
              id="product-name"
              className={styles.input}
              placeholder="Например, творог 5%"
              autoComplete="off"
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
          </div>
          {errors.name ? <p className={styles.error}>{errors.name.message}</p> : null}
          {photo.error ? <p className={styles.error}>{photo.error}</p> : null}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="product-expires-at">
              Годен до<span className={styles.required}> *</span>
            </label>
            <div className={styles.dateControl}>
              <input
                id="product-expires-at"
                type="date"
                className={[styles.input, styles.dateInput].join(" ")}
                aria-invalid={Boolean(errors.expiresAt)}
                {...register("expiresAt")}
              />
              <Icon name="calendar" size={20} className={styles.dateIcon} />
            </div>
            <div className={styles.chips}>
              {QUICK_DATES.map((option) => {
                const value = quickDateLabel(option.days);

                return (
                  <button
                    key={option.days}
                    type="button"
                    className={[styles.chip, expiresAt === value ? styles.chipActive : ""]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setValue("expiresAt", value, { shouldValidate: true })}
                    aria-pressed={expiresAt === value}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {errors.expiresAt ? <p className={styles.error}>{errors.expiresAt.message}</p> : null}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="product-quantity">
              Количество
            </label>
            <input
              id="product-quantity"
              className={styles.input}
              placeholder="200 г"
              autoComplete="off"
              {...register("quantity")}
            />
            {errors.quantity ? <p className={styles.error}>{errors.quantity.message}</p> : null}
          </div>

          <fieldset className={styles.field}>
            <legend className={styles.label}>Упаковка</legend>
            <div className={styles.segment}>
              <label className={styles.segmentOption}>
                <input type="radio" value="closed" className={styles.radio} {...register("packageOpened")} />
                <span className={styles.segmentLabel}>Закрыта</span>
              </label>
              <label className={styles.segmentOption}>
                <input type="radio" value="opened" className={styles.radio} {...register("packageOpened")} />
                <span className={styles.segmentLabel}>Открыта</span>
              </label>
            </div>
          </fieldset>

          <div className={styles.group}>
            <details className={styles.row}>
              <summary className={styles.rowSummary}>
                <span className={styles.rowLabel}>После вскрытия</span>
                <span className={styles.rowValue}>{shelfLifeLabel}</span>
                <Icon name="chevron-down" size={18} className={styles.chevron} />
              </summary>
              <div className={styles.rowBody}>
                <div className={styles.options}>
                  {SHELF_LIFE_OPTIONS.map((option) => (
                    <label key={option.value} className={styles.option}>
                      <input
                        type="radio"
                        value={option.value}
                        className={styles.radio}
                        {...register("shelfLifeAfterOpening")}
                      />
                      <span className={styles.optionLabel}>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </details>

            <details className={styles.row}>
              <summary className={styles.rowSummary}>
                <span className={styles.rowLabel}>Дополнительно</span>
                <span className={styles.rowValue}>Категория, описание</span>
                <Icon name="chevron-down" size={18} className={styles.chevron} />
              </summary>
              <div className={styles.rowBody}>
                <p className={styles.rowHint}>Категория · {categoryLabel}</p>
                <div className={styles.options}>
                  <label className={styles.option}>
                    <input
                      type="radio"
                      value="none"
                      className={styles.radio}
                      {...register("category")}
                    />
                    <span className={styles.optionLabel}>Без категории</span>
                  </label>
                  {PRODUCT_CATEGORIES.map((item) => (
                    <label key={item.id} className={styles.option}>
                      <input
                        type="radio"
                        value={item.id}
                        className={styles.radio}
                        {...register("category")}
                      />
                      <span className={styles.optionLabel}>{item.label}</span>
                    </label>
                  ))}
                </div>

                <label className={styles.label} htmlFor="product-description">
                  Описание
                </label>
                <textarea
                  id="product-description"
                  className={styles.textarea}
                  rows={3}
                  placeholder=""
                  {...register("description")}
                />
                {errors.description ? <p className={styles.error}>{errors.description.message}</p> : null}
              </div>
            </details>
          </div>
        </div>

        <div className={styles.footer}>
          <Button type="submit" variant="primary" disabled={isSubmitting || photoUploading}>
            {isSubmitting
              ? product
                ? "Сохраняем…"
                : "Добавляем…"
              : (submitLabel ?? (product ? "Сохранить" : "Добавить в холодильник"))}
          </Button>
        </div>
      </form>

      {photoOpen
        ? createPortal(
            <PhotoCapture
              mode="single"
              onClose={() => setPhotoOpen(false)}
              onPhoto={handlePhoto}
            />,
            document.body,
          )
        : null}
    </>
  );
}
