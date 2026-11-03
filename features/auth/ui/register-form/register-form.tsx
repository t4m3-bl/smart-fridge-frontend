"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/shared/ui/button";
import { getAuthErrorMessage } from "@/features/auth/model/auth-errors";
import { useAuth } from "@/features/auth/model/auth-context";
import { credentialsSchema, type CredentialsValues } from "@/features/auth/model/auth-schemas";
import auth from "@/features/auth/ui/auth.module.css";
import styles from "@/features/auth/ui/register-form/register-form.module.css";
import { YANDEX_SIGN_IN_URL } from "@/features/auth/api/auth-api";
import { YandexMark } from "@/features/auth/ui/yandex-mark";

function FridgeLogo() {
  return (
    <svg viewBox="0 0 30 30" width="30" height="30" aria-hidden="true" focusable="false">
      <rect x="6" y="4" width="18" height="22" rx="4" fill="none" stroke="#3A6FD8" strokeWidth="2.4" />
      <path d="M6 14h18" fill="none" stroke="#3A6FD8" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M15 17v4" fill="none" stroke="#3A6FD8" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="19" cy="10" r="1.5" fill="#3A6FD8" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      <path d="M14.5 6 8.5 12l6 6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"
            strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        d="M1.5 10s3.1-5.5 8.5-5.5S18.5 10 18.5 10s-3.1 5.5-8.5 5.5S1.5 10 1.5 10Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
      <path d="M3 4.5 16.5 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M1.5 10s3.1-5.5 8.5-5.5c1 0 1.9.1 2.7.4M18.5 10s-3.1 5.5-8.5 5.5c-1 0-1.9-.1-2.7-.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const { signUp: createAccount, status } = useAuth();
  const emailId = useId();
  const passwordId = useId();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setError,
    clearErrors,
  } = useForm<CredentialsValues>({
    resolver: zodResolver(credentialsSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const emailField = register("email");
  const passwordField = register("password");

  const isBusy = isSubmitting || status === "loading";
  const submitDisabled = isBusy || !isValid;

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/fridge");
    }
  }, [router, status]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      clearErrors("root");
      await createAccount(values);
      router.replace("/fridge");
    } catch (error) {
      setError("root", {
        type: "server",
        message: getAuthErrorMessage(error, "Не удалось создать аккаунт. Попробуйте ещё раз."),
      });
    }
  });

  return (
    <div className={auth.page}>
      <div className={auth.inner}>
        <main className={auth.content}>
          <div className={styles.backRow}>
            <Link href="/login" className={auth.backLink}>
              <ArrowLeftIcon />
              Вход
            </Link>
          </div>

          <section className={auth.card} aria-labelledby="register-title">
            <div className={auth.logoBox}>
              <FridgeLogo />
            </div>

            <div className={auth.titleBlock}>
              <h1 id="register-title" className={auth.title}>
                Новый аккаунт
              </h1>
            </div>

            {status === "loading" ? <p className={auth.helperText}>Проверяем сохранённую сессию…</p> : null}

            <form onSubmit={onSubmit} noValidate className={auth.formStack}>
              {errors.root?.message ? <p className={auth.errorSummary}>{errors.root.message}</p> : null}

              <div className={auth.fieldGroup}>
                <label htmlFor={emailId} className={auth.fieldLabel}>
                  Email
                </label>
                <input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="anna.k@mail.ru"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? `${emailId}-error` : undefined}
                  {...emailField}
                  className={[auth.input, errors.email ? auth.inputInvalid : ""].filter(Boolean).join(" ")}
                />
                {errors.email?.message ? (
                  <p id={`${emailId}-error`} className={auth.errorText}>
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              <div className={auth.fieldGroup}>
                <label htmlFor={passwordId} className={auth.fieldLabel}>
                  Пароль
                </label>
                <div className={auth.inputShell}>
                  <input
                    id={passwordId}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? `${passwordId}-error` : undefined}
                    {...passwordField}
                    className={[auth.input, errors.password ? auth.inputInvalid : ""].filter(Boolean).join(" ")}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                    onClick={() => setShowPassword((current) => !current)}
                    className={auth.toggleButton}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.password?.message ? (
                  <p id={`${passwordId}-error`} className={auth.errorText}>
                    {errors.password.message}
                  </p>
                ) : null}
                <p className={auth.helperText}>Минимум 8 символов</p>
              </div>

              <Button type="submit" variant={submitDisabled ? "secondary" : "primary"} disabled={submitDisabled}>
                {isBusy ? "Создаём…" : "Создать аккаунт"}
              </Button>

              <div className={auth.divider} aria-hidden="true">
                <div className={auth.dividerLine} />
                <span className={auth.dividerText}>или</span>
                <div className={auth.dividerLine} />
              </div>

              <Button variant="yandex" href={YANDEX_SIGN_IN_URL} leadingIcon={<YandexMark />}>
                Войти с Яндекс ID
              </Button>
            </form>
          </section>
        </main>

        <footer className={auth.footer}>
          <span className={auth.footerMutedText}>Уже есть аккаунт?</span>
          <Link href="/login" className={auth.footerLink}>
            Войти
          </Link>
        </footer>
      </div>
    </div>
  );
}
