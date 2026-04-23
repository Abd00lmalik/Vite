import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full border border-ui-border rounded px-4 py-2.5 text-sm text-ui-text bg-white focus:outline-none focus:ring-2 focus:ring-who-blue focus:border-who-blue transition-colors',
        className
      )}
      {...props}
    />
  );
}



