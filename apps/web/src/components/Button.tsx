import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:brightness-110',
  secondary: 'bg-surface-2 text-text hover:brightness-[0.97] dark:hover:brightness-110',
  danger: 'bg-danger text-white hover:brightness-110',
  ghost: 'text-text-secondary hover:bg-surface-2 hover:text-text',
};

/** Clases compartidas para que enlaces (`Link`) luzcan como botones. */
export function buttonClasses(variant: ButtonVariant = 'primary', className?: string): string {
  return cn(
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4',
    'text-body font-medium transition active:scale-[0.98]',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANT_CLASSES[variant],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}
