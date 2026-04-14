import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
}

export function Input({ label, error, hint, prefixIcon, suffixIcon, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <div className="relative">
        {prefixIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {prefixIcon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full px-3 py-2 bg-white border rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400',
            'transition-all duration-150 outline-none',
            'focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
            'disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed',
            error ? 'border-danger-400 focus:ring-danger/20' : 'border-neutral-200',
            prefixIcon && 'pl-10',
            suffixIcon && 'pr-10',
            className
          )}
          {...props}
        />
        {suffixIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {suffixIcon}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-danger-500">{error}</p>}
      {hint && !error && <p className="text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          'w-full px-3 py-2 bg-white border rounded-xl text-sm text-neutral-900',
          'transition-all duration-150 outline-none',
          'focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
          error ? 'border-danger-400' : 'border-neutral-200',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className, id, ...props }: TextAreaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          'w-full px-3 py-2 bg-white border rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400',
          'transition-all duration-150 outline-none resize-none',
          'focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400',
          error ? 'border-danger-400' : 'border-neutral-200',
          className
        )}
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  );
}
