import { cn } from '@/lib/utils/cn';

interface TimelineItem {
  id: string;
  title: string;
  caption?: string;
  status?: 'complete' | 'pending';
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <ul className={cn('space-y-3', className)}>
      {items.map((item, index) => (
        <li key={item.id} className="relative pl-8">
          <span
            className={cn(
              'absolute left-0 top-1 h-4 w-4 rounded-full border-2',
              item.status === 'complete'
                ? 'border-green-600 bg-green-100'
                : 'border-gray-400 bg-white'
            )}
          />
          {index < items.length - 1 ? (
            <span className="absolute left-[7px] top-5 h-8 w-px bg-gray-300" />
          ) : null}
          <div className="text-sm font-medium text-gray-900">{item.title}</div>
          {item.caption ? <div className="text-xs text-gray-500">{item.caption}</div> : null}
        </li>
      ))}
    </ul>
  );
}

