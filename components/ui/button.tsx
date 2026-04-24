import * as React from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-4 focus-visible:ring-who-blue/20',
  {
    variants: {
      variant: {
        default: 'bg-who-blue text-white shadow-soft hover:-translate-y-0.5 hover:bg-who-blue-dark',
        primary: 'bg-who-blue text-white shadow-soft hover:-translate-y-0.5 hover:bg-who-blue-dark',
        secondary: 'bg-who-blue-light text-who-blue border border-who-blue/25 hover:bg-white hover:border-who-blue/40',
        outline: 'bg-white text-ui-text border border-ui-border hover:bg-who-blue-light/40 hover:border-who-blue/30',
        ghost: 'text-ui-text hover:bg-who-blue-light/40',
        link: 'rounded-none p-0 text-who-blue hover:underline underline-offset-4 shadow-none',
        destructive: 'bg-who-red text-white hover:bg-[#dc2626]',
        danger: 'bg-who-red text-white hover:bg-[#dc2626]',
        accent: 'bg-who-green text-white shadow-soft hover:bg-[#0f9f90]',
      },
      size: {
        default: 'h-12 px-6',
        md: 'h-12 px-6',
        sm: 'h-10 px-4 text-xs',
        lg: 'h-14 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'accent' | 'danger' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  children?: ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }, ref) => {
    const variantMap: Record<string, string> = {
      primary: 'primary',
      secondary: 'secondary',
      outline: 'outline',
      accent: 'accent',
      danger: 'destructive',
      ghost: 'ghost',
      link: 'link',
    };

    const sizeMap: Record<string, string> = {
      sm: 'sm',
      md: 'default',
      lg: 'lg',
      icon: 'icon',
    };

    const v = variantMap[variant] ?? 'default';
    const s = sizeMap[size] ?? 'default';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${buttonVariants({ variant: v as any, size: s as any })} ${className}`}
        {...props}
      >
        {loading ? (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0A12 12 0 000 12h4z" />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
