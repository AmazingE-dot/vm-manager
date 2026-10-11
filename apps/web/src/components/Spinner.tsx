import { cn } from '../lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={cn(
        'inline-block size-6 animate-spin rounded-full border-2 border-separator border-t-accent',
        className,
      )}
    />
  );
}
