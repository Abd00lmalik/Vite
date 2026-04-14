'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-base font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
  {
    variants: {
      variant: {
        default: 'bg-teal-primary text-white hover:bg-teal-dark',
        primary: 'bg-teal-primary text-white hover:bg-teal-dark',
        secondary: 'bg-accent text-white hover:opacity-90',
        outline: 'border border-teal-primary text-teal-primary hover:bg-teal-50',
        ghost: 'text-teal-primary hover:bg-teal-50',
        danger: 'bg-status-error text-white hover:opacity-90',
        destructive: 'bg-status-error text-white hover:opacity-90',
        link: 'text-teal-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-12 px-4',
        sm: 'h-10 px-3 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
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
);

Button.displayName = 'Button';
