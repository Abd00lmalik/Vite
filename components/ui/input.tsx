import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-12 w-full rounded-lg border border-gray-300 px-3 text-base text-gray-900 outline-none transition focus:border-teal-primary focus:ring-2 focus:ring-teal-100',
        className
      )}
      {...props}
    />
  );
}

