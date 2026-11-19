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
import {Icon} from "@/shared/ui/icon";

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
              <Icon name={"arrowLeft"} />
              Вход
            </Link>
          </div>

          <section className={auth.card} aria-labelledby="register-title">
            <div className={auth.logoBox}>
              <Icon name="refrigerator" size={30} />
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
                    <Icon name={showPassword ? "eye-off" : "eye"} size={20} />
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
