import type { Vm, VmStatus } from '@vm-manager/shared';
import { Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { Can } from '../../../components/Can';
import { Card } from '../../../components/Card';
import { Spinner } from '../../../components/Spinner';
import { Toggle } from '../../../components/Toggle';
import { cn } from '../../../lib/utils';
import { OS_LABELS, VM_STATUS_LABELS } from '../labels';
import { VmStatusBadge } from './VmStatusBadge';

interface VmCardProps {
  vm: Vm;
  busy?: boolean;
  onToggleStatus: (vm: Vm, status: VmStatus) => void;
  onDelete: (vm: Vm) => void;
}

export function VmCard({ vm, busy = false, onToggleStatus, onDelete }: VmCardProps) {
  const isPending = vm.id.startsWith('temp-');
  const actionsDisabled = isPending || busy;

  return (
    <Card className={cn('flex flex-col gap-4 p-5', isPending && 'opacity-60')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-body font-semibold">
            <span className="truncate">{vm.name}</span>
            {isPending ? <Spinner className="size-4 shrink-0" /> : null}
          </h2>
          <p className="mt-0.5 text-caption text-text-secondary">{OS_LABELS[vm.os]}</p>
        </div>
        <VmStatusBadge status={vm.status} />
      </div>

      <dl className="grid grid-cols-3 gap-3">
        <div>
          <dt className="text-caption text-text-secondary">vCPU</dt>
          <dd className="text-sub font-medium">{vm.cores}</dd>
        </div>
        <div>
          <dt className="text-caption text-text-secondary">RAM</dt>
          <dd className="text-sub font-medium">{vm.ram} GB</dd>
        </div>
        <div>
          <dt className="text-caption text-text-secondary">Disco</dt>
          <dd className="text-sub font-medium">{vm.disk} GB</dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-between border-t border-separator pt-4">
        <Can role="ADMIN">
          <div className="flex items-center gap-2.5">
            <Toggle
              checked={vm.status === 'RUNNING'}
              disabled={actionsDisabled}
              ariaLabel={`${VM_STATUS_LABELS[vm.status]} — cambiar el estado de ${vm.name}`}
              onChange={(checked) => {
                onToggleStatus(vm, checked ? 'RUNNING' : 'STOPPED');
              }}
            />
            <span className="text-caption text-text-secondary">{VM_STATUS_LABELS[vm.status]}</span>
          </div>
        </Can>

        <Can role="ADMIN">
          <div className="flex items-center gap-1">
            <Link
              to={`/vms/${vm.id}/edit`}
              aria-label={`Editar ${vm.name}`}
              aria-disabled={actionsDisabled}
              tabIndex={actionsDisabled ? -1 : undefined}
              className={cn(
                'inline-flex size-11 items-center justify-center rounded-control text-text-secondary transition hover:bg-surface-2 hover:text-text',
                actionsDisabled && 'pointer-events-none opacity-50',
              )}
            >
              <Pencil size={18} strokeWidth={1.75} />
            </Link>
            <button
              type="button"
              aria-label={`Eliminar ${vm.name}`}
              disabled={actionsDisabled}
              onClick={() => {
                onDelete(vm);
              }}
              className="inline-flex size-11 items-center justify-center rounded-control text-text-secondary transition hover:bg-danger/10 hover:text-danger disabled:pointer-events-none disabled:opacity-50"
            >
              <Trash2 size={18} strokeWidth={1.75} />
            </button>
          </div>
        </Can>
      </div>
    </Card>
  );
}
