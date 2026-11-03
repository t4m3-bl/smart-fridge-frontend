import auth from "./auth.module.css";

export function SessionCheck() {
  return (
    <main className={auth.page}>
      <div className={auth.inner}>
        <p className={auth.helperText}>Проверяем сессию…</p>
      </div>
    </main>
  );
}
