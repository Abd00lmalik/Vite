import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`rounded-2xl border border-ui-border bg-white shadow-card ${paddings[padding]} transition-shadow duration-200 hover:shadow-panel ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  color = 'blue',
  className = '',
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  color?: 'blue' | 'orange' | 'green' | 'gray';
  className?: string;
}) {
  const colors = {
    blue: 'text-who-blue bg-who-blue-light border border-who-blue/20',
    orange: 'text-who-orange bg-who-orange-light border border-who-orange/20',
    green: 'text-who-green bg-who-green-light border border-who-green/20',
    gray: 'text-gray-600 bg-gray-100 border border-gray-200',
  };

  return (
    <div className={`rounded-2xl border border-ui-border bg-white p-5 shadow-card ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ui-text-muted">{label}</p>
          <p className="text-3xl font-bold tracking-tight text-ui-text">{value}</p>
          {sub ? <p className="mt-2 text-xs text-ui-text-light">{sub}</p> : null}
        </div>
        {icon ? <div className={`rounded-xl p-2.5 ${colors[color]}`}>{icon}</div> : null}
      </div>
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`border-b border-ui-border pb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold text-ui-text ${className}`}>{children}</h3>;
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function CardDescription({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-sm text-ui-text-light ${className}`}>{children}</p>;
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`border-t border-ui-border pt-4 ${className}`}>{children}</div>;
}
