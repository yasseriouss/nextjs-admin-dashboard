import { cn } from '../../utils/cn';
import { X } from 'lucide-react';
import { useEffect, type ReactNode, type ComponentProps } from 'react';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  className?: string;
  children: ReactNode;
  showCloseButton?: boolean;
}

export function Sheet({
  isOpen,
  onClose,
  side = 'right',
  className,
  showCloseButton = true,
  children,
}: SheetProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-primary-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        className={cn(
          'fixed inset-y-0 flex max-w-full',
          side === 'right' ? 'end-0' : 'start-0'
        )}
      >
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            'relative w-screen max-w-lg bg-card text-card-foreground shadow-2xl border-s border-card-border p-6 overflow-y-auto duration-300 animate-in',
            side === 'right' ? 'slide-in-from-right' : 'slide-in-from-left',
            className
          )}
        >
          {showCloseButton && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 end-4 flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export function SheetHeader({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex flex-col gap-1 pb-4 border-b border-border/50', className)}
      {...props}
    />
  );
}

export function SheetTitle({
  className,
  ...props
}: ComponentProps<'h3'>) {
  return (
    <h3
      className={cn(
        'text-lg font-bold leading-tight tracking-tight text-foreground flex items-center gap-2',
        className
      )}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: ComponentProps<'p'>) {
  return (
    <p
      className={cn('text-xs md:text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export function SheetBody({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn('py-4 text-sm text-foreground overflow-y-auto', className)}
      {...props}
    />
  );
}

export function SheetFooter({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 pt-4 border-t border-border/50 sm:flex-row sm:justify-end',
        className
      )}
      {...props}
    />
  );
}
