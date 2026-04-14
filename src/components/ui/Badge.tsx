import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'healthy' | 'degraded' | 'down' | 'unknown' | 'active' | 'inactive' | 'maintenance' | 'info' | 'default' | 'warning';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  healthy: 'bg-success-50 text-success-600 border-success-100 ring-success/20',
  degraded: 'bg-warning-50 text-amber-600 border-warning-100',
  down: 'bg-danger-50 text-danger-500 border-danger-100',
  unknown: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  active: 'bg-primary-50 text-primary-600 border-primary-100',
  inactive: 'bg-neutral-100 text-neutral-400 border-neutral-200',
  maintenance: 'bg-amber-50 text-amber-600 border-amber-100',
  info: 'bg-primary-50 text-primary-600 border-primary-100',
  default: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  warning: 'bg-amber-50 text-amber-600 border-amber-100',
};

const dotColors: Record<BadgeVariant, string> = {
  healthy: 'bg-success',
  degraded: 'bg-warning',
  down: 'bg-danger',
  unknown: 'bg-neutral-400',
  active: 'bg-primary-500',
  inactive: 'bg-neutral-400',
  maintenance: 'bg-amber-500',
  info: 'bg-primary-500',
  default: 'bg-neutral-400',
  warning: 'bg-amber-500',
};

export function Badge({ variant = 'default', size = 'sm', dot = false, className, children, ...props }: BadgeProps) {
  const sizes = {
    xs: 'px-1.5 py-0.5 text-2xs',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        variantStyles[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, ...props }: { status: string } & Omit<BadgeProps, 'variant'>) {
  const map: Record<string, BadgeVariant> = {
    healthy: 'healthy',
    degraded: 'degraded',
    down: 'down',
    timeout: 'down',
    error: 'down',
    active: 'active',
    inactive: 'inactive',
    maintenance: 'maintenance',
    unknown: 'unknown',
    archived: 'unknown',
  };
  return (
    <Badge variant={map[status.toLowerCase()] || 'default'} dot {...props}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
