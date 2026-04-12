'use client';

import { cn } from '@/lib/utils/cn';

interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-2 rounded-lg bg-teal-50 p-1 md:flex', className)}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            'h-12 rounded-md px-3 text-sm font-medium transition md:min-w-[120px]',
            value === item.id ? 'bg-white text-teal-dark shadow-sm' : 'text-teal-dark/80 hover:bg-white/60'
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

