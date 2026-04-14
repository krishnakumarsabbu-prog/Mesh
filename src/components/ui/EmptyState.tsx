import React from 'react';
import { cn } from '@/lib/utils';
import type { LucideProps } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ComponentType<LucideProps>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, className, compact = false }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-10 px-6' : 'py-20 px-8',
        className,
      )}
    >
      {Icon && (
        <div className={cn(
          'rounded-2xl bg-neutral-100 flex items-center justify-center mb-4',
          compact ? 'w-10 h-10' : 'w-14 h-14',
        )}>
          <Icon className={cn('text-neutral-400', compact ? 'w-5 h-5' : 'w-6 h-6')} strokeWidth={1.5} />
        </div>
      )}
      <p className={cn('font-semibold text-neutral-700 tracking-tight', compact ? 'text-sm' : 'text-base')}>{title}</p>
      {description && (
        <p className={cn('text-neutral-400 mt-1 max-w-xs', compact ? 'text-xs' : 'text-sm')}>{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
