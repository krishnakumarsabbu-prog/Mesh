import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export function Card({
  className,
  variant = 'glass',
  padding = 'md',
  hoverable = false,
  children,
  ...props
}: CardProps) {
  const variants: Record<string, string> = {
    default: 'glass-card',
    glass: 'glass-card',
    elevated: 'glass-elevated',
    flat: 'surface',
  };

  const paddings: Record<string, string> = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'rounded-2xl',
        variants[variant],
        paddings[padding],
        hoverable && 'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-6', className)} {...props}>
      <div>
        <h3
          className="text-[14px] font-bold tracking-tight leading-snug"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            className="text-[12px] mt-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
    </div>
  );
}
