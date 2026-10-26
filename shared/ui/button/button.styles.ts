import type { CSSProperties } from "react";

export type ButtonVariant = "primary" | "secondary" | "yandex";

export const buttonTokens = {
  primaryBackground: "#3A6FD8",
  primaryText: "#FFFFFF",
  secondaryBackground: "#E6E6E1",
  secondaryText: "#A3A59E",
  yandexBackground: "#1C1D1A",
  yandexText: "#FFFFFF",
  disabledOpacity: 0.6,
};

export const buttonBaseStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  width: "100%",
  minHeight: 50,
  border: "none",
  borderRadius: 14,
  padding: "0 16px",
  fontFamily: "inherit",
  fontSize: 17,
  lineHeight: "22px",
  fontWeight: 600,
  textDecoration: "none",
  cursor: "pointer",
  transition: "transform 120ms ease, opacity 120ms ease, background-color 120ms ease",
};

export function getButtonStyle(variant: ButtonVariant, disabled = false): CSSProperties {
  const styles: Record<ButtonVariant, CSSProperties> = {
    primary: {
      background: buttonTokens.primaryBackground,
      color: buttonTokens.primaryText,
    },
    secondary: {
      background: buttonTokens.secondaryBackground,
      color: buttonTokens.secondaryText,
    },
    yandex: {
      background: buttonTokens.yandexBackground,
      color: buttonTokens.yandexText,
    },
  };

  return {
    ...buttonBaseStyle,
    ...styles[variant],
    opacity: disabled ? buttonTokens.disabledOpacity : 1,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

