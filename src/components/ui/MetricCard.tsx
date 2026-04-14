import React from 'react';
import { cn } from '@/lib/utils';
import type { LucideProps } from 'lucide-react';

type IconComponent = React.ComponentType<LucideProps>;

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: IconComponent;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label: string };
  className?: string;
  accent?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary-500',
  iconBg = 'bg-primary-50',
  trend,
  className,
  accent,
}: MetricCardProps) {
  const isPositive = trend && trend.value >= 0;

  return (
    <div
      className={cn(
        'metric-card relative overflow-hidden',
        className
      )}
    >
      {accent && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
          style={{ background: accent }}
        />
      )}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">{title}</p>
          <p className="text-3xl font-bold text-neutral-900 tracking-tight leading-none">{value}</p>
          {subtitle && (
            <p className="text-sm text-neutral-400 mt-1.5">{subtitle}</p>
          )}
          {trend && (
            <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', isPositive ? 'text-success-600' : 'text-danger-500')}>
              <span>{isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className="text-neutral-400 font-normal">{trend.label}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('p-3 rounded-xl flex-shrink-0', iconBg)}>
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
        )}
      </div>
    </div>
  );
}
