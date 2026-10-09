import { cn } from '../../utils/cn';
import React, { type ComponentProps } from 'react';

export interface InputProps extends ComponentProps<'input'> {
  label?: string;
  error?: string;
  helperText?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, prefixIcon, suffixIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-start">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefixIcon && (
            <div className="absolute start-3 flex items-center pointer-events-none text-muted-foreground [&>svg]:size-4">
              {prefixIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full rounded-xl border border-input bg-card px-3.5 py-2 text-sm text-foreground shadow-xs placeholder:text-muted-foreground/60 transition-colors focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50',
              prefixIcon && 'ps-9',
              suffixIcon && 'pe-9',
              error && 'border-rose-500 focus-visible:border-rose-500 focus-visible:ring-rose-500/20',
              className
            )}
            {...props}
          />
          {suffixIcon && (
            <div className="absolute end-3 flex items-center pointer-events-none text-muted-foreground [&>svg]:size-4">
              {suffixIcon}
            </div>
          )}
        </div>
        {error && <p className="text-[11px] font-medium text-rose-500">{error}</p>}
        {helperText && !error && (
          <p className="text-[11px] text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
