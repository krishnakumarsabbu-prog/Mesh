import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

const inputBaseStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: '#E6EAF0',
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  required?: boolean;
}

export function Input({ label, error, hint, prefixIcon, suffixIcon, className, id, required, style, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold tracking-wide uppercase flex items-center gap-1"
          style={{ color: '#667085' }}
        >
          {label}
          {required && <span className="text-[10px]" style={{ color: '#EF4444' }}>*</span>}
        </label>
      )}
      <div className="relative group">
        {prefixIcon && (
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-150 pointer-events-none"
            style={{ color: '#667085' }}
          >
            {prefixIcon}
          </div>
        )}
        <input
          id={inputId}
          required={required}
          className={cn(
            'w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-150 outline-none',
            'placeholder:text-[#667085]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            prefixIcon && 'pl-9',
            suffixIcon && 'pr-9',
            className
          )}
          style={{
            ...inputBaseStyle,
            ...(error
              ? { borderColor: 'rgba(239,68,68,0.5)', boxShadow: '0 0 0 3px rgba(239,68,68,0.10)' }
              : undefined),
            ...style,
          }}
          onFocus={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = 'rgba(0,229,153,0.5)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,229,153,0.10)';
            }
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.10)';
            e.currentTarget.style.boxShadow = error ? '0 0 0 3px rgba(239,68,68,0.10)' : 'none';
            props.onBlur?.(e);
          }}
          {...props}
        />
        {suffixIcon && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-150 pointer-events-none"
            style={{ color: '#667085' }}
          >
            {suffixIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs flex items-center gap-1" style={{ color: '#EF4444' }}>
          <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#EF4444' }} />
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs leading-relaxed" style={{ color: '#667085' }}>{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  required?: boolean;
}

export function Select({ label, error, hint, options, className, id, required, style, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold tracking-wide uppercase flex items-center gap-1"
          style={{ color: '#667085' }}
        >
          {label}
          {required && <span className="text-[10px]" style={{ color: '#EF4444' }}>*</span>}
        </label>
      )}
      <div className="relative group">
        <select
          id={inputId}
          required={required}
          className={cn(
            'w-full appearance-none pl-3 pr-9 py-2.5 rounded-xl text-sm transition-all duration-150 outline-none cursor-pointer',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error ? '' : '',
            className
          )}
          style={{
            ...inputBaseStyle,
            ...(error ? { borderColor: 'rgba(239,68,68,0.5)' } : undefined),
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0,229,153,0.5)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,229,153,0.10)';
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.10)';
            e.currentTarget.style.boxShadow = 'none';
            props.onBlur?.(e);
          }}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ background: '#161B22', color: '#E6EAF0' }}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-150"
          style={{ color: '#667085' }}
        />
      </div>
      {error && (
        <p className="text-xs flex items-center gap-1" style={{ color: '#EF4444' }}>
          <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#EF4444' }} />
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs leading-relaxed" style={{ color: '#667085' }}>{hint}</p>}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function TextArea({ label, error, hint, className, id, required, style, ...props }: TextAreaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold tracking-wide uppercase flex items-center gap-1"
          style={{ color: '#667085' }}
        >
          {label}
          {required && <span className="text-[10px]" style={{ color: '#EF4444' }}>*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        required={required}
        className={cn(
          'w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-150 outline-none resize-none',
          'placeholder:text-[#667085]',
          className
        )}
        style={{
          ...inputBaseStyle,
          ...(error ? { borderColor: 'rgba(239,68,68,0.5)', boxShadow: '0 0 0 3px rgba(239,68,68,0.10)' } : undefined),
          ...style,
        }}
        onFocus={(e) => {
          if (!error) {
            e.currentTarget.style.borderColor = 'rgba(0,229,153,0.5)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,229,153,0.10)';
          }
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.10)';
          e.currentTarget.style.boxShadow = error ? '0 0 0 3px rgba(239,68,68,0.10)' : 'none';
          props.onBlur?.(e);
        }}
        rows={3}
        {...props}
      />
      {error && (
        <p className="text-xs flex items-center gap-1" style={{ color: '#EF4444' }}>
          <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#EF4444' }} />
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs leading-relaxed" style={{ color: '#667085' }}>{hint}</p>}
    </div>
  );
}
