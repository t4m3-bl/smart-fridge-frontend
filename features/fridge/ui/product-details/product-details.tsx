"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/shared/ui/icon";
import { useAuth } from "@/features/auth/model/auth-context";
import { useProducts } from "@/features/fridge/model/use-products";
import { getExpiryDate, getProductStatus } from "@/features/fridge/model/product-status";
import { formatDayMonth, formatShortDate, parseDateValue } from "@/features/fridge/model/dates";
import { getCategoryLabel } from "@/features/fridge/model/categories";
import { removeProduct } from "@/features/fridge/model/products-repository";
import { ConfirmDialog } from "@/features/fridge/ui/confirm-dialog/confirm-dialog";
import { FullScreenSheet } from "@/features/fridge/ui/full-screen-sheet/full-screen-sheet";
import { ProductForm } from "@/features/fridge/ui/product-form/product-form";
import { ProductPhoto } from "@/features/fridge/ui/product-photo/product-photo";
import styles from "./product-details.module.css";
import {formatDays} from "@/shared/lib/format/pluralize";

interface ProductDetailsProps {
  id: string;
}

export function ProductDetails({ id }: ProductDetailsProps) {
  const { userId } = useAuth();
  const products = useProducts(userId);
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const product = products?.find((item) => item.id === id);

  const back = (
    <Link href="/fridge" className={styles.back}>
      <Icon name="arrowLeft" size={24} />
      <span>Холодильник</span>
    </Link>
  );

  if (products === undefined) {
    return (
      <main className={styles.screen}>
        <div className={styles.inner}>
          <header className={styles.header}>{back}</header>
          <p className={styles.placeholder}>Загружаем продукт…</p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className={styles.screen}>
        <div className={styles.inner}>
          <header className={styles.header}>{back}</header>
          <p className={styles.placeholder}>Продукт не найден</p>
        </div>
      </main>
    );
  }

  const status = getProductStatus(product);
  const expiry = getExpiryDate(product);
  const subtitle = [product.quantity, getCategoryLabel(product.category)]
    .filter(Boolean)
    .join(" · ");
  const manufacturedAt = parseDateValue(product.manufacturedAt);

  const statusDetail =
    status.daysLeft < 0
      ? `истёк ${formatDays(Math.abs(status.daysLeft))} назад · ${formatShortDate(expiry)}`
      : status.daysLeft === 0
        ? `сегодня · до ${formatShortDate(expiry)}`
        : `осталось ${formatDays(status.daysLeft)} · до ${formatShortDate(expiry)}`;

  const handleDelete = async () => {
    if (!userId) {
      return;
    }

    await removeProduct(userId, product.id);
    router.replace("/fridge");
  };

  return (
    <main className={styles.screen}>
      <div className={styles.inner}>
        <header className={styles.header}>
          {back}
          <button type="button" className={styles.edit} onClick={() => setEditing(true)}>
            Изменить
          </button>
        </header>

        <ProductPhoto
          imageKey={product.imageKey}
          url={product.imageUrl ?? null}
          alt={product.name}
          className={styles.photo}
          fallback={<span className={styles.photoLabel}>фото продукта</span>}
        />

        <h1 className={styles.name}>{product.name}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}

        <div className={styles.statusRow}>
          <span className={styles.badge} data-status={status.status}>
            <span className={styles.dot} />
            <span className={styles.badgeLabel}>{status.label}</span>
          </span>
          <span className={styles.statusDetail}>{statusDetail}</span>
        </div>

        <div className={styles.group}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Упаковка</span>
            <span className={styles.rowValue}>
              {product.openedAt ? "Открыта" : "Закрыта"}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>После вскрытия</span>
            <span className={styles.rowValue}>
              {product.shelfLifeAfterOpening === null
                ? "Не указано"
                : formatDays(product.shelfLifeAfterOpening)}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Дата производства</span>
            <span className={styles.rowValue}>
              {manufacturedAt ? formatDayMonth(manufacturedAt) : "Не указана"}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Категория</span>
            <span className={styles.rowValue}>
              {getCategoryLabel(product.category) ?? "Не выбрана"}
            </span>
          </div>
        </div>

        <button
          type="button"
          className={styles.delete}
          onClick={() => setConfirming(true)}
        >
          Удалить продукт
        </button>
      </div>

      <FullScreenSheet open={editing} onClose={() => setEditing(false)} title="Изменить данные">
        {userId ? (
          <ProductForm
            userId={userId}
            product={product}
            submitLabel="Сохранить"
            onDone={() => {
              setEditing(false);
              router.push("/fridge");
            }}
          />
        ) : null}
      </FullScreenSheet>

      <ConfirmDialog
        open={confirming}
        title={`Удалить «${product.name}»?`}
        text="Продукт исчезнет из холодильника на всех устройствах"
        confirmLabel="Удалить"
        danger
        onCancel={() => setConfirming(false)}
        onConfirm={handleDelete}
      />
    </main>
  );
}
