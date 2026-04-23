import { cn } from '@/lib/utils/cn';

interface ProgressBarProps {
  value: number;
  className?: string;
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-gray-200', className)}>
      <div className="h-full rounded-full bg-teal-primary transition-all" style={{ width: `${safeValue}%` }} />
    </div>
  );
}




