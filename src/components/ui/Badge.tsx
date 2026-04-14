import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'healthy' | 'degraded' | 'down' | 'unknown' | 'active' | 'inactive' | 'maintenance' | 'info' | 'default' | 'warning';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
}

const variantStyleMap: Record<BadgeVariant, React.CSSProperties> = {
  healthy: { background: 'rgba(0,229,153,0.10)', color: '#00E599', border: '1px solid rgba(0,229,153,0.25)' },
  degraded: { background: 'rgba(245,158,11,0.10)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)' },
  down: { background: 'rgba(239,68,68,0.10)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' },
  unknown: { background: 'rgba(107,114,128,0.10)', color: '#9CA3AF', border: '1px solid rgba(107,114,128,0.20)' },
  active: { background: 'rgba(59,130,246,0.10)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.25)' },
  inactive: { background: 'rgba(107,114,128,0.08)', color: '#6B7280', border: '1px solid rgba(107,114,128,0.15)' },
  maintenance: { background: 'rgba(245,158,11,0.10)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)' },
  info: { background: 'rgba(59,130,246,0.10)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.25)' },
  default: { background: 'rgba(255,255,255,0.06)', color: '#98A2B3', border: '1px solid rgba(255,255,255,0.10)' },
  warning: { background: 'rgba(245,158,11,0.10)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)' },
};

const dotColorMap: Record<BadgeVariant, string> = {
  healthy: '#00E599',
  degraded: '#F59E0B',
  down: '#EF4444',
  unknown: '#6B7280',
  active: '#3B82F6',
  inactive: '#6B7280',
  maintenance: '#F59E0B',
  info: '#3B82F6',
  default: '#6B7280',
  warning: '#F59E0B',
};

export function Badge({ variant = 'default', size = 'sm', dot = false, pulse = false, className, style, children, ...props }: BadgeProps) {
  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-2.5 py-1 text-sm gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full transition-all duration-150',
        sizes[size],
        className
      )}
      style={{ ...variantStyleMap[variant], ...style }}
      {...props}
    >
      {dot && (
        <span className="relative flex-shrink-0 flex items-center justify-center" style={{ width: '7px', height: '7px' }}>
          {pulse && (
            <span
              className="absolute inset-0 rounded-full animate-ping opacity-75"
              style={{ background: dotColorMap[variant] + '40', animationDuration: '2s' }}
            />
          )}
          <span className="relative w-1.5 h-1.5 rounded-full" style={{ background: dotColorMap[variant] }} />
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
