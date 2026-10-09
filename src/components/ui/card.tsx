import { cn } from '../../utils/cn';
import type { ComponentProps } from 'react';

export function Card({ children, className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-card-border bg-card text-card-foreground p-5 shadow-sm transition-shadow hover:shadow-md dark:shadow-none',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'relative flex w-full flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }: ComponentProps<'h3'>) {
  return (
    <h3
      className={cn(
        'text-base md:text-lg font-bold leading-6 tracking-tight text-foreground flex items-center gap-2',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'text-xs md:text-sm text-muted-foreground mt-0.5 leading-relaxed',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ children, className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('pt-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('pt-4 mt-4 border-t border-border/50 flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  );
}
