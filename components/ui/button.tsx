import * as React from 'react';
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cva } from 'class-variance-authority';

/* ── Backward-compatible buttonVariants for shadcn UI components ── */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default:   'bg-who-blue text-white hover:bg-who-blue-dark',
        primary:   'bg-who-blue text-white hover:bg-who-blue-dark',
        secondary: 'bg-white text-who-blue border border-who-blue hover:bg-who-blue-light',
        outline:   'bg-white text-ui-text border border-ui-border hover:bg-ui-bg',
        ghost:     'hover:bg-ui-bg text-ui-text',
        link:      'text-who-blue underline-offset-4 hover:underline',
        destructive: 'bg-who-red text-white hover:opacity-90',
        accent:    'bg-who-orange text-white hover:opacity-90',
        danger:    'bg-who-red text-white hover:opacity-90',
      },
      size: {
        default: 'px-6 py-3',
        md:      'px-6 py-3',
        sm:      'px-4 py-2 text-xs',
        lg:      'px-8 py-4 text-base',
        icon:    'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'accent' | 'danger' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  children?: ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary', size = 'md', loading, children,
  className = '', disabled, ...props
}, ref) => {
  // Map internal variant names to buttonVariants keys
  const variantMap: Record<string, any> = {
    primary: 'primary',
    secondary: 'secondary',
    outline: 'outline',
    accent: 'accent',
    danger: 'destructive',
    ghost: 'ghost',
    link: 'link',
  };

  const sizeMap: Record<string, any> = {
    sm: 'sm',
    md: 'default',
    lg: 'lg',
    icon: 'icon',
  };

  const v = variantMap[variant] || 'default';
  const s = sizeMap[size] || 'default';

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${buttonVariants({ variant: v, size: s })} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';



