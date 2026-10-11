import type { VmStatus } from '@vm-manager/shared';
import { cn } from '../../../lib/utils';
import { VM_STATUS_LABELS } from '../labels';

export function VmStatusBadge({ status }: { status: VmStatus }) {
  const isRunning = status === 'RUNNING';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-medium',
        isRunning ? 'bg-success/10 text-success' : 'bg-surface-2 text-text-secondary',
      )}
    >
      <span
        aria-hidden="true"
        className={cn('size-2 rounded-full', isRunning ? 'bg-success' : 'bg-text-secondary')}
      />
      {VM_STATUS_LABELS[status]}
    </span>
  );
}
