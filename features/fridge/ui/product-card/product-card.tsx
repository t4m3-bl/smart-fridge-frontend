import Link from "next/link";
import type { Product } from "@/features/fridge/model/types";
import type { ProductStatusInfo } from "@/features/fridge/model/product-status";
import { Icon } from "@/shared/ui/icon";
import { ProductPhoto } from "@/features/fridge/ui/product-photo/product-photo";
import styles from "./product-card.module.css";

interface ProductCardProps {
  product: Product;
  status: ProductStatusInfo;
}

export function ProductCard({ product, status }: ProductCardProps) {
  return (
    <Link
      href={`/fridge/${product.id}`}
      className={styles.card}
      data-status={status.status}
    >
      <ProductPhoto
        imageKey={product.imageKey}
        url={product.imageUrl ?? null}
        alt={product.name}
        className={styles.placeholder}
        fallback={
          <span className={styles.placeholderLabel}>{product.name.slice(0, 6).toLowerCase()}</span>
        }
      />

      <div className={styles.body}>
        <div className={styles.topRow}>
          <h3 className={styles.name}>{product.name}</h3>
          {product.quantity ? <span className={styles.quantity}>{product.quantity}</span> : null}
        </div>

        <div className={styles.statusRow}>
          <span className={styles.dot} />
          <span className={styles.statusLabel}>{status.label}</span>
          <span className={styles.statusDetail}>{status.detail}</span>
        </div>

        {product.openedAt ? (
          <div className={styles.openedRow}>
            <Icon name="package-open" size={12} />
            <span>Открыто</span>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
