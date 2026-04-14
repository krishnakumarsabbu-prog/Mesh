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
  ...props
}: ButtonProps) {
  const variants = {
    primary: [
      'bg-primary-500 text-white border border-primary-500',
      'hover:bg-primary-600 hover:border-primary-600 hover:shadow-md hover:shadow-primary-500/20',
      'active:bg-primary-700 active:scale-[0.98]',
      'shadow-sm shadow-primary-500/25',
    ].join(' '),
    secondary: [
      'bg-white text-neutral-700 border border-neutral-200',
      'hover:bg-neutral-50 hover:border-neutral-300 hover:shadow-sm',
      'active:bg-neutral-100 active:scale-[0.98]',
      'shadow-xs',
    ].join(' '),
    ghost: [
      'text-neutral-600 border border-transparent',
      'hover:bg-neutral-100 hover:text-neutral-900 hover:border-neutral-200',
      'active:bg-neutral-200 active:scale-[0.98]',
    ].join(' '),
    danger: [
      'bg-danger text-white border border-danger',
      'hover:bg-red-600 hover:border-red-600 hover:shadow-md hover:shadow-red-500/20',
      'active:bg-red-700 active:scale-[0.98]',
      'shadow-sm shadow-red-500/20',
    ].join(' '),
    success: [
      'bg-success text-white border border-success',
      'hover:bg-green-600 hover:border-green-600 hover:shadow-md hover:shadow-green-500/20',
      'active:bg-green-700 active:scale-[0.98]',
      'shadow-sm shadow-green-500/20',
    ].join(' '),
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-xs gap-1 rounded-lg',
    sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-xl',
    md: 'px-4 py-2 text-sm gap-2 rounded-xl',
    lg: 'px-5 py-2.5 text-base gap-2 rounded-xl',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold',
        'transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-1',
        variants[variant],
        sizes[size],
        className
      )}
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
