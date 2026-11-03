import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./button.module.css";

export type ButtonVariant = "primary" | "secondary" | "yandex";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  leadingIcon?: ReactNode;
  className?: string;
  children?: ReactNode;
}

type ButtonAsButtonProps = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLinkProps = ButtonBaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

const variantClasses: Record<ButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  yandex: styles.yandex,
};

export function Button({ variant = "primary", leadingIcon, children, className, ...props }: ButtonProps) {
  const classes = [styles.button, variantClasses[variant], className].filter(Boolean).join(" ");

  if (props.href !== undefined) {
    const { href, ...anchorProps } = props;

    return (
      <a {...anchorProps} href={href} className={classes}>
        {leadingIcon}
        <span>{children}</span>
      </a>
    );
  }

  return (
    <button {...props} className={classes}>
      {leadingIcon}
      <span>{children}</span>
    </button>
  );
}
