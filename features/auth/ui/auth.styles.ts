import type { CSSProperties } from "react";

export const authColors = {
  pageBackground: "#F5F5F2",
  textPrimary: "#1C1D1A",
  textSecondary: "#6B6D66",
  border: "#DCDCD6",
  blue: "#3A6FD8",
  yandexRed: "#FC3F1D",
  logoBackground: "#E8EFFC",
  inputBackground: "#FFFFFF",
  inactiveButtonBackground: "#E6E6E1",
  inactiveButtonText: "#A3A59E",
  iconMuted: "#A3A59E",
  error: "#D92D20",
};

export const pageStyle: CSSProperties = {
  minHeight: "100svh",
  background: authColors.pageBackground,
  color: authColors.textPrimary,
  display: "flex",
  justifyContent: "center",
};

export const pageInnerStyle: CSSProperties = {
  width: "100%",
  maxWidth: 432,
  minHeight: "100svh",
  display: "flex",
  flexDirection: "column",
  padding: "16px 16px 24px",
};

export const contentStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
};

export const cardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  paddingTop: 24,
};

export const logoRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
};

export const logoBoxStyle: CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: 20,
  background: authColors.logoBackground,
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
};

export const pageTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 32,
  lineHeight: "38px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  color: authColors.textPrimary,
};

export const subtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 15,
  lineHeight: "21px",
  fontWeight: 400,
  color: authColors.textSecondary,
};

export const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 32,
  lineHeight: "38px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  color: authColors.textPrimary,
};

export const sectionSubtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 15,
  lineHeight: "21px",
  fontWeight: 400,
  color: authColors.textSecondary,
};

export const linkRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
};

export const linkButtonStyle: CSSProperties = {
  border: 0,
  padding: 0,
  background: "transparent",
  fontSize: 15,
  lineHeight: "19px",
  fontWeight: 600,
  color: authColors.blue,
  cursor: "pointer",
  textDecoration: "none",
};

export const helperTextStyle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: "18px",
  color: authColors.textSecondary,
};

export const errorTextStyle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: "18px",
  color: authColors.error,
};

export const fieldGroupStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

export const fieldLabelStyle: CSSProperties = {
  fontSize: 13,
  lineHeight: "17px",
  fontWeight: 500,
  color: authColors.textSecondary,
};

export const inputShellBaseStyle: CSSProperties = {
  position: "relative",
};

export const inputBaseStyle: CSSProperties = {
  width: "100%",
  minHeight: 50,
  borderRadius: 12,
  borderWidth: 1,
  borderStyle: "solid",
  background: authColors.inputBackground,
  color: authColors.textPrimary,
  fontFamily: "inherit",
  fontSize: 17,
  lineHeight: "22px",
  padding: "14px 14px",
  paddingRight: 46,
  outline: "none",
  boxSizing: "border-box",
};

export function getInputStyle(options: { invalid?: boolean; focused?: boolean }): CSSProperties {
  if (options.invalid) {
    return {
      ...inputBaseStyle,
      borderColor: authColors.error,
      boxShadow: `0 0 0 1px ${authColors.error}`,
    };
  }

  if (options.focused) {
    return {
      ...inputBaseStyle,
      borderColor: authColors.blue,
      boxShadow: `0 0 0 1px ${authColors.blue}`,
    };
  }

  return {...inputBaseStyle, borderColor: authColors.border};
}

export const toggleButtonStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  width: 48,
  border: 0,
  background: "transparent",
  display: "grid",
  placeItems: "center",
  color: authColors.iconMuted,
  cursor: "pointer",
};

export const dividerStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",
  gap: 12,
};

export const dividerLineStyle: CSSProperties = {
  height: 1,
  background: authColors.border,
};

export const dividerTextStyle: CSSProperties = {
  fontSize: 13,
  lineHeight: "17px",
  color: authColors.inactiveButtonText,
};

export const footerStyle: CSSProperties = {
  marginTop: "auto",
  paddingTop: 24,
  display: "flex",
  justifyContent: "center",
  gap: 6,
  flexWrap: "wrap",
  fontSize: 15,
  lineHeight: "21px",
};

export const footerMutedTextStyle: CSSProperties = {
  color: authColors.textSecondary,
};

export const footerLinkStyle: CSSProperties = {
  color: authColors.blue,
  fontWeight: 600,
  textDecoration: "none",
};

export const backLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  color: authColors.blue,
  fontSize: 17,
  lineHeight: "22px",
  textDecoration: "none",
  fontWeight: 400,
};

export const errorSummaryStyle: CSSProperties = {
  borderRadius: 12,
  border: `1px solid ${authColors.error}`,
  background: "rgba(217, 45, 32, 0.08)",
  color: authColors.error,
  padding: 12,
  fontSize: 14,
  lineHeight: "20px",
};

export const formStackStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

