import { useState } from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pendingLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const EXIT_MS = 180;

/** Hoja de confirmación centrada, con fondo oscurecido y blur. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  pendingLabel = 'Procesando…',
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [closing, setClosing] = useState(false);

  if (!open) {
    return null;
  }

  const requestCancel = () => {
    if (pending || closing) {
      return;
    }
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      onCancel();
    }, EXIT_MS);
  };

  return (
    <Modal title={title} onClose={requestCancel} closing={closing} size="sm">
      {description ? <p className="text-sub text-text-secondary">{description}</p> : null}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={requestCancel} disabled={pending} autoFocus>
          {cancelLabel}
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={pending}>
          {pending ? pendingLabel : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
