import type { Vm } from '@vm-manager/shared';
import { VM_EVENTS } from '@vm-manager/shared';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { vmsQueryKey, type VmsData } from '../vms/hooks/useVms';
import { useRecentChangesStore } from './recentChanges';
import { disconnectSocket, getSocket } from './socket';

/**
 * Aplica el cambio al cache solo si aporta algo (idempotente): quien originó el
 * cambio ya tiene los datos y su `updatedAt` coincide, así no hay duplicados ni
 * doble animación.
 */
function applyVmChange(queryClient: QueryClient, incoming: Vm): boolean {
  const current = queryClient.getQueryData<VmsData>(vmsQueryKey);
  if (!current) {
    return false;
  }

  const existing = current.vms.find((vm) => vm.id === incoming.id);
  if (!existing) {
    queryClient.setQueryData<VmsData>(vmsQueryKey, { vms: [incoming, ...current.vms] });
    return true;
  }

  if (incoming.updatedAt > existing.updatedAt) {
    queryClient.setQueryData<VmsData>(vmsQueryKey, {
      vms: current.vms.map((vm) => (vm.id === incoming.id ? incoming : vm)),
    });
    return true;
  }

  return false;
}

function removeVmFromCache(queryClient: QueryClient, id: string): void {
  const current = queryClient.getQueryData<VmsData>(vmsQueryKey);
  if (!current || !current.vms.some((vm) => vm.id === id)) {
    return;
  }
  queryClient.setQueryData<VmsData>(vmsQueryKey, {
    vms: current.vms.filter((vm) => vm.id !== id),
  });
}

/**
 * Sincroniza el cache de VMs con los eventos del servidor. Se monta una sola vez
 * en el layout autenticado.
 */
export function useVmRealtime(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    const { mark } = useRecentChangesStore.getState();

    const handleUpsert = (vm: Vm) => {
      if (applyVmChange(queryClient, vm)) {
        mark(vm.id);
      }
    };

    const handleDeleted = (vm: Vm) => {
      removeVmFromCache(queryClient, vm.id);
    };

    socket.on(VM_EVENTS.created, handleUpsert);
    socket.on(VM_EVENTS.updated, handleUpsert);
    socket.on(VM_EVENTS.deleted, handleDeleted);

    return () => {
      socket.off(VM_EVENTS.created, handleUpsert);
      socket.off(VM_EVENTS.updated, handleUpsert);
      socket.off(VM_EVENTS.deleted, handleDeleted);
      disconnectSocket();
    };
  }, [queryClient]);
}
