import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };
  return (
    <div className={`bg-white border border-ui-border rounded-lg shadow-card
                     ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({
  label, value, sub, icon, color = 'blue', className = ''
}: {
  label: string; value: string | number; sub?: string;
  icon?: ReactNode; color?: 'blue' | 'orange' | 'green' | 'gray';
  className?: string;
}) {
  const colors = {
    blue:   'text-who-blue bg-who-blue-light',
    orange: 'text-who-orange bg-who-orange-light',
    green:  'text-who-green bg-who-green-light',
    gray:   'text-gray-600 bg-gray-100',
  };
  return (
    <div className={`stat-card ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ui-text-light font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-ui-text">{value}</p>
          {sub && <p className="text-xs text-ui-text-muted mt-1">{sub}</p>}
        </div>
        {icon && (
          <div className={`p-2 rounded-lg ${colors[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

/* Ã¢â€â‚¬Ã¢â€â‚¬ Compatibility wrappers for shadcn-style card API Ã¢â€â‚¬Ã¢â€â‚¬ */

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`pb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h3 className={`text-lg font-semibold text-ui-text ${className}`}>{children}</h3>;
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function CardDescription({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-sm text-ui-text-muted ${className}`}>{children}</p>;
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`pt-4 ${className}`}>{children}</div>;
}




