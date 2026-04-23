'use client';

interface StatusDotProps {
  status: 'online' | 'offline' | 'pending' | 'synced' | 'error';
}

const colors: Record<StatusDotProps['status'], string> = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  pending: 'bg-amber-400',
  synced: 'bg-teal-500',
  error: 'bg-red-500',
};

export function StatusDot({ status }: StatusDotProps) {
  return <span className={`h-2.5 w-2.5 rounded-full ${colors[status]}`} />;
}




