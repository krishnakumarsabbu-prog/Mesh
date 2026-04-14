import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: string;
  animate?: boolean;
}

export function Skeleton({ width, height, rounded = 'rounded-lg', animate = true, className, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'shimmer-bg',
        rounded,
        className
      )}
      style={{ width, height, ...style }}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton height={16} width={120} />
        <Skeleton height={24} width={56} rounded="rounded-full" />
      </div>
      <Skeleton height={36} width={80} className="mb-2" />
      <Skeleton height={14} width={160} />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <Skeleton height={14} width={i === 0 ? 140 : 80} />
        </td>
      ))}
    </tr>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
