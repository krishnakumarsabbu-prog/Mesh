import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  required?: boolean;
}

export function Input({ label, error, hint, prefixIcon, suffixIcon, className, id, required, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-neutral-600 tracking-wide uppercase flex items-center gap-1">
          {label}
          {required && <span className="text-danger-400 text-[10px]">*</span>}
        </label>
      )}
      <div className="relative group">
        {prefixIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-500 transition-colors duration-150 pointer-events-none">
            {prefixIcon}
          </div>
        )}
        <input
          id={inputId}
          required={required}
          className={cn(
            'w-full px-3 py-2.5 bg-white border rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400',
            'transition-all duration-150 outline-none',
            'hover:border-neutral-300',
            'focus:ring-[3px] focus:ring-primary-500/12 focus:border-primary-400',
            'disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed disabled:border-neutral-200',
            error
              ? 'border-danger-400 focus:ring-danger/12 focus:border-danger-400 bg-danger-50/30'
              : 'border-neutral-200',
            prefixIcon && 'pl-9',
            suffixIcon && 'pr-9',
            className
          )}
          {...props}
        />
        {suffixIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-500 transition-colors duration-150 pointer-events-none">
            {suffixIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-danger-500 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-danger-400 flex-shrink-0" />
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-neutral-400 leading-relaxed">{hint}</p>}
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

export function Select({ label, error, hint, options, className, id, required, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-neutral-600 tracking-wide uppercase flex items-center gap-1">
          {label}
          {required && <span className="text-danger-400 text-[10px]">*</span>}
        </label>
      )}
      <div className="relative group">
        <select
          id={inputId}
          required={required}
          className={cn(
            'w-full appearance-none pl-3 pr-9 py-2.5 bg-white border rounded-xl text-sm text-neutral-900',
            'transition-all duration-150 outline-none cursor-pointer',
            'hover:border-neutral-300',
            'focus:ring-[3px] focus:ring-primary-500/12 focus:border-primary-400',
            'disabled:bg-neutral-50 disabled:cursor-not-allowed',
            error ? 'border-danger-400 focus:ring-danger/12' : 'border-neutral-200',
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
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none group-focus-within:text-primary-500 transition-colors duration-150" />
      </div>
      {error && (
        <p className="text-xs text-danger-500 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-danger-400 flex-shrink-0" />
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-neutral-400 leading-relaxed">{hint}</p>}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function TextArea({ label, error, hint, className, id, required, ...props }: TextAreaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-neutral-600 tracking-wide uppercase flex items-center gap-1">
          {label}
          {required && <span className="text-danger-400 text-[10px]">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        required={required}
        className={cn(
          'w-full px-3 py-2.5 bg-white border rounded-xl text-sm text-neutral-900 placeholder:text-neutral-400',
          'transition-all duration-150 outline-none resize-none',
          'hover:border-neutral-300',
          'focus:ring-[3px] focus:ring-primary-500/12 focus:border-primary-400',
          error ? 'border-danger-400 focus:ring-danger/12 bg-danger-50/30' : 'border-neutral-200',
          className
        )}
        rows={3}
        {...props}
      />
      {error && (
        <p className="text-xs text-danger-500 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-danger-400 flex-shrink-0" />
          {error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-neutral-400 leading-relaxed">{hint}</p>}
    </div>
  );
}
