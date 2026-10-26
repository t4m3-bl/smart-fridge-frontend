import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { buttonBaseStyle, getButtonStyle, type ButtonVariant } from './button.styles';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  leadingIcon?: ReactNode;
};

export function Button({ variant = 'primary', leadingIcon, children, disabled, style, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        ...buttonBaseStyle,
        ...getButtonStyle(variant, Boolean(disabled)),
        ...style,
      }}
    >
      {leadingIcon}
      <span>{children}</span>
    </button>
  );
}

