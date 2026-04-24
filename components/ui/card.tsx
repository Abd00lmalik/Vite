'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

function useCountUp(value: number, duration = 650): number {
  const reduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setDisplayValue(value);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const from = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(from + (value - from) * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration, reduceMotion, value]);

  return displayValue;
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const reduceMotion = useReducedMotion();
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.28 }}
      whileHover={reduceMotion ? undefined : { scale: 1.01, y: -1 }}
      className={`rounded-2xl border border-ui-border bg-white shadow-card transition-shadow duration-200 hover:shadow-panel ${paddings[padding]} ${className}`}
    >
      {children}
    </motion.div>
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

  const numericValue = typeof value === 'number' ? value : null;
  const animatedValue = useCountUp(numericValue ?? 0);
  const displayValue = useMemo(() => {
    if (numericValue === null) return value;
    return animatedValue;
  }, [animatedValue, numericValue, value]);

  return (
    <Card className={className} padding="md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ui-text-muted">{label}</p>
          <p className="text-3xl font-bold tracking-tight text-ui-text">{displayValue}</p>
          {sub ? <p className="mt-2 text-xs text-ui-text-light">{sub}</p> : null}
        </div>
        {icon ? <div className={`rounded-xl p-2.5 ${colors[color]}`}>{icon}</div> : null}
      </div>
    </Card>
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
