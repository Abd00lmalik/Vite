import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-12 w-full rounded-xl border border-ui-border bg-white px-4 text-base text-ui-text shadow-sm outline-none transition-all duration-200 placeholder:text-ui-text-muted focus:border-who-blue focus:ring-4 focus:ring-who-blue/15',
        className
      )}
      {...props}
    />
  );
}



