import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'healthy' | 'degraded' | 'down' | 'unknown' | 'active' | 'inactive' | 'maintenance' | 'info' | 'default' | 'warning';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  healthy: 'bg-success-50 text-success-600 border-success-100 ring-1 ring-success/10',
  degraded: 'bg-warning-50 text-amber-600 border-warning-100 ring-1 ring-amber-500/10',
  down: 'bg-danger-50 text-danger-500 border-danger-100 ring-1 ring-danger/10',
  unknown: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  active: 'bg-primary-50 text-primary-600 border-primary-100 ring-1 ring-primary-500/10',
  inactive: 'bg-neutral-100 text-neutral-400 border-neutral-200',
  maintenance: 'bg-amber-50 text-amber-600 border-amber-100 ring-1 ring-amber-500/10',
  info: 'bg-primary-50 text-primary-600 border-primary-100 ring-1 ring-primary-500/10',
  default: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  warning: 'bg-amber-50 text-amber-600 border-amber-100 ring-1 ring-amber-500/10',
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

const pulseDotColors: Record<BadgeVariant, string> = {
  healthy: 'bg-success/30',
  degraded: 'bg-amber-400/30',
  down: 'bg-danger/30',
  unknown: 'bg-neutral-300/50',
  active: 'bg-primary-400/30',
  inactive: 'bg-neutral-300/50',
  maintenance: 'bg-amber-400/30',
  info: 'bg-primary-400/30',
  default: 'bg-neutral-300/50',
  warning: 'bg-amber-400/30',
};

export function Badge({ variant = 'default', size = 'sm', dot = false, pulse = false, className, children, ...props }: BadgeProps) {
  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-2.5 py-1 text-sm gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border transition-all duration-150',
        variantStyles[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex-shrink-0 flex items-center justify-center" style={{ width: '7px', height: '7px' }}>
          {pulse && (
            <span
              className={cn('absolute inset-0 rounded-full animate-ping opacity-75', pulseDotColors[variant])}
              style={{ animationDuration: '2s' }}
            />
          )}
          <span className={cn('relative w-1.5 h-1.5 rounded-full', dotColors[variant])} />
        </span>
      )}
      {children}
    </span>
  );
}

export function StatusBadge({ status, pulse: pulseProp, ...props }: { status: string; pulse?: boolean } & Omit<BadgeProps, 'variant'>) {
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
  const variant = map[status.toLowerCase()] || 'default';
  const shouldPulse = pulseProp ?? (variant === 'healthy' || variant === 'degraded' || variant === 'down');
  return (
    <Badge variant={variant} dot pulse={shouldPulse} {...props}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
