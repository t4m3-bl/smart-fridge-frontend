"use client";

import Link from "next/link";
import {useEffect, useId, useState} from "react";
import {useRouter} from "next/navigation";
import {zodResolver} from "@hookform/resolvers/zod";
import {useForm} from "react-hook-form";
import {Button} from "@/shared/ui/button/button";
import {getAuthErrorMessage} from "@/features/auth/model/auth-errors";
import {useAuth} from "@/features/auth/model/auth-context";
import {credentialsSchema, type CredentialsValues} from "@/features/auth/model/auth-schemas";
import {registerStyles} from "@/features/auth/ui/register-form/register-form.styles";
import {startYandexSignIn} from "@/features/auth/api/auth-api";

function FridgeLogo() {
  return (
      <svg viewBox="0 0 30 30" width="30" height="30" aria-hidden="true" focusable="false">
        <rect x="6" y="4" width="18" height="22" rx="4" fill="none" stroke="#3A6FD8" strokeWidth="2.4"/>
        <path d="M6 14h18" fill="none" stroke="#3A6FD8" strokeWidth="2.4" strokeLinecap="round"/>
        <path d="M15 17v4" fill="none" stroke="#3A6FD8" strokeWidth="2.4" strokeLinecap="round"/>
        <circle cx="19" cy="10" r="1.5" fill="#3A6FD8"/>
      </svg>
  );
}

function ArrowLeftIcon() {
  return (
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
        <path d="M14.5 6 8.5 12l6 6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"
              strokeLinejoin="round"/>
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
        <circle cx="10" cy="10" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
  );
}

function EyeOffIcon() {
  return (
      <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
        <path d="M3 4.5 16.5 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path
            d="M1.5 10s3.1-5.5 8.5-5.5c1 0 1.9.1 2.7.4M18.5 10s-3.1 5.5-8.5 5.5c-1 0-1.9-.1-2.7-.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="10" cy="10" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
  );
}

function YandexMark() {
  return <span style={registerStyles.yandexDot}>Я</span>;
}

export function RegisterForm() {
  const router = useRouter();
  const {signUp: createAccount, status} = useAuth();
  const emailId = useId();
  const passwordId = useId();
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting, isValid},
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
      <div style={registerStyles.page}>
        <div style={registerStyles.inner}>
          <main style={registerStyles.content}>
            <div style={{display: "flex", alignItems: "center", gap: 6, paddingTop: 8}}>
              <Link href="/login" style={registerStyles.backLink}>
                <ArrowLeftIcon/>
                Вход
              </Link>
            </div>

            <section style={registerStyles.card} aria-labelledby="register-title">
              <div style={registerStyles.logoBox}>
                <FridgeLogo/>
              </div>

              <div style={{display: "flex", flexDirection: "column", gap: 8}}>
                <h1 id="register-title" style={registerStyles.title}>
                  Новый аккаунт
                </h1>
              </div>

              {status === "loading" ? <p style={registerStyles.helperText}>Проверяем сохранённую сессию…</p> : null}

              <form onSubmit={onSubmit} noValidate style={{display: "flex", flexDirection: "column", gap: 16}}>
                {errors.root?.message ? <p style={registerStyles.errorSummary}>{errors.root.message}</p> : null}

                <div style={registerStyles.fieldGroup}>
                  <label htmlFor={emailId} style={registerStyles.fieldLabel}>
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
                      onFocus={() => setEmailFocused(true)}
                      onBlur={(event) => {
                        setEmailFocused(false);
                        emailField.onBlur(event);
                      }}
                      style={registerStyles.input({invalid: Boolean(errors.email), focused: emailFocused})}
                  />
                  {errors.email?.message ? (
                      <p id={`${emailId}-error`} style={registerStyles.errorText}>
                        {errors.email.message}
                      </p>
                  ) : null}
                </div>

                <div style={registerStyles.fieldGroup}>
                  <label htmlFor={passwordId} style={registerStyles.fieldLabel}>
                    Пароль
                  </label>
                  <div style={registerStyles.inputShell}>
                    <input
                        id={passwordId}
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        aria-invalid={Boolean(errors.password)}
                        aria-describedby={errors.password ? `${passwordId}-error` : undefined}
                        {...passwordField}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={(event) => {
                          setPasswordFocused(false);
                          passwordField.onBlur(event);
                        }}
                        style={registerStyles.input({invalid: Boolean(errors.password), focused: passwordFocused})}
                    />
                    <button
                        type="button"
                        aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                        onClick={() => setShowPassword((current) => !current)}
                        style={registerStyles.toggleButton}
                    >
                      {showPassword ? <EyeOffIcon/> : <EyeIcon/>}
                    </button>
                  </div>
                  {errors.password?.message ? (
                      <p id={`${passwordId}-error`} style={registerStyles.errorText}>
                        {errors.password.message}
                      </p>
                  ) : null}
                  <p style={registerStyles.helperText}>Минимум 8 символов</p>
                </div>

                <Button type="submit" variant={submitDisabled ? "secondary" : "primary"} disabled={submitDisabled}>
                  {isBusy ? "Создаём…" : "Создать аккаунт"}
                </Button>

                <div style={registerStyles.divider} aria-hidden="true">
                  <div style={registerStyles.dividerLine}/>
                  <span style={registerStyles.dividerText}>или</span>
                  <div style={registerStyles.dividerLine}/>
                </div>

                <Button type="button" variant="yandex" leadingIcon={<YandexMark/>} onClick={startYandexSignIn}>
                  Продолжить с Яндекс ID
                </Button>
              </form>
            </section>
          </main>

          <footer style={registerStyles.footer}>
            <span style={registerStyles.footerMutedText}>Уже есть аккаунт?</span>
            <Link href="/login" style={registerStyles.footerLink}>
              Войти
            </Link>
          </footer>
        </div>
      </div>
  );
}


