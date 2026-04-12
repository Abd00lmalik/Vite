'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  loading?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-teal-primary text-white hover:bg-teal-dark',
    secondary: 'bg-accent text-white hover:opacity-90',
    outline: 'border border-teal-primary text-teal-primary hover:bg-teal-50',
    ghost: 'text-teal-primary hover:bg-teal-50',
    danger: 'bg-status-error text-white hover:opacity-90',
  };

  return (
    <button
      className={cn(
        'inline-flex h-12 items-center justify-center rounded-lg px-4 text-base font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

