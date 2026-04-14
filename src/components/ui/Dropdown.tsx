import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

interface DropdownProps {
  trigger: React.ReactElement;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, items, align = 'left', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-flex">
      {React.cloneElement(trigger, { onClick: () => setOpen((v) => !v) })}
      {open && (
        <div
          className={cn(
            'absolute top-full z-50 mt-1.5 min-w-[160px] bg-white rounded-2xl border border-neutral-100 py-1.5 animate-scale-in',
            align === 'right' ? 'right-0' : 'left-0',
            className,
          )}
          style={{ boxShadow: '0 8px 32px -6px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)' }}
        >
          {items.map((item, i) => {
            if (item.divider) {
              return <div key={i} className="my-1 border-t border-neutral-50" />;
            }
            return (
              <button
                key={i}
                disabled={item.disabled}
                onClick={() => { item.onClick?.(); setOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors text-left',
                  item.danger
                    ? 'text-danger-500 hover:bg-danger-50'
                    : 'text-neutral-700 hover:bg-neutral-50',
                  item.disabled && 'opacity-40 cursor-not-allowed',
                )}
              >
                {item.icon && <span className="flex-shrink-0 text-current opacity-60">{item.icon}</span>}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
