import { Icon } from "@/shared/ui/icon";
import { AddProductButton } from "@/features/fridge/ui/add-product-button/add-product-button";
import styles from "./empty-fridge.module.css";

export function EmptyFridge() {
  return (
    <section className={styles.empty} aria-labelledby="fridge-empty-title">
      <div className={styles.icon}>
        <Icon name="refrigerator" size={36} />
      </div>

      <h2 id="fridge-empty-title" className={styles.title}>
        Ваш холодильник пока пуст
      </h2>

      <p className={styles.text}>Добавьте первый продукт, чтобы начать отслеживать сроки годности</p>

      <AddProductButton className={styles.action} />
    </section>
  );
}
