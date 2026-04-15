import React from 'react';
import { cn } from '@/lib/utils';
import { Loader as Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  className,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const sizes = {
    xs: 'px-2.5 py-1 text-xs gap-1 rounded-lg',
    sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-xl',
    md: 'px-4 py-2 text-sm gap-2 rounded-xl',
    lg: 'px-5 py-2.5 text-base gap-2 rounded-xl',
  };

  const variantClass =
    variant === 'primary' || variant === 'success'
      ? 'hm-btn-primary'
      : variant === 'secondary'
      ? 'hm-btn-secondary'
      : variant === 'ghost'
      ? 'hm-btn-ghost'
      : variant === 'danger'
      ? 'hm-btn-danger'
      : '';

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold',
        'transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        'hm-btn-focus',
        sizes[size],
        variantClass,
        className
      )}
      style={style}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className={cn('animate-spin', size === 'xs' ? 'w-3 h-3' : 'w-4 h-4')} />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      {children}
      {!loading && iconRight && <span className="flex-shrink-0">{iconRight}</span>}
    </button>
  );
}
