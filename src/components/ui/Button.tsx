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
  onMouseEnter,
  onMouseLeave,
  ...props
}: ButtonProps) {
  const sizes = {
    xs: 'px-2.5 py-1 text-xs gap-1 rounded-lg',
    sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-xl',
    md: 'px-4 py-2 text-sm gap-2 rounded-xl',
    lg: 'px-5 py-2.5 text-base gap-2 rounded-xl',
  };

  const isPrimary = variant === 'primary' || variant === 'success';
  const isSecondary = variant === 'secondary';
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';

  const baseStyle: React.CSSProperties = isPrimary
    ? { background: 'linear-gradient(135deg, #00E599 0%, #00C97F 100%)', boxShadow: '0 2px 12px rgba(0,229,153,0.25)', color: '#0F1115' }
    : isSecondary
    ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', color: '#98A2B3' }
    : isGhost
    ? { color: '#98A2B3' }
    : isDanger
    ? { background: '#EF4444', border: '1px solid rgba(239,68,68,0.8)', color: '#fff' }
    : {};

  function handleMouseEnter(e: React.MouseEvent<HTMLButtonElement>) {
    const el = e.currentTarget as HTMLElement;
    if (isPrimary) {
      el.style.boxShadow = '0 4px 20px rgba(0,229,153,0.4)';
      el.style.transform = 'translateY(-1px)';
    } else if (isSecondary) {
      el.style.background = 'rgba(255,255,255,0.07)';
      el.style.color = '#E6EAF0';
    } else if (isGhost) {
      el.style.background = 'rgba(255,255,255,0.06)';
      el.style.color = '#E6EAF0';
    } else if (isDanger) {
      el.style.background = '#DC2626';
    }
    onMouseEnter?.(e);
  }

  function handleMouseLeave(e: React.MouseEvent<HTMLButtonElement>) {
    const el = e.currentTarget as HTMLElement;
    if (isPrimary) {
      el.style.boxShadow = '0 2px 12px rgba(0,229,153,0.25)';
      el.style.transform = '';
    } else if (isSecondary) {
      el.style.background = 'rgba(255,255,255,0.04)';
      el.style.color = '#98A2B3';
    } else if (isGhost) {
      el.style.background = '';
      el.style.color = '#98A2B3';
    } else if (isDanger) {
      el.style.background = '#EF4444';
    }
    onMouseLeave?.(e);
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold',
        'transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,229,153,0.4)] focus-visible:ring-offset-1 focus-visible:ring-offset-[#0F1115]',
        sizes[size],
        className
      )}
      style={{ ...baseStyle, ...style }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
