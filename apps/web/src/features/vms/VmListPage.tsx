import type { Vm, VmStatus } from '@vm-manager/shared';
import { Plus, Search, Server } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Button, buttonClasses } from '../../components/Button';
import { Can, useCan } from '../../components/Can';
import { Card } from '../../components/Card';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { useRecentChangesStore } from '../realtime/recentChanges';
import { VmCard } from './components/VmCard';
import { VmCardSkeleton } from './components/VmCardSkeleton';
import { useVmMutations } from './hooks/useVmMutations';
import { useVms } from './hooks/useVms';

type StatusFilter = 'ALL' | VmStatus;

const FILTER_OPTIONS = [
  { value: 'ALL', label: 'Todas' },
  { value: 'RUNNING', label: 'Encendidas' },
  { value: 'STOPPED', label: 'Apagadas' },
] as const;

export function VmListPage() {
  useDocumentTitle('Máquinas virtuales');
  const { data: vms, isPending, isError, refetch } = useVms();
  const { updateVm, deleteVm } = useVmMutations();
  const canCreate = useCan('ADMIN');
  const recentIds = useRecentChangesStore((state) => state.ids);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [vmToDelete, setVmToDelete] = useState<Vm | null>(null);

  const filteredVms = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (vms ?? []).filter((vm) => {
      const matchesSearch = term === '' || vm.name.includes(term);
      const matchesStatus = statusFilter === 'ALL' || vm.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vms, search, statusFilter]);

  const handleConfirmDelete = () => {
    if (!vmToDelete) {
      return;
    }
    deleteVm.mutate(vmToDelete, {
      onSettled: () => {
        setVmToDelete(null);
      },
    });
  };

  const totalVms = (vms ?? []).length;

  return (
    <>
      <PageHeader
        title="Máquinas virtuales"
        description="Crea, edita y controla el estado de tus VMs."
        actions={
          <Can role="ADMIN">
            <Link to="/vms/new" className={buttonClasses('primary')}>
              <Plus size={18} strokeWidth={2} />
              Crear VM
            </Link>
          </Can>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={16}
            strokeWidth={1.75}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-secondary"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            placeholder="Buscar por nombre…"
            aria-label="Buscar por nombre"
            className="min-h-11 w-full rounded-control bg-surface-2 pr-3.5 pl-9 text-body text-text transition placeholder:text-text-secondary/70"
          />
        </div>
        <SegmentedControl
          options={FILTER_OPTIONS}
          value={statusFilter}
          onChange={setStatusFilter}
          ariaLabel="Filtrar por estado"
        />
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <VmCardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <EmptyState
            title="No se pudieron cargar las VMs"
            description="Revisa tu conexión e inténtalo de nuevo."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  void refetch();
                }}
              >
                Reintentar
              </Button>
            }
          />
        </Card>
      ) : totalVms === 0 ? (
        <Card>
          <EmptyState
            icon={<Server size={22} strokeWidth={1.75} />}
            title="Aún no hay máquinas virtuales"
            description={
              canCreate
                ? 'Crea tu primera VM para empezar a gestionar recursos.'
                : 'Cuando un ADMIN cree una VM aparecerá aquí.'
            }
            action={
              <Can role="ADMIN">
                <Link to="/vms/new" className={buttonClasses('primary')}>
                  Crear la primera VM
                </Link>
              </Can>
            }
          />
        </Card>
      ) : filteredVms.length === 0 ? (
        <Card>
          <EmptyState
            title="Sin resultados"
            description="Ninguna VM coincide con la búsqueda o el filtro seleccionado."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                }}
              >
                Limpiar filtros
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredVms.map((vm) => (
            <VmCard
              key={vm.id}
              vm={vm}
              busy={updateVm.isPending && updateVm.variables?.id === vm.id}
              recent={recentIds.has(vm.id)}
              onToggleStatus={(target, status) => {
                updateVm.mutate({ id: target.id, input: { status } });
              }}
              onDelete={(target) => {
                setVmToDelete(target);
              }}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={vmToDelete !== null}
        title="Eliminar máquina virtual"
        description={
          vmToDelete
            ? `Se eliminará "${vmToDelete.name}" de forma permanente. Esta acción no se puede deshacer.`
            : undefined
        }
        confirmLabel="Eliminar"
        pendingLabel="Eliminando…"
        pending={deleteVm.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleteVm.isPending) {
            setVmToDelete(null);
          }
        }}
      />
    </>
  );
}
