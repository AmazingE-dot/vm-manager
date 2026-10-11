import { X } from 'lucide-react';
import { useEffect, useId, type ReactNode } from 'react';
import { cn } from '../lib/utils';

interface ModalProps {
  title: string;
  onClose: () => void;
  /** Marca el inicio de la animación de salida (el padre desmonta al terminar). */
  closing?: boolean;
  size?: 'sm' | 'md';
  children: ReactNode;
}

/** Hoja centrada con fondo oscurecido + blur y transición de entrada/salida. */
export function Modal({ title, onClose, closing = false, size = 'sm', children }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Bloquea el scroll de fondo mientras el modal está abierto.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div data-closing={closing} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="modal-backdrop absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'modal-panel relative max-h-[85dvh] w-full overflow-y-auto rounded-card border border-separator bg-surface p-6 shadow-card',
          size === 'sm' ? 'max-w-sm' : 'max-w-lg',
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-heading">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="-m-1 inline-flex size-9 shrink-0 items-center justify-center rounded-control text-text-secondary transition hover:bg-surface-2 hover:text-text"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
