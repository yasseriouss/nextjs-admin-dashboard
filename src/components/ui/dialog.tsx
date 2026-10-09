import { cn } from '../../utils/cn';
import { X } from 'lucide-react';
import { useEffect, type ReactNode, type ComponentProps } from 'react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: ReactNode;
  showCloseButton?: boolean;
}

export function Dialog({
  isOpen,
  onClose,
  className,
  showCloseButton = true,
  children,
}: DialogProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-primary-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-card-border bg-card p-6 shadow-2xl transition-all animate-in zoom-in-95 duration-200 text-card-foreground',
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
  );
}

export function DialogHeader({
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

export function DialogTitle({
  className,
  ...props
}: ComponentProps<'h3'>) {
  return (
    <h3
      className={cn(
        'text-lg md:text-xl font-bold leading-tight tracking-tight text-foreground flex items-center gap-2',
        className
      )}
      {...props}
    />
  );
}

export function DialogDescription({
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

export function DialogBody({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      className={cn('py-4 text-sm text-foreground overflow-y-auto max-h-[75vh]', className)}
      {...props}
    />
  );
}

export function DialogFooter({
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
