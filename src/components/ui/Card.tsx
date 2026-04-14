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
  const variants = {
    default: 'bg-white border border-neutral-200',
    glass: 'glass-card',
    elevated: 'bg-white shadow-glass-lg border border-neutral-100',
    flat: 'bg-ivory-100 border border-neutral-200',
  };

  const paddings = {
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
        hoverable && 'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-px cursor-pointer',
        className
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
        <h3 className="text-base font-semibold text-neutral-900 tracking-tight">{title}</h3>
        {subtitle && <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
