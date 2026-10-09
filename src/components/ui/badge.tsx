import { cn } from '../../utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-semibold transition-colors [&>svg]:size-3.5',
  {
    variants: {
      variant: {
        primary: 'bg-primary/10 text-primary border border-primary/20 dark:bg-accent/20 dark:text-accent dark:border-accent/30',
        accent: 'bg-accent/15 text-accent-700 dark:text-accent-300 border border-accent/30',
        success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20',
        warning: 'bg-accent text-accent dark:text-accent border border-accent',
        danger: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20',
        neutral: 'bg-muted text-muted-foreground border border-border',
      },
      size: {
        sm: 'px-2 py-0.5 text-[11px]',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends ComponentProps<'span'>,
    VariantProps<typeof badgeVariants> {
  icon?: ReactNode;
}

export function Badge({
  className,
  variant,
  size,
  icon,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon}
      <span>{children}</span>
    </span>
  );
}
